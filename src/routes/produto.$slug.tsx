import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag, Truck, ShieldCheck, Sparkles, Minus, Plus } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getPublicProductBySlug } from "@/lib/products.functions";
import { useCart, brl } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params }) => {
    const product = await getPublicProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — My Makes` },
          { name: "description", content: loaderData.product.short_description ?? loaderData.product.name },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:image", content: loaderData.product.main_image_url ?? "" },
        ]
      : [],
  }),
  component: ProdutoPage,
});

function ProdutoPage() {
  const { product } = Route.useLoaderData();
  const { add, open } = useCart();
  const [qty, setQty] = useState(1);

  const images = [
    ...(product.main_image_url ? [{ id: "main", image_url: product.main_image_url }] : []),
    ...((product.product_images ?? [])
      .filter((i) => i.image_url && i.image_url !== product.main_image_url)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))),
  ];
  const [active, setActive] = useState(0);
  const activeImg = images[active]?.image_url;

  const price = Number(product.price);
  const promo = product.promotional_price != null ? Number(product.promotional_price) : null;
  const finalPrice = promo && promo > 0 ? promo : price;
  const discount = promo && promo < price ? Math.round(((price - promo) / price) * 100) : 0;
  const outOfStock = (product.stock_quantity ?? 0) <= 0;

  return (
    <PublicShell>
      <div className="container mx-auto px-6 py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/loja" className="hover:text-primary">Loja</Link>
          {product.categories && (
            <>
              <span className="mx-2">/</span>
              <Link to="/categoria/$slug" params={{ slug: product.categories.slug }} className="hover:text-primary">
                {product.categories.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* GALLERY */}
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-muted">
              {activeImg ? (
                <img src={activeImg} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <Sparkles className="h-10 w-10" />
                </div>
              )}
              {discount > 0 && (
                <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground">-{discount}%</Badge>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActive(idx)}
                    className={cn(
                      "h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition",
                      active === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETAILS */}
          <div>
            {product.categories?.name && (
              <span className="text-xs font-medium uppercase tracking-widest text-primary">{product.categories.name}</span>
            )}
            <h1 className="mt-1 font-display text-3xl md:text-4xl">{product.name}</h1>
            {product.short_description && (
              <p className="mt-3 text-base text-muted-foreground">{product.short_description}</p>
            )}

            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-4xl text-primary">{brl(finalPrice)}</span>
              {discount > 0 && <span className="text-base text-muted-foreground line-through">{brl(price)}</span>}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              ou 3x de <strong>{brl(finalPrice / 3)}</strong> sem juros no cartão
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              💚 5% de desconto adicional no PIX: <strong>{brl(finalPrice * 0.95)}</strong>
            </p>

            <Separator className="my-6" />

            <div className="flex items-center gap-4">
              <div className="inline-flex items-center rounded-full border">
                <button className="p-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-10 text-center font-medium">{qty}</span>
                <button className="p-2" onClick={() => setQty((q) => q + 1)}>
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                {outOfStock ? "Fora de estoque" : `${product.stock_quantity} em estoque`}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                disabled={outOfStock}
                onClick={() => {
                  add(
                    {
                      productId: product.id,
                      slug: product.slug,
                      name: product.name,
                      price: finalPrice,
                      image: product.main_image_url,
                      maxStock: product.stock_quantity ?? undefined,
                    },
                    qty,
                  );
                  open();
                }}
                className="flex-1 rounded-full bg-gradient-rose text-primary-foreground shadow-elegant"
              >
                <ShoppingBag className="h-5 w-5" />
                Adicionar à sacola
              </Button>
              <Link to="/checkout" className="flex-1">
                <Button
                  size="lg"
                  variant="outline"
                  disabled={outOfStock}
                  onClick={() =>
                    add(
                      {
                        productId: product.id,
                        slug: product.slug,
                        name: product.name,
                        price: finalPrice,
                        image: product.main_image_url,
                        maxStock: product.stock_quantity ?? undefined,
                      },
                      qty,
                    )
                  }
                  className="w-full rounded-full border-primary/40 text-primary hover:bg-primary/5"
                >
                  Comprar agora
                </Button>
              </Link>
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm">
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-primary" />
                <span>Frete grátis acima de R$ 199 para todo o Brasil</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Produto 100% original com nota fiscal</span>
              </div>
            </div>

            {product.description && (
              <div className="mt-8">
                <h2 className="font-display text-xl">Sobre o produto</h2>
                <div className="prose prose-sm mt-3 max-w-none whitespace-pre-line text-muted-foreground">
                  {product.description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.main_image_url,
            description: product.short_description ?? product.description ?? undefined,
            sku: product.sku ?? undefined,
            offers: {
              "@type": "Offer",
              price: finalPrice,
              priceCurrency: "BRL",
              availability: outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            },
          }),
        }}
      />
    </PublicShell>
  );
}
