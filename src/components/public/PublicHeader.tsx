import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ShoppingBag, Search, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, cartTotals } from "@/lib/cart-store";
import { getPublicSettings } from "@/lib/settings.functions";
import { listCategories } from "@/lib/categories.functions";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { items, toggle } = useCart();
  const { count } = cartTotals(items);

  const submitSearch = (close?: () => void) => (e: React.FormEvent) => {
    e.preventDefault();
    close?.();
    navigate({ to: "/loja", search: q ? { q } : {} });
  };


  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => getPublicSettings() });
  const { data: cats } = useQuery({ queryKey: ["categories"], queryFn: () => listCategories() });

  const storeName = settings?.store_name ?? "My Makes";
  const topCats = (cats ?? []).slice(0, 8);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex items-center gap-4 px-4 py-3 md:px-6 md:py-4">
        <button
          className="md:hidden -ml-2 p-2 text-foreground"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={storeName} className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-rose text-primary-foreground shadow-elegant">
              <Sparkles className="h-4 w-4" />
            </div>
          )}
          <span className="font-display text-xl tracking-tight md:text-2xl">{storeName}</span>
        </Link>

        <form className="hidden md:flex flex-1 max-w-xl mx-auto" onSubmit={submitSearch()} role="search">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar batom, base, paleta, skincare..."
              aria-label="Buscar produtos"
              className="pl-9 h-11 rounded-full border-border/60 bg-muted/40 focus-visible:ring-primary/30"
            />
          </div>
        </form>


        <div className="ml-auto flex items-center gap-1">
          <Link to="/loja" className="hidden md:inline-flex">
            <Button variant="ghost" size="sm">Loja</Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Carrinho" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shadow-elegant">
                {count}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Category strip */}
      <nav className="hidden md:block border-t border-border/40 bg-background/50">
        <div className="container mx-auto flex flex-wrap items-center gap-1 px-6 py-2">
          {topCats.map((c) => (
            <Link
              key={c.id}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className="rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={cn("md:hidden overflow-hidden border-t border-border/60 transition-all", mobileOpen ? "max-h-[70vh]" : "max-h-0")}>
        <div className="p-4 space-y-3">
          <form onSubmit={submitSearch(() => setMobileOpen(false))} role="search">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produtos..." aria-label="Buscar produtos" className="h-11" />
          </form>

          <Link to="/loja" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
            Todos os produtos
          </Link>
          <div className="grid grid-cols-2 gap-1">
            {topCats.map((c) => (
              <Link
                key={c.id}
                to="/categoria/$slug"
                params={{ slug: c.slug }}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
