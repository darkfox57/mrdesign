import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

type LandingRow = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  status: string;
  translationKey: string;
  blocks: { content: { type: string }[] } | null;
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

const columns = `id, locale, slug, title, status, "translationKey", blocks, "draftBlocks"`;

// Every landing this spec creates or uses carries RUN in its title, so the cleanup touches nothing
// another spec owns. The slugs never start with "e2e-": the landing seed deletes those.
const RUN = `spec-create-${Date.now()}`;
const cleanUp = () => query(`delete from "Landing" where title like $1`, [`%${RUN}%`]);
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

// A published Spanish landing with blocks and no translation, owned by the test that asks for it.
async function sourceLanding(suffix: string) {
  const id = `${RUN}-${suffix}`;
  const blocks = JSON.stringify({
    root: { props: {} },
    content: [
      {
        type: "Hero",
        props: {
          id: "hero",
          eyebrow: "",
          title: "Sitios WordPress",
          lead: "",
          primaryLabel: "Cuéntame tu proyecto",
          primaryHref: "/contacto",
          secondaryLabel: "",
          secondaryHref: "",
          background: "paper",
          side: [],
        },
      },
      { type: "Faq", props: { id: "faq", title: "Preguntas", background: "surface", items: [] } },
    ],
  });
  await query(
    `insert into "Landing" (id, locale, "translationKey", slug, title, blocks, status, "publishedAt", "updatedAt")
     values ($1, 'es', $1, $1, $2, $3::jsonb, 'PUBLISHED', now(), now())`,
    [id, `Fuente ${id}`, blocks],
  );
  return { id, title: `Fuente ${id}` };
}

test("creates a landing as a draft and opens it in the visual editor", async ({ page }) => {
  const title = `Nueva tienda ${RUN}`;
  await logIn(page);
  await openNewLanding(page);
  await page.getByLabel("Idioma").selectOption("en");
  await page.getByLabel("Título").fill(title);
  await page.getByRole("button", { name: "Crear y abrir el editor visual" }).click();

  await expect(page).toHaveURL(/\/admin\/landings\/[^/]+\/visual$/);
  // An empty page, ready for blocks.
  await expect(page.frameLocator("iframe").locator("body")).toBeAttached({ timeout: 30_000 });

  // The slug comes from the title; the landing is a draft with no page yet.
  const [row] = await query<LandingRow>(`select ${columns} from "Landing" where title = $1`, [title]);
  expect(row).toMatchObject({ locale: "en", slug: `nueva-tienda-${RUN}`, status: "DRAFT", blocks: null, draftBlocks: null });
  // The editor starts with the page fields of the new landing.
  await expect(page.getByRole("textbox", { name: /^Slug/ })).toHaveValue(`nueva-tienda-${RUN}`);

  // It cannot go public from the list before it has a page.
  await page.goto("/admin/landings");
  await page.getByRole("button", { name: `Publicar ${title}` }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Esta landing todavía no tiene página. Ármala y publícala desde el editor visual." }),
  ).toBeVisible();
  const [after] = await query<LandingRow>(`select ${columns} from "Landing" where title = $1`, [title]);
  expect(after.status).toBe("DRAFT");
});

test("refuses a slug another landing of the same language already uses, keeping what was typed", async ({ page }) => {
  const title = `Repetida ${RUN}`;
  await logIn(page);
  await openNewLanding(page);
  // Spanish: the default. The seeded public landing is only read here.
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Slug").fill("e2e-builder");
  await page.getByRole("button", { name: "Crear y abrir el editor visual" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Slug: otra landing de este idioma ya lo usa." })).toBeVisible();
  await expect(page.getByLabel("Título")).toHaveValue(title);
  expect(await query(`select id from "Landing" where title = $1`, [title])).toHaveLength(0);
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
  const source = await sourceLanding("wp");
  await logIn(page);
  await page.goto("/admin/landings");
  await page.getByRole("link", { name: `Traducir ${source.title} al inglés` }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Nueva traducción" })).toBeVisible();
  // The language comes from the link.
  await expect(page.getByLabel("Idioma")).toHaveCount(0);
  await page.getByLabel("Título").fill(`WordPress sites ${RUN}`);
  await page.getByLabel("Slug").fill(`${RUN}-wordpress-sites`);
  await page.getByRole("button", { name: "Crear y abrir el editor visual" }).click();
  await expect(page).toHaveURL(/\/admin\/landings\/[^/]+\/visual$/);

  const [original] = await query<LandingRow>(`select ${columns} from "Landing" where id = $1`, [source.id]);
  const [copy] = await query<LandingRow>(`select ${columns} from "Landing" where "translationKey" = $1 and locale = 'en'`, [source.id]);
  expect(original.blocks, "the source landing has published blocks").not.toBeNull();
  expect(copy).toMatchObject({ slug: `${RUN}-wordpress-sites`, title: `WordPress sites ${RUN}`, status: "DRAFT", blocks: null });
  // The blocks are a draft of the translation; its page fields are its own.
  expect(copy.draftBlocks?.root.props).toEqual({});
  expect(copy.draftBlocks?.content.map((block) => block.type)).toEqual(original.blocks!.content.map((block) => block.type));
  // The editor opens on that copy.
  await expect(page.frameLocator("iframe").getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });

  // Every language now has its version: no more translate links for it.
  await page.goto("/admin/landings");
  await expect(page.getByRole("link", { name: `Traducir ${source.title} al inglés` })).toHaveCount(0);
  // Going back to the translate link shows the existing version instead of a second form.
  await page.goto(`/admin/landings/nueva?traducir=${source.id}&idioma=en`);
  await expect(page.getByRole("link", { name: "Editar la versión en inglés" })).toBeVisible();
});

test("explains a translate link it cannot honour instead of showing a plain new landing form", async ({ page }) => {
  const source = await sourceLanding("bad-link");
  await logIn(page);
  const cases: [string, string][] = [
    [`traducir=${source.id}`, "El enlace de traducción no indica a qué idioma traducir."],
    [`traducir=${source.id}&idioma=fr`, "El enlace de traducción no indica a qué idioma traducir."],
    [`traducir=${source.id}&idioma=es`, `«${source.title}» ya está en español: la traducción tiene que ser a otro idioma.`],
    ["traducir=no-such-landing&idioma=en", "La landing que quieres traducir no existe."],
    [`traducir=${"x".repeat(300)}&idioma=en`, "La landing que quieres traducir no existe."],
  ];
  for (const [search, message] of cases) {
    await page.goto(`/admin/landings/nueva?${search}`);
    await expect(page.getByRole("heading", { level: 1, name: "Nueva traducción" }), search).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: message }), search).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear y abrir el editor visual" }), search).toHaveCount(0);
  }
});

test("refuses a tampered translationOf and creates nothing", async ({ page }) => {
  const source = await sourceLanding("tampered");
  const title = `Manipulada ${RUN}`;
  await logIn(page);
  await page.goto(`/admin/landings/nueva?traducir=${source.id}&idioma=en`);
  await page.locator('input[name="translationOf"]').evaluate((input: HTMLInputElement) => {
    input.value = "../no such id";
  });
  await page.getByLabel("Título").fill(title);
  await page.getByRole("button", { name: "Crear y abrir el editor visual" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "La landing original ya no existe." })).toBeVisible();
  expect(await query(`select id from "Landing" where title = $1`, [title])).toHaveLength(0);
});
