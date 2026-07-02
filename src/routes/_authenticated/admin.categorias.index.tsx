import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil } from "lucide-react";
import { listAdminCategories, upsertCategory, deleteCategory } from "@/lib/categories.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/categorias/")({
  component: CategoriesPage,
});

type Editing = { id?: string; name: string; description: string; icon: string; sort_order: number; is_active: boolean };
const empty: Editing = { name: "", description: "", icon: "", sort_order: 0, is_active: true };

function CategoriesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Editing>(empty);
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listAdminCategories(),
  });

  const save = useMutation({
    mutationFn: () =>
      upsertCategory({
        data: {
          id: editing.id,
          name: editing.name.trim(),
          description: editing.description || null,
          icon: editing.icon || null,
          sort_order: Number(editing.sort_order) || 0,
          is_active: editing.is_active,
        },
      }),
    onSuccess: () => {
      toast.success("Categoria salva");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setOpen(false);
      setEditing(empty);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Categoria removida");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl">Categorias</h1>
          <p className="mt-1 text-muted-foreground">Organize seu catálogo de produtos.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(empty); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty)} className="bg-gradient-rose text-primary-foreground shadow-elegant">
              <Plus className="mr-2 h-4 w-4" /> Nova categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ícone (emoji)</Label><Input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="💄" /></div>
                <div><Label>Ordem</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">Ativa</span>
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button disabled={!editing.name || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-center">Produtos</TableHead>
              <TableHead className="text-center">Ordem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Carregando...</TableCell></TableRow>}
            {!isLoading && categories.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-16 text-center text-muted-foreground">Nenhuma categoria cadastrada</TableCell></TableRow>
            )}
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-lg">{c.icon || "•"}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                <TableCell className="text-center">{c.product_count}</TableCell>
                <TableCell className="text-center">{c.sort_order}</TableCell>
                <TableCell>
                  <Badge variant={c.is_active ? "default" : "secondary"} className={c.is_active ? "bg-sage text-sage-foreground" : ""}>
                    {c.is_active ? "ativa" : "inativa"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditing({
                        id: c.id,
                        name: c.name,
                        description: c.description ?? "",
                        icon: c.icon ?? "",
                        sort_order: c.sort_order ?? 0,
                        is_active: c.is_active,
                      });
                      setOpen(true);
                    }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost"
                      onClick={() => { if (confirm(`Remover "${c.name}"?`)) del.mutate(c.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
