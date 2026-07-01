import { Link } from "@tanstack/react-router";
import { Sparkles, Instagram } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPublicSettings } from "@/lib/settings.functions";

export function PublicFooter() {
  const { data: s } = useQuery({ queryKey: ["public-settings"], queryFn: () => getPublicSettings() });
  const name = s?.store_name ?? "My Makes";
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/30">
      <div className="container mx-auto grid gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-rose text-primary-foreground shadow-elegant">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display text-2xl">{name}</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            {s?.tagline ?? "Beleza curada com carinho. Maquiagem, skincare e perfumaria com entrega rápida e pagamento via PIX."}
          </p>
          {s?.instagram && (
            <a href={`https://instagram.com/${s.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Instagram className="h-4 w-4" /> {s.instagram}
            </a>
          )}
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Navegar</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/loja" className="hover:text-primary">Loja completa</Link></li>
            <li><Link to="/carrinho" className="hover:text-primary">Meu carrinho</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-sm uppercase tracking-widest text-muted-foreground">Atendimento</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {s?.whatsapp && <li>WhatsApp: {s.whatsapp}</li>}
            {s?.email && <li>{s.email}</li>}
            {s?.address_city && <li>{s.address_city}{s.address_state ? ` / ${s.address_state}` : ""}</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-5">
        <p className="text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {name}. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
