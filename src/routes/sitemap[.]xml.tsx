import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/sitemap[.]xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = process.env.SITE_URL ?? "https://mymakes.lovable.app";
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

        const staticUrls = ["", "/loja", "/auth"].map((p) => ({ loc: `${origin}${p}`, priority: p === "" ? "1.0" : "0.7" }));
        const urls: { loc: string; lastmod?: string; priority?: string }[] = [...staticUrls];

        if (supabaseUrl && supabaseKey) {
          try {
            const sb = createClient<Database>(supabaseUrl, supabaseKey, {
              auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
            });
            const [{ data: prods }, { data: cats }] = await Promise.all([
              sb.from("products").select("slug, updated_at").eq("status", "active").limit(2000),
              sb.from("categories").select("slug, updated_at").eq("is_active", true).limit(500),
            ]);
            for (const c of cats ?? []) {
              urls.push({ loc: `${origin}/categoria/${c.slug}`, lastmod: c.updated_at ?? undefined, priority: "0.6" });
            }
            for (const p of prods ?? []) {
              urls.push({ loc: `${origin}/produto/${p.slug}`, lastmod: p.updated_at ?? undefined, priority: "0.8" });
            }
          } catch {
            /* fallback to static-only sitemap */
          }
        }

        const xml =
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          urls
            .map((u) => {
              const lastmod = u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : "";
              const priority = u.priority ? `<priority>${u.priority}</priority>` : "";
              return `  <url><loc>${u.loc}</loc>${lastmod}${priority}</url>`;
            })
            .join("\n") +
          "\n</urlset>\n";

        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=1800" },
        });
      },
    },
  },
});
