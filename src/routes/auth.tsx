import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { bootstrapFirstAdmin } from "@/lib/admin.functions";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Entrar — My Makes" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    try {
      const r = await bootstrapFirstAdmin();
      if (r.promoted) toast.success("Você foi promovido a administrador (bootstrap inicial).");
    } catch {/* ignore */}
    toast.success("Bem-vinda!");
    navigate({ to: redirect || "/admin" });
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const full_name = String(form.get("name"));
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: `${window.location.origin}/auth`,
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }
    // Auto-confirm está ativo: tentar login imediato
    const { error: lerr } = await supabase.auth.signInWithPassword({ email, password });
    if (lerr) {
      setLoading(false);
      toast.success("Cadastro feito. Faça login.");
      return;
    }
    try {
      const r = await bootstrapFirstAdmin();
      if (r.promoted) toast.success("Você é o primeiro admin do sistema!");
    } catch {/* ignore */}
    toast.success("Conta criada!");
    navigate({ to: redirect || "/admin" });
  }

  return (
    <div className="grid min-h-screen bg-gradient-soft md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-hero p-12 md:flex">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-rose text-primary-foreground shadow-elegant">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-2xl text-foreground">My Makes</span>
        </Link>
        <div>
          <h1 className="font-display text-5xl leading-tight text-foreground">Beleza com<br />assinatura própria.</h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            Acesse o painel administrativo para gerenciar produtos, pedidos e o catálogo completo da My Makes.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Painel exclusivo</p>
      </div>

      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-3xl">Acesso ao painel</CardTitle>
            <CardDescription>Use seu e-mail e senha para entrar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar conta</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="li-email">E-mail</Label>
                    <Input id="li-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="li-pass">Senha</Label>
                    <Input id="li-pass" name="password" type="password" required autoComplete="current-password" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Nome completo</Label>
                    <Input id="su-name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">E-mail</Label>
                    <Input id="su-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass">Senha</Label>
                    <Input id="su-pass" name="password" type="password" required minLength={6} autoComplete="new-password" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando..." : "Criar conta"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    O primeiro usuário a se cadastrar é automaticamente promovido a admin.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
