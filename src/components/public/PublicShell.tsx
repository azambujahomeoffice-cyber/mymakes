import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { CartDrawer } from "./CartDrawer";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <CartDrawer />
    </div>
  );
}
