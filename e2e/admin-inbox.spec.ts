import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

// Messages go straight into the local database: the public form is covered by contact.spec.ts
// and has its own rate limit.
async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows;
  } finally {
    await client.end();
  }
}

async function insertMessage(name: string, { projectType = "shopify", locale = "en" } = {}) {
  const id = `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `${id}@mrdesign.test`;
  await sql(
    'insert into "ContactSubmission" (id, name, email, phone, company, "projectType", message, consent, locale) values ($1, $2, $3, $4, $5, $6, $7, true, $8::"Locale")',
    [id, name, email, "+57 300 000 0000", "Tienda E2E", projectType, `Mensaje de ${name}: queremos migrar la tienda.`, locale],
  );
  return { id, email };
}

async function logIn(page: Page, email = E2E_ADMIN.email, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const sidebar = (page: Page) => page.getByRole("navigation", { name: "Panel" });

test("lists a new message as unread, opens it and marks it read and unread again", async ({ page }) => {
  const name = `Ana Inbox ${Date.now()}`;
  const { email } = await insertMessage(name);
  await logIn(page);

  await sidebar(page).getByRole("link", { name: /Mensajes/ }).click();
  await expect(page.getByRole("heading", { name: "Mensajes" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row.getByText("Sin leer", { exact: true })).toBeVisible();
  await expect(row.getByText("Tiendas Shopify", { exact: true })).toBeVisible();
  await expect(row.getByText("Inglés", { exact: true })).toBeVisible();

  await row.getByRole("link", { name: `Abrir el mensaje de ${name}`, exact: true }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText(`Mensaje de ${name}: queremos migrar la tienda.`)).toBeVisible();
  await expect(page.getByText("Tienda E2E")).toBeVisible();
  await expect(page.getByText("Tiendas Shopify", { exact: true })).toBeVisible();
  await expect(page.getByText("Inglés", { exact: true })).toBeVisible();
  // The reply subject follows the language the visitor used on the site.
  await expect(page.getByRole("link", { name: "Responder por email" })).toHaveAttribute(
    "href",
    `mailto:${email}?subject=Re%3A%20your%20message%20to%20Mr.%20Design`,
  );

  await page.getByRole("button", { name: "Marcar como leído" }).click();
  await expect(page.getByRole("button", { name: "Marcar como no leído" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Mensaje marcado como leído." })).toBeVisible();
  expect((await sql('select "readAt" from "ContactSubmission" where email = $1', [email]))[0].readAt).not.toBeNull();

  await page.getByRole("button", { name: "Marcar como no leído" }).click();
  await expect(page.getByRole("button", { name: "Marcar como leído" })).toBeVisible();
  expect((await sql('select "readAt" from "ContactSubmission" where email = $1', [email]))[0].readAt).toBeNull();
  await page.getByRole("button", { name: "Marcar como leído" }).click();
  await expect(page.getByRole("button", { name: "Marcar como no leído" })).toBeVisible();

  await page.goto("/admin/mensajes?filtro=sin-leer");
  await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(0);
  await page.goto("/admin/mensajes");
  await expect(page.getByRole("row").filter({ hasText: name }).getByText("Leído", { exact: true })).toBeVisible();
});

test("names the other project type and the Spanish site", async ({ page }) => {
  const name = `Otra ${Date.now()}`;
  const { id, email } = await insertMessage(name, { projectType: "other", locale: "es" });
  await logIn(page);
  await page.goto(`/admin/mensajes/${id}`);
  await expect(page.getByText("Otra cosa", { exact: true })).toBeVisible();
  await expect(page.getByText("Español", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Responder por email" })).toHaveAttribute(
    "href",
    `mailto:${email}?subject=Re%3A%20tu%20mensaje%20a%20Mr.%20Design`,
  );
});

// Other specs add and delete messages in the same database, so the test never compares the badge
// with a global count: it reads the badge, changes only its own messages and checks the difference.
test("the sidebar shows how many messages are unread", async ({ page }) => {
  const first = await insertMessage(`Conteo ${Date.now()}`);
  await logIn(page);
  const link = sidebar(page).getByRole("link", { name: /^Mensajes \(\d+ sin leer\)$/ });
  await expect(link).toBeVisible();
  const badge = async () => Number((await link.getAttribute("aria-label"))?.match(/\((\d+) sin leer\)/)?.[1]);
  const before = await badge();
  expect(before).toBeGreaterThanOrEqual(1);

  const second = await insertMessage(`Conteo ${Date.now()}`);
  await page.reload();
  await expect(link).toHaveAccessibleName(`Mensajes (${before + 1} sin leer)`);

  await sql('update "ContactSubmission" set "readAt" = now() where id = any($1)', [[first.id, second.id]]);
  await page.reload();
  // Reading both messages leaves one fewer than at the start; with no other unread message the badge disappears.
  const expected = before - 1;
  if (expected > 0) await expect(link).toHaveAccessibleName(`Mensajes (${expected} sin leer)`);
  else await expect(sidebar(page).getByRole("link", { name: "Mensajes", exact: true })).toBeVisible();
});

test("an admin deletes a message for good", async ({ page }) => {
  const name = `Borrar ${Date.now()}`;
  const { email } = await insertMessage(name);
  await logIn(page);
  await page.goto("/admin/mensajes");
  await page.getByRole("row").filter({ hasText: name }).getByRole("link", { name: `Abrir el mensaje de ${name}`, exact: true }).click();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Eliminar mensaje" }).click();
  await expect(page).toHaveURL(/\/admin\/mensajes\?eliminado=1$/);
  await expect(page.getByRole("status").filter({ hasText: "Mensaje eliminado." })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(0);
  expect(await sql('select id from "ContactSubmission" where email = $1', [email])).toHaveLength(0);
});

test("cancelling the confirmation keeps the message", async ({ page }) => {
  const name = `Conservar ${Date.now()}`;
  const { id, email } = await insertMessage(name);
  await logIn(page);
  await page.goto(`/admin/mensajes/${id}`);

  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Eliminar mensaje" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  expect(await sql('select id from "ContactSubmission" where email = $1', [email])).toHaveLength(1);
});

test("editors do not see the inbox", async ({ page, browser }) => {
  const email = `inbox-editor-${Date.now()}@mrdesign.test`;
  const password = "inbox-editor-password-1";
  const { id } = await insertMessage(`Privado ${Date.now()}`);
  await logIn(page);
  await page.goto("/admin/usuarios");
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Mensajes");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();

  const context = await browser.newContext();
  const editor = await context.newPage();
  await logIn(editor, email, password);
  // The sidebar has rendered (Inicio is there) before checking that Mensajes is not.
  await expect(sidebar(editor).getByRole("link", { name: "Inicio" })).toBeVisible();
  await expect(sidebar(editor).getByRole("link", { name: /Mensajes/ })).toHaveCount(0);
  for (const path of ["/admin/mensajes", `/admin/mensajes/${id}`]) {
    const response = await editor.request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(await response.text()).not.toContain("Tienda E2E");
  }
  await context.close();
});

test("an unknown message id shows not found", async ({ page }) => {
  await logIn(page);
  const response = await page.goto("/admin/mensajes/no-existe");
  expect(response?.status()).toBe(404);
});
