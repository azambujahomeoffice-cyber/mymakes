import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, cartTotals, brl } from "@/lib/cart-store";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Meu carrinho — My Makes" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, clear } = useCart();
  const { subtotal, count } = cartTotals(items);
  const shipping = subtotal >= 199 || subtotal === 0 ? 0 : 19.9;
  const total = subtotal + shipping;

  return (
    <PublicShell>
      <div className="container mx-auto px-6 py-10">
        <h1 className="font-display text-3xl md:text-4xl">Meu carrinho</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {count === 0 ? "Sua sacola está vazia." : `${count} item(s) na sacola`}
        </p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed p-16 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-muted">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Que tal explorar nossa curadoria?</p>
            <Link to="/loja">
              <Button className="mt-5 rounded-full bg-gradient-rose text-primary-foreground">Ir para a loja</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.productId} className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link to="/produto/$slug" params={{ slug: it.slug }} className="text-sm font-medium hover:text-primary">
                      {it.name}
                    </Link>
                    <span className="mt-1 text-sm font-semibold text-primary">{brl(it.price)}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border">
                        <button className="p-1.5" onClick={() => setQty(it.productId, it.quantity - 1)}>
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm">{it.quantity}</span>
                        <button className="p-1.5" onClick={() => setQty(it.productId, it.quantity + 1)}>
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => remove(it.productId)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              <Button variant="ghost" size="sm" onClick={clear} className="text-muted-foreground">
                Esvaziar sacola
              </Button>
            </ul>

            <aside className="h-fit rounded-2xl border border-border/60 bg-card p-6">
              <h2 className="font-display text-lg">Resumo</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{brl(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span>{shipping === 0 ? "Grátis" : brl(shipping)}</span>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-baseline justify-between">
                <span className="text-sm">Total</span>
                <span className="font-display text-2xl text-primary">{brl(total)}</span>
              </div>
              <Link to="/checkout">
                <Button className="mt-5 w-full rounded-full bg-gradient-rose text-primary-foreground">
                  Finalizar compra <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </aside>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
