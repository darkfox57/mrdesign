import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

type LandingRow = {
  locale: string;
  slug: string;
  title: string;
  status: string;
  translationKey: string;
  blocks: unknown;
  draftBlocks: { root: { props: Record<string, unknown> }; content: { type: string }[] } | null;
};

async function query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(sql, values)).rows as T[];
  } finally {
    await client.end();
  }
}

const columns = `locale, slug, title, status, "translationKey", blocks, "draftBlocks"`;

// Landings this spec creates; scripts/seed-e2e-landings.ts removes them too.
const cleanUp = () => query(`delete from "Landing" where slug like 'e2e-nueva%' or ("translationKey" = 'e2e-landing-solo' and locale = 'en')`);
test.beforeEach(cleanUp);
test.afterEach(cleanUp);

async function logIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function openNewLanding(page: Page) {
  await page.goto("/admin/landings");
  await page.getByRole("link", { name: "Nueva landing" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Nueva landing" })).toBeVisible();
}

test("creates a landing as a draft and opens it in the visual editor", async ({ page }) => {
  await logIn(page);
  await openNewLanding(page);
  await page.getByLabel("Idioma").selectOption("en");
  await page.getByLabel("Título").fill("E2E Nueva tienda Shopify");
  await page.getByRole("button", { name: "Crear y abrir el editor visual" }).click();

  await expect(page).toHaveURL(/\/admin\/landings\/[^/]+\/visual$/);
  // An empty page, ready for blocks.
  await expect(page.frameLocator("iframe").locator("body")).toBeAttached({ timeout: 30_000 });

  // The slug comes from the title; the landing is a draft with no page yet.
  const [row] = await query<LandingRow>(`select ${columns} from "Landing" where slug = 'e2e-nueva-tienda-shopify'`);
  expect(row).toMatchObject({ locale: "en", title: "E2E Nueva tienda Shopify", status: "DRAFT", blocks: null, draftBlocks: null });
  // The editor starts with the page fields of the new landing.
  await expect(page.getByRole("textbox", { name: /^Slug/ })).toHaveValue("e2e-nueva-tienda-shopify");

  // It cannot go public from the list before it has a page.
  await page.goto("/admin/landings");
  await page.getByRole("button", { name: "Publicar E2E Nueva tienda Shopify" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Esta landing todavía no tiene página. Ármala y publícala desde el editor visual." }),
  ).toBeVisible();
  const [after] = await query<LandingRow>(`select ${columns} from "Landing" where slug = 'e2e-nueva-tienda-shopify'`);
  expect(after.status).toBe("DRAFT");
});

test("refuses a slug another landing of the same language already uses, keeping what was typed", async ({ page }) => {
  await logIn(page);
  await openNewLanding(page);
  // Spanish: the default.
  await page.getByLabel("Título").fill("E2E Nueva repetida");
  await page.getByLabel("Slug").fill("e2e-builder");
  await page.getByRole("button", { name: "Crear y abrir el editor visual" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Slug: otra landing de este idioma ya lo usa." })).toBeVisible();
  await expect(page.getByLabel("Título")).toHaveValue("E2E Nueva repetida");
  expect(await query(`select id from "Landing" where title = 'E2E Nueva repetida'`)).toHaveLength(0);
});

test("names the field to fix when the title is empty", async ({ page }) => {
  await logIn(page);
  await openNewLanding(page);
  // Spaces pass the browser's required check; the server trims them.
  await page.getByLabel("Título").fill("   ");
  await page.getByRole("button", { name: "Crear y abrir el editor visual" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Título: no puede quedar vacío." })).toBeVisible();
});

test("translates a landing: same translationKey, starting from a copy of its blocks", async ({ page }) => {
  await logIn(page);
  await page.goto("/admin/landings");
  await page.getByRole("link", { name: "Traducir E2E Landing solo en español al inglés" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Nueva traducción" })).toBeVisible();
  // The language comes from the link.
  await expect(page.getByLabel("Idioma")).toHaveCount(0);
  await page.getByLabel("Título").fill("E2E WordPress sites");
  await page.getByLabel("Slug").fill("e2e-wordpress-sites");
  await page.getByRole("button", { name: "Crear y abrir el editor visual" }).click();
  await expect(page).toHaveURL(/\/admin\/landings\/[^/]+\/visual$/);

  const [original] = await query<LandingRow>(`select ${columns} from "Landing" where "translationKey" = 'e2e-landing-solo' and locale = 'es'`);
  const [copy] = await query<LandingRow>(`select ${columns} from "Landing" where "translationKey" = 'e2e-landing-solo' and locale = 'en'`);
  expect(copy).toMatchObject({ slug: "e2e-wordpress-sites", title: "E2E WordPress sites", status: "DRAFT", blocks: null });
  // The blocks are a draft of the translation; its page fields are its own.
  expect(copy.draftBlocks?.root.props).toEqual({});
  expect(copy.draftBlocks?.content.map((block) => block.type)).toEqual(
    (original.blocks as { content: { type: string }[] }).content.map((block) => block.type),
  );
  // The editor opens on that copy.
  await expect(page.frameLocator("iframe").getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });

  // Every language now has its version: no more translate links for it.
  await page.goto("/admin/landings");
  await expect(page.getByRole("link", { name: /^Traducir E2E Landing solo en español/ })).toHaveCount(0);
  // Going back to the translate link shows the existing version instead of a second form.
  const [source] = await query<{ id: string }>(`select id from "Landing" where "translationKey" = 'e2e-landing-solo' and locale = 'es'`);
  await page.goto(`/admin/landings/nueva?traducir=${source.id}&idioma=en`);
  await expect(page.getByRole("link", { name: "Editar la versión en inglés" })).toBeVisible();
});
