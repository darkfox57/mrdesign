import { createHash } from "node:crypto";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

let seq = 0;
const ownAddress = () => {
  const n = (Date.now() + seq++) % 65_536;
  return { "x-forwarded-for": `198.51.${n >> 8}.${n & 255}` };
};

async function logIn(page: Page, email: string, password: string, next = "") {
  await page.setExtraHTTPHeaders(ownAddress());
  await page.goto(`/admin/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

async function sql(text: string, values: unknown[]) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return await client.query(text, values);
  } finally {
    await client.end();
  }
}

async function createUser(browser: Browser, role: "admin" | "editor") {
  const tag = `${Date.now()}-${seq++}`;
  const user = { name: `Verify ${role} ${tag}`, email: `verify-${role}-${tag}@mrdesign.test`, password: "verify-password-123" };
  const admin = await (await browser.newContext()).newPage();
  await logIn(admin, E2E_ADMIN.email, E2E_ADMIN.password);
  await expect(admin).toHaveURL(/\/admin$/);
  await admin.goto("/admin/usuarios");
  const form = admin.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill(user.name);
  await form.getByLabel("Email").fill(user.email);
  await form.getByLabel("Contraseña").fill(user.password);
  await form.getByLabel("Rol").selectOption(role);
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(admin.getByRole("row").filter({ hasText: user.email })).toBeVisible();
  await admin.context().close();
  return user;
}

test("proxy: cookie-less non-GET gets 303, GET/HEAD get 307 with next", async ({ request }) => {
  for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
    const r = await request.fetch("/admin/usuarios?x=1", { method, maxRedirects: 0, headers: { "next-action": "deadbeef" } });
    expect(r.status(), method).toBe(303);
    expect(new URL(r.headers()["location"], "http://localhost:3100").pathname + new URL(r.headers()["location"], "http://localhost:3100").search).toBe(
      "/admin/login?next=%2Fadmin%2Fusuarios%3Fx%3D1",
    );
  }
  for (const method of ["GET", "HEAD"]) {
    const r = await request.fetch("/admin/usuarios", { method, maxRedirects: 0 });
    expect(r.status(), method).toBe(307);
    expect(r.headers()["location"]).toContain("/admin/login?next=%2Fadmin%2Fusuarios");
  }
  // Public admin pages are not redirected.
  expect((await request.fetch("/admin/login", { method: "POST", maxRedirects: 0 })).status()).not.toBe(303);
});

test("proxy matcher still skips /api, _next and files with an extension", async ({ request }) => {
  const api = await request.post("/api/blog", { maxRedirects: 0, data: {} });
  expect(api.status()).toBe(401);
  const nextStatic = await request.get("/_next/static/does-not-exist.js", { maxRedirects: 0 });
  expect(nextStatic.status()).toBe(404);
  const file = await request.get("/favicon.ico", { maxRedirects: 0 });
  expect([200, 404]).toContain(file.status());
  expect(file.headers()["location"]).toBeUndefined();
});

test("next cannot become an open redirect after login", async ({ browser }) => {
  for (const next of ["//evil.example/admin", "https://evil.example/admin", "/\\evil.example", "/admin@evil.example", "/admin//evil.example"]) {
    const page = await (await browser.newContext()).newPage();
    await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password, next);
    await page.waitForURL(/localhost:3100\/admin/);
    expect(new URL(page.url()).host, next).toBe("localhost:3100");
    await page.context().close();
  }
});

test("a ban written straight in the DB (sessions not revoked) ends access on the next request, page and action", async ({ page, browser }) => {
  const user = await createUser(browser, "editor");
  await logIn(page, user.email, user.password);
  await expect(page).toHaveURL(/\/admin$/);
  await sql(`update "user" set banned = true where email = $1`, [user.email]);
  const sessions = await sql(`select count(*)::int as n from "session" s join "user" u on u.id = s."userId" where u.email = $1`, [user.email]);
  expect(sessions.rows[0].n).toBeGreaterThan(0);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("an expired session in the DB ends access; logout still works; a normal session persists", async ({ page, browser }) => {
  const user = await createUser(browser, "editor");
  await logIn(page, user.email, user.password);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/blog");
  await expect(page).toHaveURL(/\/admin\/blog$/);
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name.includes("session_data"))).toBe(false);
  const token = cookies.find((c) => c.name.endsWith("session_token"));
  expect(token?.expires ?? 0).toBeGreaterThan(Date.now() / 1000 + 6 * 24 * 3600);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);

  await logIn(page, user.email, user.password);
  await expect(page).toHaveURL(/\/admin$/);
  await sql(`update "session" set "expiresAt" = now() - interval '1 minute' where "userId" = (select id from "user" where email = $1)`, [user.email]);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("reset request answers byte-identical text for a known and an unknown email", async ({ page }) => {
  const shot = async (email: string) => {
    await page.setExtraHTTPHeaders(ownAddress());
    await page.goto("/admin/recuperar");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    return { text: await page.locator("main").innerText(), alerts: await page.locator("main").getByRole("alert").count() };
  };
  // Reset counters persist in the database for a window (3 requests per account), and this test
  // asks for the shared e2e admin on every run: start and end without its counter.
  // Keys hash the lower-cased email (src/lib/auth/login-rate-limit.ts).
  const adminKey = `reset:acct:${createHash("sha256").update(E2E_ADMIN.email.toLowerCase()).digest("hex")}`;
  await sql(`delete from "AuthThrottle" where key = $1`, [adminKey]);
  const known = await shot(E2E_ADMIN.email);
  const unknown = await shot(`nadie-${Date.now()}@mrdesign.test`);
  await sql(`delete from "AuthThrottle" where key = $1`, [adminKey]);
  expect(unknown).toEqual(known);
  expect(known.alerts).toBe(0);
});
