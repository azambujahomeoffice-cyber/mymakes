import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminSettings, updateStoreSettings } from "@/lib/settings.functions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: Settings,
});

function Settings() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getAdminSettings(),
  });
  const mut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateStoreSettings({ data: payload }),
    onSuccess: () => {
      toast.success("Configurações salvas");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["public-settings"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const obj: Record<string, unknown> = {};
    fd.forEach((v, k) => { obj[k] = v === "" ? null : v; });
    mut.mutate(obj);
  }

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl tracking-tight">Configurações</h1>
        <p className="mt-1 text-muted-foreground">Identidade visual, contato e integrações de pagamento.</p>
      </header>

      <form onSubmit={onSubmit}>
        <Tabs defaultValue="brand">
          <TabsList>
            <TabsTrigger value="brand">Marca</TabsTrigger>
            <TabsTrigger value="contact">Contato</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="brand">
            <Card>
              <CardHeader><CardTitle>Identidade da loja</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field name="store_name" label="Nome da loja" defaultValue={settings?.store_name ?? "My Makes"} />
                <Field name="tagline" label="Slogan" defaultValue={settings?.tagline ?? ""} />
                <Field name="logo_url" label="URL do logo" defaultValue={settings?.logo_url ?? ""} className="md:col-span-2" />
                <Field name="banner_url" label="URL do banner principal" defaultValue={settings?.banner_url ?? ""} className="md:col-span-2" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader><CardTitle>Contato e redes</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field name="email" type="email" label="E-mail" defaultValue={settings?.email ?? ""} />
                <Field name="phone" label="Telefone" defaultValue={settings?.phone ?? ""} />
                <Field name="whatsapp" label="WhatsApp" defaultValue={settings?.whatsapp ?? ""} />
                <Field name="instagram" label="Instagram" defaultValue={settings?.instagram ?? ""} />
                <Field name="facebook" label="Facebook" defaultValue={settings?.facebook ?? ""} />
                <Field name="tiktok" label="TikTok" defaultValue={settings?.tiktok ?? ""} />
                <Field name="address_city" label="Cidade" defaultValue={settings?.address_city ?? ""} />
                <Field name="address_state" label="Estado" defaultValue={settings?.address_state ?? ""} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos</CardTitle>
                <CardDescription>
                  Chave PIX para pagamento manual e Mercado Pago para PIX automático (cobrança e webhook).
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field name="pix_key" label="Chave PIX" defaultValue={settings?.pix_key ?? ""} />
                <Field name="pix_key_type" label="Tipo da chave (cpf/cnpj/email/telefone/aleatoria)" defaultValue={settings?.pix_key_type ?? ""} />
                <Field name="mercadopago_public_key" label="Mercado Pago — Public Key" defaultValue={settings?.mercadopago_public_key ?? ""} className="md:col-span-2" />
                <div className="md:col-span-2 rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  O <strong>Access Token</strong> do Mercado Pago é armazenado como <em>secret</em> no Lovable Cloud
                  (variável <code className="rounded bg-muted px-1">MERCADOPAGO_ACCESS_TOKEN</code>).
                  Quando estiver pronto para ativar PIX automático, peça para configurar a secret.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo">
            <Card>
              <CardHeader><CardTitle>SEO padrão</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Field name="seo_default_title" label="Título padrão" defaultValue={settings?.seo_default_title ?? ""} />
                <div className="space-y-2">
                  <Label htmlFor="seo_default_description">Descrição padrão</Label>
                  <Textarea id="seo_default_description" name="seo_default_description" defaultValue={settings?.seo_default_description ?? ""} rows={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" className="bg-gradient-rose text-primary-foreground shadow-elegant" disabled={mut.isPending}>
            {mut.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ name, label, defaultValue, type, className }: { name: string; label: string; defaultValue?: string; type?: string; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type ?? "text"} defaultValue={defaultValue} />
    </div>
  );
}
