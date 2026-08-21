import { logoutAction } from "@/features/auth/actions";
import Link from "next/link";
import { NavLinks } from "@/shared/components/nav-links";
import { SubmitButton } from "@/shared/components/submit-button";
import { requireSession } from "@/shared/lib/session";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const session = await requireSession();
  const initials = session.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/pedidos" aria-label="Trama, inicio">
          <span className="brand-mark small">TR</span>
          <span>Trama</span>
        </Link>
        <NavLinks />
        <div className="user-menu">
          <span className="avatar" aria-hidden="true">{initials}</span>
          <div className="user-copy">
            <strong>{session.nombre}</strong>
            <span>{session.email}</span>
          </div>
          <form action={logoutAction}>
            <SubmitButton className="text-button" pendingLabel="Saliendo…">
              Salir
            </SubmitButton>
          </form>
        </div>
      </header>
      <main className="workspace">{children}</main>
    </div>
  );
}
