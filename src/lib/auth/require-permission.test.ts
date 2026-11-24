import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "./permissions";

vi.mock("server-only", () => ({}));
// requireSession redirects (throws) when the session's role is not in the list it is given.
let sessionRole: string = "editor";
const requireSession = vi.fn(async (roles?: Role[]) => {
  if (roles && !roles.includes(sessionRole as Role)) throw new Error("NEXT_REDIRECT /admin/login");
  return { role: sessionRole };
});
vi.mock("./session", () => ({ requireSession }));

const { ac, roleAllows, rolesWith } = await import("./permissions");
const { requirePermission } = await import("./require-permission");

describe("roleAllows", () => {
  it("denies a role that can read content but not write it", () => {
    const reader = ac.newRole({ content: ["read"], media: ["read"] });
    expect(roleAllows(reader, "content", ["read"])).toBe(true);
    expect(roleAllows(reader, "content", ["write"])).toBe(false);
    expect(roleAllows(reader, "content", ["read", "write"])).toBe(false);
  });
});

describe("rolesWith", () => {
  it("lists the configured roles that hold every action asked for", () => {
    expect(rolesWith("content", ["write"])).toEqual(["admin", "editor"]);
    expect(rolesWith("media", ["delete"])).toEqual(["admin"]);
  });
});

describe("requirePermission", () => {
  beforeEach(() => requireSession.mockClear());

  it("passes only the roles holding the permission to requireSession", async () => {
    sessionRole = "editor";
    await expect(requirePermission("content", ["write"])).resolves.toEqual({ role: "editor" });
    expect(requireSession).toHaveBeenCalledWith(["admin", "editor"]);
  });

  it("redirects a session whose role lacks the permission", async () => {
    sessionRole = "editor";
    await expect(requirePermission("media", ["delete"])).rejects.toThrow("NEXT_REDIRECT");
    expect(requireSession).toHaveBeenCalledWith(["admin"]);
  });
});
