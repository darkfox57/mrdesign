import { expect, test, type Page } from "@playwright/test";

// Landings made with the visual builder, seeded by scripts/seed-e2e-landings.ts: a Spanish landing
// with every block type and its English translation, a Spanish-only one and a draft.
test.use({ reducedMotion: "reduce" });

const absolute = /^https?:\/\/[^/]+/;
const alternate = async (page: Page, hreflang: string) =>
  (await page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`).getAttribute("href"))?.replace(absolute, "");

async function jsonLd(page: Page, type: string) {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((block) => JSON.parse(block) as Record<string, unknown>).find((data) => data["@type"] === type);
}

async function faqQuestions(page: Page) {
  const faq = await jsonLd(page, "FAQPage");
  return (faq?.mainEntity as { name: string }[] | undefined)?.map((question) => question.name);
}

test("renders a builder landing from its blocks on the server", async ({ page }) => {
  const response = await page.goto("/soluciones/e2e-builder");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "Tu tienda Shopify, lista para vender" })).toBeVisible();
  // Every block of the fixture: hero side, cards, columns, FAQ and the closing call to action.
  for (const name of ["Entrega en cuatro semanas", "Lo que incluye", "Migración desde otra plataforma", "Preguntas frecuentes", "¿Empezamos tu tienda?"]) {
    await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
  }
  await expect(page.getByRole("heading", { level: 3, name: "Pagos y envíos" })).toBeVisible();
  const main = page.locator("main");
  await expect(main.getByRole("link", { name: "Cuéntame tu proyecto" }).first()).toHaveAttribute("href", "/contacto");
  await expect(main.getByRole("link", { name: "Ver servicios" })).toHaveAttribute("href", "/servicios");

  // The FAQ opens in place, without JavaScript.
  const question = page.getByText("¿Puedo administrarla yo?");
  await question.click();
  await expect(page.getByText("Sí. Te enseño a cargar productos y gestionar pedidos.")).toBeVisible();

  expect(await faqQuestions(page)).toEqual(["¿Cuánto tarda una tienda Shopify?", "¿Puedo administrarla yo?", "¿Incluye el plan de Shopify?"]);
  expect((await jsonLd(page, "BreadcrumbList"))?.itemListElement).toHaveLength(2);
  await expect(page).toHaveTitle(/E2E Landing con bloques/);
  // No SEO description: the hero's lead stands in.
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /^Diseño, catálogo, pagos y envíos/);

  // No horizontal scroll at any width.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the English version localizes its internal links", async ({ page }) => {
  expect((await page.goto("/en/solutions/e2e-builder-en"))?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your Shopify store, ready to sell");
  expect(await page.locator('main a[href="/en/contact"]').count()).toBeGreaterThan(0);
  await expect(page.locator('main a[href="/contacto"]')).toHaveCount(0);
  expect(await faqQuestions(page)).toHaveLength(3);
});

test("both language versions point to each other, and a single version lists only itself", async ({ page }) => {
  await page.goto("/soluciones/e2e-builder");
  expect(await alternate(page, "es")).toBe("/soluciones/e2e-builder");
  expect(await alternate(page, "en")).toBe("/en/solutions/e2e-builder-en");
  expect(await alternate(page, "x-default")).toBe("/soluciones/e2e-builder");
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(/\/soluciones\/e2e-builder$/);

  await page.goto("/soluciones/e2e-solo-espanol");
  expect(await alternate(page, "es")).toBe("/soluciones/e2e-solo-espanol");
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
});

test("a slug from the other language redirects to its translation, or home without one", async ({ request }) => {
  const toTranslation = await request.get("/en/solutions/e2e-builder", { maxRedirects: 0 });
  expect(toTranslation.status()).toBe(307);
  expect(toTranslation.headers().location).toMatch(/\/en\/solutions\/e2e-builder-en$/);

  const back = await request.get("/soluciones/e2e-builder-en", { maxRedirects: 0 });
  expect(back.status()).toBe(307);
  expect(back.headers().location).toMatch(/\/soluciones\/e2e-builder$/);

  const home = await request.get("/en/solutions/e2e-solo-espanol", { maxRedirects: 0 });
  expect(home.status()).toBe(307);
  expect(home.headers().location).toMatch(/\/en$/);
});

test("drafts and unknown slugs are not found", async ({ request }) => {
  expect((await request.get("/soluciones/e2e-borrador", { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get("/soluciones/e2e-sin-pagina", { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get("/soluciones/no-existe", { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get("/en/solutions/no-such-page", { maxRedirects: 0 })).status()).toBe(404);
});

test("the sitemap lists the published landings and only their existing versions", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/soluciones/e2e-builder</loc>");
  expect(sitemap).toContain("/en/solutions/e2e-builder-en</loc>");
  expect(sitemap).toContain("/soluciones/e2e-solo-espanol</loc>");
  expect(sitemap).not.toContain("e2e-borrador");
  expect(sitemap).not.toContain("/en/solutions/e2e-solo-espanol");
  // Existing entries stay.
  expect(sitemap).toContain("/servicios</loc>");
});
