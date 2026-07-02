import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAdminOrders, type OrderStatus } from "@/lib/orders-admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pedidos/")({
  component: OrdersPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  awaiting_payment: "Aguardando pagto",
  paid: "Pago",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  awaiting_payment: "bg-amber-100 text-amber-900",
  paid: "bg-sage text-sage-foreground",
  preparing: "bg-blue-100 text-blue-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-red-100 text-red-900",
  refunded: "bg-orange-100 text-orange-900",
};

function brl(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n); }

function OrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", q, status],
    queryFn: () => listAdminOrders({ data: { q: q || undefined, status: status === "all" ? undefined : (status as OrderStatus) } }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">Pedidos</h1>
        <p className="mt-1 text-muted-foreground">Acompanhe e gerencie todos os pedidos.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nº do pedido, cliente ou email..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
            {!isLoading && orders.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-16 text-center text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
            )}
            {orders.map((o) => (
              <TableRow key={o.id} className="cursor-pointer hover:bg-muted/40">
                <TableCell>
                  <Link to="/admin/pedidos/$id" params={{ id: o.id }} className="font-mono text-sm text-primary hover:underline">{o.order_number}</Link>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR")}</TableCell>
                <TableCell className="text-right font-medium">{brl(Number(o.total))}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{o.payment_status}</Badge></TableCell>
                <TableCell>
                  <Badge className={STATUS_COLOR[o.status] ?? ""}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
