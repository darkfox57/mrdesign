// @vitest-environment node
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import proxy from "./proxy";

// next-intl's middleware cannot load under vitest; a marker response stands in for the locale routing.
vi.mock("next-intl/middleware", () => ({ default: () => () => new Response(null, { headers: { "x-test-handler": "intl" } }) }));

const request = (path: string, method = "GET") => new NextRequest(new URL(path, "http://localhost:3100"), { method });

describe("admin guard in the proxy", () => {
  it("sends a cookie-less POST to the login page as a GET (303), so the action is not replayed", () => {
    const response = proxy(request("/admin/usuarios", "POST"));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3100/admin/login?next=%2Fadmin%2Fusuarios");
  });

  it("keeps a temporary redirect (307) for a cookie-less GET", () => {
    const response = proxy(request("/admin?tab=drafts"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3100/admin/login?next=%2Fadmin%3Ftab%3Ddrafts");
  });

  it("leaves a path that only starts with admin to the locale routing", () => {
    const response = proxy(request("/administracion"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-test-handler")).toBe("intl");
  });
});
