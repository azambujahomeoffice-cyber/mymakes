import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ShoppingBag, ShieldCheck } from "lucide-react";
import { getPublicSettings } from "@/lib/settings.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Makes — Maquiagem profissional com elegância" },
      { name: "description", content: "Marketplace oficial My Makes. Produtos de maquiagem selecionados com curadoria, entrega rápida e atendimento via WhatsApp." },
      { property: "og:title", content: "My Makes — Beleza que destaca você" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => getPublicSettings(),
  });
  const storeName = settings?.store_name ?? "My Makes";
  const tagline = settings?.tagline ?? "Beleza que destaca a sua melhor versão";

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={storeName} className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-rose text-primary-foreground shadow-elegant">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            <span className="font-display text-2xl tracking-tight text-foreground">{storeName}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-hero">
        <div className="container mx-auto grid gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="flex flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Coleção em breve
            </span>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl">
              {tagline}
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Estamos preparando uma vitrine cuidadosamente curada com os melhores produtos
              de maquiagem. Em poucos cliques você terá acesso ao catálogo completo, com
              pagamento via PIX e atendimento personalizado.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="shadow-elegant">
                  Acessar painel admin
                </Button>
              </Link>
              <a href="#fases">
                <Button size="lg" variant="outline">Ver roadmap</Button>
              </a>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-rose opacity-20 blur-3xl" />
            <div className="grid w-full max-w-md grid-cols-2 gap-4">
              {["Batom", "Base", "Paleta", "Skincare"].map((label, i) => (
                <div
                  key={label}
                  className="group relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft"
                  style={{ transform: `translateY(${i % 2 === 0 ? "0" : "1.5rem"})` }}
                >
                  <div className="absolute inset-0 bg-gradient-rose opacity-10 transition-opacity group-hover:opacity-25" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-display text-xl text-foreground">{label}</p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Em breve</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="fases" className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Roadmap</p>
          <h2 className="mt-4 font-display text-4xl tracking-tight text-foreground">Construído por fases, sem retrabalho</h2>
          <p className="mt-4 text-muted-foreground">
            Toda a arquitetura — banco de dados, APIs e UI — já está pensada para suportar as próximas fases do marketplace.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Fase 1 — Backend + Admin", desc: "Schema completo, autenticação, painel administrativo, importação de produtos via IA e estrutura PIX (Mercado Pago).", active: true },
            { icon: ShoppingBag, title: "Fase 2 — Loja pública", desc: "Home premium, busca inteligente, página de produto, carrinho e checkout completo." },
            { icon: Sparkles, title: "Fases 3–6", desc: "Gestão avançada de produtos, dashboards com gráficos, gerador de catálogo PDF e integrações (PagSeguro, Asaas, Melhor Envio, Correios, Analytics, Pixel)." },
          ].map(({ icon: Icon, title, desc, active }) => (
            <div
              key={title}
              className={`rounded-2xl border p-6 transition ${active ? "border-primary/40 bg-card shadow-elegant" : "border-border/60 bg-card/60"}`}
            >
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-gradient-rose text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              {active && <span className="mt-4 inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">em andamento</span>}
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background/60">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
          <p className="font-display text-base text-foreground">{tagline}</p>
        </div>
      </footer>
    </div>
  );
}
