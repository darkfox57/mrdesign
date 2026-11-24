import { expect, test, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { THROTTLE_NAMESPACES, throttleKey } from "../src/lib/auth/login-rate-limit";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

async function logIn(page: Page, password = E2E_ADMIN.password, next = "", email = E2E_ADMIN.email) {
  await page.goto(`/admin/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

// The app trusts the last X-Forwarded-For entry (in production the proxy appends it). Tests that
// fail logins on purpose use their own address, so they never fill the per-IP counter that every
// spec shares from 127.0.0.1.
let addressSeq = 0;
async function useOwnClientAddress(page: Page) {
  const n = (Date.now() + addressSeq++) % 65_536;
  const address = `198.18.${n >> 8}.${n & 255}`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": address });
  return address;
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

// Login throttle rows live in the database (src/lib/auth/login-rate-limit.ts) and outlive the server,
// so tests that lock keys on purpose delete them, and the next run starts clean. Keys are the
// namespace and kind in clear text plus the SHA-256 of the lower-cased email or the address.
const accountKey = (email: string) => throttleKey(THROTTLE_NAMESPACES.login, "acct", email);
const addressKey = (address: string) => throttleKey(THROTTLE_NAMESPACES.login, "ip", address);
const throttleRow = async (key: string) =>
  (await sql(`select failures, "lockedUntil" from "AuthThrottle" where key = $1`, [key])).rows[0] as { failures: number; lockedUntil: Date | null } | undefined;
const dropThrottle = (keys: string[]) => sql(`delete from "AuthThrottle" where key = any($1)`, [keys]);

// A fresh account per test, created by the e2e admin from the users screen.
async function createUser(browser: Browser, role: "admin" | "editor") {
  const user = { name: `Sesion ${role} ${Date.now()}`, email: `session-${role}-${Date.now()}@mrdesign.test`, password: "session-password-123" };
  const admin = await (await browser.newContext()).newPage();
  await logIn(admin);
  await expect(admin).toHaveURL(/\/admin$/);
  await admin.goto("/admin/usuarios");
  const form = admin.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill(user.name);
  await form.getByLabel("Email").fill(user.email);
  await form.getByLabel("Contraseña").fill(user.password);
  await form.getByLabel("Rol").selectOption(role);
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(admin.getByRole("row").filter({ hasText: user.email })).toBeVisible();
  return { user, admin };
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
  await useOwnClientAddress(page);
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
  // The header shows who is signed in (the dashboard greeting may repeat the name).
  const header = page.getByRole("banner");
  await expect(header.getByText(E2E_ADMIN.name)).toBeVisible();
  await expect(header.getByText("Administrador")).toBeVisible();
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

  const address = await useOwnClientAddress(page);
  await page.goto("/admin/login");
  for (let i = 0; i < 5; i++) {
    await attempt(`wrong-password-${i}`);
    await expect(page.locator("form").getByRole("alert")).toHaveText("Email o contraseña incorrectos.");
  }

  await attempt("wrong-password-again");
  await expect(page.locator("form").getByRole("alert")).toContainText("Demasiados intentos");

  // The lock is stored in the database, so it survives a restart and holds on every instance.
  // Attempts are counted before the password is checked, so the refused sixth one counts too, and it
  // is the one that stores the lock.
  const lock = await throttleRow(accountKey(email));
  expect(lock?.failures).toBe(6);
  expect(lock?.lockedUntil?.getTime()).toBeGreaterThan(Date.now());
  await dropThrottle([accountKey(email), addressKey(address)]);
});

test("a blocked user loses the dashboard on the next request", async ({ page, browser }) => {
  const { user, admin } = await createUser(browser, "editor");
  await logIn(page, user.password, "", user.email);
  await expect(page).toHaveURL(/\/admin$/);

  const row = admin.getByRole("row").filter({ hasText: user.email });
  await row.getByRole("button", { name: `Bloquear a ${user.name}`, exact: true }).click();
  await expect(row.getByText("Bloqueado", { exact: true })).toBeVisible();

  // No wait: the session check reads the database, not a cached copy in the cookie.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("a demoted admin loses the admin pages on the next request", async ({ page, browser }) => {
  const { user } = await createUser(browser, "admin");
  await logIn(page, user.password, "/admin/usuarios", user.email);
  await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();

  // Straight in the database, so only a fresh read of the user can notice it.
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    await client.query(`update "user" set role = 'editor' where email = $1`, [user.email]);
  } finally {
    await client.end();
  }

  // The users page sends the now-editor to the login page, which sends a valid session on to /admin.
  await page.goto("/admin/usuarios");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("banner").getByText("Editor", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Usuarios" })).toHaveCount(0);
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
  // The forged addresses are fixed, so their counters must not carry over to the next run.
  await dropThrottle([accountKey(email), ...Array.from({ length: 6 }, (_, i) => addressKey(`198.51.100.${i + 1}`))]);
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
