import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { slugify, generateSku } from "./slug";

/* ============================================================
 * PUBLIC: list & detail (loja pública lê via anon)
 * ============================================================ */

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listPublicProducts = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => (i ?? {}) as { categorySlug?: string; q?: string; limit?: number })
  .handler(async ({ data }) => {
    const supabase = publicClient();
    let q = supabase
      .from("products")
      .select("id, name, slug, short_description, price, promotional_price, main_image_url, is_featured, is_new, is_bestseller, stock_quantity, category_id, categories(name, slug)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 60);
    if (data.q) q = q.ilike("name", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    if (data.categorySlug) {
      return (rows ?? []).filter((r) => r.categories?.slug === data.categorySlug);
    }
    return rows ?? [];
  });

export const getPublicProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => i as { slug: string })
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: p, error } = await supabase
      .from("products")
      .select("id, name, slug, short_description, description, price, promotional_price, main_image_url, stock_quantity, is_featured, is_new, is_bestseller, is_on_sale, sku, category_id, categories(name, slug), product_images(id, image_url, sort_order, is_main)")
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return p;
  });

export const listFeaturedProducts = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, short_description, price, promotional_price, main_image_url, is_featured, is_new, is_bestseller, stock_quantity, categories(name, slug)")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw new Error(error.message);
  return data ?? [];
});

/* ============================================================
 * ADMIN: CRUD
 * ============================================================ */

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("id, name, slug, sku, price, promotional_price, stock_quantity, status, is_featured, main_image_url, category_id, categories(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => {
    const { data: p, error } = await context.supabase
      .from("products").select("*, product_images(id, image_url, sort_order, is_main)").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return p;
  });

type UpsertInput = {
  id?: string;
  name: string;
  short_description?: string | null;
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  price: number;
  promotional_price?: number | null;
  stock_quantity?: number;
  sku?: string | null;
  main_image_url?: string | null;
  status?: "active" | "inactive" | "draft" | "archived";
  is_featured?: boolean;
  is_new?: boolean;
  is_bestseller?: boolean;
  is_on_sale?: boolean;
};

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as UpsertInput)
  .handler(async ({ data, context }) => {
    const slug = slugify(data.name) + "-" + Math.random().toString(36).slice(2, 6);
    const payload = {
      name: data.name,
      short_description: data.short_description ?? null,
      description: data.description ?? null,
      category_id: data.category_id ?? null,
      brand_id: data.brand_id ?? null,
      price: data.price,
      promotional_price: data.promotional_price ?? null,
      stock_quantity: data.stock_quantity ?? 0,
      sku: data.sku || generateSku(),
      main_image_url: data.main_image_url ?? null,
      status: data.status ?? "active",
      is_featured: data.is_featured ?? false,
      is_new: data.is_new ?? false,
      is_bestseller: data.is_bestseller ?? false,
      is_on_sale: data.is_on_sale ?? false,
    };
    if (data.id) {
      const { error } = await context.supabase
        .from("products")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: created, error } = await context.supabase
      .from("products")
      .insert({ ...payload, slug })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ============================================================
 * IMPORT: lista imagens no storage `product-images/imports/`
 * e cria produtos com IA inferindo nome/categoria/descrição.
 * ============================================================ */

type AIProductInfo = {
  name: string;
  short_description: string;
  description: string;
  category_slug: string;
  suggested_price: number;
  tags: string[];
};

async function inferProductFromImage(imageUrl: string, categories: { name: string; slug: string }[]): Promise<AIProductInfo> {
  const { lovableAIChat } = await import("./ai-gateway.server");
  const categoryList = categories.map((c) => `${c.slug} → ${c.name}`).join("\n");
  const sys = `Você é especialista em catalogação de produtos de maquiagem e beleza.
Analise a imagem e identifique o produto. Responda APENAS com um JSON válido com este schema:
{
  "name": "nome comercial curto e atrativo do produto",
  "short_description": "1 frase de até 120 caracteres",
  "description": "descrição completa de 2 a 4 frases, destacando benefícios",
  "category_slug": "um dos slugs da lista abaixo",
  "suggested_price": número em reais (R$) entre 19.90 e 199.90,
  "tags": ["3 a 6 tags em minúsculas"]
}

Categorias disponíveis (use o slug exato):
${categoryList}

Se a imagem não for de um produto de beleza identificável, use "outros-produtos".`;
  const raw = await lovableAIChat({
    model: "google/gemini-3-flash-preview",
    responseFormat: "json_object",
    messages: [
      { role: "system", content: sys },
      {
        role: "user",
        content: [
          { type: "text", text: "Identifique este produto:" },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  });
  try {
    const parsed = JSON.parse(raw) as AIProductInfo;
    return {
      name: parsed.name?.slice(0, 120) || "Produto sem nome",
      short_description: parsed.short_description?.slice(0, 160) || "",
      description: parsed.description || "",
      category_slug: parsed.category_slug || "outros-produtos",
      suggested_price: Number(parsed.suggested_price) || 49.9,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    };
  } catch {
    return {
      name: "Produto importado",
      short_description: "",
      description: "",
      category_slug: "outros-produtos",
      suggested_price: 49.9,
      tags: [],
    };
  }
}

export const listImportQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.storage
      .from("product-images")
      .list("imports", { limit: 200, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(error.message);
    const supabaseUrl = process.env.SUPABASE_URL!;
    const items = (data ?? [])
      .filter((f) => f.name && !f.name.endsWith("/"))
      .map((f) => ({
        name: f.name,
        url: `${supabaseUrl}/storage/v1/object/public/product-images/imports/${encodeURIComponent(f.name)}`,
      }));
    return items;
  });

export const importProductsFromQueue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { files?: string[]; useAI?: boolean })
  .handler(async ({ data, context }) => {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const { data: listing, error: lerr } = await context.supabase.storage
      .from("product-images")
      .list("imports", { limit: 200 });
    if (lerr) throw new Error(lerr.message);
    const files = (listing ?? []).filter((f) => f.name && !f.name.endsWith("/"));
    const targets = data.files?.length
      ? files.filter((f) => data.files!.includes(f.name))
      : files;
    const { data: cats } = await context.supabase
      .from("categories")
      .select("id, name, slug");
    const catList = cats ?? [];
    const useAI = data.useAI !== false;

    const results: Array<{ file: string; status: "created" | "skipped" | "error"; productId?: string; message?: string }> = [];

    for (const f of targets) {
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/imports/${encodeURIComponent(f.name)}`;
      try {
        const { data: existing } = await context.supabase
          .from("products")
          .select("id")
          .eq("main_image_url", imageUrl)
          .maybeSingle();
        if (existing) {
          results.push({ file: f.name, status: "skipped", message: "já importado" });
          continue;
        }
        let info: AIProductInfo;
        if (useAI) {
          try {
            info = await inferProductFromImage(imageUrl, catList);
          } catch (err) {
            info = {
              name: f.name.replace(/\.[^.]+$/, ""),
              short_description: "",
              description: "",
              category_slug: "outros-produtos",
              suggested_price: 49.9,
              tags: [],
            };
            results.push({ file: f.name, status: "error", message: `IA falhou: ${(err as Error).message.slice(0, 100)}` });
          }
        } else {
          info = {
            name: f.name.replace(/\.[^.]+$/, ""),
            short_description: "",
            description: "",
            category_slug: "outros-produtos",
            suggested_price: 49.9,
            tags: [],
          };
        }
        const category = catList.find((c) => c.slug === info.category_slug) ?? catList.find((c) => c.slug === "outros-produtos");
        const slug = slugify(info.name) + "-" + Math.random().toString(36).slice(2, 6);
        const { data: created, error } = await context.supabase
          .from("products")
          .insert({
            name: info.name,
            slug,
            short_description: info.short_description,
            description: info.description,
            category_id: category?.id ?? null,
            price: info.suggested_price,
            stock_quantity: 10,
            sku: generateSku(),
            main_image_url: imageUrl,
            tags: info.tags,
            status: "active",
            is_new: true,
            ai_metadata: { source: "import_queue", inferred: useAI, ...info },
          })
          .select("id")
          .single();
        if (error) throw error;
        await context.supabase.from("product_images").insert({
          product_id: created.id,
          image_url: imageUrl,
          is_main: true,
          sort_order: 0,
        });
        results.push({ file: f.name, status: "created", productId: created.id });
      } catch (err) {
        results.push({ file: f.name, status: "error", message: (err as Error).message.slice(0, 200) });
      }
    }
    return { processed: results.length, results };
  });
