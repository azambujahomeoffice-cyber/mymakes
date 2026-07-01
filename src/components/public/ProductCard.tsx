import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart, brl } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  slug: string;
  short_description?: string | null;
  price: number | string;
  promotional_price?: number | string | null;
  main_image_url?: string | null;
  is_new?: boolean | null;
  is_bestseller?: boolean | null;
  is_featured?: boolean | null;
  stock_quantity?: number | null;
  categories?: { name: string; slug: string } | null;
};

export function ProductCard({ product }: { product: Product }) {
  const price = Number(product.price);
  const promo = product.promotional_price != null ? Number(product.promotional_price) : null;
  const finalPrice = promo && promo > 0 ? promo : price;
  const discount = promo && promo < price ? Math.round(((price - promo) / price) * 100) : 0;
  const outOfStock = (product.stock_quantity ?? 0) <= 0;
  const { add } = useCart();

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant hover:border-primary/30">
      <Link
        to="/produto/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        {product.main_image_url ? (
          <img
            src={product.main_image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Sem imagem</div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discount > 0 && <Badge className="bg-primary text-primary-foreground shadow-elegant">-{discount}%</Badge>}
          {product.is_new && <Badge variant="secondary" className="bg-secondary/90">Novo</Badge>}
          {product.is_bestseller && !discount && <Badge className="bg-gold-500 text-white">Top</Badge>}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 text-xs font-semibold uppercase tracking-widest">
            Esgotado
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categories?.name && (
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {product.categories.name}
          </span>
        )}
        <Link
          to="/produto/$slug"
          params={{ slug: product.slug }}
          className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary"
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg text-primary">{brl(finalPrice)}</span>
            {discount > 0 && <span className="text-xs text-muted-foreground line-through">{brl(price)}</span>}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            ou 3x de {brl(finalPrice / 3)} sem juros
          </p>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={(e) => {
              e.preventDefault();
              add({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: finalPrice,
                image: product.main_image_url,
                maxStock: product.stock_quantity ?? undefined,
              });
            }}
            className={cn(
              "mt-3 w-full rounded-full bg-gradient-rose text-primary-foreground shadow-sm transition hover:brightness-105",
              outOfStock && "opacity-60",
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            {outOfStock ? "Indisponível" : "Adicionar"}
          </Button>
        </div>
      </div>
    </article>
  );
}
