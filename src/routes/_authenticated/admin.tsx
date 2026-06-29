import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  LayoutDashboard, Package, Upload, Settings, LogOut, Sparkles, ShoppingCart, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/produtos/importar", label: "Importar (IA)", icon: Upload },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart, soon: true },
  { to: "/admin/categorias", label: "Categorias", icon: Tag, soon: true },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: roleData, isLoading } = useQuery({
    queryKey: ["my-role"],
    queryFn: () => getMyRole(),
  });

  useEffect(() => {
    if (!isLoading && roleData && roleData.role === "customer") {
      navigate({ to: "/" });
    }
  }, [isLoading, roleData, navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <Toaster richColors position="top-right" />
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
          <Link to="/" className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-rose text-primary-foreground shadow-elegant">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-lg leading-none text-sidebar-foreground">My Makes</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Painel admin</p>
            </div>
          </Link>
          <nav className="flex-1 space-y-1 p-3">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = item.exact ? path === item.to : path.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.soon ? "/admin" : item.to}
                  className={cn(
                    "group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    item.soon && "opacity-60 cursor-not-allowed",
                  )}
                  onClick={(e) => item.soon && e.preventDefault()}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  {item.soon && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">em breve</span>}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-sidebar-border p-3">
            <div className="mb-2 px-3 py-2 text-xs text-sidebar-foreground/70">
              Função: <span className="font-medium text-sidebar-foreground">{roleData?.role ?? "..."}</span>
            </div>
            <Button variant="ghost" className="w-full justify-start" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </Button>
          </div>
        </aside>

        <main className="flex-1 overflow-x-hidden">
          <div className="md:hidden border-b border-border bg-background px-4 py-3 flex items-center justify-between">
            <span className="font-display text-lg">My Makes · Admin</span>
            <Button size="sm" variant="ghost" onClick={logout}><LogOut className="h-4 w-4" /></Button>
          </div>
          <div className="container mx-auto max-w-7xl px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
