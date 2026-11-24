"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, House, Image, KeyRound, Mail, Users, type LucideIcon } from "lucide-react";
import type { Role } from "@/lib/auth/permissions";

type NavItem = { href: string; label: string; icon: LucideIcon; roles?: Role[]; showsUnread?: boolean };

// Hiding a link is only convenience: every page checks the role on the server.
const items: NavItem[] = [
  { href: "/admin", label: "Inicio", icon: House },
  // Each dashboard module adds its entry here when it ships (see odd/tasks/nextjs-platform.md).
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/imagenes", label: "Imágenes", icon: Image },
  { href: "/admin/mensajes", label: "Mensajes", icon: Mail, roles: ["admin"], showsUnread: true },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
  { href: "/admin/api-keys", label: "API keys", icon: KeyRound, roles: ["admin"] },
];

const isCurrent = (pathname: string, href: string) =>
  href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

export function AdminSidebar({ role, unreadMessages = 0 }: { role: Role; unreadMessages?: number }) {
  const pathname = usePathname();
  const visible = items.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <nav aria-label="Panel" className="border-b border-line bg-white lg:min-h-[calc(100svh-4rem)] lg:border-r lg:border-b-0">
      <ul className="flex gap-1 overflow-x-auto px-4 py-2 lg:flex-col lg:px-3 lg:py-4">
        {visible.map(({ href, label, icon: Icon, showsUnread }) => {
          const current = isCurrent(pathname, href);
          const unread = showsUnread ? unreadMessages : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                aria-label={unread > 0 ? `${label} (${unread} sin leer)` : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  current ? "bg-brand-50 text-brand-700" : "text-ink hover:bg-paper"
                }`}
              >
                <Icon aria-hidden className="size-4" />
                {label}
                {unread > 0 ? (
                  <span aria-hidden className="ml-auto rounded-full bg-brand-600 px-2 text-xs font-semibold text-white">
                    {unread}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
