import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "./index";
import type { Role } from "./permissions";
import { validRole } from "./valid-session";

export const ADMIN_LOGIN_PATH = "/admin/login";

// One session lookup per request, shared by layouts, pages and actions. It skips the cookie cache
// and reads the database, so a ban, a role change or a revoked session counts on the next request.
const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } }),
);

// The session only if it can use the dashboard: not banned and with a configured role.
export const getDashboardSession = cache(async () => {
  const session = await getSession();
  const role = session ? validRole(session.user) : null;
  return session && role ? { ...session, role } : null;
});

// Call it at the top of EVERY dashboard page and server action, before reading data.
// A redirect in the layout does not stop a page from rendering in parallel, so a check
// that lives only in the layout lets the page stream its data into the redirect response.
// Never call it inside try/catch: redirect() throws and must propagate.
export async function requireSession(roles?: Role[]) {
  const session = await getDashboardSession();
  if (!session || (roles && !roles.includes(session.role))) redirect(ADMIN_LOGIN_PATH);
  return session;
}
