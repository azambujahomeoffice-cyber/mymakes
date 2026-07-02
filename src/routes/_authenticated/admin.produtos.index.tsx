import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { listAdminProducts, deleteProduct } from "@/lib/products.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Upload, ImageOff, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/produtos/")({
  component: ProductsList,
});

function brl(n: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);
}

function ProductsList() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => listAdminProducts(),
  });
  const filtered = useMemo(() => {
    if (!q.trim()) return products;
    const s = q.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(s) || (p.sku ?? "").toLowerCase().includes(s),
    );
  }, [products, q]);

  const del = useMutation({
    mutationFn: (id: string) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Produto removido");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Produtos</h1>
          <p className="mt-1 text-muted-foreground">Gerencie todo o catálogo da loja.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/produtos/importar">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Importar com IA
            </Button>
          </Link>
          <Link to="/admin/produtos/novo">
            <Button className="bg-gradient-rose text-primary-foreground shadow-elegant">
              <Plus className="mr-2 h-4 w-4" /> Novo produto
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou SKU..." className="pl-9" />
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20"></TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <p className="font-display text-xl text-muted-foreground">Nenhum produto encontrado</p>
                    <Link to="/admin/produtos/importar">
                      <Button className="mt-4 bg-gradient-rose text-primary-foreground"><Upload className="mr-2 h-4 w-4" />Importar imagens</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => {
                const low = (p.stock_quantity ?? 0) <= 5;
                return (
                  <TableRow key={p.id} className="group">
                    <TableCell>
                      {p.main_image_url ? (
                        <img src={p.main_image_url} alt={p.name} className="h-12 w-12 rounded-md object-cover ring-1 ring-border" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{p.name}</p>
                      <div className="mt-1 flex gap-1">
                        {p.is_featured && <Badge variant="outline" className="text-[10px]">destaque</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.categories?.name ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                    <TableCell className="text-right">{brl(Number(p.promotional_price ?? p.price))}</TableCell>
                    <TableCell className={"text-center " + (low ? "text-destructive font-medium" : "")}>{p.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "active" ? "default" : "secondary"} className={p.status === "active" ? "bg-sage text-sage-foreground" : ""}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Link to="/admin/produtos/$id" params={{ id: p.id }}>
                          <Button size="icon" variant="ghost"><Pencil className="h-4 w-4" /></Button>
                        </Link>
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remover "${p.name}"?`)) del.mutate(p.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
