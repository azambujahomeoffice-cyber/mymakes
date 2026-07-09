import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Supabase persiste a sessão em localStorage, o que o servidor não consegue ler.
// Se o gate rodar no SSR, um hard-refresh dispara loop de redirect e signed-in
// users veem flash da tela /auth. `ssr: false` evita ambos.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
