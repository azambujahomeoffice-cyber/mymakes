import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { ProductCard } from "@/components/public/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listPublicProducts } from "@/lib/products.functions";
import { listCategories } from "@/lib/categories.functions";
import { cn } from "@/lib/utils";
import * as v from "valibot";

const Search$ = v.object({
  q: v.optional(v.string()),
  cat: v.optional(v.string()),
  sort: v.optional(v.picklist(["recent", "price-asc", "price-desc", "name"])),
});

export const Route = createFileRoute("/loja")({
  head: () => ({
    meta: [
      { title: "Loja completa — My Makes" },
      { name: "description", content: "Explore todo o catálogo My Makes: maquiagem, skincare e perfumaria com preços especiais." },
    ],
  }),
  validateSearch: (s) => v.parse(Search$, s),
  component: LojaPage,
});

function LojaPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search.cat, search.q],
    queryFn: () => listPublicProducts({ data: { categorySlug: search.cat, q: search.q } }),
  });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const sorted = useMemo(() => {
    const arr = [...products];
    switch (search.sort) {
      case "price-asc":
        return arr.sort((a, b) => Number(a.promotional_price ?? a.price) - Number(b.promotional_price ?? b.price));
      case "price-desc":
        return arr.sort((a, b) => Number(b.promotional_price ?? b.price) - Number(a.promotional_price ?? a.price));
      case "name":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return arr;
    }
  }, [products, search.sort]);

  const activeCat = categories.find((c) => c.slug === search.cat);

  return (
    <PublicShell>
      <section className="border-b border-border/60 bg-gradient-soft">
        <div className="container mx-auto px-6 py-10 md:py-14">
          <p className="text-xs uppercase tracking-widest text-primary">Catálogo</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">
            {activeCat ? activeCat.name : "Toda a loja My Makes"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Curadoria completa de produtos de beleza. Use os filtros abaixo para encontrar seu próximo favorito.
          </p>

          <form
            className="mt-6 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ search: (s) => ({ ...s, q: q || undefined }) });
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você procura?"
                className="pl-9 h-11 rounded-full"
              />
            </div>
            <Button type="submit" className="rounded-full bg-gradient-rose text-primary-foreground">Buscar</Button>
          </form>
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-6 py-10 md:grid-cols-[240px_1fr]">
        <aside className="space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Categorias
            </div>
            <div className="space-y-1">
              <button
                onClick={() => navigate({ search: (s) => ({ ...s, cat: undefined }) })}
                className={cn(
                  "block w-full rounded-lg px-3 py-2 text-left text-sm transition",
                  !search.cat ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                )}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate({ search: (s) => ({ ...s, cat: c.slug }) })}
                  className={cn(
                    "block w-full rounded-lg px-3 py-2 text-left text-sm transition",
                    search.cat === c.slug ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : `${sorted.length} produtos encontrados`}
            </p>
            <select
              value={search.sort ?? "recent"}
              onChange={(e) => navigate({ search: (s) => ({ ...s, sort: e.target.value as "recent" | "price-asc" | "price-desc" | "name" }) })}
              className="h-9 rounded-full border border-border bg-background px-4 text-sm"
            >
              <option value="recent">Mais recentes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>

          {sorted.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado. <Link to="/loja" className="text-primary hover:underline">Limpar filtros</Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {sorted.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
