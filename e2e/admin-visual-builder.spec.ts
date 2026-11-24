import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

type LandingRow = { slug: string; title: string; status: string; blocks: unknown; draftBlocks: unknown };
type StoredPage = { content: { type: string; props: { title?: string } }[] };

async function query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(sql, values)).rows as T[];
  } finally {
    await client.end();
  }
}

// Every test edits a landing of its own, so no test (or other spec) ever sees another's edits and
// no reseed is needed. The slug never starts with "e2e-": the landing seed deletes those.
const RUN = `spec-vb-${Date.now()}`;
let landing: { id: string; slug: string; title: string };
let counter = 0;

const hero = (title: string) => ({
  type: "Hero",
  props: {
    id: "hero",
    eyebrow: "Shopify",
    title,
    lead: "La edita el e2e del editor.",
    primaryLabel: "Cuéntame tu proyecto",
    primaryHref: "/contacto",
    secondaryLabel: "",
    secondaryHref: "",
    background: "paper",
    side: [],
  },
});
const faq = { type: "Faq", props: { id: "faq", title: "Preguntas", background: "surface", items: [{ question: "¿Se guarda?", answer: "Como borrador." }] } };
const pageJson = (...content: unknown[]) => JSON.stringify({ root: { props: {} }, content });

async function createLanding(draftBlocks: string | null = null) {
  counter += 1;
  const slug = `${RUN}-${counter}`;
  landing = { id: slug, slug, title: `Editor ${slug}` };
  await query(
    `insert into "Landing" (id, locale, "translationKey", slug, title, blocks, "draftBlocks", status, "updatedAt")
     values ($1, 'es', $1, $1, $2, $3::jsonb, $4::jsonb, 'DRAFT', now())`,
    [slug, landing.title, pageJson(hero("Landing para el editor visual"), faq), draftBlocks],
  );
}

const storedLanding = async () =>
  (await query<LandingRow>(`select slug, title, status, blocks, "draftBlocks" from "Landing" where id = $1`, [landing.id]))[0];

test.beforeEach(async ({ page }) => {
  // The discard confirmation and the unsaved-changes warning.
  page.on("dialog", (dialog) => dialog.accept());
  await createLanding();
});

test.afterEach(() => query(`delete from "Landing" where id like $1`, [`${RUN}-%`]));

async function logIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

const preview = (page: Page) => page.frameLocator("iframe");

async function openBuilder(page: Page) {
  await page.goto(`/admin/landings/${landing.id}/visual`);
  await expect(preview(page).getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
}

test("opens from the list, full screen, with the landing's blocks and saves only the draft", async ({ page }) => {
  await logIn(page);
  await page.goto("/admin/landings");
  await page.getByRole("link", { name: `Editar ${landing.title}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/landings/${landing.id}/visual$`));
  await expect(preview(page).getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });

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

  // A second save from the same editor carries the version the first one returned.
  await page.getByRole("textbox", { name: "Título", exact: true }).fill("Segundo borrador E2E");
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect.poll(async () => ((await storedLanding()).draftBlocks as StoredPage | null)?.content[0].props.title).toBe("Segundo borrador E2E");
  await expect(page.getByRole("alert").filter({ hasText: "No se guardó" })).toHaveCount(0);

  const stored = await storedLanding();
  // Only the draft changed: the published blocks and the status stay as they were.
  expect((stored.blocks as StoredPage).content[0].props.title).toBe("Landing para el editor visual");
  expect(stored.status).toBe("DRAFT");

  // The editor starts from the saved draft.
  await page.reload();
  await expect(preview(page).getByRole("heading", { level: 1 })).toHaveText("Segundo borrador E2E", { timeout: 30_000 });

  // Discarding the draft goes back to the published blocks.
  await page.getByRole("button", { name: "Descartar borrador" }).click();
  await expect(preview(page).getByRole("heading", { level: 1 })).toHaveText("Landing para el editor visual", { timeout: 30_000 });
  expect((await storedLanding()).draftBlocks).toBeNull();
});

test("publishes what the editor has, clears the draft and shows it on the site", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);
  expect((await page.request.get(`/soluciones/${landing.slug}`, { maxRedirects: 0 })).status()).toBe(404);

  await preview(page).getByRole("heading", { level: 1 }).click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill("Landing publicada E2E");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Landing publicada." })).toBeVisible();
  await expect(page.getByText("Publicada", { exact: true })).toBeVisible();

  const stored = await storedLanding();
  expect(stored.status).toBe("PUBLISHED");
  expect((stored.blocks as StoredPage).content[0].props.title).toBe("Landing publicada E2E");
  expect(stored.draftBlocks).toBeNull();

  await page.goto(`/soluciones/${landing.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Landing publicada E2E");
});

test("refuses to overwrite what someone else saved meanwhile", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);
  // Another editor saves a draft after this one loaded the landing.
  const theirs = pageJson(hero("Borrador de otra persona"));
  await query(`update "Landing" set "draftBlocks" = $2::jsonb, "updatedAt" = now() + interval '1 second' where id = $1`, [landing.id, theirs]);

  await preview(page).getByRole("heading", { level: 1 }).click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill("Pisaría el otro borrador");
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No se guardó" })).toContainText(
    "Alguien más guardó esta landing mientras la editabas. Recarga la página para ver la versión actual.",
  );
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No se guardó" })).toContainText("Alguien más guardó esta landing");

  const stored = await storedLanding();
  expect((stored.draftBlocks as StoredPage).content[0].props.title).toBe("Borrador de otra persona");
  expect(stored.status).toBe("DRAFT");
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
  await expect(page.getByRole("textbox", { name: /^Slug/ })).toHaveValue(landing.slug);
  await page.getByRole("textbox", { name: /^Slug/ }).fill(`${landing.slug} Editada`);
  await page.getByRole("textbox", { name: "Título de la página" }).fill("Landing editada");
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado." })).toBeVisible();

  // A draft never moves the URL or the title.
  let stored = await storedLanding();
  expect(stored.slug).toBe(landing.slug);
  expect(stored.title).toBe(landing.title);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Título de la página" })).toHaveValue("Landing editada", { timeout: 30_000 });

  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Landing publicada." })).toBeVisible();
  stored = await storedLanding();
  expect(stored.slug).toBe(`${landing.slug}-editada`);
  expect(stored.title).toBe("Landing editada");
});

test("refuses a slug another landing of the same language uses", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);
  // The seeded public landing: read here, never written.
  await page.getByRole("textbox", { name: /^Slug/ }).fill("e2e-builder");
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No se guardó" })).toContainText("Slug: otra landing de este idioma ya lo usa.");
  expect((await storedLanding()).draftBlocks).toBeNull();
});

test("a stored draft that fails validation is not loaded: the editor starts from the published page and says why", async ({ page }) => {
  await query(`update "Landing" set "draftBlocks" = $2::jsonb where id = $1`, [landing.id, pageJson({ type: "Conversation", props: { id: "c" } })]);
  await logIn(page);
  await openBuilder(page);
  await expect(page.getByRole("status").filter({ hasText: "El borrador guardado tiene bloques que ya no son válidos" })).toBeVisible();
  await expect(preview(page).getByRole("heading", { level: 1 })).toHaveText("Landing para el editor visual");
  // The list and the editor agree that a draft is stored, so it can be discarded from here.
  await page.getByRole("button", { name: "Descartar borrador" }).click();
  await expect.poll(async () => (await storedLanding()).draftBlocks).toBeNull();
});

test("the visual builder needs a session, and an unknown or malformed id is not found", async ({ page, request }) => {
  const response = await request.get("/admin/landings/any/visual", { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toContain("/admin/login");

  await logIn(page);
  for (const id of ["no-such-landing", "bad%20id", "x".repeat(120)]) {
    expect((await page.request.get(`/admin/landings/${id}/visual`, { maxRedirects: 0 })).status(), id).toBe(404);
  }
});
