import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots")({
  server: {
    handlers: {
      GET: () => {
        const origin = process.env.SITE_URL ?? "https://mymakes.lovable.app";
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /admin/",
          "Disallow: /_authenticated",
          "Disallow: /checkout",
          "Disallow: /carrinho",
          "Disallow: /pedido/",
          "",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
        });
      },
    },
  },
});
