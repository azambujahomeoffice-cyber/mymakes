import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package, Sparkles, ShoppingCart, TrendingUp, ArrowUpRight } from "lucide-react";
import { listAdminProducts } from "@/lib/products.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });

  const total = products.length;
  const active = products.filter((p) => p.status === "active").length;
  const lowStock = products.filter((p) => (p.stock_quantity ?? 0) < 5).length;
  const featured = products.filter((p) => p.is_featured).length;

  const stats = [
    { label: "Produtos cadastrados", value: total, icon: Package, hint: `${active} ativos` },
    { label: "Em destaque", value: featured, icon: Sparkles, hint: "vitrine premium" },
    { label: "Estoque baixo", value: lowStock, icon: TrendingUp, hint: "< 5 unidades" },
    { label: "Pedidos", value: 0, icon: ShoppingCart, hint: "fase 2" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Bem-vinda</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Painel My Makes</h1>
          <p className="mt-1 text-muted-foreground">Visão geral do catálogo e operações.</p>
        </div>
        <Link
          to="/admin/produtos/importar"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-rose px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition hover:opacity-95"
        >
          <Sparkles className="h-4 w-4" /> Importar produtos com IA
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, hint }) => (
          <Card key={label} className="border-border/60 shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-rose/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-display text-3xl">{isLoading ? "—" : value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Próximos passos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            { t: "1. Importe as imagens", d: "23 imagens prontas na fila. Use a IA para gerar nome, categoria, descrição e preço sugerido.", to: "/admin/produtos/importar", cta: "Importar" },
            { t: "2. Revise produtos", d: "Ajuste preços, estoque e fotos. Marque os destaques que aparecerão na vitrine.", to: "/admin/produtos", cta: "Ver produtos" },
            { t: "3. Configure loja", d: "Defina logo, WhatsApp, chave PIX e dados Mercado Pago para receber pagamentos.", to: "/admin/configuracoes", cta: "Configurar" },
          ].map((s) => (
            <Link key={s.t} to={s.to} className="group rounded-xl border border-border/60 p-5 transition hover:border-primary/40 hover:shadow-elegant">
              <p className="font-display text-lg">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                {s.cta} <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
