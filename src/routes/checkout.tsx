import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCart, cartTotals, brl } from "@/lib/cart-store";
import { createOrder } from "@/lib/orders.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — My Makes" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, clear } = useCart();
  const { subtotal, count } = cartTotals(items);
  const shipping = subtotal >= 199 ? 0 : 19.9;
  const total = subtotal + shipping;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    zip: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    notes: "",
  });

  const mut = useMutation({
    mutationFn: async () => {
      const res = await createOrder({
        data: {
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            document: form.document,
          },
          shipping: {
            zip: form.zip,
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
          },
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          notes: form.notes || undefined,
        },
      });
      return res;
    },
    onSuccess: (res) => {
      clear();
      toast.success("Pedido criado! Redirecionando para o pagamento...");
      navigate({ to: "/pedido/$orderNumber", params: { orderNumber: res.orderNumber } });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar pedido"),
  });

  useEffect(() => {
    if (count === 0) {
      navigate({ to: "/carrinho" });
    }
  }, [count, navigate]);

  const bind = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });

  return (
    <PublicShell>
      <div className="container mx-auto px-6 py-10">
        <h1 className="font-display text-3xl md:text-4xl">Finalizar compra</h1>
        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Ambiente seguro. Seus dados são protegidos.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]"
        >
          <div className="space-y-8">
            {/* Cliente */}
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="font-display text-lg">Seus dados</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Nome completo" required>
                  <Input required {...bind("name")} />
                </Field>
                <Field label="E-mail" required>
                  <Input type="email" required {...bind("email")} />
                </Field>
                <Field label="Telefone / WhatsApp" required>
                  <Input required placeholder="(11) 99999-9999" {...bind("phone")} />
                </Field>
                <Field label="CPF">
                  <Input placeholder="000.000.000-00" {...bind("document")} />
                </Field>
              </div>
            </section>

            {/* Endereço */}
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="font-display text-lg">Endereço de entrega</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <Field label="CEP" required>
                    <Input required placeholder="00000-000" {...bind("zip")} />
                  </Field>
                </div>
                <div className="sm:col-span-4">
                  <Field label="Rua" required>
                    <Input required {...bind("street")} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Número" required>
                    <Input required {...bind("number")} />
                  </Field>
                </div>
                <div className="sm:col-span-4">
                  <Field label="Complemento">
                    <Input {...bind("complement")} />
                  </Field>
                </div>
                <div className="sm:col-span-3">
                  <Field label="Bairro" required>
                    <Input required {...bind("neighborhood")} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Cidade" required>
                    <Input required {...bind("city")} />
                  </Field>
                </div>
                <div className="sm:col-span-1">
                  <Field label="UF" required>
                    <Input required maxLength={2} {...bind("state")} />
                  </Field>
                </div>
              </div>
            </section>

            {/* Observações */}
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="font-display text-lg">Observações</h2>
              <Textarea
                className="mt-3"
                placeholder="Alguma observação para seu pedido? (opcional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </section>

            {/* Pagamento */}
            <section className="rounded-2xl border bg-card p-6">
              <h2 className="font-display text-lg">Pagamento</h2>
              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">PIX — aprovação imediata</p>
                    <p className="text-xs text-muted-foreground">
                      Ao confirmar, geraremos um QR Code Mercado Pago para pagamento.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Resumo */}
          <aside className="h-fit rounded-2xl border bg-card p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-lg">Resumo do pedido</h2>
            <ul className="mt-4 space-y-3">
              {items.map((it) => (
                <li key={it.productId} className="flex gap-3 text-sm">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-2">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {it.quantity}x {brl(it.price)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{brl(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{brl(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{shipping === 0 ? "Grátis" : brl(shipping)}</span>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm">Total</span>
              <span className="font-display text-2xl text-primary">{brl(total)}</span>
            </div>
            <Button
              type="submit"
              disabled={mut.isPending}
              className="mt-5 w-full rounded-full bg-gradient-rose text-primary-foreground"
            >
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar e pagar com PIX"}
            </Button>
            <Link to="/carrinho" className="mt-3 block text-center text-xs text-muted-foreground hover:text-primary">
              Voltar para o carrinho
            </Link>
          </aside>
        </form>
      </div>
    </PublicShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
    </div>
  );
}
