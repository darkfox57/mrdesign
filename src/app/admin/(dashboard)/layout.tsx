import { Logo } from "@/components/atoms/Logo";
import { AdminSidebar } from "@/components/organisms/AdminSidebar";
import { ROLE_LABELS } from "@/lib/admin/users";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { signOut } from "../actions";

// The layout needs the session for the header. It is NOT the access check for pages: a page
// renders in parallel with its layout, so every page calls requireSession() itself.
export default async function DashboardLayout({ children }: LayoutProps<"/admin">) {
  const { user, role } = await requireSession();
  // Only admins see the inbox, so only they get the count.
  const unreadMessages = role === "admin" ? await db.contactSubmission.count({ where: { readAt: null } }) : 0;

  return (
    <div className="min-h-svh">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo className="h-10 text-brand-600" />
            <span className="text-sm font-semibold text-graphite">Panel</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-right leading-tight">
              <span className="block font-medium text-ink">{user.name}</span>
              <span className="text-graphite">{ROLE_LABELS[role]}</span>
            </span>
            <form action={signOut}>
              <button type="submit" className="min-h-11 rounded-control border border-line px-4 font-medium text-ink hover:border-ink">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[14rem_1fr]">
        <AdminSidebar role={role} unreadMessages={unreadMessages} />
        <main className="mx-auto w-full max-w-7xl min-w-0 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
