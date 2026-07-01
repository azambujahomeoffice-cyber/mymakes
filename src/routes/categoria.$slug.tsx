import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/public/PublicShell";
import { ProductCard } from "@/components/public/ProductCard";
import { listPublicProducts } from "@/lib/products.functions";
import { listCategories } from "@/lib/categories.functions";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} — My Makes` }] }),
  component: CategoriaPage,
});

function CategoriaPage() {
  const { slug } = Route.useParams();
  const { data: cats = [] } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", slug],
    queryFn: () => listPublicProducts({ data: { categorySlug: slug } }),
  });
  const cat = cats.find((c) => c.slug === slug);

  return (
    <PublicShell>
      <section className="border-b border-border/60 bg-gradient-soft">
        <div className="container mx-auto px-6 py-12">
          <nav className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/loja" className="hover:text-primary">Loja</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{cat?.name ?? slug}</span>
          </nav>
          <h1 className="mt-3 font-display text-3xl md:text-4xl">{cat?.name ?? slug}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? "produto" : "produtos"} nesta categoria
          </p>
        </div>
      </section>
      <section className="container mx-auto px-6 py-10">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Nenhum produto nesta categoria ainda. <Link to="/loja" className="text-primary hover:underline">Ver todos</Link>
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
