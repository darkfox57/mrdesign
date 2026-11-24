// The dashboard home shows each set of counts only to roles that may read it: posts need
// `content: read`, contact messages are admin-only. A fake `viewer` role (media read only) stands
// for a role added later without content access.
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let sessionRole = "admin";
const count = vi.fn(async () => 3);
vi.mock("@/lib/auth/session", () => ({ requireSession: vi.fn(async () => ({ user: { name: "Ana" }, role: sessionRole })) }));
vi.mock("@/lib/db", () => ({ db: { post: { count }, contactSubmission: { count } } }));
vi.mock("@/lib/auth/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/permissions")>();
  const viewer = actual.ac.newRole({ content: [], media: ["read"] });
  const roles = { ...actual.roles, viewer } as const;
  const ROLES = Object.keys(roles);
  // Same body as the real rolesWith, over the extended role table.
  const rolesWith = (resource: string, actions: string[]) =>
    ROLES.filter((name) => actual.roleAllows(roles[name as keyof typeof roles], resource as never, actions as never));
  return { ...actual, roles, ROLES, rolesWith };
});

const { default: AdminHomePage } = await import("@/app/admin/(dashboard)/page");

async function renderAs(role: string) {
  sessionRole = role;
  count.mockClear();
  render(await AdminHomePage());
}

describe("dashboard home counts", () => {
  afterEach(cleanup);

  it("shows the admin the post and message counts", async () => {
    await renderAs("admin");
    expect(screen.getByRole("heading", { name: "Blog" })).toBeTruthy();
    expect(screen.getByText("Posts en borrador")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Contacto" })).toBeTruthy();
  });

  it("shows an editor the post counts but not the inbox", async () => {
    await renderAs("editor");
    expect(screen.getByText("Posts publicados")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Contacto" })).toBeNull();
    expect(screen.queryByText("Mensajes sin leer")).toBeNull();
  });

  it("hides the post counts from a role without content: read, and never counts them", async () => {
    await renderAs("viewer");
    expect(screen.getByRole("heading", { name: "Inicio" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Blog" })).toBeNull();
    expect(screen.queryByText("Posts en borrador")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Contacto" })).toBeNull();
    expect(count).not.toHaveBeenCalled();
  });
});
