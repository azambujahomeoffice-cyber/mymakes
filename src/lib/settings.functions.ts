import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Public read of store settings (telefone, redes, etc). */
export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase
    .from("store_settings")
    .select("store_name, tagline, logo_url, banner_url, email, phone, whatsapp, instagram, facebook, tiktok, address_city, address_state, seo_default_title, seo_default_description")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateStoreSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => input as Record<string, unknown>)
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("store_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (!existing) {
      const { error } = await context.supabase
        .from("store_settings")
        .insert(data as never);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("store_settings")
        .update(data as never)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
