import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { serveFakeMedia } from "./fake-media";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows;
  } finally {
    await client.end();
  }
}

// Every post these specs create has this slug prefix (titles start with "E2E Admin", which the
// editor turns into the slug), so the public blog specs never see them.
const SLUG_PREFIX = "e2e-admin-";
const unique = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

async function insertPost(content: string) {
  const id = `e2e-post-${unique()}`;
  const title = `E2E Admin con tabla ${unique()}`;
  const slug = `${SLUG_PREFIX}${unique()}`;
  await sql(
    'insert into "Post" (id, locale, "translationKey", title, slug, excerpt, content, "updatedAt") values ($1, $2::"Locale", $1, $3, $4, $5, $6, now())',
    [id, "es", title, slug, "Resumen.", content],
  );
  return { id, title, slug };
}

test.beforeEach(async ({ page }) => {
  await serveFakeMedia(page);
});

test.afterAll(async () => {
  await sql('delete from "Post" where slug like $1', [`${SLUG_PREFIX}%`]);
});

async function logIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const editor = (page: Page) => page.getByRole("textbox", { name: "Contenido" });

async function fillNewPost(page: Page, title: string) {
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Resumen").fill(`Resumen de ${title}.`);
  await editor(page).click();
  await page.keyboard.type("Primer párrafo escrito en el editor.");
}

test("creates a draft from the editor and opens it for editing", async ({ page }) => {
  const title = `E2E Admin Nuevo ${unique()}`;
  await logIn(page);
  await page.goto("/admin/blog");
  await page.getByRole("link", { name: "Nuevo post" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo post" })).toBeVisible();

  await fillNewPost(page, title);
  await page.getByRole("button", { name: "Guardar" }).click();

  // The id of the new post, never the /nuevo page the form was sent from.
  await expect(page).toHaveURL(/\/admin\/blog\/(?!nuevo$)[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: "Editar post" })).toBeVisible();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(title);
  // An empty slug is generated from the title.
  await expect(page.getByLabel("Slug")).toHaveValue(/^e2e-admin-nuevo-[a-z0-9]+$/);
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();

  await page.goto("/admin/blog");
  await page.getByRole("link", { name: `Editar ${title}`, exact: true }).click();
  await expect(editor(page)).toContainText("Primer párrafo escrito en el editor.");
});

test("edits and publishes a post, and the public page shows the new text", async ({ page }) => {
  const title = `E2E Admin Publicar ${unique()}`;
  await logIn(page);
  await page.goto("/admin/blog/nuevo");
  await fillNewPost(page, title);
  await page.getByLabel("Slug").fill(`E2E admin publicar ${unique()}`);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("heading", { name: "Editar post" })).toBeVisible();
  const slug = await page.getByLabel("Slug").inputValue();
  expect(slug).toMatch(/^e2e-admin-publicar-[a-z0-9]+$/);

  await editor(page).click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Segundo párrafo agregado al editar.");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado." })).toBeVisible();

  await page.getByRole("button", { name: `Publicar ${title}`, exact: true }).click();
  await expect(page.getByText("Publicado", { exact: true })).toBeVisible();
  await page.goto(`/blog/${slug}`);
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText("Segundo párrafo agregado al editar.")).toBeVisible();

  // Editing a published post reaches the public page too.
  await page.goBack();
  await editor(page).click();
  await page.keyboard.press("Control+End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Tercer párrafo agregado después de publicar.");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado." })).toBeVisible();
  await page.goto(`/blog/${slug}`);
  await expect(page.getByText("Tercer párrafo agregado después de publicar.")).toBeVisible();

  await page.goBack();
  await page.getByRole("button", { name: `Despublicar ${title}`, exact: true }).click();
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
});

test("rejects a slug another post already uses in the same language", async ({ page }) => {
  const taken = await insertPost("<p>Texto.</p>");
  await logIn(page);
  await page.goto("/admin/blog/nuevo");
  await fillNewPost(page, `E2E Admin Duplicado ${unique()}`);
  await page.getByLabel("Slug").fill(taken.slug);
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByText("Ya hay un post con ese slug en este idioma.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/blog\/nuevo$/);
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(/E2E Admin Duplicado/);
});

test("picks the cover and an inline image from the library", async ({ page }) => {
  const name = `editor-${unique()}.png`;
  await logIn(page);
  await page.goto("/admin/imagenes");
  await page
    .getByLabel("Subir imágenes")
    .setInputFiles({ name, mimeType: "image/png", buffer: Buffer.concat([PNG, Buffer.from(`${name}-${Math.random()}`)]) });
  await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();

  await page.goto("/admin/blog/nuevo");
  await fillNewPost(page, `E2E Admin Imagenes ${unique()}`);

  await page.getByRole("button", { name: "Elegir portada" }).click();
  const picker = page.getByRole("dialog", { name: "Biblioteca de imágenes" });
  await picker.getByRole("button", { name: `Usar ${name}`, exact: true }).click();
  await expect(picker).toBeHidden();
  await expect(page.getByRole("img", { name: "Portada elegida" })).toBeVisible();

  await editor(page).click();
  await page.getByRole("button", { name: "Insertar imagen" }).click();
  await picker.getByRole("button", { name: `Usar ${name}`, exact: true }).click();
  await expect(editor(page).locator("img")).toHaveCount(1);

  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("heading", { name: "Editar post" })).toBeVisible();
  await expect(editor(page).locator("img")).toHaveAttribute("src", new RegExp(`/test-bucket/media/[0-9a-f]{64}\\.png$`));
  await expect(page.getByRole("img", { name: "Portada elegida" })).toBeVisible();

  // The library now refuses to delete the image: a post uses it.
  await page.goto("/admin/imagenes");
  const card = page.getByRole("listitem").filter({ hasText: name });
  await card.getByRole("button", { name: `Eliminar ${name}`, exact: true }).click();
  await expect(card.getByRole("alert")).toContainText("No se puede eliminar: está en uso (Post: E2E Admin Imagenes");
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();
});

test("saving a post keeps its table, its h4 and its internal links", async ({ page }) => {
  const post = await insertPost(
    '<h4>Comparativa</h4><table><tbody><tr><th>Plataforma</th><th>Uso</th></tr><tr><td>Shopify</td><td>Tiendas</td></tr></tbody></table><p>Escríbeme desde <a href="/contacto">contacto</a>.</p>',
  );
  await logIn(page);
  await page.goto("/admin/blog");
  await page.getByRole("link", { name: `Editar ${post.title}`, exact: true }).click();
  await expect(editor(page).locator("table")).toBeVisible();

  // Type something so the saved HTML is the editor's own output, not the stored HTML untouched.
  await editor(page).locator("h4").click();
  await page.keyboard.press("End");
  await page.keyboard.type(" 2026");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado." })).toBeVisible();
  await page.reload();
  await expect(editor(page).locator("h4")).toHaveText("Comparativa 2026");
  await expect(editor(page).locator("table th").first()).toHaveText("Plataforma");
  await expect(editor(page).locator("table td").first()).toHaveText("Shopify");
  // Internal links stay as they were: no new tab, no nofollow.
  const link = editor(page).getByRole("link", { name: "contacto" });
  await expect(link).toHaveAttribute("href", "/contacto");
  await expect(link).not.toHaveAttribute("target", /.*/);
  await expect(link).not.toHaveAttribute("rel", /.*/);
});

test("the editor needs a session", async ({ request }) => {
  const response = await request.get("/admin/blog/nuevo", { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
});
