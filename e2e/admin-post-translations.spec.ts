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

// Every post these specs create has this slug prefix (titles start with "E2E Admin", which the
// editor turns into the slug), so the public blog specs never see them.
const SLUG_PREFIX = "e2e-admin-";
const unique = () => `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

async function insertPost({ locale, translationKey }: { locale: "es" | "en"; translationKey?: string }) {
  const id = `e2e-post-${unique()}`;
  const title = `E2E Admin original ${locale} ${unique()}`;
  await sql(
    'insert into "Post" (id, locale, "translationKey", title, slug, excerpt, content, "updatedAt") values ($1, $2::"Locale", $3, $4, $5, $6, $7, now())',
    [id, locale, translationKey ?? id, title, `${SLUG_PREFIX}${unique()}`, "Resumen.", "<p>Texto.</p>"],
  );
  return { id, title, translationKey: translationKey ?? id };
}

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

const translations = (page: Page) => page.getByRole("region", { name: "Traducciones" });

async function openPost(page: Page, id: string) {
  await page.goto(`/admin/blog/${id}`);
  await expect(page.getByRole("heading", { name: "Editar post" })).toBeVisible();
}

test("creates the missing translation linked to the original", async ({ page }) => {
  const original = await insertPost({ locale: "es" });
  const title = `E2E Admin Translation ${unique()}`;
  await logIn(page);
  await openPost(page, original.id);

  await translations(page).getByRole("link", { name: "Traducir al inglés" }).click();
  await expect(page.getByRole("heading", { name: "Nueva traducción" })).toBeVisible();
  await expect(page.getByText(`Traducción de «${original.title}» (Español) al inglés.`)).toBeVisible();
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Resumen").fill("Summary of the post.");
  await page.getByRole("textbox", { name: "Contenido" }).click();
  await page.keyboard.type("Text in English.");
  await page.getByRole("button", { name: "Guardar" }).click();

  await expect(page.getByRole("heading", { name: "Editar post" })).toBeVisible();
  await expect(page.getByText("Inglés (no se cambia después de crear el post)")).toBeVisible();
  await expect(translations(page).getByRole("link", { name: "Editar la versión en español" })).toHaveAttribute(
    "href",
    `/admin/blog/${original.id}`,
  );

  await openPost(page, original.id);
  await translations(page).getByRole("link", { name: "Editar la versión en inglés" }).click();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(title);
});

test("does not create a second version in a language that already has one", async ({ page }) => {
  const original = await insertPost({ locale: "es" });
  const english = await insertPost({ locale: "en", translationKey: original.translationKey });
  await logIn(page);
  await openPost(page, original.id);
  await expect(translations(page).getByRole("link", { name: "Editar la versión en inglés" })).toHaveAttribute(
    "href",
    `/admin/blog/${english.id}`,
  );

  await page.goto(`/admin/blog/nuevo?traducir=${original.id}&idioma=en`);
  await expect(page.getByText("Este post ya tiene versión en inglés.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar la versión en inglés" })).toHaveAttribute("href", `/admin/blog/${english.id}`);
  await expect(page.getByRole("button", { name: "Guardar" })).toHaveCount(0);
});

test("a translation request for an unknown post or the same language falls back to a plain new post", async ({ page }) => {
  const original = await insertPost({ locale: "es" });
  await logIn(page);
  await page.goto("/admin/blog/nuevo?traducir=no-existe&idioma=en");
  await expect(page.getByRole("heading", { name: "Nuevo post" })).toBeVisible();

  await page.goto(`/admin/blog/nuevo?traducir=${original.id}&idioma=es`);
  await expect(page.getByRole("heading", { name: "Nuevo post" })).toBeVisible();
});
