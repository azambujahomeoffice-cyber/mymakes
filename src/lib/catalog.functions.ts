import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Generates a premium PDF catalog of active products.
 * Returns base64 so the client can trigger a download.
 */
export const generateCatalogPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as {
    categoryId?: string;
    onlyFeatured?: boolean;
    onlyInStock?: boolean;
  })
  .handler(async ({ data, context }) => {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    // ---- Load data
    let query = context.supabase
      .from("products")
      .select("id, name, sku, price, promotional_price, stock_quantity, main_image_url, short_description, is_featured, categories(name)")
      .eq("status", "active")
      .order("is_featured", { ascending: false })
      .order("name", { ascending: true });
    if (data.categoryId) query = query.eq("category_id", data.categoryId);
    if (data.onlyFeatured) query = query.eq("is_featured", true);
    if (data.onlyInStock) query = query.gt("stock_quantity", 0);

    const { data: products, error } = await query;
    if (error) throw new Error(error.message);

    const { data: settings } = await context.supabase
      .from("store_settings")
      .select("store_name, tagline, phone, whatsapp, instagram, email, address_city, address_state")
      .limit(1)
      .maybeSingle();

    const storeName = settings?.store_name ?? "My Makes";
    const tagline = settings?.tagline ?? "Beleza que revela sua essência";
    const whatsapp = settings?.whatsapp ?? settings?.phone ?? "";
    const instagram = settings?.instagram ?? "";

    // ---- Build PDF
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Catálogo ${storeName}`);
    pdf.setAuthor(storeName);
    pdf.setCreator("My Makes Marketplace");

    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

    // Rosé Gold-ish palette
    const rose = rgb(0.72, 0.44, 0.51);
    const nude = rgb(0.97, 0.92, 0.9);
    const ink = rgb(0.18, 0.14, 0.16);
    const muted = rgb(0.45, 0.4, 0.42);
    const white = rgb(1, 1, 1);
    const line = rgb(0.9, 0.85, 0.83);

    const A4 = { w: 595.28, h: 841.89 };
    const margin = 36;

    // ===== Cover
    const cover = pdf.addPage([A4.w, A4.h]);
    cover.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: nude });
    cover.drawRectangle({ x: 0, y: A4.h - 200, width: A4.w, height: 200, color: rose });
    cover.drawText(storeName.toUpperCase(), {
      x: margin, y: A4.h - 120, size: 42, font: fontBold, color: white,
    });
    cover.drawText(tagline, {
      x: margin, y: A4.h - 150, size: 14, font: fontItalic, color: white,
    });
    cover.drawText("CATÁLOGO", { x: margin, y: A4.h / 2 + 30, size: 28, font, color: ink });
    cover.drawText(`${products?.length ?? 0} produtos`, {
      x: margin, y: A4.h / 2, size: 16, font, color: muted,
    });
    const today = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    cover.drawText(today, { x: margin, y: A4.h / 2 - 24, size: 12, font: fontItalic, color: muted });

    // footer on cover
    const footerLines: string[] = [];
    if (whatsapp) footerLines.push(`WhatsApp: ${whatsapp}`);
    if (instagram) footerLines.push(`Instagram: @${instagram.replace(/^@/, "")}`);
    if (settings?.email) footerLines.push(`Email: ${settings.email}`);
    if (settings?.address_city) footerLines.push(`${settings.address_city}${settings.address_state ? " - " + settings.address_state : ""}`);
    footerLines.forEach((l, i) => {
      cover.drawText(l, { x: margin, y: 90 - i * 16, size: 10, font, color: ink });
    });

    // ===== Grid pages (2 cols x 3 rows = 6 per page)
    const cols = 2;
    const rows = 3;
    const gap = 16;
    const headerH = 60;
    const footerH = 30;
    const gridW = A4.w - margin * 2;
    const gridH = A4.h - margin * 2 - headerH - footerH;
    const cardW = (gridW - gap * (cols - 1)) / cols;
    const cardH = (gridH - gap * (rows - 1)) / rows;
    const imgH = cardH * 0.6;

    async function fetchImage(url: string): Promise<{ bytes: Uint8Array; kind: "jpg" | "png" } | null> {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = new Uint8Array(await res.arrayBuffer());
        const isPng = buf[0] === 0x89 && buf[1] === 0x50;
        return { bytes: buf, kind: isPng ? "png" : "jpg" };
      } catch { return null; }
    }

    const items = products ?? [];
    const perPage = cols * rows;
    const totalPages = Math.max(1, Math.ceil(items.length / perPage));

    for (let p = 0; p < totalPages; p++) {
      const page = pdf.addPage([A4.w, A4.h]);
      // header
      page.drawRectangle({ x: 0, y: A4.h - headerH, width: A4.w, height: headerH, color: nude });
      page.drawText(storeName, { x: margin, y: A4.h - 32, size: 16, font: fontBold, color: rose });
      page.drawText("Catálogo de produtos", { x: margin, y: A4.h - 48, size: 9, font, color: muted });
      const pageLabel = `Página ${p + 1} / ${totalPages}`;
      const plw = font.widthOfTextAtSize(pageLabel, 9);
      page.drawText(pageLabel, { x: A4.w - margin - plw, y: A4.h - 32, size: 9, font, color: muted });

      // footer
      const foot = whatsapp ? `Peça pelo WhatsApp: ${whatsapp}` : storeName;
      const fw = font.widthOfTextAtSize(foot, 9);
      page.drawText(foot, { x: (A4.w - fw) / 2, y: 18, size: 9, font, color: muted });

      // cards
      const slice = items.slice(p * perPage, p * perPage + perPage);
      for (let i = 0; i < slice.length; i++) {
        const prod = slice[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = margin + col * (cardW + gap);
        const y = A4.h - headerH - margin - (row + 1) * cardH - row * gap;

        // card background
        page.drawRectangle({ x, y, width: cardW, height: cardH, color: white, borderColor: line, borderWidth: 0.5 });

        // image
        const imgY = y + cardH - imgH;
        page.drawRectangle({ x, y: imgY, width: cardW, height: imgH, color: nude });
        if (prod.main_image_url) {
          const img = await fetchImage(prod.main_image_url);
          if (img) {
            try {
              const embedded = img.kind === "png"
                ? await pdf.embedPng(img.bytes)
                : await pdf.embedJpg(img.bytes);
              const scale = Math.min(cardW / embedded.width, imgH / embedded.height);
              const w = embedded.width * scale;
              const h = embedded.height * scale;
              page.drawImage(embedded, {
                x: x + (cardW - w) / 2,
                y: imgY + (imgH - h) / 2,
                width: w, height: h,
              });
            } catch { /* skip */ }
          }
        }

        // text area
        const tx = x + 10;
        let ty = imgY - 14;
        const cat = (prod as { categories?: { name?: string } | null }).categories?.name;
        if (cat) {
          page.drawText(cat.toUpperCase(), { x: tx, y: ty, size: 7, font, color: rose });
          ty -= 12;
        }
        const name = truncate(prod.name ?? "", 42);
        page.drawText(name, { x: tx, y: ty, size: 10, font: fontBold, color: ink });
        ty -= 12;
        if (prod.short_description) {
          const desc = truncate(prod.short_description, 60);
          page.drawText(desc, { x: tx, y: ty, size: 8, font, color: muted });
          ty -= 12;
        }
        if (prod.sku) {
          page.drawText(`SKU ${prod.sku}`, { x: tx, y: ty, size: 7, font, color: muted });
        }
        // price bottom-right
        const promo = prod.promotional_price;
        const priceText = brl(promo ?? prod.price ?? 0);
        const psize = 13;
        const pw = fontBold.widthOfTextAtSize(priceText, psize);
        page.drawText(priceText, {
          x: x + cardW - 10 - pw, y: y + 10, size: psize, font: fontBold, color: rose,
        });
        if (promo && prod.price && promo < prod.price) {
          const oldText = brl(prod.price);
          const ow = font.widthOfTextAtSize(oldText, 8);
          page.drawText(oldText, {
            x: x + cardW - 10 - ow, y: y + 10 + psize + 2, size: 8, font, color: muted,
          });
        }
      }
    }

    const bytes = await pdf.save();
    // Convert to base64
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    const fileName = `catalogo-${storeName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
    return { base64, fileName, productCount: items.length };
  });

function truncate(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function brl(n: number) {
  return "R$ " + Number(n).toFixed(2).replace(".", ",");
}
