import { expect, test, type Page } from "@playwright/test";
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

// Every post these specs create has this slug prefix, so the public blog specs never see them.
const SLUG_PREFIX = "e2e-admin-";
const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Posts go straight into the local database: the admin specs never depend on the blog seed.
async function insertPost({ locale = "es", status = "DRAFT" }: { locale?: "es" | "en"; status?: "DRAFT" | "PUBLISHED" } = {}) {
  const id = `e2e-post-${unique()}`;
  const slug = `${SLUG_PREFIX}${unique()}`;
  const title = `E2E Admin ${status === "DRAFT" ? "borrador" : "publicado"} ${locale} ${unique()}`;
  await sql(
    'insert into "Post" (id, locale, "translationKey", title, slug, excerpt, content, status, "publishedAt", "updatedAt") values ($1, $2::"Locale", $1, $3, $4, $5, $6, $7::"ContentStatus", $8, now())',
    [id, locale, title, slug, `Resumen de ${title}.`, "<p>Texto del post.</p>", status, status === "PUBLISHED" ? new Date() : null],
  );
  return { id, slug, title };
}

test.afterAll(async () => {
  await sql('delete from "Post" where slug like $1', [`${SLUG_PREFIX}%`]);
});

async function logIn(page: Page, email = E2E_ADMIN.email, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const postRow = (page: Page, title: string) => page.getByRole("row").filter({ hasText: title });

test("the sidebar opens the post list with drafts and published posts", async ({ page }) => {
  const draft = await insertPost();
  const published = await insertPost({ status: "PUBLISHED" });
  const english = await insertPost({ locale: "en", status: "PUBLISHED" });
  await logIn(page);
  await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Blog" }).click();

  await expect(page).toHaveURL(/\/admin\/blog$/);
  await expect(page.getByRole("heading", { name: "Blog", level: 1 })).toBeVisible();
  await expect(postRow(page, draft.title).getByText("Borrador", { exact: true })).toBeVisible();
  await expect(postRow(page, published.title).getByText("Publicado", { exact: true })).toBeVisible();
  await expect(postRow(page, english.title).getByText("Inglés", { exact: true })).toBeVisible();
  await expect(postRow(page, published.title).getByRole("link", { name: "Ver en el sitio" })).toHaveAttribute("href", `/blog/${published.slug}`);
  await expect(postRow(page, english.title).getByRole("link", { name: "Ver en el sitio" })).toHaveAttribute("href", `/en/blog/${english.slug}`);
});

test("filters the list by status and language through the URL", async ({ page }) => {
  const draft = await insertPost();
  const published = await insertPost({ status: "PUBLISHED" });
  const englishDraft = await insertPost({ locale: "en" });
  await logIn(page);
  await page.goto("/admin/blog?status=DRAFT&locale=es");

  await expect(postRow(page, draft.title)).toBeVisible();
  await expect(postRow(page, published.title)).toHaveCount(0);
  await expect(postRow(page, englishDraft.title)).toHaveCount(0);
  await expect(page.getByLabel("Estado")).toHaveValue("DRAFT");
  await expect(page.getByLabel("Idioma")).toHaveValue("es");

  // An unknown filter value shows everything instead of failing.
  await page.goto("/admin/blog?status=DELETED&locale=fr");
  await expect(postRow(page, published.title)).toBeVisible();
  await expect(postRow(page, englishDraft.title)).toBeVisible();
});

test("publishing shows the post on the public blog and unpublishing hides it again", async ({ page }) => {
  const post = await insertPost();
  await logIn(page);
  await page.goto("/admin/blog");
  const row = postRow(page, post.title);

  await row.getByRole("button", { name: `Publicar ${post.title}`, exact: true }).click();
  await expect(row.getByText("Publicado", { exact: true })).toBeVisible();
  expect((await page.request.get(`/blog/${post.slug}`)).status()).toBe(200);

  await row.getByRole("button", { name: `Despublicar ${post.title}`, exact: true }).click();
  await expect(row.getByText("Borrador", { exact: true })).toBeVisible();
  expect((await page.request.get(`/blog/${post.slug}`)).status()).toBe(404);
});

// Editors have `content: publish` (src/lib/auth/permissions.ts).
test("an editor can open the blog and publish a post", async ({ page, browser }) => {
  const post = await insertPost();
  const email = `blog-editor-${unique()}@mrdesign.test`;
  const password = "blog-editor-password-1";
  await logIn(page);
  await page.goto("/admin/usuarios");
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Blog");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();

  const context = await browser.newContext();
  const editor = await context.newPage();
  await logIn(editor, email, password);
  await editor.goto("/admin/blog");
  const row = postRow(editor, post.title);
  await row.getByRole("button", { name: `Publicar ${post.title}`, exact: true }).click();
  await expect(row.getByText("Publicado", { exact: true })).toBeVisible();
  await context.close();
});

test("the post list needs a session", async ({ request }) => {
  const draft = await insertPost();
  const response = await request.get("/admin/blog", { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  expect(await response.text()).not.toContain(draft.title);
});
