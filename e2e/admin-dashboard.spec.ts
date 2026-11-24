import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

async function logIn(page: Page, email = E2E_ADMIN.email, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const INBOX_LABELS = ["Mensajes de contacto", "Mensajes sin leer"];
const POST_LABELS = ["Posts en borrador", "Posts publicados"];

test("an admin sees the contact message counts on the home", async ({ page }) => {
  await logIn(page);
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();
  for (const label of INBOX_LABELS) await expect(page.getByText(label, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver mensajes" })).toHaveAttribute("href", "/admin/mensajes");
});

test("an admin sees the draft and published post counts on the home", async ({ page }) => {
  await logIn(page);
  const blog = page.getByRole("region", { name: "Blog" });
  for (const label of POST_LABELS) await expect(blog.getByText(label, { exact: true })).toBeVisible();
  await expect(blog.getByRole("link", { name: "Ver posts" })).toHaveAttribute("href", "/admin/blog");
});

// Contact messages are personal data that only admins may read (review finding R1-004).
test("an editor gets no inbox data on the home", async ({ page, browser }) => {
  const email = `home-editor-${Date.now()}@mrdesign.test`;
  const password = "home-editor-password-1";
  await logIn(page);
  await page.goto("/admin/usuarios");
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Inicio");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();

  const context = await browser.newContext();
  const editor = await context.newPage();
  await logIn(editor, email, password);
  await expect(editor.getByRole("heading", { name: "Inicio" })).toBeVisible();
  // Editors work on the blog, so they keep its counts.
  for (const label of POST_LABELS) await expect(editor.getByText(label, { exact: true })).toBeVisible();
  for (const label of INBOX_LABELS) await expect(editor.getByText(label)).toHaveCount(0);
  await expect(editor.getByRole("link", { name: "Ver mensajes" })).toHaveCount(0);

  // Not only hidden: the server never sends the counts to an editor.
  const response = await editor.request.get("/admin");
  expect(response.status()).toBe(200);
  const body = await response.text();
  for (const label of INBOX_LABELS) expect(body).not.toContain(label);
  await context.close();
});
