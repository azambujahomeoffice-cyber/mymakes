import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getOrderByNumber } from "@/lib/orders.functions";
import { getPublicSettings } from "@/lib/settings.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/pedido/$orderNumber")({
  loader: async ({ params }) => {
    const [order, settings] = await Promise.all([
      getOrderByNumber({ data: { orderNumber: params.orderNumber } }),
      getPublicSettings(),
    ]);
    if (!order) throw notFound();
    return { order, settings };
  },
  head: ({ params }) => ({ meta: [{ title: `Pedido ${params.orderNumber} — My Makes` }] }),
  component: PedidoPage,
});

function PedidoPage() {
  const { order, settings } = Route.useLoaderData();
  const brl = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const [copied, setCopied] = useState(false);

  // Placeholder PIX copia-e-cola — a integração Mercado Pago real será conectada nesta camada
  const pixCode = `00020126360014BR.GOV.BCB.PIX0114+55${(settings?.whatsapp ?? "11999999999").replace(/\D/g, "")}52040000530398654${String(order.total).padStart(6, "0").slice(0, 6)}5802BR5910MYMAKES6009SAOPAULO62070503***6304ABCD`;

  const wa = settings?.whatsapp?.replace(/\D/g, "");
  const waLink = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Olá! Acabei de fazer o pedido ${order.order_number} (${brl(Number(order.total))}). Vou realizar o pagamento via PIX.`)}`
    : null;

  return (
    <PublicShell>
      <div className="container mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl border border-primary/20 bg-gradient-soft p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-elegant">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-5 font-display text-3xl">Pedido confirmado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Nº do pedido: <strong>{order.order_number}</strong>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Total: <strong className="text-primary">{brl(Number(order.total))}</strong>
          </p>
        </div>

        <div className="mt-8 rounded-2xl border bg-card p-6">
          <h2 className="font-display text-xl">Pagamento via PIX</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Copie o código PIX abaixo e cole no aplicativo do seu banco. Assim que confirmarmos o pagamento, seu pedido será separado.
          </p>

          <div className="mt-4 rounded-xl border bg-muted/40 p-4">
            <p className="break-all font-mono text-xs text-muted-foreground">{pixCode}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                navigator.clipboard.writeText(pixCode);
                setCopied(true);
                toast.success("Código PIX copiado!");
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copiado!" : "Copiar código PIX"}
            </Button>
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer">
                <Button className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700">
                  <MessageCircle className="h-4 w-4" />
                  Avisar no WhatsApp
                </Button>
              </a>
            )}
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            ℹ️ Este é um código de exemplo. A integração completa com Mercado Pago PIX (QR Code oficial) está prevista para a próxima fase do projeto.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border bg-card p-6">
          <h2 className="font-display text-xl">Itens</h2>
          <ul className="mt-4 space-y-3">
            {(order.order_items ?? []).map((it: { product_name: string; quantity: number; unit_price: number | string; total_price: number | string; image_url?: string | null }, idx: number) => (
              <li key={idx} className="flex gap-3 text-sm">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {it.image_url && <img src={it.image_url} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                  <p>{it.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.quantity}x {brl(Number(it.unit_price))}
                  </p>
                </div>
                <span className="font-semibold">{brl(Number(it.total_price))}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{brl(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frete</span>
            <span>{Number(order.shipping_cost) === 0 ? "Grátis" : brl(Number(order.shipping_cost))}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-sm">Total</span>
            <span className="font-display text-2xl text-primary">{brl(Number(order.total))}</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/loja">
            <Button variant="outline" className="rounded-full">Continuar comprando</Button>
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
