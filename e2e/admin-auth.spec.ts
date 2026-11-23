import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

async function logIn(page: Page, password = E2E_ADMIN.password, next = "") {
  await page.goto(`/admin/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

test("redirects to the login page without a session, keeping the destination", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
});

test("keeps the query string of the destination through the login", async ({ page }) => {
  await page.goto("/admin?tab=drafts");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%3Ftab%3Ddrafts$/);
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin\?tab=drafts$/);
});

test("rejects a wrong password without revealing which field failed", async ({ page }) => {
  await logIn(page, "wrong-password-123");

  await expect(page.locator("form").getByRole("alert")).toHaveText("Email o contraseña incorrectos.");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByLabel("Email")).toHaveValue(E2E_ADMIN.email);
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name.includes("session_token"))).toBe(false);
});

test("logs in, shows the dashboard and logs out", async ({ page }) => {
  await logIn(page);

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  await expect(page.getByText(E2E_ADMIN.name)).toBeVisible();
  await expect(page.getByText("Administrador")).toBeVisible();
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name.includes("session_token"));
  expect(session?.httpOnly).toBe(true);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("ignores external destinations after login (no open redirect)", async ({ page }) => {
  await logIn(page, E2E_ADMIN.password, "//evil.example.com");
  await expect(page).toHaveURL(/localhost:3100\/admin$/);
});

test("a forged session cookie does not open the dashboard", async ({ page, context }) => {
  await context.addCookies([{ name: "better-auth.session_token", value: "forged.value", url: "http://localhost:3100" }]);
  await page.goto("/admin");
  // No ?next= means the proxy let the cookie through and the server-side check rejected it.
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("the redirect for a forged cookie carries no dashboard data", async ({ request }) => {
  const response = await request.get("/admin", {
    headers: { cookie: "better-auth.session_token=forged.value" },
    maxRedirects: 0,
  });

  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  expect(response.headers().location).toMatch(/\/admin\/login$/);
  const body = await response.text();
  for (const label of ["Posts en borrador", "Posts publicados", "Mensajes de contacto"]) {
    expect(body).not.toContain(label);
  }
});

test("locks an account after repeated failed logins", async ({ page }) => {
  const email = `rate-limit-${Date.now()}@mrdesign.test`;
  // Each attempt waits for its own server action response: the previous error stays on screen.
  const attempt = async (password: string) => {
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(password);
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/login")),
      page.getByRole("button", { name: "Ingresar" }).click(),
    ]);
  };

  await page.goto("/admin/login");
  for (let i = 0; i < 5; i++) {
    await attempt(`wrong-password-${i}`);
    await expect(page.locator("form").getByRole("alert")).toHaveText("Email o contraseña incorrectos.");
  }

  await attempt("wrong-password-again");
  await expect(page.locator("form").getByRole("alert")).toContainText("Demasiados intentos");
});

test("the HTTP sign-in endpoint is closed: the only way in is the rate-limited form", async ({ request }) => {
  const response = await request.post("/api/auth/sign-in/email", {
    headers: { origin: "http://localhost:3100", "content-type": "application/json" },
    data: { email: E2E_ADMIN.email, password: E2E_ADMIN.password },
    maxRedirects: 0,
  });

  expect(response.status()).toBe(404);
  expect(response.headers()["set-cookie"] ?? "").not.toContain("session_token");
});

test("a spoofed X-Forwarded-For does not unlock a locked account", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `spoof-${Date.now()}@mrdesign.test`;
  await page.goto("/admin/login");

  for (let i = 0; i < 6; i++) {
    // A different forged client address on every attempt.
    await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${i + 1}` });
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(`wrong-password-${i}`);
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.url().includes("/admin/login")),
      page.getByRole("button", { name: "Ingresar" }).click(),
    ]);
  }

  await expect(page.locator("form").getByRole("alert")).toContainText("Demasiados intentos");
  await context.close();
});

test("the admin is not indexed and is not localized", async ({ request }) => {
  const html = await (await request.get("/admin/login")).text();
  expect(html).toContain('name="robots" content="noindex, nofollow"');
  expect(html).toContain('<html lang="es"');
  expect((await request.get("/en/admin", { maxRedirects: 0 })).status()).toBe(404);
});

test("the HTTP sign-up and sign-in endpoints are closed", async ({ request }) => {
  const body = { email: "new-user@example.com", password: "a-long-password-123", name: "New user" };
  for (const path of ["/api/auth/sign-up/email", "/api/auth/sign-in/email"]) {
    const response = await request.post(path, { data: body });
    expect(response.status(), path).toBe(404);
  }
});
