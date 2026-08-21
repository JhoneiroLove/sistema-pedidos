"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/pedidos", label: "Pedidos", short: "01" },
  { href: "/clientes", label: "Clientes", short: "02" },
  { href: "/articulos", label: "Artículos", short: "03" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="main-nav" aria-label="Navegación principal">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <span>{link.short}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
