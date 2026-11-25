import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_DATABASE_URL } from "./test-env";

// Public case pages, from cases written straight into the local database: a published pair the
// client authorized (es and en) and a draft. Each run uses its own slugs and deletes them afterwards.
test.use({ reducedMotion: "reduce" });

async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows;
  } finally {
    await client.end();
  }
}

// Not "e2e-case-": admin-cases.spec.ts deletes that prefix.
const SLUG_PREFIX = "e2e-pubcase-";

const fixture = {
  run: "",
  slug: { es: "", en: "" },
  draft: "",
  title: { es: "", en: "" },
  path(locale: "es" | "en") {
    return locale === "es" ? `/portafolio/${this.slug.es}` : `/en/portfolio/${this.slug.en}`;
  },
};

test.beforeAll(async () => {
  const run = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  fixture.run = run;
  fixture.slug = { es: `${SLUG_PREFIX}${run}-tienda`, en: `${SLUG_PREFIX}${run}-store` };
  fixture.draft = `${SLUG_PREFIX}${run}-borrador`;
  fixture.title = { es: `Una tienda que se arma sola ${run}`, en: `A store that builds itself ${run}` };
  const key = `${SLUG_PREFIX}${run}`;
  const insert = `insert into "Case" (id, locale, "translationKey", slug, title, client, year, lines, summary, challenge, solution, result,
      metrics, stack, "websiteUrl", "coverImageUrl", "coverImageAlt", gallery, "clientAuthorized", status, "publishedAt", "updatedAt")
    values ($1, $2, $3, $4, $5, 'Cliente E2E', 2025, '{shopify,plugins}', $6, $7, $8, $9, $10, '{Shopify,Liquid}', 'https://example.com',
      '/portfolio/lecoq-sportif.jpg', $11, $12, $13, $14, $15, now())`;
  const metrics = (source: string) => JSON.stringify([{ label: "Pedidos", value: "+30 %", source }]);
  const gallery = (alt: string) => JSON.stringify([{ url: "/portfolio/loboexpress.jpg", alt }]);
  await sql(insert, [`${key}-es`, "es", key, fixture.slug.es, fixture.title.es, "Resumen del caso E2E.", "El reto del caso E2E.", "La solución del caso E2E.", "El resultado del caso E2E.", metrics("Informe de Shopify E2E"), "Tenis blancos", gallery("Ficha de producto"), true, "PUBLISHED", new Date(Date.now() - 60_000)]);
  await sql(insert, [`${key}-en`, "en", key, fixture.slug.en, fixture.title.en, "E2E case summary.", "The E2E challenge.", "The E2E solution.", "The E2E result.", metrics("E2E Shopify report"), "White sneakers", gallery("Product page"), true, "PUBLISHED", new Date(Date.now() - 60_000)]);
  // Complete and authorized, but still a draft.
  await sql(insert, [`${key}-draft`, "es", `${key}-draft`, fixture.draft, `Borrador ${run}`, "Resumen.", "Reto.", "Solución.", "Resultado.", "[]", "Portada", "[]", true, "DRAFT", null]);
});

test.afterAll(async () => {
  await sql('delete from "Case" where slug like $1', [`${SLUG_PREFIX}${fixture.run}%`]);
});

async function jsonLd(page: Page) {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? "{}") as Record<string, unknown>));
}

const pathOf = (href: string | null) => new URL(href!).pathname;

for (const locale of ["es", "en"] as const) {
  test(`the ${locale} case page renders the case with CreativeWork data and hreflang to both versions`, async ({ page }) => {
    const response = await page.goto(fixture.path(locale));
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(fixture.title[locale]);

    expect(pathOf(await page.locator('link[rel="canonical"]').getAttribute("href"))).toBe(fixture.path(locale));
    for (const other of ["es", "en"] as const) {
      const href = await page.locator(`link[rel="alternate"][hreflang="${other}"]`).getAttribute("href");
      expect(pathOf(href)).toBe(fixture.path(other));
    }

    const data = await jsonLd(page);
    const work = data.find((item) => item["@type"] === "CreativeWork");
    expect(work).toMatchObject({ name: fixture.title[locale], inLanguage: locale, dateCreated: "2025" });
    expect(pathOf(work!.url as string)).toBe(fixture.path(locale));
    const breadcrumb = data.find((item) => item["@type"] === "BreadcrumbList") as { itemListElement: unknown[] } | undefined;
    expect(breadcrumb?.itemListElement).toHaveLength(3);

    const website = page.getByRole("link", { name: locale === "es" ? /Ver el sitio en vivo/ : /See the live site/ });
    await expect(website).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.getByText(locale === "es" ? "Informe de Shopify E2E" : "E2E Shopify report")).toBeVisible();
  });

  test(`the ${locale} portfolio index lists the published case`, async ({ page }) => {
    await page.goto(locale === "es" ? "/portafolio" : "/en/portfolio");
    await expect(page.getByRole("link", { name: fixture.title[locale], exact: true })).toHaveAttribute("href", fixture.path(locale));
  });
}

test("a draft case answers 404", async ({ page }) => {
  expect((await page.goto(`/portafolio/${fixture.draft}`))?.status()).toBe(404);
});

test("a case slug opened in the other language leads to its translation", async ({ page }) => {
  await page.goto(`/en/portfolio/${fixture.slug.es}`);
  await expect(page).toHaveURL(new RegExp(`/en/portfolio/${fixture.slug.en}$`));
});

test("the sitemap lists both language versions of the case", async ({ request, baseURL }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain(`<loc>${baseURL}${fixture.path("es")}</loc>`);
  expect(xml).toContain(`<loc>${baseURL}${fixture.path("en")}</loc>`);
  expect(xml).not.toContain(fixture.draft);
});

test("the case page content is there without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(fixture.path("es"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(fixture.title.es);
    for (const text of ["Resumen del caso E2E.", "El reto del caso E2E.", "La solución del caso E2E.", "El resultado del caso E2E.", "Informe de Shopify E2E", "Liquid"]) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
    for (const name of ["El reto", "La solución", "El resultado", "Cifras del proyecto"]) {
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    }
  } finally {
    await context.close();
  }
});
