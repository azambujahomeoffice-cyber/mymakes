import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Download, Loader2, Sparkles } from "lucide-react";
import { generateCatalogPdf } from "@/lib/catalog.functions";
import { listAdminCategories } from "@/lib/categories.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/catalogo")({
  component: CatalogPage,
});

function CatalogPage() {
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listAdminCategories(),
  });

  const [categoryId, setCategoryId] = useState<string>("all");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(true);

  const gen = useMutation({
    mutationFn: () =>
      generateCatalogPdf({
        data: {
          categoryId: categoryId === "all" ? undefined : categoryId,
          onlyFeatured,
          onlyInStock,
        },
      }),
    onSuccess: (r) => {
      const bytes = Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Catálogo gerado com ${r.productCount} produtos`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Fase 4</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Catálogo em PDF</h1>
        <p className="mt-1 text-muted-foreground">
          Gere um catálogo profissional com capa, imagens, preços e contato da loja — sempre com os produtos atualizados.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Apenas produtos em destaque</p>
                  <p className="text-xs text-muted-foreground">Vitrine premium da marca.</p>
                </div>
                <Switch checked={onlyFeatured} onCheckedChange={setOnlyFeatured} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Apenas com estoque</p>
                  <p className="text-xs text-muted-foreground">Esconde produtos zerados.</p>
                </div>
                <Switch checked={onlyInStock} onCheckedChange={setOnlyInStock} />
              </div>
            </div>

            <Button
              size="lg"
              onClick={() => gen.mutate()}
              disabled={gen.isPending}
              className="w-full bg-gradient-rose text-primary-foreground shadow-elegant"
            >
              {gen.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Montando catálogo...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" /> Gerar e baixar PDF</>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              A geração pode levar alguns segundos por baixar e otimizar cada imagem.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-rose/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl">O que vai no PDF</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" /> Capa com nome da loja, tagline e mês.</li>
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" /> Cards com foto, nome, categoria, SKU e preço.</li>
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" /> Preço promocional destacado quando houver.</li>
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" /> WhatsApp, Instagram e cidade em cada página.</li>
              <li className="flex gap-2"><Sparkles className="mt-0.5 h-3.5 w-3.5 text-primary" /> Sempre atualizado com o catálogo atual.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
