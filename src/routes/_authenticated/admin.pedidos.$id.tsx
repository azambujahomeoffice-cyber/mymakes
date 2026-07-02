import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { getAdminOrder, updateOrderStatus, type OrderStatus, type PaymentStatus } from "@/lib/orders-admin.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/pedidos/$id")({
  component: OrderDetail,
});

function brl(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n); }

const STATUS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "awaiting_payment", label: "Aguardando pagamento" },
  { value: "paid", label: "Pago" },
  { value: "preparing", label: "Preparando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
];
const PAY: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "awaiting", label: "Aguardando" },
  { value: "paid", label: "Pago" },
  { value: "failed", label: "Falhou" },
  { value: "refunded", label: "Reembolsado" },
  { value: "cancelled", label: "Cancelado" },
];

function OrderDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/pedidos/$id" });
  const qc = useQueryClient();
  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => getAdminOrder({ data: { id } }),
  });

  const [status, setStatus] = useState<OrderStatus | "">("");
  const [payStatus, setPayStatus] = useState<PaymentStatus | "">("");
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState("");
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);
  if (order && !hydrated) {
    setStatus(order.status as OrderStatus);
    setPayStatus(order.payment_status as PaymentStatus);
    setTracking(order.tracking_code ?? "");
    setCarrier(order.shipping_carrier ?? "");
    setNotes(order.internal_notes ?? "");
    setHydrated(true);
  }

  const save = useMutation({
    mutationFn: () => updateOrderStatus({
      data: {
        id,
        status: (status || undefined) as OrderStatus | undefined,
        payment_status: (payStatus || undefined) as PaymentStatus | undefined,
        tracking_code: tracking || null,
        shipping_carrier: carrier || null,
        internal_notes: notes || null,
      },
    }),
    onSuccess: () => {
      toast.success("Pedido atualizado");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!order) return <p className="text-muted-foreground">Pedido não encontrado.</p>;

  const items = (order.order_items ?? []) as Array<{ id: string; product_name: string; quantity: number; unit_price: number; total_price: number; image_url: string | null; product_sku: string | null }>;
  const addr = (order.shipping_address ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/pedidos"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="font-display text-3xl">Pedido {order.order_number}</h1>
          <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardContent className="p-6">
            <h2 className="font-display text-lg">Itens</h2>
            <div className="mt-4 divide-y">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 py-3">
                  {it.image_url ? <img src={it.image_url} alt="" className="h-14 w-14 rounded-md object-cover ring-1 ring-border" /> : <div className="h-14 w-14 rounded-md bg-muted" />}
                  <div className="flex-1">
                    <p className="font-medium">{it.product_name}</p>
                    <p className="text-xs text-muted-foreground">{it.product_sku} · {it.quantity}x {brl(Number(it.unit_price))}</p>
                  </div>
                  <p className="font-medium">{brl(Number(it.total_price))}</p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(Number(order.subtotal))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{Number(order.shipping_cost) === 0 ? "Grátis" : brl(Number(order.shipping_cost))}</span></div>
              {Number(order.discount_amount) > 0 && <div className="flex justify-between text-emerald-700"><span>Desconto</span><span>- {brl(Number(order.discount_amount))}</span></div>}
              <div className="flex justify-between border-t pt-2 font-display text-xl text-primary"><span>Total</span><span>{brl(Number(order.total))}</span></div>
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <h2 className="font-display text-lg">Cliente</h2>
            <div className="mt-3 grid gap-1 text-sm">
              <p><strong>{order.customer_name}</strong></p>
              <p className="text-muted-foreground">{order.customer_email}</p>
              {order.customer_phone && <p className="text-muted-foreground">{order.customer_phone}</p>}
              {order.customer_document && <p className="text-muted-foreground">CPF/CNPJ: {order.customer_document}</p>}
            </div>
            {addr && addr.street && (
              <>
                <Separator className="my-4" />
                <h3 className="text-sm font-medium">Endereço de entrega</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {addr.street}, {addr.number} {addr.complement ? `- ${addr.complement}` : ""}<br />
                  {addr.neighborhood} · {addr.city}/{addr.state}<br />
                  CEP {addr.zip}
                </p>
              </>
            )}
          </CardContent></Card>
        </div>

        <div className="space-y-6">
          <Card><CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Status</h2>
              <Badge className="bg-sage text-sage-foreground">{order.status}</Badge>
            </div>
            <div>
              <Label>Status do pedido</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pagamento</Label>
              <Select value={payStatus} onValueChange={(v) => setPayStatus(v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAY.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Transportadora</Label><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Correios, Jadlog..." /></div>
            <div><Label>Código de rastreio</Label><Input value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
            <div><Label>Notas internas</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full bg-gradient-rose text-primary-foreground">
              <Save className="mr-2 h-4 w-4" /> {save.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
