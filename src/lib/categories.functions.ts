import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { slugify } from "./slug";

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

/* ============================================================
 * ADMIN
 * ============================================================ */

export const listAdminCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("categories")
      .select("id, name, slug, description, icon, sort_order, is_active, parent_id")
      .order("sort_order");
    if (error) throw new Error(error.message);
    // count products per category
    const { data: counts } = await context.supabase
      .from("products")
      .select("category_id");
    const byCat = new Map<string, number>();
    for (const row of counts ?? []) {
      if (!row.category_id) continue;
      byCat.set(row.category_id, (byCat.get(row.category_id) ?? 0) + 1);
    }
    return (data ?? []).map((c) => ({ ...c, product_count: byCat.get(c.id) ?? 0 }));
  });

type CategoryInput = {
  id?: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
  parent_id?: string | null;
};

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as CategoryInput)
  .handler(async ({ data, context }) => {
    const payload = {
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
      parent_id: data.parent_id ?? null,
    };
    if (data.id) {
      const { error } = await context.supabase.from("categories").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const slug = slugify(data.name) + "-" + Math.random().toString(36).slice(2, 5);
    const { data: created, error } = await context.supabase
      .from("categories")
      .insert({ ...payload, slug })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
