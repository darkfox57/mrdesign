import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

type LandingRow = { slug: string; title: string; status: string; blocks: unknown; draftBlocks: unknown };
type StoredPage = { content: { type: string; props: { title?: string } }[] };

async function query<T>(sql: string): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(sql)).rows as T[];
  } finally {
    await client.end();
  }
}

const storedLanding = async () =>
  (await query<LandingRow>(`select slug, title, status, blocks, "draftBlocks" from "Landing" where "translationKey" = 'e2e-landing'`))[0];

// Back to what scripts/seed-e2e-landings.ts leaves (a draft with blocks), so the other specs and
// the public pages never see a published, renamed or edited E2E Landing.
test.afterEach(({}, info) => {
  if (info.status === "skipped") return;
  execFileSync("npx", ["tsx", "scripts/seed-e2e-landings.ts"], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: "pipe",
    shell: process.platform === "win32",
  });
});

test.beforeEach(({ page }) => {
  // The discard confirmation and the unsaved-changes warning.
  page.on("dialog", (dialog) => dialog.accept());
});

async function logIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function openBuilder(page: Page) {
  await page.goto("/admin/landings");
  await page.getByRole("link", { name: "Editar E2E Landing", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/landings\/[^/]+\/visual$/);
  await expect(page.frameLocator("iframe").getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
}

const preview = (page: Page) => page.frameLocator("iframe");

test("opens full screen with the landing's blocks and saves only the draft", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);

  // Full screen: no dashboard sidebar or header.
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toHaveCount(0);
  await expect(preview(page).getByRole("heading", { level: 1 })).toHaveText("Landing para el editor visual");
  // Section titles keep the site's type scale.
  const sectionTitle = preview(page).getByRole("heading", { level: 2 }).first();
  const fontSize = await sectionTitle.evaluate((h2) => parseFloat(getComputedStyle(h2).fontSize));
  expect(fontSize).toBeGreaterThan(24);
  // The block list shows the generic blocks only.
  for (const block of ["Hero", "Tarjetas", "Texto con imagen", "Preguntas frecuentes", "Llamado a la acción", "Columnas", "Botón"]) {
    await expect(page.getByText(block, { exact: true }).first()).toBeVisible();
  }
  for (const block of ["Conversación", "Caso de éxito", "Módulos de DatiHub"]) {
    await expect(page.getByText(block, { exact: true })).toHaveCount(0);
  }
  await expect(page.getByText("Hay cambios sin publicar")).toHaveCount(0);

  // Edit the hero's title from its fields, then save the draft.
  await preview(page).getByRole("heading", { level: 1 }).click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill("Título del borrador E2E");
  await expect(preview(page).getByRole("heading", { level: 1 })).toHaveText("Título del borrador E2E");
  // Puck draws its header action as a clickable element, not a <button>, so it is found by its text.
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado." })).toBeVisible();
  await expect(page.getByText("Hay cambios sin publicar")).toBeVisible();

  const stored = await storedLanding();
  expect((stored.draftBlocks as StoredPage).content[0].props.title).toBe("Título del borrador E2E");
  // Only the draft changed: the published blocks and the status stay as they were.
  expect((stored.blocks as StoredPage).content[0].props.title).toBe("Landing para el editor visual");
  expect(stored.status).toBe("DRAFT");

  // The editor starts from the saved draft.
  await page.reload();
  await expect(preview(page).getByRole("heading", { level: 1 })).toHaveText("Título del borrador E2E", { timeout: 30_000 });

  // Discarding the draft goes back to the published blocks.
  await page.getByRole("button", { name: "Descartar borrador" }).click();
  await expect(preview(page).getByRole("heading", { level: 1 })).toHaveText("Landing para el editor visual", { timeout: 30_000 });
  expect((await storedLanding()).draftBlocks).toBeNull();
});

test("publishes what the editor has, clears the draft and shows it on the site", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);
  expect((await page.request.get("/soluciones/e2e-landing", { maxRedirects: 0 })).status()).toBe(404);

  await preview(page).getByRole("heading", { level: 1 }).click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill("Landing publicada E2E");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Landing publicada." })).toBeVisible();
  await expect(page.getByText("Publicada", { exact: true })).toBeVisible();

  const stored = await storedLanding();
  expect(stored.status).toBe("PUBLISHED");
  expect((stored.blocks as StoredPage).content[0].props.title).toBe("Landing publicada E2E");
  expect(stored.draftBlocks).toBeNull();

  await page.goto("/soluciones/e2e-landing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Landing publicada E2E");
});

test("rejects an unsafe link and saves nothing", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);
  await preview(page).getByRole("heading", { level: 1 }).click();

  await page.getByRole("textbox", { name: /^Enlace del botón principal/ }).fill("javascript:alert(1)");
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No se guardó" })).toContainText("primaryHref: enlace no permitido");
  const stored = await storedLanding();
  expect(stored.draftBlocks).toBeNull();
  expect((stored.blocks as StoredPage).content[0].props.title).toBe("Landing para el editor visual");
});

test("page fields stay in the draft and reach the landing only when it is published", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);

  // With no block selected, the fields panel shows the page's own fields.
  await expect(page.getByRole("textbox", { name: /^Slug/ })).toHaveValue("e2e-landing");
  await page.getByRole("textbox", { name: /^Slug/ }).fill("E2E Landing Editada");
  await page.getByRole("textbox", { name: "Título de la página" }).fill("E2E Landing editada");
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado." })).toBeVisible();

  // A draft never moves the URL or the title.
  let stored = await storedLanding();
  expect(stored.slug).toBe("e2e-landing");
  expect(stored.title).toBe("E2E Landing");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Título de la página" })).toHaveValue("E2E Landing editada", { timeout: 30_000 });

  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Landing publicada." })).toBeVisible();
  stored = await storedLanding();
  expect(stored.slug).toBe("e2e-landing-editada");
  expect(stored.title).toBe("E2E Landing editada");
});

test("refuses a slug another landing of the same language uses", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);
  await page.getByRole("textbox", { name: /^Slug/ }).fill("e2e-builder");
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No se guardó" })).toContainText("Slug: otra landing de este idioma ya lo usa.");
  expect((await storedLanding()).draftBlocks).toBeNull();
});

test("the visual builder needs a session, and an unknown landing is not found", async ({ page, request }) => {
  const response = await request.get("/admin/landings/any/visual", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/admin/login");

  await logIn(page);
  expect((await page.request.get("/admin/landings/no-such-landing/visual", { maxRedirects: 0 })).status()).toBe(404);
});
