import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OrderStatus =
  | "pending" | "awaiting_payment" | "paid" | "preparing" | "shipped" | "delivered" | "cancelled" | "refunded";
export type PaymentStatus = "pending" | "awaiting" | "paid" | "failed" | "refunded" | "cancelled";

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => (i ?? {}) as { status?: OrderStatus; q?: string })
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, status, payment_status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status) q = q.eq("status", data.status);
    if (data.q) q = q.or(`order_number.ilike.%${data.q}%,customer_name.ilike.%${data.q}%,customer_email.ilike.%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getAdminOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as { id: string })
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*, order_items(id, product_name, product_sku, quantity, unit_price, total_price, image_url)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order;
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => i as {
    id: string;
    status?: OrderStatus;
    payment_status?: PaymentStatus;
    tracking_code?: string | null;
    shipping_carrier?: string | null;
    internal_notes?: string | null;
  })
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.status) {
      patch.status = data.status;
      if (data.status === "paid") patch.paid_at = new Date().toISOString();
      if (data.status === "shipped") patch.shipped_at = new Date().toISOString();
      if (data.status === "delivered") patch.delivered_at = new Date().toISOString();
      if (data.status === "cancelled") patch.cancelled_at = new Date().toISOString();
    }
    if (data.payment_status) patch.payment_status = data.payment_status;
    if (data.tracking_code !== undefined) patch.tracking_code = data.tracking_code;
    if (data.shipping_carrier !== undefined) patch.shipping_carrier = data.shipping_carrier;
    if (data.internal_notes !== undefined) patch.internal_notes = data.internal_notes;
    const { error } = await context.supabase.from("orders").update(patch as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [products, orders, revenue, lowStock] = await Promise.all([
      context.supabase.from("products").select("id", { count: "exact", head: true }),
      context.supabase.from("orders").select("id", { count: "exact", head: true }),
      context.supabase.from("orders").select("total").eq("payment_status", "paid"),
      context.supabase.from("products").select("id, name, stock_quantity, low_stock_threshold").lte("stock_quantity", 5).limit(5),
    ]);
    const totalRevenue = (revenue.data ?? []).reduce((s, o) => s + Number(o.total), 0);
    return {
      productCount: products.count ?? 0,
      orderCount: orders.count ?? 0,
      totalRevenue,
      lowStock: lowStock.data ?? [],
    };
  });
