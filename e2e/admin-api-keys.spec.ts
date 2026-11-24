import { expect, test, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows;
  } finally {
    await client.end();
  }
}

const storedKey = async (name: string) =>
  (await sql('select "keyHash", prefix, "publishImmediately", "lastUsedAt", "revokedAt" from "ApiKey" where name = $1', [name]))[0];

async function logIn(page: Page, email = E2E_ADMIN.email, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function createKey(page: Page, name: string, publish: boolean) {
  const form = page.getByRole("form", { name: "Nueva API key" });
  await form.getByLabel("Nombre").fill(name);
  await form.getByLabel("Publicar los posts directamente").setChecked(publish);
  await form.getByRole("button", { name: "Crear API key" }).click();
  if (!name) return "";
  const shown = page.getByLabel("API key nueva");
  await expect(shown).toHaveValue(/^mrd_[A-Za-z0-9_-]{43}$/);
  return shown.inputValue();
}

const postWith = (request: APIRequestContext, key: string, slug: string) =>
  request.post("/api/blog", {
    headers: { Authorization: `Bearer ${key}` },
    data: { title: "Post desde la API", slug, description: "Creado con una API key.", content: "<p>Hola desde la API.</p>" },
  });

test("creates a key, shows it once and stores only its hash", async ({ page }) => {
  const name = `Generador ${Date.now()}`;
  await logIn(page);
  await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "API keys" }).click();
  await expect(page).toHaveURL(/\/admin\/api-keys$/);
  await expect(page.getByRole("heading", { name: "API keys", level: 1 })).toBeVisible();

  const key = await createKey(page, name, true);
  await expect(page.getByText("Cópiala ahora: no se vuelve a mostrar.")).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row.getByText(key.slice(0, 12), { exact: true })).toBeVisible();
  await expect(row.getByText("Publica directo", { exact: true })).toBeVisible();

  const stored = await storedKey(name);
  expect(stored.prefix).toBe(key.slice(0, 12));
  expect(stored.keyHash).toMatch(/^[0-9a-f]{64}$/);
  expect(stored.keyHash).not.toContain(key.slice(4));

  await page.reload();
  await expect(page.getByLabel("API key nueva")).toHaveCount(0);
  await expect(page.getByText(key)).toHaveCount(0);
});

test("a draft key creates a draft through POST /api/blog, and once revoked the API answers 401", async ({ page, request }) => {
  const name = `Borradores ${Date.now()}`;
  const slug = `e2e-api-key-${Date.now()}`;
  await logIn(page);
  await page.goto("/admin/api-keys");
  const key = await createKey(page, name, false);
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row.getByText("Deja borradores", { exact: true })).toBeVisible();
  await expect(row.getByText("Nunca", { exact: true })).toBeVisible();

  try {
    const created = await postWith(request, key, slug);
    expect(created.status()).toBe(201);
    expect(await created.json()).toMatchObject({ slug, locale: "es", status: "DRAFT" });
    const [post] = await sql('select status, source, "publishedAt" from "Post" where locale = $1 and slug = $2', ["es", slug]);
    expect(post).toEqual({ status: "DRAFT", source: "API", publishedAt: null });
    expect((await storedKey(name)).lastUsedAt).not.toBeNull();

    await page.reload();
    await expect(row.getByText("Nunca", { exact: true })).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: `Revocar ${name}`, exact: true }).click();
    await expect(row.getByText("Revocada", { exact: true })).toBeVisible();
    await expect(row.getByRole("button", { name: `Revocar ${name}`, exact: true })).toHaveCount(0);
    expect((await storedKey(name)).revokedAt).not.toBeNull();

    const rejected = await postWith(request, key, `${slug}-revocada`);
    expect(rejected.status()).toBe(401);
    expect(await rejected.json()).toEqual({ error: "API key inválida o revocada." });
    expect(await sql('select id from "Post" where slug = $1', [`${slug}-revocada`])).toHaveLength(0);
  } finally {
    await sql('delete from "Post" where slug like $1', [`${slug}%`]);
  }
});

test("revoking a key that was already revoked tells the admin and keeps its original date", async ({ page }) => {
  const name = `Ya revocada ${Date.now()}`;
  await logIn(page);
  await page.goto("/admin/api-keys");
  await createKey(page, name, true);
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row.getByText("Activa", { exact: true })).toBeVisible();

  try {
    // Another tab or admin revokes it while this page still shows it as active.
    const original = new Date("2026-01-02T03:04:05.000Z");
    await sql('update "ApiKey" set "revokedAt" = $1 where name = $2', [original, name]);

    page.once("dialog", (dialog) => dialog.accept());
    await row.getByRole("button", { name: `Revocar ${name}`, exact: true }).click();
    await expect(row.getByRole("alert")).toHaveText("Esta key ya estaba revocada o no existe.");
    expect((await storedKey(name)).revokedAt).toEqual(original);
  } finally {
    await sql('delete from "ApiKey" where name = $1', [name]);
  }
});

test("the API rejects a request without a valid key", async ({ request }) => {
  const missing = await request.post("/api/blog", { data: { title: "Sin key" } });
  expect(missing.status()).toBe(401);
  expect(missing.headers()["www-authenticate"]).toBe("Bearer");
  expect((await postWith(request, "mrd_not-a-real-key", "e2e-api-key-falsa")).status()).toBe(401);
});

test("requires a name", async ({ page }) => {
  await logIn(page);
  await page.goto("/admin/api-keys");
  await createKey(page, "", true);
  await expect(page.getByRole("form", { name: "Nueva API key" }).getByText("Escribe un nombre para reconocerla.")).toBeVisible();
  await expect(page.getByLabel("API key nueva")).toHaveCount(0);
});

async function newEditor(admin: Page, browser: Browser) {
  const email = `api-keys-editor-${Date.now()}@mrdesign.test`;
  const password = "api-keys-editor-password-1";
  await admin.goto("/admin/usuarios");
  const form = admin.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor API keys");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(admin.getByRole("row").filter({ hasText: email })).toBeVisible();
  const context = await browser.newContext();
  const editor = await context.newPage();
  await logIn(editor, email, password);
  return { editor, context };
}

test("API keys are for admins only", async ({ page, browser, request }) => {
  const anonymous = await request.get("/admin/api-keys", { maxRedirects: 0 });
  expect(anonymous.status()).toBeGreaterThanOrEqual(300);
  expect(anonymous.status()).toBeLessThan(400);

  await logIn(page);
  const { editor, context } = await newEditor(page, browser);
  try {
    await expect(editor.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "API keys" })).toHaveCount(0);
    const response = await editor.request.get("/admin/api-keys", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
  } finally {
    await context.close();
  }
});
