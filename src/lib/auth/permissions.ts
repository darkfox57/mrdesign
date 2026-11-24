import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

// Resources the dashboard protects. `user` and `session` come from the admin plugin.
const statement = {
  ...defaultStatements,
  content: ["read", "write", "publish"],
  media: ["read", "upload", "delete"],
} as const;

export const ac = createAccessControl(statement);

// Admins manage everything, including users.
export const admin = ac.newRole({
  ...adminAc.statements,
  content: ["read", "write", "publish"],
  media: ["read", "upload", "delete"],
});

// Editors work on content and media but cannot manage users or sessions.
export const editor = ac.newRole({
  user: [],
  session: [],
  content: ["read", "write", "publish"],
  media: ["read", "upload"],
});

export const roles = { admin, editor };
export type Role = keyof typeof roles;
export const ROLES = Object.keys(roles) as Role[];

type Statement = typeof statement;
export type Resource = keyof Statement;
type AuthorizingRole = Pick<typeof editor, "authorize">;

// Whether the role's statements grant every action asked for on the resource.
export function roleAllows<R extends Resource>(role: AuthorizingRole, resource: R, actions: Statement[R][number][]) {
  return role.authorize({ [resource]: actions } as Parameters<AuthorizingRole["authorize"]>[0]).success;
}

// The configured roles that hold the permission: what requirePermission passes to requireSession.
export function rolesWith<R extends Resource>(resource: R, actions: Statement[R][number][]): Role[] {
  return ROLES.filter((name) => roleAllows(roles[name], resource, actions));
}
