import { ROLES, type Role } from "./permissions";

// A session only counts for the dashboard when its user is not banned and has a configured role.
export function validRole(user: { role?: string | null; banned?: boolean | null }): Role | null {
  if (user.banned) return null;
  return ROLES.includes(user.role as Role) ? (user.role as Role) : null;
}
