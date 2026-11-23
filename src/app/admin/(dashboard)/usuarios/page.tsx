import type { Metadata } from "next";
import { ROLE_LABELS } from "@/lib/admin/users";
import { requireSession } from "@/lib/auth/session";
import { validRole } from "@/lib/auth/valid-session";
import { ROLES, type Role } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { NewUserForm } from "./NewUserForm";
import { BlockForm, PasswordForm, RoleForm } from "./UserActions";

export const metadata: Metadata = { title: "Usuarios" };

const knownRole = (role: string | null): Role | null => (ROLES.includes(role as Role) ? (role as Role) : null);

export default async function UsersPage() {
  // Admins only. The page checks the session itself: the layout's check does not stop it from rendering.
  const { user: current } = await requireSession(["admin"]);
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, banned: true },
  });

  return (
    <>
      <h1 className="text-headline text-ink">Usuarios</h1>
      <p className="mt-2 max-w-2xl text-graphite">
        Los administradores gestionan todo el panel, incluidos los usuarios. Los editores trabajan con el contenido y las imágenes. Bloquear
        una cuenta cierra sus sesiones abiertas.
      </p>

      <div className="mt-8 overflow-x-auto rounded-card border border-line bg-white">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="border-b border-line text-graphite">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Nombre</th>
              <th scope="col" className="px-4 py-3 font-medium">Email</th>
              <th scope="col" className="px-4 py-3 font-medium">Rol</th>
              <th scope="col" className="px-4 py-3 font-medium">Estado</th>
              <th scope="col" className="px-4 py-3 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const own = user.id === current.id;
              const role = knownRole(user.role);
              const blocked = Boolean(user.banned);
              return (
                <tr key={user.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {user.name}
                    {own ? <span className="ml-2 text-xs font-normal text-graphite">Tu cuenta</span> : null}
                  </td>
                  <td className="px-4 py-3 text-ink">{user.email}</td>
                  <td className="px-4 py-3">
                    {own ? (
                      <span className="text-ink">{role ? ROLE_LABELS[role] : "Sin rol"}</span>
                    ) : (
                      <RoleForm userId={user.id} name={user.name} role={role} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={blocked || !validRole(user) ? "font-medium text-brand-700" : "text-ink"}>
                      {blocked ? "Bloqueado" : validRole(user) ? "Activo" : "Sin acceso"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {own ? null : (
                      <div className="grid gap-2">
                        <BlockForm userId={user.id} name={user.name} blocked={blocked} />
                        <PasswordForm userId={user.id} name={user.name} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <NewUserForm />
      </div>
    </>
  );
}
