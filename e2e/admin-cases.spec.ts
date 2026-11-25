import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { FAKE_MEDIA_ORIGIN, serveFakeMedia } from "./fake-media";
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

// Every case these specs create has this slug prefix.
const SLUG_PREFIX = "e2e-case-";
const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const mediaIds: string[] = [];

test.afterAll(async () => {
  await sql('delete from "Case" where slug like $1', [`${SLUG_PREFIX}%`]);
  await sql('delete from "MediaFile" where id = any($1)', [mediaIds]);
});

async function logIn(page: Page, email = E2E_ADMIN.email, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

// A library image straight in the database, newest first in the picker.
async function libraryImage() {
  const sha = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  const id = `e2e-case-media-${unique()}`;
  const name = `caso-${unique()}.png`;
  await sql(
    'insert into "MediaFile" (id, sha256, key, url, "contentType", size, "originalName", alt) values ($1, $2, $3, $4, $5, $6, $7, $8)',
    [id, sha, `media/${sha}.png`, `${FAKE_MEDIA_ORIGIN}/test-bucket/media/${sha}.png`, "image/png", 10, name, "Portada del caso"],
  );
  mediaIds.push(id);
  return { id, name };
}

async function insertCase() {
  const id = `e2e-case-${unique()}`;
  const slug = `${SLUG_PREFIX}${unique()}`;
  const title = `Caso E2E ${unique()}`;
  await sql(
    `insert into "Case" (id, locale, "translationKey", slug, title, client, lines, summary, challenge, solution, result, stack, "updatedAt")
     values ($1, 'es', $1, $2, $3, 'Cliente E2E', '{}', '', '', '', '', '{}', now())`,
    [id, slug, title],
  );
  return { id, slug, title };
}

test("an admin drafts a case, cannot publish it without the client's authorization, then publishes it", async ({ page }) => {
  await serveFakeMedia(page);
  const image = await libraryImage();
  const slug = `${SLUG_PREFIX}${unique()}`;
  const client = `Cliente ${unique()}`;
  const title = `Una tienda que se arma sola ${unique()}`;
  await logIn(page);

  await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Casos" }).click();
  await expect(page).toHaveURL(/\/admin\/casos$/);
  await expect(page.getByRole("heading", { name: "Casos", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Nuevo caso" }).click();

  // A draft only needs something to build its slug.
  await page.getByLabel("Cliente o marca").fill(client);
  await page.getByLabel("Slug", { exact: true }).fill(slug);
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/admin\/casos\/[\w-]+$/);
  await expect(page.getByRole("heading", { name: "Editar caso" })).toBeVisible();
  const [stored] = await sql('select id, status from "Case" where slug = $1', [slug]);
  expect(stored.status).toBe("DRAFT");

  await page.getByLabel("Título del caso").fill(title);
  await page.getByLabel("Resumen").fill("Migré la tienda y conecté el inventario.");
  await page.getByLabel("El reto").fill("El inventario vivía en hojas de cálculo.");
  await page.getByLabel("La solución").fill("Un plugin que sincroniza el inventario con la tienda.");
  await page.getByLabel("El resultado").fill("La tienda se actualiza sola.");
  await page.getByLabel("Tiendas Shopify").check();
  await page.getByRole("button", { name: "Elegir portada" }).click();
  await page.getByRole("dialog", { name: "Biblioteca de imágenes" }).getByRole("button", { name: `Usar ${image.name}`, exact: true }).click();
  // The library's alt text fills the empty cover alt.
  await expect(page.getByLabel("Texto alternativo de la portada")).toHaveValue("Portada del caso");

  await page.getByRole("button", { name: "Guardar y publicar" }).click();
  await expect(page.getByText("Para publicar, el cliente tiene que haber autorizado el caso.")).toBeVisible();
  expect((await sql('select status from "Case" where id = $1', [stored.id]))[0].status).toBe("DRAFT");

  await page.getByLabel("El cliente autorizó publicar este caso").check();
  await page.getByRole("button", { name: "Guardar y publicar" }).click();
  await expect(page.getByRole("button", { name: "Guardar cambios" })).toBeVisible();
  await expect(page.getByRole("button", { name: `Despublicar ${title}`, exact: true })).toBeVisible();
  const [published] = await sql('select status, "clientAuthorized", lines, "coverImageAlt", "publishedAt" from "Case" where id = $1', [stored.id]);
  expect(published).toMatchObject({ status: "PUBLISHED", clientAuthorized: true, lines: ["shopify"], coverImageAlt: "Portada del caso" });
  expect(published.publishedAt).not.toBeNull();

  // Each save hands the form the case's new version, so the editor keeps saving without a reload.
  await page.getByLabel("Resumen").fill("Migré la tienda, conecté el inventario y automaticé los envíos.");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Guardado." })).toBeVisible();
  expect((await sql('select summary from "Case" where id = $1', [stored.id]))[0].summary).toBe("Migré la tienda, conecté el inventario y automaticé los envíos.");

  await page.goto("/admin/casos");
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row.getByText("Publicado", { exact: true })).toBeVisible();
  await expect(row.getByText("Autorizado", { exact: true })).toBeVisible();

  // The image is in use: the library refuses to delete it.
  await page.goto("/admin/imagenes");
  await page.getByRole("button", { name: `Eliminar ${image.name}` }).click();
  await expect(page.getByText(`Caso: ${title}`)).toBeVisible();
  expect(await sql('select id from "MediaFile" where id = $1', [image.id])).toHaveLength(1);
});

test("the list refuses to publish a case the client has not authorized", async ({ page }) => {
  const item = await insertCase();
  await logIn(page);
  await page.goto("/admin/casos");
  const row = page.getByRole("row").filter({ hasText: item.title });
  await row.getByRole("button", { name: `Publicar ${item.title}`, exact: true }).click();
  await expect(row.getByRole("alert")).toContainText("Para publicar, el cliente tiene que haber autorizado el caso.");
  expect((await sql('select status from "Case" where id = $1', [item.id]))[0].status).toBe("DRAFT");
});

test("the cases need a session and a configured role: an editor gets in, a role without content access does not", async ({ page, browser, request }) => {
  const item = await insertCase();
  const anonymous = await request.get("/admin/casos", { maxRedirects: 0 });
  expect(anonymous.status()).toBeGreaterThanOrEqual(300);
  expect(anonymous.status()).toBeLessThan(400);
  expect(await anonymous.text()).not.toContain(item.title);

  const email = `cases-editor-${unique()}@mrdesign.test`;
  const password = "cases-editor-password-1";
  await logIn(page);
  await page.goto("/admin/usuarios");
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Casos");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();

  const context = await browser.newContext();
  try {
    const editor = await context.newPage();
    await logIn(editor, email, password);
    await editor.goto("/admin/casos");
    await expect(editor.getByRole("row").filter({ hasText: item.title })).toBeVisible();

    // Every configured role holds `content` (src/lib/auth/permissions.ts); a role outside that
    // table stands for one added later without it, and is sent to the login page.
    await sql(`update "user" set role = 'viewer' where email = $1`, [email]);
    await editor.goto("/admin/casos");
    await expect(editor).toHaveURL(/\/admin\/login/);
    await expect(editor.getByRole("row").filter({ hasText: item.title })).toHaveCount(0);
    const response = await editor.request.get(`/admin/casos/${item.id}`, { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
  } finally {
    await context.close();
  }
});
