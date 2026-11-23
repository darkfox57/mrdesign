import { expect, test, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

const SENT = "Si el email está registrado, te enviamos un enlace para restablecer la contraseña.";

// Brevo has no key in e2e, so the email is not sent; the token is read where better-auth stores it.
async function latestResetToken(email: string) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(
      `select v.identifier from verification v join "user" u on u.id = v.value
       where u.email = $1 and v.identifier like 'reset-password:%' order by v."createdAt" desc limit 1`,
      [email],
    );
    return rows[0] ? String(rows[0].identifier).replace("reset-password:", "") : null;
  } finally {
    await client.end();
  }
}

async function logIn(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

// A fresh editor per test, created by the e2e admin from the users screen.
async function createEditor(browser: Browser, tag: string) {
  const user = { name: `Reset ${tag}`, email: `reset-${tag}-${Date.now()}@mrdesign.test`, password: "first-password-123" };
  const page = await (await browser.newContext()).newPage();
  await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/usuarios");
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill(user.name);
  await form.getByLabel("Email").fill(user.email);
  await form.getByLabel("Contraseña").fill(user.password);
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByRole("row").filter({ hasText: user.email })).toBeVisible();
  return { user, admin: page };
}

test("resets a forgotten password from the email link, once", async ({ page, browser }) => {
  const { user } = await createEditor(browser, "link");

  await page.goto("/admin/login");
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
  await expect(page).toHaveURL(/\/admin\/recuperar$/);
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("status")).toHaveText(SENT);

  const token = await latestResetToken(user.email);
  expect(token).toBeTruthy();
  await page.goto(`/admin/restablecer?token=${token}`);
  await page.getByLabel("Contraseña nueva").fill("second-password-456");
  await page.getByLabel("Repite la contraseña").fill("second-password-456");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.getByRole("status")).toContainText("Listo, tu contraseña cambió.");

  await logIn(page, user.email, "first-password-123");
  await expect(page.locator("form").getByRole("alert")).toHaveText("Email o contraseña incorrectos.");
  await logIn(page, user.email, "second-password-456");
  await expect(page).toHaveURL(/\/admin$/);

  // The link works only once.
  const other = await (await browser.newContext()).newPage();
  await other.goto(`/admin/restablecer?token=${token}`);
  await other.getByLabel("Contraseña nueva").fill("third-password-789");
  await other.getByLabel("Repite la contraseña").fill("third-password-789");
  await other.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(other.locator("form").getByRole("alert")).toHaveText("El enlace no es válido o ya venció. Pide uno nuevo.");
});

test("answers the same for an unknown email and checks the new password", async ({ page }) => {
  await page.goto("/admin/recuperar");
  await page.getByLabel("Email").fill(`nadie-${Date.now()}@mrdesign.test`);
  await page.getByRole("button", { name: "Enviar enlace" }).click();
  await expect(page.getByRole("status")).toHaveText(SENT);

  await page.goto("/admin/restablecer?token=no-existe");
  await page.getByLabel("Contraseña nueva").fill("short");
  await page.getByLabel("Repite la contraseña").fill("other");
  await page.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("La contraseña necesita al menos 12 caracteres.");
});

test("an admin sets a new password for another user", async ({ page, browser }) => {
  const { user, admin } = await createEditor(browser, "admin");
  const row = admin.getByRole("row").filter({ hasText: user.email });
  await row.getByLabel(`Contraseña nueva para ${user.name}`).fill("admin-set-password-1");
  await row.getByRole("button", { name: `Cambiar la contraseña de ${user.name}`, exact: true }).click();
  await expect(row.getByRole("status")).toHaveText("Contraseña cambiada.");

  await logIn(page, user.email, "admin-set-password-1");
  await expect(page).toHaveURL(/\/admin$/);
});

test("better-auth's own reset endpoints are closed: resets only go through the rate-limited forms", async ({ request }) => {
  for (const path of ["/api/auth/request-password-reset", "/api/auth/reset-password", "/api/auth/forget-password"]) {
    const response = await request.post(path, { data: { email: E2E_ADMIN.email, token: "x", newPassword: "whatever-password-1" } });
    expect(response.status(), path).toBe(404);
  }
  // The GET callback would tell whether a token is valid.
  const callback = await request.get("/api/auth/reset-password/some-token?callbackURL=/admin/restablecer", { maxRedirects: 0 });
  expect(callback.status()).toBe(404);
});
