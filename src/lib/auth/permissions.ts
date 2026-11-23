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
