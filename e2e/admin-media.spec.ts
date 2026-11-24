import { expect, test, type Page } from "@playwright/test";
import { serveFakeMedia } from "./fake-media";
import { E2E_ADMIN } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

// A valid 1x1 PNG. Bytes appended after the IEND chunk keep it a valid image but change its
// hash, so every run uploads a new file (the database keeps rows between runs; the fake bucket does not).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const uniquePng = (tag: string) => Buffer.concat([PNG, Buffer.from(`${tag}-${Date.now()}-${Math.random()}`)]);

test.beforeEach(async ({ page }) => {
  await serveFakeMedia(page);
});

async function logIn(page: Page, email = E2E_ADMIN.email, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const upload = (page: Page, file: { name: string; mimeType: string; buffer: Buffer }) =>
  page.getByLabel("Subir imágenes").setInputFiles(file);
const card = (page: Page, name: string) => page.getByRole("listitem").filter({ hasText: name });

test("uploads an image to the bucket, shows it in the library and reuses it on a second upload", async ({ page }) => {
  const name = `foto-${Date.now()}.png`;
  const buffer = uniquePng("upload");
  await logIn(page);
  await page.getByRole("navigation", { name: "Panel" }).getByRole("link", { name: "Imágenes" }).click();
  await expect(page.getByRole("heading", { name: "Imágenes" })).toBeVisible();

  await upload(page, { name, mimeType: "image/png", buffer });
  // The first upload after a fresh build also warms up the server actions: allow it more time.
  await expect(page.getByRole("status").filter({ hasText: name })).toContainText("Subida.", { timeout: 15_000 });
  const image = card(page, name).locator("img");
  await expect(image).toBeVisible();
  // The image is served from the bucket, so it actually loads.
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);

  await upload(page, { name: `copia-${name}`, mimeType: "image/png", buffer });
  await expect(page.getByRole("status").filter({ hasText: `copia-${name}` })).toContainText("Ya estaba en la biblioteca.");
  await expect(card(page, `copia-${name}`)).toHaveCount(0);
  await expect(card(page, name)).toHaveCount(1);
});

test("rejects files that are not supported images, without uploading them", async ({ page }) => {
  await logIn(page);
  await page.goto("/admin/imagenes");

  await upload(page, { name: "dibujo.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg></svg>") });
  await expect(page.getByRole("alert").filter({ hasText: "dibujo.svg" })).toContainText("Usa una imagen JPG, PNG, WebP, AVIF o GIF.");
  await expect(card(page, "dibujo.svg")).toHaveCount(0);
});

test("saves the alternative text and lets an admin delete an unused image", async ({ page }) => {
  const name = `alt-${Date.now()}.png`;
  await logIn(page);
  await page.goto("/admin/imagenes");
  await upload(page, { name, mimeType: "image/png", buffer: uniquePng("alt") });
  await expect(card(page, name)).toBeVisible();

  await expect(card(page, name)).toContainText("Falta el texto alternativo.");

  // The alternative text is required.
  await card(page, name).getByRole("button", { name: `Guardar texto de ${name}`, exact: true }).click();
  await expect(card(page, name).getByRole("alert")).toHaveText("Escribe el texto alternativo.");

  await card(page, name).getByLabel(`Texto alternativo de ${name}`).fill("Maqueta de una tienda Shopify en un portátil");
  await card(page, name).getByRole("button", { name: `Guardar texto de ${name}`, exact: true }).click();
  await expect(card(page, name).getByRole("status")).toHaveText("Guardado.");
  await page.reload();
  await expect(card(page, name).getByRole("img")).toHaveAttribute("alt", "Maqueta de una tienda Shopify en un portátil");
  await expect(card(page, name)).not.toContainText("Falta el texto alternativo.");

  await card(page, name).getByRole("button", { name: `Eliminar ${name}`, exact: true }).click();
  await expect(card(page, name)).toHaveCount(0);
});

test("an editor can upload but cannot delete images, and edits the alt text of their own images only", async ({ page, browser }) => {
  const email = `media-editor-${Date.now()}@mrdesign.test`;
  const password = "media-editor-password-1";
  const adminImage = `admin-${Date.now()}.png`;
  await logIn(page);
  await page.goto("/admin/imagenes");
  await upload(page, { name: adminImage, mimeType: "image/png", buffer: uniquePng("admin") });
  await expect(card(page, adminImage)).toBeVisible();
  await page.goto("/admin/usuarios");
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Imágenes");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();

  const context = await browser.newContext();
  const editor = await context.newPage();
  await logIn(editor, email, password);
  await editor.goto("/admin/imagenes");
  const name = `editor-${Date.now()}.png`;
  await upload(editor, { name, mimeType: "image/png", buffer: uniquePng("editor") });
  await expect(card(editor, name)).toBeVisible();
  await expect(card(editor, name).getByRole("button", { name: /Eliminar/ })).toHaveCount(0);

  await card(editor, name).getByLabel(`Texto alternativo de ${name}`).fill("Captura subida por el editor");
  await card(editor, name).getByRole("button", { name: `Guardar texto de ${name}`, exact: true }).click();
  await expect(card(editor, name).getByRole("status")).toHaveText("Guardado.");
  // An image the admin uploaded: the editor sees why the alt text cannot be changed.
  await expect(card(editor, adminImage).getByRole("button", { name: /Guardar texto/ })).toHaveCount(0);
  await expect(card(editor, adminImage)).toContainText("Solo quien la subió o un administrador puede cambiar el texto alternativo.");
  await context.close();
});

test("the library needs a session", async ({ request }) => {
  const response = await request.get("/admin/imagenes", { maxRedirects: 0 });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
});
