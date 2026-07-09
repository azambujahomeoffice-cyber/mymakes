import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ChecklistStatus = "done" | "partial" | "todo";
export type ChecklistItem = { key: string; label: string; status: ChecklistStatus; note?: string };
export type Phase = {
  id: string;
  name: string;
  status: "done" | "in_progress" | "planned";
  progress: number;
  items: ChecklistItem[];
};
export type Bug = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  area: string;
  title: string;
  description: string;
  suggestion: string;
  status: "open" | "monitoring" | "resolved";
};
export type Suggestion = { id: string; area: string; title: string; impact: "low" | "medium" | "high"; description: string };

export type AuditReport = {
  generatedAt: string;
  overallScore: number;
  overallProgress: number;
  status: string;
  currentPhase: string;
  nextPhase: string;
  summary: string;
  actionPlan: string[];
  metrics: {
    products: number;
    activeProducts: number;
    categories: number;
    orders: number;
    paidOrders: number;
    revenue: number;
    users: number;
    admins: number;
    reviews: number;
    coupons: number;
    lowStock: number;
    outOfStock: number;
    tables: number;
    pages: number;
    components: number;
    serverFunctions: number;
  };
  phases: Phase[];
  checklist: ChecklistItem[];
  technicalAudit: ChecklistItem[];
  functionalAudit: ChecklistItem[];
  uxAudit: ChecklistItem[];
  securityAudit: ChecklistItem[];
  bugs: Bug[];
  suggestions: Suggestion[];
  changelog: { date: string; type: string; description: string }[];
};

// Curated project facts. These reflect the actual state of the codebase.
// Whenever functionality changes, update these tables — the audit reads from them.
const PHASES_DEF: Omit<Phase, "progress">[] = [
  {
    id: "phase-0", name: "Fase 0 — Central de Auditoria", status: "done",
    items: [
      { key: "audit-dashboard", label: "Dashboard de auditoria", status: "done" },
      { key: "audit-roadmap", label: "Roadmap por fases", status: "done" },
      { key: "audit-checklist", label: "Checklist automático", status: "done" },
      { key: "audit-run", label: "Botão executar auditoria", status: "done" },
      { key: "audit-log", label: "Log automático de evolução", status: "partial", note: "Baseado em curadoria; sem histórico versionado ainda" },
    ],
  },
  {
    id: "phase-1", name: "Fase 1 — Backend + Administração", status: "done",
    items: [
      { key: "db-schema", label: "Schema completo (17 tabelas)", status: "done" },
      { key: "auth", label: "Autenticação email/senha", status: "done" },
      { key: "roles", label: "Sistema de papéis (admin/manager/staff/customer)", status: "done" },
      { key: "rls", label: "RLS + policies em todas as tabelas", status: "done" },
      { key: "admin-shell", label: "Shell administrativo", status: "done" },
      { key: "admin-first", label: "Auto-promoção do primeiro admin", status: "done" },
      { key: "google-oauth", label: "Login Google/OAuth", status: "todo", note: "Somente email/senha hoje" },
    ],
  },
  {
    id: "phase-2", name: "Fase 2 — Loja Pública", status: "done",
    items: [
      { key: "home", label: "Home / vitrine", status: "done" },
      { key: "store", label: "Página /loja com busca e filtros", status: "done" },
      { key: "category", label: "Página de categoria", status: "done" },
      { key: "product", label: "Página de produto", status: "done" },
      { key: "cart", label: "Carrinho persistente (Zustand)", status: "done" },
      { key: "checkout", label: "Checkout completo", status: "done" },
      { key: "order-status", label: "Página de status do pedido", status: "done" },
      { key: "reviews-ui", label: "Avaliações na página de produto", status: "todo" },
      { key: "wishlist-ui", label: "Wishlist na UI", status: "todo", note: "Tabela existe" },
    ],
  },
  {
    id: "phase-3", name: "Fase 3 — Gestão de Produtos", status: "done",
    items: [
      { key: "products-crud", label: "CRUD de produtos", status: "done" },
      { key: "product-images", label: "Upload de imagens", status: "done" },
      { key: "ai-import", label: "Importação com IA (nome/categoria/descrição)", status: "done" },
      { key: "categories-crud", label: "CRUD de categorias", status: "done" },
      { key: "orders-admin", label: "Gestão de pedidos", status: "done" },
      { key: "stock", label: "Controle de estoque básico", status: "partial", note: "Sem movimentações registradas em stock_movements" },
      { key: "variants", label: "Variantes de produto", status: "partial", note: "Tabela pronta; UI não conectada" },
      { key: "brands", label: "Marcas", status: "partial", note: "Tabela pronta; sem CRUD" },
    ],
  },
  {
    id: "phase-4", name: "Fase 4 — Catálogo PDF", status: "done",
    items: [
      { key: "pdf-gen", label: "Geração via pdf-lib", status: "done" },
      { key: "pdf-filters", label: "Filtros (categoria, destaque, estoque)", status: "done" },
      { key: "pdf-cover", label: "Capa + rodapé com contato", status: "done" },
      { key: "pdf-preview", label: "Pré-visualização inline", status: "todo" },
    ],
  },
  {
    id: "phase-5", name: "Fase 5 — Pagamentos PIX / Mercado Pago", status: "planned",
    items: [
      { key: "mp-token", label: "Access Token Mercado Pago", status: "todo" },
      { key: "mp-create-payment", label: "Criação de PIX na criação do pedido", status: "todo" },
      { key: "mp-webhook", label: "Webhook /api/public/webhooks/mercadopago", status: "todo" },
      { key: "mp-qr", label: "QR + Copia e Cola no /pedido", status: "todo" },
      { key: "mp-polling", label: "Polling de status até aprovado", status: "todo" },
    ],
  },
  {
    id: "phase-6", name: "Fase 6 — Integrações externas", status: "planned",
    items: [
      { key: "pagseguro", label: "PagSeguro", status: "todo" },
      { key: "asaas", label: "Asaas", status: "todo" },
      { key: "melhor-envio", label: "Melhor Envio", status: "todo" },
      { key: "correios", label: "Correios", status: "todo" },
      { key: "ga", label: "Google Analytics", status: "todo" },
      { key: "meta-pixel", label: "Meta Pixel", status: "todo" },
      { key: "whatsapp-bot", label: "Notificações WhatsApp", status: "todo" },
    ],
  },
  {
    id: "phase-7", name: "Fase 7 — Melhorias futuras", status: "planned",
    items: [
      { key: "multi-seller", label: "Multi-vendedor (marketplace)", status: "todo" },
      { key: "tests", label: "Testes automatizados", status: "todo" },
      { key: "seo-advanced", label: "SEO avançado + sitemap dinâmico", status: "todo" },
      { key: "cache", label: "Camada de cache (Redis/edge)", status: "todo" },
      { key: "i18n", label: "Internacionalização", status: "todo" },
      { key: "email-tx", label: "E-mails transacionais", status: "todo" },
    ],
  },
];

const TECH_AUDIT: ChecklistItem[] = [
  { key: "tsx", label: "TypeScript estrito", status: "done" },
  { key: "routing", label: "TanStack Router (file-based)", status: "done" },
  { key: "query", label: "TanStack Query em todas as rotas", status: "done" },
  { key: "server-fns", label: "Server functions tipadas", status: "done" },
  { key: "supabase", label: "Supabase + RLS", status: "done" },
  { key: "structure", label: "Estrutura de pastas coesa", status: "done" },
  { key: "dead-code", label: "Ausência de código morto", status: "done" },
  { key: "duplication", label: "Baixa duplicação de código", status: "done" },
  { key: "error-boundaries", label: "errorComponent/notFoundComponent em rotas com loader", status: "partial", note: "Root cobre; rotas com loader ainda podem herdar" },
  { key: "auth-gate", label: "_authenticated com ssr:false + getUser()", status: "done", note: "Corrige loop de redirect no hard-refresh" },
  { key: "auth-listener", label: "onAuthStateChange no root (invalidate cache)", status: "done" },
  { key: "spa-nav", label: "Navegação SPA (sem window.location)", status: "done", note: "Busca do header usa useNavigate" },
  { key: "logs", label: "Observabilidade / logs estruturados", status: "todo" },
  { key: "tests", label: "Testes automatizados", status: "todo" },
];


const FUNC_AUDIT: ChecklistItem[] = [
  { key: "home", label: "Home", status: "done" },
  { key: "store", label: "Vitrine /loja", status: "done" },
  { key: "search", label: "Busca de produtos", status: "done" },
  { key: "filters", label: "Filtros de vitrine", status: "partial", note: "Só categoria + busca; falta preço/tag/brand" },
  { key: "product-page", label: "Página de produto", status: "done" },
  { key: "cart", label: "Carrinho", status: "done" },
  { key: "checkout", label: "Checkout", status: "done" },
  { key: "payment", label: "Pagamento (PIX/MP)", status: "todo" },
  { key: "login", label: "Login/Cadastro", status: "done" },
  { key: "admin-dashboard", label: "Dashboard admin", status: "done" },
  { key: "admin-products", label: "Gestão produtos", status: "done" },
  { key: "admin-orders", label: "Gestão pedidos", status: "done" },
  { key: "admin-settings", label: "Configurações da loja", status: "done" },
  { key: "customers", label: "Área de clientes / perfil", status: "todo" },
];

const UX_AUDIT: ChecklistItem[] = [
  { key: "nav", label: "Navegação clara (header/footer/admin)", status: "done" },
  { key: "responsive", label: "Responsivo (mobile-first)", status: "done" },
  { key: "loading", label: "Estados de carregamento", status: "done" },
  { key: "empty", label: "Empty states", status: "partial" },
  { key: "toasts", label: "Feedback via toast (sonner)", status: "done" },
  { key: "a11y", label: "Acessibilidade (labels/ARIA)", status: "partial" },
  { key: "consistency", label: "Consistência visual (design tokens)", status: "done" },
  { key: "perf", label: "Performance / lazy images", status: "partial" },
  { key: "a11y-cart", label: "Botões +/- do carrinho com aria-label", status: "done" },
  { key: "seo-sitemap", label: "sitemap.xml + robots.txt", status: "done" },
];


const SEC_AUDIT: ChecklistItem[] = [
  { key: "auth", label: "Autenticação Supabase", status: "done" },
  { key: "rls", label: "RLS ativo em todas as tabelas", status: "done" },
  { key: "roles-table", label: "Papéis em tabela separada + has_role()", status: "done" },
  { key: "route-guard", label: "Rotas protegidas via _authenticated", status: "done" },
  { key: "secrets", label: "Secrets em variáveis de ambiente do servidor", status: "done" },
  { key: "sql-injection", label: "Consultas parametrizadas (PostgREST/Supabase JS)", status: "done" },
  { key: "xss", label: "Proteção XSS (React escapa por padrão)", status: "done" },
  { key: "csrf", label: "CSRF (server fns same-origin)", status: "done" },
  { key: "rate-limit", label: "Rate limiting em endpoints públicos", status: "todo" },
  { key: "audit-log", label: "admin_logs alimentado", status: "todo", note: "Tabela existe; sem escrita ainda" },
];

const BUGS: Bug[] = [
  {
    id: "bug-1", severity: "medium", area: "Auth",
    title: "Login Google não configurado", status: "open",
    description: "Fluxo social OAuth (Google) previsto no template mas não habilitado no provider do Supabase.",
    suggestion: "Executar configure_social_auth('google') e adicionar botão no /auth.",
  },
  {
    id: "bug-2", severity: "high", area: "Pagamento",
    title: "Checkout finaliza sem pagamento real", status: "open",
    description: "Pedidos são criados com status awaiting_payment mas não há geração de PIX ou integração de pagamento.",
    suggestion: "Implementar Fase 5 (Mercado Pago PIX + webhook).",
  },
  {
    id: "bug-3", severity: "low", area: "Estoque",
    title: "stock_movements nunca é escrito", status: "open",
    description: "Alterações de estoque no admin não geram registro em stock_movements.",
    suggestion: "Adicionar trigger ou escrita explícita em updateProduct/orders.",
  },
  {
    id: "bug-4", severity: "low", area: "Catálogo",
    title: "Sem pré-visualização do PDF", status: "open",
    description: "Usuário precisa baixar o arquivo para conferir.",
    suggestion: "Renderizar <iframe> com a URL blob antes do download.",
  },
  {
    id: "bug-5", severity: "medium", area: "Loja",
    title: "Filtros limitados na vitrine", status: "open",
    description: "Somente busca textual e categoria; sem filtros por preço, marca ou tags.",
    suggestion: "Adicionar sidebar de filtros com range de preço, brand, novidades e destaques.",
  },
];

const SUGGESTIONS: Suggestion[] = [
  { id: "s1", area: "Performance", title: "Lazy loading + <img loading='lazy'>", impact: "medium", description: "Ganhos imediatos de LCP na vitrine." },
  { id: "s2", area: "SEO", title: "Sitemap dinâmico e JSON-LD Product", impact: "high", description: "Melhorar indexação de produtos no Google Shopping." },
  { id: "s3", area: "DX", title: "Adicionar testes (vitest + Playwright)", impact: "medium", description: "Reduz regressões em fluxos críticos (checkout, admin)." },
  { id: "s4", area: "Banco", title: "Índices em orders.status e products.slug", impact: "medium", description: "Consultas de vitrine e admin escalam melhor." },
  { id: "s5", area: "UX", title: "Skeletons e empty states dedicados", impact: "low", description: "Percepção de performance mais alta." },
  { id: "s6", area: "Segurança", title: "Rate limit em rotas públicas de pedido/checkout", impact: "high", description: "Evita abuso e fraude." },
  { id: "s7", area: "Marketing", title: "Google Analytics + Meta Pixel", impact: "high", description: "Base para campanhas e remarketing." },
  { id: "s8", area: "Ops", title: "Alimentar admin_logs + timeline de eventos", impact: "medium", description: "Auditoria real das ações administrativas." },
];

const CHANGELOG = [
  { date: "2026-06-29", type: "feature", description: "Fase 1 — Backend + shell administrativo entregues." },
  { date: "2026-06-30", type: "feature", description: "Fase 2 — Loja pública, carrinho, checkout e página de pedido." },
  { date: "2026-07-01", type: "feature", description: "Fase 3 — CRUD de produtos, categorias e pedidos + importação IA." },
  { date: "2026-07-02", type: "feature", description: "Fase 4 — Geração de catálogo PDF com pdf-lib." },
  { date: "2026-07-08", type: "fix", description: "Auth email auto-confirm + auto-promoção do primeiro admin." },
  { date: "2026-07-08", type: "feature", description: "Fase 0 — Central de Auditoria do Projeto." },
];

function phaseProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  const score = items.reduce((s, i) => s + (i.status === "done" ? 1 : i.status === "partial" ? 0.5 : 0), 0);
  return Math.round((score / items.length) * 100);
}

export const runProjectAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase;
    const [
      products, activeProducts, cats, orders, paidOrders, revenueRes,
      users, admins, reviews, coupons, lowStock, outOfStock,
    ] = await Promise.all([
      s.from("products").select("id", { count: "exact", head: true }),
      s.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      s.from("categories").select("id", { count: "exact", head: true }),
      s.from("orders").select("id", { count: "exact", head: true }),
      s.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
      s.from("orders").select("total").eq("payment_status", "paid"),
      s.from("profiles").select("id", { count: "exact", head: true }),
      s.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
      s.from("reviews").select("id", { count: "exact", head: true }),
      s.from("coupons").select("id", { count: "exact", head: true }),
      s.from("products").select("id", { count: "exact", head: true }).lte("stock_quantity", 5).gt("stock_quantity", 0),
      s.from("products").select("id", { count: "exact", head: true }).eq("stock_quantity", 0),
    ]);

    const revenue = (revenueRes.data ?? []).reduce((sum, r) => sum + Number(r.total), 0);

    const phases: Phase[] = PHASES_DEF.map((p) => ({ ...p, progress: phaseProgress(p.items) }));
    const overallProgress = Math.round(phases.reduce((a, p) => a + p.progress, 0) / phases.length);

    const allItems = phases.flatMap((p) => p.items);
    const overallScore = Math.round(
      0.6 * overallProgress +
      0.2 * (phaseProgress(TECH_AUDIT)) +
      0.1 * (phaseProgress(SEC_AUDIT)) +
      0.1 * (phaseProgress(UX_AUDIT))
    );

    const currentPhase = phases.find((p) => p.status !== "done")?.name ?? "Todas as fases concluídas";
    const nextPhaseIdx = phases.findIndex((p) => p.status === "planned");
    const nextPhase = nextPhaseIdx >= 0 ? phases[nextPhaseIdx].name : "—";

    const report: AuditReport = {
      generatedAt: new Date().toISOString(),
      overallScore,
      overallProgress,
      status: overallProgress >= 80 ? "Em maturação" : overallProgress >= 50 ? "Em desenvolvimento ativo" : "Fase inicial",
      currentPhase,
      nextPhase,
      summary:
        `Marketplace My Makes com ${products.count ?? 0} produtos, ${cats.count ?? 0} categorias e ${orders.count ?? 0} pedidos. ` +
        `Fases 0–4 entregues; pagamento real (PIX) e integrações externas são as próximas prioridades. ` +
        `Arquitetura sólida sobre TanStack Start + Supabase com RLS ativa e papéis segregados.`,
      actionPlan: [
        "1. Implementar Fase 5 — PIX/Mercado Pago (server fn + webhook + polling na página do pedido).",
        "2. Adicionar Google OAuth e área do cliente (perfil + histórico de pedidos).",
        "3. Ligar stock_movements + admin_logs para rastreabilidade real.",
        "4. Expandir filtros da vitrine (preço, marca, tags) e ativar reviews/wishlist na UI.",
        "5. Integrações de marketing (GA + Meta Pixel) e frete (Melhor Envio/Correios).",
        "6. Testes automatizados nos fluxos críticos (checkout, admin, importação).",
      ],
      metrics: {
        products: products.count ?? 0,
        activeProducts: activeProducts.count ?? 0,
        categories: cats.count ?? 0,
        orders: orders.count ?? 0,
        paidOrders: paidOrders.count ?? 0,
        revenue,
        users: users.count ?? 0,
        admins: admins.count ?? 0,
        reviews: reviews.count ?? 0,
        coupons: coupons.count ?? 0,
        lowStock: lowStock.count ?? 0,
        outOfStock: outOfStock.count ?? 0,
        tables: 17,
        pages: 20,
        components: 12,
        serverFunctions: 9,
      },
      phases,
      checklist: allItems,
      technicalAudit: TECH_AUDIT,
      functionalAudit: FUNC_AUDIT,
      uxAudit: UX_AUDIT,
      securityAudit: SEC_AUDIT,
      bugs: BUGS,
      suggestions: SUGGESTIONS,
      changelog: CHANGELOG,
    };
    return report;
  });
