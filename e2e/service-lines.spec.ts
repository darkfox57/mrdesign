import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { services, type Service } from "../src/content/services";
import { E2E_DATABASE_URL } from "./test-env";

// One page per line of work (odd/tasks/site-build-experience.md, T5, S1, S3, S6): eight lines, each
// in es and en, with its own build stage, FAQ and structured data, readable without JavaScript.
test.use({ reducedMotion: "reduce" });

type Locale = "es" | "en";
const locales: Locale[] = ["es", "en"];
const pathOf = (service: Service, locale: Locale) =>
  locale === "es" ? `/servicios/${service.slug.es}` : `/en/services/${service.slug.en}`;

async function sql<T>(query: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows as T[];
  } finally {
    await client.end();
  }
}

async function jsonLd(page: Page) {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? "{}") as Record<string, unknown>));
}

for (const service of services) {
  for (const locale of locales) {
    const path = pathOf(service, locale);

    test(`${path} renders its h1, metadata, structured data and stage`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(service.content.h1[locale]);
      await expect(page).toHaveTitle(`${service.content.metaTitle[locale]} | Mr. Design`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", service.content.metaDescription[locale]);
      // The keywords are an editorial reference: never a meta tag.
      await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);

      expect(new URL((await page.locator('link[rel="canonical"]').getAttribute("href"))!).pathname).toBe(path);
      for (const other of locales) {
        const href = await page.locator(`link[rel="alternate"][hreflang="${other}"]`).getAttribute("href");
        expect(new URL(href!).pathname).toBe(pathOf(service, other));
      }

      const data = await jsonLd(page);
      const byType = (type: string) => data.find((item) => item["@type"] === type);
      expect(byType("Service")).toMatchObject({ name: service.name[locale], description: service.content.summary[locale] });
      const faq = byType("FAQPage") as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
      expect(faq.mainEntity.map((item) => item.name)).toEqual(service.content.faqs.map((item) => item.q[locale]));
      expect(faq.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(service.content.faqs.map((item) => item.a[locale]));
      const breadcrumb = byType("BreadcrumbList") as { itemListElement: { name: string }[] };
      expect(breadcrumb.itemListElement.map((item) => item.name)).toEqual([locale === "es" ? "Servicios" : "Services", service.name[locale]]);

      // The line's own stage: six steps on the rail and its log lines as text.
      const stage = page.locator("[data-x=LineStage]");
      await expect(stage.getByRole("group").getByRole("button")).toHaveCount(6);
      await expect(stage.getByRole("log")).toContainText(service.content.buildSteps[5].logLine[locale]);

      // The comparison is a real table with its caption and headers.
      const table = page.locator("[data-x=PlatformComparison] table");
      await expect(table.locator("caption")).toHaveCount(1);
      await expect(table.locator('thead th[scope="col"]')).toHaveCount(service.content.comparison.columns[locale].length + 1);
      await expect(table.locator('tbody th[scope="row"]')).toHaveCount(service.content.comparison.rows.length);

      // The keyword list is never printed on the page.
      await expect(page.locator("main")).not.toContainText(service.content.keywords[locale][0]);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const service of services) {
    test(`the ${service.id} page carries its FAQ answers and deliverables in the HTML`, async ({ page }) => {
      for (const locale of locales) {
        await page.goto(pathOf(service, locale));
        const faq = page.locator("[data-x=FaqList]");
        for (const item of service.content.faqs) {
          await expect(faq).toContainText(item.q[locale]);
          await expect(faq).toContainText(item.a[locale]);
        }
        const deliverables = page.locator("[data-x=Deliverables]");
        for (const item of service.content.deliverables) {
          await expect(deliverables).toContainText(item.code);
          await expect(deliverables).toContainText(item.title[locale]);
          await expect(deliverables).toContainText(item.description[locale]);
        }
        // The stage shows the finished build, and its log tells the whole story as text.
        await expect(page.locator("[data-x=LineStage]")).toHaveAttribute("data-step", "5");
        for (const step of service.content.buildSteps) await expect(page.locator("[data-x=LineBuild]")).toContainText(step.note[locale]);
      }
    });
  }
});

test("a line's stage plays its steps from the rail", async ({ page }) => {
  await page.goto("/servicios/shopify");
  const stage = page.locator("[data-x=LineStage]");
  await stage.getByRole("button", { name: /02\s*Secciones/ }).click();
  await expect(stage).toHaveAttribute("data-step", "1");
  await expect(stage).toHaveAttribute("data-on", "0 1");
});

test("each related line links to its page, with its reason", async ({ page }) => {
  const service = services.find((item) => item.id === "websites")!;
  await page.goto(pathOf(service, "es"));
  const related = page.locator("[data-x=RelatedLines] a");
  await expect(related).toHaveCount(service.content.related.length);
  for (const [index, item] of service.content.related.entries()) {
    const target = services.find((other) => other.id === item.id)!;
    await expect(related.nth(index)).toHaveAttribute("href", pathOf(target, "es"));
    await expect(related.nth(index)).toContainText(item.reason.es);
  }
});

test("the hero sends the visitor to the contact page", async ({ page }) => {
  await page.goto("/en/services/landing-pages");
  await page.locator("[data-x=ServiceHero]").getByRole("link", { name: "Tell me about your project" }).click();
  await expect(page).toHaveURL(/\/en\/contact$/);
});

test("a slug from the other language redirects to this language's slug", async ({ page }) => {
  await page.goto("/servicios/platform-evolution");
  await expect(page).toHaveURL(/\/servicios\/evolucion-de-plataformas$/);
  await page.goto("/en/services/evolucion-de-plataformas");
  await expect(page).toHaveURL(/\/en\/services\/platform-evolution$/);
});

test("an unknown line is not found", async ({ page }) => {
  expect((await page.goto("/servicios/embudos"))?.status()).toBe(404);
  expect((await page.goto("/en/services/funnels"))?.status()).toBe(404);
});

test("the services index links the eight lines in order", async ({ page }) => {
  for (const locale of locales) {
    await page.goto(locale === "es" ? "/servicios" : "/en/services");
    const prefix = locale === "es" ? "/servicios/" : "/en/services/";
    const hrefs = await page.locator(`main a[href^="${prefix}"]`).evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    expect(hrefs).toEqual(services.map((service) => pathOf(service, locale)));
  }
});

// Like every code-owned page, each language version of a line is its own sitemap entry, and every
// entry lists both languages as alternates.
test("the sitemap lists the eight lines in both languages", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const service of services) {
    for (const locale of locales) expect(sitemap).toContain(`<loc>http://localhost:3100${pathOf(service, locale)}</loc>`);
    for (const locale of locales) expect(sitemap).toContain(`hreflang="${locale}" href="http://localhost:3100${pathOf(service, locale)}"`);
  }
});

test.describe("published cases", () => {
  const run = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  // Not "e2e-case-" nor "e2e-pubcase-": other specs delete those prefixes.
  const slug = `e2e-linecase-${run}`;
  const title = `Una plataforma que vuelve a moverse ${run}`;

  test.beforeAll(async () => {
    await sql(
      `insert into "Case" (id, locale, "translationKey", slug, title, client, year, lines, summary, challenge, solution, result,
        metrics, stack, gallery, "clientAuthorized", status, "publishedAt", "updatedAt")
       values ($1, 'es', $1, $1, $2, 'Cliente E2E', 2025, '{evolution}', 'Resumen del caso E2E.', 'Reto.', 'Solución.', 'Resultado.',
        '[]', '{Next.js}', '[]', true, 'PUBLISHED', $3, now())`,
      [slug, title, new Date(Date.now() - 60_000)],
    );
  });

  test.afterAll(async () => {
    await sql('delete from "Case" where slug = $1', [slug]);
  });

  test("a line page shows its own published cases, and only those", async ({ page }) => {
    await page.goto("/servicios/evolucion-de-plataformas");
    const cases = page.locator("[data-x=LineCases]");
    await expect(cases.getByRole("heading", { level: 3, name: title })).toBeVisible();
    await expect(cases.getByRole("link", { name: title })).toHaveAttribute("href", `/portafolio/${slug}`);

    await page.goto("/servicios/sitios-web");
    await expect(page.getByText(title)).toHaveCount(0);
  });

  test("a line without published cases has no cases section", async ({ page }) => {
    const [{ count }] = await sql<{ count: string }>(
      `select count(*) from "Case" where status = 'PUBLISHED' and "clientAuthorized" and locale = 'es' and 'funnels' = any(lines)`,
    );
    test.skip(Number(count) > 0, "the local database has published funnels cases");
    await page.goto("/servicios/landing-pages");
    await expect(page.locator("[data-x=LineCases]")).toHaveCount(0);
  });
});
