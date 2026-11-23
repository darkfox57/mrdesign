import { describe, expect, it } from "vitest";
import { validRole } from "./valid-session";

describe("validRole", () => {
  it.each(["admin", "editor"])("accepts the configured role %s", (role) => {
    expect(validRole({ role, banned: false })).toBe(role);
  });

  it.each([
    ["an unknown role", { role: "superuser", banned: false }],
    ["a null role", { role: null, banned: false }],
    ["a banned admin", { role: "admin", banned: true }],
  ])("rejects %s", (_, user) => {
    expect(validRole(user)).toBeNull();
  });
});
