import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Star, Trash2, Upload } from "lucide-react";
import {
  upsertProduct,
  getAdminProduct,
  addProductImage,
  deleteProductImage,
  setMainProductImage,
  uploadProductImage,
} from "@/lib/products.functions";
import { listAdminCategories } from "@/lib/categories.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Props = { productId?: string };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function ProductForm({ productId }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const isEdit = !!productId;

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => listAdminCategories(),
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => getAdminProduct({ data: { id: productId! } }),
    enabled: isEdit,
  });

  const [form, setForm] = useState({
    name: "",
    short_description: "",
    description: "",
    category_id: "",
    price: "",
    promotional_price: "",
    stock_quantity: "10",
    sku: "",
    main_image_url: "",
    status: "active" as "active" | "inactive" | "draft" | "archived",
    is_featured: false,
    is_new: false,
    is_bestseller: false,
    is_on_sale: false,
  });
  const [loaded, setLoaded] = useState(false);

  if (isEdit && product && !loaded) {
    setForm({
      name: product.name ?? "",
      short_description: product.short_description ?? "",
      description: product.description ?? "",
      category_id: product.category_id ?? "",
      price: String(product.price ?? ""),
      promotional_price: product.promotional_price != null ? String(product.promotional_price) : "",
      stock_quantity: String(product.stock_quantity ?? 0),
      sku: product.sku ?? "",
      main_image_url: product.main_image_url ?? "",
      status: (product.status ?? "active") as typeof form.status,
      is_featured: !!product.is_featured,
      is_new: !!product.is_new,
      is_bestseller: !!product.is_bestseller,
      is_on_sale: !!product.is_on_sale,
    });
    setLoaded(true);
  }

  const save = useMutation({
    mutationFn: () =>
      upsertProduct({
        data: {
          id: productId,
          name: form.name.trim(),
          short_description: form.short_description || null,
          description: form.description || null,
          category_id: form.category_id || null,
          price: Number(form.price) || 0,
          promotional_price: form.promotional_price ? Number(form.promotional_price) : null,
          stock_quantity: Number(form.stock_quantity) || 0,
          sku: form.sku || null,
          main_image_url: form.main_image_url || null,
          status: form.status,
          is_featured: form.is_featured,
          is_new: form.is_new,
          is_bestseller: form.is_bestseller,
          is_on_sale: form.is_on_sale,
        },
      }),
    onSuccess: (r) => {
      toast.success(isEdit ? "Produto atualizado" : "Produto criado");
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      if (!isEdit) navigate({ to: "/admin/produtos/$id", params: { id: r.id } });
      else qc.invalidateQueries({ queryKey: ["admin-product", productId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const b64 = await fileToBase64(file);
      const { url } = await uploadProductImage({
        data: { fileName: file.name, base64: b64, contentType: file.type || "image/jpeg" },
      });
      if (productId) {
        await addProductImage({ data: { productId, imageUrl: url, isMain: !form.main_image_url } });
      } else {
        setForm((f) => ({ ...f, main_image_url: f.main_image_url || url }));
      }
      return url;
    },
    onSuccess: () => {
      toast.success("Imagem enviada");
      if (productId) qc.invalidateQueries({ queryKey: ["admin-product", productId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const delImg = useMutation({
    mutationFn: (id: string) => deleteProductImage({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-product", productId] }),
  });

  const setMain = useMutation({
    mutationFn: (imageId: string) => setMainProductImage({ data: { productId: productId!, imageId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product", productId] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Imagem principal atualizada");
    },
  });

  const images = (product?.product_images ?? []) as Array<{ id: string; image_url: string; is_main: boolean }>;

  if (isEdit && isLoading) {
    return <p className="text-muted-foreground">Carregando produto...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/produtos">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="font-display text-3xl">{isEdit ? "Editar produto" : "Novo produto"}</h1>
            <p className="text-sm text-muted-foreground">Preencha as informações e salve.</p>
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={!form.name || !form.price || save.isPending}
                className="bg-gradient-rose text-primary-foreground shadow-elegant">
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card><CardContent className="space-y-4 p-6">
            <Field label="Nome do produto">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Base HD Matte Luxe" />
            </Field>
            <Field label="Descrição curta (até 160 chars)">
              <Input maxLength={160} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
            </Field>
            <Field label="Descrição completa">
              <Textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </CardContent></Card>

          <Card><CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg">Galeria de imagens</h2>
              <label>
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload.mutate(f); e.currentTarget.value = ""; }} />
                <span className={"inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-muted " + (upload.isPending ? "opacity-60" : "")}>
                  <Upload className="h-4 w-4" /> {upload.isPending ? "Enviando..." : "Enviar imagem"}
                </span>
              </label>
            </div>

            {!isEdit && form.main_image_url && (
              <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                A imagem será salva com o produto. Após salvar você poderá adicionar mais imagens.
              </div>
            )}

            {isEdit ? (
              images.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  <ImagePlus className="mx-auto mb-2 h-6 w-6" />
                  Nenhuma imagem ainda.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((img) => (
                    <div key={img.id} className={"group relative aspect-square overflow-hidden rounded-lg ring-2 " + (img.is_main ? "ring-primary" : "ring-transparent")}>
                      <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                      <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                        <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => setMain.mutate(img.id)} disabled={img.is_main}>
                          <Star className={"h-3.5 w-3.5 " + (img.is_main ? "fill-current" : "")} />
                        </Button>
                        <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => delImg.mutate(img.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {img.is_main && <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-medium uppercase text-primary-foreground">Principal</span>}
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </CardContent></Card>
        </div>

        <div className="space-y-6">
          <Card><CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg">Preço e estoque</h2>
            <Field label="Preço (R$)">
              <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
            <Field label="Preço promocional (opcional)">
              <Input type="number" step="0.01" value={form.promotional_price} onChange={(e) => setForm({ ...form, promotional_price: e.target.value })} />
            </Field>
            <Field label="Estoque">
              <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
            </Field>
            <Field label="SKU (código interno)">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Gera automaticamente se vazio" />
            </Field>
          </CardContent></Card>

          <Card><CardContent className="space-y-4 p-6">
            <h2 className="font-display text-lg">Organização</h2>
            <Field label="Categoria">
              <Select value={form.category_id || undefined} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Separator />
            <ToggleRow label="Produto em destaque" value={form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} />
            <ToggleRow label="Novidade" value={form.is_new} onChange={(v) => setForm({ ...form, is_new: v })} />
            <ToggleRow label="Mais vendido" value={form.is_bestseller} onChange={(v) => setForm({ ...form, is_bestseller: v })} />
            <ToggleRow label="Em promoção" value={form.is_on_sale} onChange={(v) => setForm({ ...form, is_on_sale: v })} />
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
