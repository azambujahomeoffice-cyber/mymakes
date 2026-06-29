import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listImportQueue, importProductsFromQueue } from "@/lib/products.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ImageOff, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/produtos/importar")({
  component: ImportPage,
});

type ResultRow = { file: string; status: "created" | "skipped" | "error"; productId?: string; message?: string };

function ImportPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [useAI, setUseAI] = useState(true);
  const [results, setResults] = useState<ResultRow[] | null>(null);

  const { data: queue = [], isLoading, refetch } = useQuery({
    queryKey: ["import-queue"],
    queryFn: () => listImportQueue(),
  });

  const importMut = useMutation({
    mutationFn: (files: string[]) => importProductsFromQueue({ data: { files, useAI } }),
    onSuccess: (r) => {
      setResults(r.results);
      const created = r.results.filter((x) => x.status === "created").length;
      toast.success(`${created} produto(s) criados`);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setSelected(new Set());
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function toggle(name: string) {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name); else next.add(name);
    setSelected(next);
  }
  function toggleAll() {
    if (selected.size === queue.length) setSelected(new Set());
    else setSelected(new Set(queue.map((q) => q.name)));
  }

  const toImport = selected.size > 0 ? Array.from(selected) : queue.map((q) => q.name);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl tracking-tight">Importar produtos</h1>
        <p className="mt-1 text-muted-foreground">
          Imagens detectadas no bucket <code className="rounded bg-muted px-1.5 py-0.5 text-xs">product-images/imports/</code>.
          A IA identifica nome, categoria, descrição e sugere um preço.
        </p>
      </header>

      <Card className="border-primary/30 bg-gradient-hero/30">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-rose text-primary-foreground shadow-elegant">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg">Inferência automática com IA</p>
              <p className="text-sm text-muted-foreground">Modelo: Gemini 3 Flash · Visão computacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Usar IA</span>
            <Switch checked={useAI} onCheckedChange={setUseAI} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-display text-2xl">Fila de importação</CardTitle>
            <CardDescription>{queue.length} imagem(ns) prontas</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>Atualizar</Button>
            <Button variant="outline" size="sm" onClick={toggleAll} disabled={!queue.length}>
              {selected.size === queue.length && queue.length ? "Limpar seleção" : "Selecionar tudo"}
            </Button>
            <Button
              className="bg-gradient-rose text-primary-foreground shadow-elegant"
              disabled={!queue.length || importMut.isPending}
              onClick={() => importMut.mutate(toImport)}
            >
              {importMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Importar {selected.size > 0 ? `${selected.size}` : "todas"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Carregando fila...</p>}
          {!isLoading && queue.length === 0 && (
            <div className="rounded-xl border border-dashed border-border/70 p-10 text-center">
              <ImageOff className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-display text-lg">A fila está vazia</p>
              <p className="text-sm text-muted-foreground">Faça upload de novas imagens em product-images/imports/.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {queue.map((item) => {
              const isSel = selected.has(item.name);
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => toggle(item.name)}
                  className={`group relative overflow-hidden rounded-xl border bg-card text-left shadow-soft transition ${isSel ? "border-primary ring-2 ring-primary/40" : "border-border/60 hover:border-primary/40"}`}
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={item.url} alt={item.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2">
                    <p className="truncate text-xs text-muted-foreground">{item.name}</p>
                    <Checkbox checked={isSel} />
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Resultado</CardTitle>
            <CardDescription>
              {results.filter((r) => r.status === "created").length} criados ·{" "}
              {results.filter((r) => r.status === "skipped").length} ignorados ·{" "}
              {results.filter((r) => r.status === "error").length} erros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((r) => (
              <div key={r.file} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 p-3 text-sm">
                <div className="flex items-start gap-2">
                  {r.status === "created" && <CheckCircle2 className="mt-0.5 h-4 w-4 text-sage-foreground" />}
                  {r.status === "skipped" && <AlertTriangle className="mt-0.5 h-4 w-4 text-gold" />}
                  {r.status === "error" && <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />}
                  <div>
                    <p className="font-medium">{r.file}</p>
                    {r.message && <p className="text-xs text-muted-foreground">{r.message}</p>}
                  </div>
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
