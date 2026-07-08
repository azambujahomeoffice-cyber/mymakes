import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Activity, AlertTriangle, CheckCircle2, CircleDot, XCircle, Sparkles, RefreshCw,
  Database, Package, ShoppingCart, Users, Shield, Gauge, Lightbulb, ClipboardList, History, Bug as BugIcon,
} from "lucide-react";
import { runProjectAudit, type AuditReport, type ChecklistItem, type ChecklistStatus } from "@/lib/audit.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/auditoria")({
  component: AuditPage,
});

function brl(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n); }
function dt(iso: string) { return new Date(iso).toLocaleString("pt-BR"); }

const STATUS_META: Record<ChecklistStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  done: { label: "Concluído", icon: CheckCircle2, className: "text-emerald-600" },
  partial: { label: "Parcial", icon: CircleDot, className: "text-amber-600" },
  todo: { label: "Pendente", icon: XCircle, className: "text-rose-600" },
};

function StatusIcon({ status }: { status: ChecklistStatus }) {
  const M = STATUS_META[status];
  const Icon = M.icon;
  return <Icon className={cn("h-4 w-4 shrink-0", M.className)} />;
}

function ChecklistList({ items }: { items: ChecklistItem[] }) {
  return (
    <ul className="divide-y divide-border/60">
      {items.map((i) => (
        <li key={i.key} className="flex items-start gap-3 py-2.5">
          <StatusIcon status={i.status} />
          <div className="flex-1">
            <p className="text-sm">{i.label}</p>
            {i.note && <p className="text-xs text-muted-foreground">{i.note}</p>}
          </div>
          <Badge variant="outline" className="text-[10px]">{STATUS_META[i.status].label}</Badge>
        </li>
      ))}
    </ul>
  );
}

function AuditPage() {
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { data, isLoading, refetch, isFetching } = useQuery<AuditReport>({
    queryKey: ["project-audit"],
    queryFn: () => runProjectAudit(),
  });

  const runMut = useMutation({
    mutationFn: () => runProjectAudit(),
    onSuccess: async () => {
      setLastRun(new Date().toISOString());
      await refetch();
      toast.success("Auditoria concluída");
    },
    onError: (e: Error) => toast.error(e.message ?? "Falha ao executar auditoria"),
  });

  if (isLoading || !data) {
    return <div className="py-20 text-center text-muted-foreground">Carregando auditoria...</div>;
  }

  const r = data;
  const doneCount = r.checklist.filter((i) => i.status === "done").length;
  const partialCount = r.checklist.filter((i) => i.status === "partial").length;
  const todoCount = r.checklist.filter((i) => i.status === "todo").length;
  const openBugs = r.bugs.filter((b) => b.status === "open").length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Fase 0</p>
          <h1 className="mt-2 flex items-center gap-3 font-display text-4xl tracking-tight">
            <Activity className="h-8 w-8 text-primary" /> Central de Auditoria
          </h1>
          <p className="mt-1 text-muted-foreground">
            PO + QA automáticos monitorando o Marketplace My Makes.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => runMut.mutate()}
          disabled={runMut.isPending || isFetching}
          className="rounded-full bg-gradient-rose text-primary-foreground shadow-elegant"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", runMut.isPending && "animate-spin")} />
          Executar Auditoria Completa
        </Button>
      </header>

      {/* KPIs principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Nota geral</CardTitle></CardHeader>
          <CardContent>
            <p className="font-display text-5xl text-primary">{r.overallScore}<span className="text-xl text-muted-foreground">/100</span></p>
            <p className="mt-1 text-xs text-muted-foreground">{r.status}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Progresso do projeto</CardTitle></CardHeader>
          <CardContent>
            <p className="font-display text-4xl">{r.overallProgress}%</p>
            <Progress value={r.overallProgress} className="mt-3 h-2" />
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Fase atual</CardTitle></CardHeader>
          <CardContent>
            <p className="font-display text-lg leading-tight">{r.currentPhase}</p>
            <p className="mt-2 text-xs text-muted-foreground">Próxima: <span className="font-medium">{r.nextPhase}</span></p>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-soft">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Última auditoria</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{dt(lastRun ?? r.generatedAt)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Automática a cada abertura</p>
          </CardContent>
        </Card>
      </div>

      {/* Contadores rápidos */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Concluídas", value: doneCount, icon: CheckCircle2, tint: "text-emerald-600 bg-emerald-500/10" },
          { label: "Parciais", value: partialCount, icon: CircleDot, tint: "text-amber-600 bg-amber-500/10" },
          { label: "Pendentes", value: todoCount, icon: XCircle, tint: "text-rose-600 bg-rose-500/10" },
          { label: "Bugs abertos", value: openBugs, icon: AlertTriangle, tint: "text-orange-600 bg-orange-500/10" },
        ].map(({ label, value, icon: Icon, tint }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-full", tint)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-2xl">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo executivo */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-2xl">
            <Sparkles className="h-5 w-5 text-primary" /> Resumo executivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Plano de ação priorizado</p>
            <ol className="space-y-1.5 text-sm">
              {r.actionPlan.map((step, i) => (
                <li key={i} className="flex gap-2"><span className="font-mono text-primary">{String(i + 1).padStart(2, "0")}.</span><span>{step.replace(/^\d+\.\s*/, "")}</span></li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="roadmap" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="roadmap"><ClipboardList className="mr-1.5 h-3.5 w-3.5" />Roadmap</TabsTrigger>
          <TabsTrigger value="tech"><Database className="mr-1.5 h-3.5 w-3.5" />Técnica</TabsTrigger>
          <TabsTrigger value="func"><Package className="mr-1.5 h-3.5 w-3.5" />Funcional</TabsTrigger>
          <TabsTrigger value="ux"><Gauge className="mr-1.5 h-3.5 w-3.5" />UX</TabsTrigger>
          <TabsTrigger value="sec"><Shield className="mr-1.5 h-3.5 w-3.5" />Segurança</TabsTrigger>
          <TabsTrigger value="bugs"><BugIcon className="mr-1.5 h-3.5 w-3.5" />Bugs</TabsTrigger>
          <TabsTrigger value="sugg"><Lightbulb className="mr-1.5 h-3.5 w-3.5" />Sugestões</TabsTrigger>
          <TabsTrigger value="metrics"><ShoppingCart className="mr-1.5 h-3.5 w-3.5" />Métricas</TabsTrigger>
          <TabsTrigger value="log"><History className="mr-1.5 h-3.5 w-3.5" />Log</TabsTrigger>
        </TabsList>

        <TabsContent value="roadmap" className="space-y-4">
          {r.phases.map((p) => (
            <Card key={p.id} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="font-display text-lg">{p.name}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{p.status === "done" ? "Concluída" : p.status === "in_progress" ? "Em progresso" : "Planejada"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-2xl">{p.progress}%</span>
                    <div className="w-32"><Progress value={p.progress} className="h-2" /></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent><ChecklistList items={p.items} /></CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tech"><Card><CardContent className="p-6"><ChecklistList items={r.technicalAudit} /></CardContent></Card></TabsContent>
        <TabsContent value="func"><Card><CardContent className="p-6"><ChecklistList items={r.functionalAudit} /></CardContent></Card></TabsContent>
        <TabsContent value="ux"><Card><CardContent className="p-6"><ChecklistList items={r.uxAudit} /></CardContent></Card></TabsContent>
        <TabsContent value="sec"><Card><CardContent className="p-6"><ChecklistList items={r.securityAudit} /></CardContent></Card></TabsContent>

        <TabsContent value="bugs" className="space-y-3">
          {r.bugs.map((b) => (
            <Card key={b.id} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(
                        b.severity === "critical" && "bg-red-600",
                        b.severity === "high" && "bg-orange-500",
                        b.severity === "medium" && "bg-amber-500",
                        b.severity === "low" && "bg-slate-400",
                        "text-white",
                      )}>{b.severity}</Badge>
                      <Badge variant="outline">{b.area}</Badge>
                      <Badge variant="secondary">{b.status}</Badge>
                    </div>
                    <p className="mt-2 font-display text-lg">{b.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                    <p className="mt-2 text-sm"><span className="font-medium text-primary">Sugestão: </span>{b.suggestion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sugg" className="grid gap-3 md:grid-cols-2">
          {r.suggestions.map((s) => (
            <Card key={s.id} className="border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{s.area}</Badge>
                  <Badge className={cn(
                    s.impact === "high" && "bg-primary",
                    s.impact === "medium" && "bg-amber-500",
                    s.impact === "low" && "bg-slate-400",
                    "text-white",
                  )}>impacto {s.impact}</Badge>
                </div>
                <p className="mt-2 font-display text-base">{s.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="metrics">
          <Card><CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[
                { label: "Produtos", value: r.metrics.products, icon: Package },
                { label: "Produtos ativos", value: r.metrics.activeProducts, icon: Package },
                { label: "Categorias", value: r.metrics.categories, icon: Package },
                { label: "Pedidos", value: r.metrics.orders, icon: ShoppingCart },
                { label: "Pedidos pagos", value: r.metrics.paidOrders, icon: ShoppingCart },
                { label: "Faturamento", value: brl(r.metrics.revenue), icon: ShoppingCart },
                { label: "Usuários", value: r.metrics.users, icon: Users },
                { label: "Administradores", value: r.metrics.admins, icon: Shield },
                { label: "Avaliações", value: r.metrics.reviews, icon: Sparkles },
                { label: "Cupons", value: r.metrics.coupons, icon: Sparkles },
                { label: "Estoque baixo", value: r.metrics.lowStock, icon: AlertTriangle },
                { label: "Sem estoque", value: r.metrics.outOfStock, icon: AlertTriangle },
                { label: "Tabelas no banco", value: r.metrics.tables, icon: Database },
                { label: "Páginas", value: r.metrics.pages, icon: ClipboardList },
                { label: "Componentes", value: r.metrics.components, icon: ClipboardList },
                { label: "Server functions", value: r.metrics.serverFunctions, icon: Database },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border/60 bg-card p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <m.icon className="h-3.5 w-3.5" /> {m.label}
                  </div>
                  <p className="mt-1 font-display text-2xl">{m.value}</p>
                </div>
              ))}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="log">
          <Card><CardContent className="p-6">
            <ul className="space-y-3">
              {r.changelog.map((c, i) => (
                <li key={i} className="flex gap-3 border-l-2 border-primary/40 pl-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{c.date}</span>
                      <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm">{c.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
