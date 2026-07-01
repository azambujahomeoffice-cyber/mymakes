import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Truck, ShieldCheck, CreditCard, ArrowRight } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProductCard } from "@/components/public/ProductCard";
import { Button } from "@/components/ui/button";
import { getPublicSettings } from "@/lib/settings.functions";
import { listFeaturedProducts } from "@/lib/products.functions";
import { listCategories } from "@/lib/categories.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Makes — Maquiagem profissional com elegância" },
      { name: "description", content: "Marketplace My Makes. Maquiagem, skincare e perfumaria com curadoria premium, entrega rápida e pagamento via PIX." },
      { property: "og:title", content: "My Makes — Beleza que destaca você" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => getPublicSettings() });
  const { data: products = [] } = useQuery({ queryKey: ["featured-products"], queryFn: () => listFeaturedProducts() });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const storeName = settings?.store_name ?? "My Makes";
  const tagline = settings?.tagline ?? "Beleza que destaca a sua melhor versão";

  return (
    <PublicShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-soft">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-gold-300/25 blur-3xl" />
        </div>
        <div className="container relative mx-auto grid gap-10 px-6 py-16 md:grid-cols-2 md:py-24 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/60 px-3 py-1 text-xs uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Coleção premium
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight md:text-6xl">
              {tagline}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
              Descubra o universo {storeName}. Maquiagem, skincare e fragrâncias selecionadas para você brilhar todos os dias — com pagamento via PIX e frete grátis a partir de R$ 199.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/loja">
                <Button size="lg" className="rounded-full bg-gradient-rose text-primary-foreground shadow-elegant">
                  Explorar loja <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              {categories[0] && (
                <Link to="/categoria/$slug" params={{ slug: categories[0].slug }}>
                  <Button size="lg" variant="outline" className="rounded-full">Ver {categories[0].name}</Button>
                </Link>
              )}
            </div>
          </div>
          <div className="relative">
            {settings?.banner_url ? (
              <img src={settings.banner_url} alt="" className="w-full rounded-3xl shadow-elegant" />
            ) : (
              <div className="aspect-[4/5] rounded-3xl bg-gradient-rose shadow-elegant grid place-items-center">
                <Sparkles className="h-20 w-20 text-primary-foreground/40" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* USP */}
      <section className="border-y border-border/60 bg-background">
        <div className="container mx-auto grid gap-6 px-6 py-8 md:grid-cols-3">
          {[
            { icon: Truck, title: "Frete grátis", text: "Acima de R$ 199 para todo o Brasil" },
            { icon: CreditCard, title: "PIX com desconto", text: "Pagamento aprovado na hora" },
            { icon: ShieldCheck, title: "100% original", text: "Curadoria de marcas confiáveis" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="container mx-auto px-6 py-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-2xl md:text-3xl">Compre por categoria</h2>
            <Link to="/loja" className="text-sm text-primary hover:underline">Ver tudo</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.slice(0, 12).map((c) => (
              <Link
                key={c.id}
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                className="group rounded-2xl border border-border/60 bg-card p-5 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-rose text-primary-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-medium group-hover:text-primary">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="container mx-auto px-6 pb-20">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Curadoria da semana</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">Destaques My Makes</h2>
          </div>
          <Link to="/loja" className="text-sm text-primary hover:underline">Ver todos</Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 p-12 text-center text-sm text-muted-foreground">
            Em breve novos produtos. Aguarde!
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
