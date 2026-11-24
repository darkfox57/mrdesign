import "server-only";
import { rolesWith, type Resource } from "./permissions";
import { requireSession } from "./session";

// requireSession for the roles that hold `actions` on `resource` (src/lib/auth/permissions.ts), so
// a role added later without that permission is turned away instead of trusted for having a session.
// Same contract as requireSession: call it first and never inside try/catch, since it redirects by throwing.
export function requirePermission<R extends Resource>(resource: R, actions: Parameters<typeof rolesWith<R>>[1]) {
  return requireSession(rolesWith(resource, actions));
}
