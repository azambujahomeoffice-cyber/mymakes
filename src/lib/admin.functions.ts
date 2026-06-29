import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Returns the authenticated user's highest role (admin > manager > staff > customer). */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const roles = (data ?? []).map((r) => r.role);
    if (roles.includes("admin")) return { role: "admin" as const, userId: context.userId };
    if (roles.includes("manager")) return { role: "manager" as const, userId: context.userId };
    if (roles.includes("staff")) return { role: "staff" as const, userId: context.userId };
    return { role: "customer" as const, userId: context.userId };
  });

/**
 * Bootstrap: if there is no admin in the system yet, promotes the current
 * authenticated user to admin. After first admin exists, this is a no-op.
 * Safe to expose because once an admin exists, the only way to add another
 * admin is via the user_roles table (admin-only RLS).
 */
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error: cntErr } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (cntErr) throw new Error(cntErr.message);
    if ((count ?? 0) > 0) return { promoted: false, reason: "admin_exists" as const };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { promoted: true } as const;
  });
