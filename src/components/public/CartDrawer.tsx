import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, cartTotals, brl } from "@/lib/cart-store";
import { Link } from "@tanstack/react-router";

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove } = useCart();
  const { subtotal, count } = cartTotals(items);
  const freeShippingThreshold = 199;
  const missingFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? null : close())}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2 font-display text-lg">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Sua sacola ({count})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-muted">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Sua sacola está vazia.</p>
            <Button onClick={close} variant="outline" className="rounded-full">Continuar comprando</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {missingFreeShipping > 0 ? (
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                  Faltam <strong>{brl(missingFreeShipping)}</strong> para o frete grátis!
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-emerald-300/40 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  🎉 Você ganhou frete grátis!
                </div>
              )}
              <ul className="space-y-4">
                {items.map((it) => (
                  <li key={it.productId} className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {it.image ? (
                        <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <Link
                        to="/produto/$slug"
                        params={{ slug: it.slug }}
                        onClick={close}
                        className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
                      >
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
                        <button
                          onClick={() => remove(it.productId)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />
            <div className="space-y-3 p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg text-primary">{brl(subtotal)}</span>
              </div>
              <Link to="/checkout" onClick={close}>
                <Button className="w-full rounded-full bg-gradient-rose text-primary-foreground">Finalizar compra</Button>
              </Link>
              <Button variant="ghost" onClick={close} className="w-full">Continuar comprando</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
