// @vitest-environment node
// TEMPORARY verifier probe (T12). Real requireSession + validRole + roleAllows; only the session
// source, headers and redirect are stubbed. A fake `viewer` role (media read only) is added.
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
let sessionUser: { role: string; banned?: boolean } | null = null;
vi.mock("./index", () => ({ auth: { api: { getSession: async () => (sessionUser ? { user: sessionUser, session: {} } : null) } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  },
}));
vi.mock("react", async (importOriginal) => ({ ...(await importOriginal<object>()), cache: <T,>(fn: T) => fn }));
vi.mock("./permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./permissions")>();
  const viewer = actual.ac.newRole({ content: [], media: ["read"] });
  const reader = actual.ac.newRole({ content: ["read"], media: ["read"] });
  const roles = { ...actual.roles, viewer, reader } as const;
  const ROLES = Object.keys(roles);
  // Same body as the real rolesWith, over the extended role table.
  const rolesWith = (resource: string, actions: string[]) =>
    ROLES.filter((name) => actual.roleAllows(roles[name as keyof typeof roles], resource as never, actions as never));
  return { ...actual, roles, ROLES, rolesWith };
});

const { requirePermission } = await import("./require-permission");

const as = (role: string, banned = false) => {
  sessionUser = { role, banned };
};

describe("requirePermission with real requireSession", () => {
  it.each([
    ["content", ["read"]],
    ["content", ["write"]],
    ["content", ["publish"]],
  ] as const)("denies viewer (no content) %s %j", async (resource, actions) => {
    as("viewer");
    await expect(requirePermission(resource, [...actions] as never)).rejects.toThrow("NEXT_REDIRECT /admin/login");
  });

  it("lets viewer read media", async () => {
    as("viewer");
    await expect(requirePermission("media", ["read"])).resolves.toMatchObject({ role: "viewer" });
  });

  it("reader may read content but not write or publish", async () => {
    as("reader");
    await expect(requirePermission("content", ["read"])).resolves.toMatchObject({ role: "reader" });
    await expect(requirePermission("content", ["write"])).rejects.toThrow("NEXT_REDIRECT");
    await expect(requirePermission("content", ["publish"])).rejects.toThrow("NEXT_REDIRECT");
  });

  it.each(["admin", "editor"])("%s keeps read, write, publish and media read", async (role) => {
    as(role);
    for (const action of ["read", "write", "publish"] as const) {
      await expect(requirePermission("content", [action])).resolves.toMatchObject({ role });
    }
    await expect(requirePermission("media", ["read"])).resolves.toMatchObject({ role });
  });

  it("editor cannot delete media; admin can", async () => {
    as("editor");
    await expect(requirePermission("media", ["delete"])).rejects.toThrow("NEXT_REDIRECT");
    as("admin");
    await expect(requirePermission("media", ["delete"])).resolves.toMatchObject({ role: "admin" });
  });

  it("denies banned, unknown-role and anonymous sessions", async () => {
    as("admin", true);
    await expect(requirePermission("content", ["read"])).rejects.toThrow("NEXT_REDIRECT");
    as("superuser");
    await expect(requirePermission("content", ["read"])).rejects.toThrow("NEXT_REDIRECT");
    as("admin,editor");
    await expect(requirePermission("content", ["read"])).rejects.toThrow("NEXT_REDIRECT");
    sessionUser = null;
    await expect(requirePermission("content", ["read"])).rejects.toThrow("NEXT_REDIRECT");
  });
});
