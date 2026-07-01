import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

type CheckoutInput = {
  customer: {
    name: string;
    email: string;
    phone: string;
    document?: string;
  };
  shipping: {
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  items: { productId: string; quantity: number }[];
  notes?: string;
};

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => i as CheckoutInput)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.items?.length) throw new Error("Carrinho vazio");

    const ids = data.items.map((i) => i.productId);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price, promotional_price, main_image_url, sku")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    if (!products?.length) throw new Error("Produtos não encontrados");

    const orderItems = data.items.map((it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) throw new Error(`Produto ${it.productId} indisponível`);
      const unit = Number(p.promotional_price ?? p.price);
      return {
        product_id: p.id,
        product_name: p.name,
        image_url: p.main_image_url,
        product_sku: p.sku,
        unit_price: unit,
        quantity: it.quantity,
        total_price: unit * it.quantity,
      };
    });

    const subtotal = orderItems.reduce((s, i) => s + i.total_price, 0);
    const shipping_cost = subtotal >= 199 ? 0 : 19.9;
    const total = subtotal + shipping_cost;
    const orderNumber = `MM${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone,
        customer_document: data.customer.document ?? null,
        shipping_address: data.shipping,
        billing_address: data.shipping,
        subtotal,
        shipping_cost,
        discount_amount: 0,
        total,
        status: "pending",
        payment_status: "pending",
        payment_method: "pix",
        notes: data.notes ?? null,
      } as never)
      .select("id, order_number, total")
      .single();
    if (oErr) throw new Error(oErr.message);

    const itemsPayload = orderItems.map((it) => ({ ...it, order_id: order.id }));
    const { error: iErr } = await supabaseAdmin.from("order_items").insert(itemsPayload as never);
    if (iErr) throw new Error(iErr.message);

    return { orderId: order.id, orderNumber: order.order_number, total: Number(order.total) };
  });

export const getOrderByNumber = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => i as { orderNumber: string })
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total, subtotal, shipping_cost, customer_name, customer_email, shipping_address, created_at, order_items(product_name, quantity, unit_price, total_price, image_url)")
      .eq("order_number", data.orderNumber)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order;
  });
