import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let pathname = "/admin";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

const { AdminSidebar } = await import("./AdminSidebar");

const linkNames = () =>
  within(screen.getByRole("navigation", { name: "Panel" }))
    .getAllByRole("link")
    .map((link) => link.textContent?.trim());

describe("AdminSidebar", () => {
  afterEach(cleanup);

  it("shows editors the content modules, Casos right after Blog, and no admin-only module", () => {
    render(<AdminSidebar role="editor" />);
    expect(linkNames()).toEqual(["Inicio", "Blog", "Casos", "Landings", "Imágenes"]);
  });

  it("shows admins every module, Casos after Blog", () => {
    render(<AdminSidebar role="admin" />);
    expect(linkNames()).toEqual(["Inicio", "Blog", "Casos", "Landings", "Imágenes", "Mensajes", "Usuarios", "API keys"]);
  });

  it("marks Casos as the current page inside the module", () => {
    pathname = "/admin/casos/abc";
    render(<AdminSidebar role="editor" />);
    expect(screen.getByRole("link", { name: "Casos" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("aria-current")).toBeNull();
  });

  it("counts the unread messages on the inbox link", () => {
    pathname = "/admin";
    render(<AdminSidebar role="admin" unreadMessages={2} />);
    expect(screen.getByRole("link", { name: "Mensajes (2 sin leer)" })).toBeTruthy();
  });
});
