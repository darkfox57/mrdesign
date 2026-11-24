import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

async function logIn(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const sidebar = (page: Page) => page.getByRole("navigation", { name: "Panel" });

async function createUser(page: Page, user: { name: string; email: string; password: string; role: string }) {
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill(user.name);
  await form.getByLabel("Email").fill(user.email);
  await form.getByLabel("Contraseña").fill(user.password);
  await form.getByLabel("Rol").selectOption(user.role);
  await form.getByRole("button", { name: "Crear usuario" }).click();
}

test("the sidebar links the dashboard sections and marks the current one", async ({ page }) => {
  await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await expect(sidebar(page).getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");

  await sidebar(page).getByRole("link", { name: "Usuarios" }).click();
  await expect(page).toHaveURL(/\/admin\/usuarios$/);
  await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
  await expect(sidebar(page).getByRole("link", { name: "Usuarios" })).toHaveAttribute("aria-current", "page");
});

test("an admin creates an editor, changes the role and blocks and unblocks the account", async ({ page }) => {
  const email = `editor-${Date.now()}@mrdesign.test`;
  await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await page.goto("/admin/usuarios");

  await createUser(page, { name: "Editora E2E", email, password: "editor-password-123", role: "editor" });
  const row = page.getByRole("row").filter({ hasText: email });
  await expect(row).toBeVisible();
  await expect(row.getByLabel("Rol de Editora E2E", { exact: true })).toHaveValue("editor");

  await row.getByLabel("Rol de Editora E2E", { exact: true }).selectOption("admin");
  await row.getByRole("button", { name: "Guardar rol de Editora E2E", exact: true }).click();
  await expect(row.getByRole("status")).toHaveText("Rol actualizado.");
  await page.reload();
  await expect(row.getByLabel("Rol de Editora E2E", { exact: true })).toHaveValue("admin");

  await row.getByRole("button", { name: "Bloquear a Editora E2E", exact: true }).click();
  await expect(row.getByText("Bloqueado", { exact: true })).toBeVisible();
  await expect(row.getByRole("status")).toHaveText("Usuario bloqueado.");
  await row.getByRole("button", { name: "Desbloquear a Editora E2E", exact: true }).click();
  await expect(row.getByText("Activo", { exact: true })).toBeVisible();
  await expect(row.getByRole("status")).toHaveText("Usuario desbloqueado.");
});

test("shows field errors and keeps the typed values when the new user is invalid", async ({ page }) => {
  await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await page.goto("/admin/usuarios");

  await createUser(page, { name: "Corto", email: "corto@mrdesign.test", password: "short", role: "editor" });
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await expect(form.getByText("La contraseña necesita al menos 12 caracteres.")).toBeVisible();
  await expect(form.getByLabel("Email")).toHaveValue("corto@mrdesign.test");
  await expect(page.getByRole("row").filter({ hasText: "corto@mrdesign.test" })).toHaveCount(0);
});

test("rejects a duplicate email", async ({ page }) => {
  await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await page.goto("/admin/usuarios");

  await createUser(page, { name: "Duplicado", email: E2E_ADMIN.email, password: "another-password-123", role: "editor" });
  await expect(page.getByRole("form", { name: "Nuevo usuario" }).getByRole("alert")).toHaveText(
    "Ya existe un usuario con ese email.",
  );
});

test("an admin cannot change or block their own account", async ({ page }) => {
  await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await page.goto("/admin/usuarios");

  const own = page.getByRole("row").filter({ hasText: E2E_ADMIN.email });
  await expect(own.getByText("Tu cuenta")).toBeVisible();
  await expect(own.getByRole("button")).toHaveCount(0);
  await expect(own.getByRole("combobox")).toHaveCount(0);
});

test("an editor does not see users in the sidebar and cannot open the page", async ({ page, browser }) => {
  const email = `editor-only-${Date.now()}@mrdesign.test`;
  const password = "editor-password-456";
  await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await page.goto("/admin/usuarios");
  await createUser(page, { name: "Solo Editor", email, password, role: "editor" });
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();

  const context = await browser.newContext();
  const editor = await context.newPage();
  await logIn(editor, email, password);
  await expect(sidebar(editor).getByRole("link", { name: "Inicio" })).toBeVisible();
  await expect(sidebar(editor).getByRole("link", { name: "Usuarios" })).toHaveCount(0);

  const response = await editor.request.get("/admin/usuarios", { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  expect(await response.text()).not.toContain(E2E_ADMIN.email);
  await context.close();
});

test("a blocked user cannot log in", async ({ page, browser }) => {
  const email = `blocked-${Date.now()}@mrdesign.test`;
  const password = "blocked-password-789";
  await logIn(page, E2E_ADMIN.email, E2E_ADMIN.password);
  await page.goto("/admin/usuarios");
  await createUser(page, { name: "Bloqueada", email, password, role: "editor" });
  const row = page.getByRole("row").filter({ hasText: email });
  await row.getByRole("button", { name: "Bloquear a Bloqueada", exact: true }).click();
  await expect(row.getByText("Bloqueado", { exact: true })).toBeVisible();

  // A failed login on purpose: its own client address keeps the shared 127.0.0.1 per-IP counter clean
  // (the app trusts the last X-Forwarded-For entry, as behind the production proxy).
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "198.19.0.1" } });
  const blocked = await context.newPage();
  await blocked.goto("/admin/login");
  await blocked.getByLabel("Email").fill(email);
  await blocked.getByLabel("Contraseña").fill(password);
  await blocked.getByRole("button", { name: "Ingresar" }).click();
  await expect(blocked.locator("form").getByRole("alert")).toHaveText("Email o contraseña incorrectos.");
  await context.close();
});
