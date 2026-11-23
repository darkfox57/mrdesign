import { expect, test } from "@playwright/test";

const pages = [
  { es: "/", en: "/en" },
  { es: "/servicios", en: "/en/services" },
  { es: "/servicios/shopify", en: "/en/services/shopify" },
  { es: "/servicios/sitios-web", en: "/en/services/websites" },
  { es: "/portafolio", en: "/en/portfolio" },
  { es: "/contacto", en: "/en/contact" },
  { es: "/politica-de-privacidad", en: "/en/privacy-policy" },
  { es: "/terminos-y-condiciones", en: "/en/terms-and-conditions" },
];

for (const paths of pages) {
  for (const locale of ["es", "en"] as const) {
    test(`${paths[locale]} renders with canonical and hreflang`, async ({ page }) => {
      const response = await page.goto(paths[locale]);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical!).pathname).toBe(paths[locale]);
      for (const alternate of ["es", "en"] as const) {
        const href = await page.locator(`link[rel="alternate"][hreflang="${alternate}"]`).getAttribute("href");
        expect(new URL(href!).pathname).toBe(paths[alternate]);
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

test("a service slug from the other language redirects to this language's slug", async ({ page }) => {
  await page.goto("/servicios/websites");
  await expect(page).toHaveURL(/\/servicios\/sitios-web$/);
  await page.goto("/en/services/aplicaciones");
  await expect(page).toHaveURL(/\/en\/services\/apps$/);
});

test("an unknown service is not found", async ({ page }) => {
  const response = await page.goto("/servicios/does-not-exist");
  expect(response?.status()).toBe(404);
});

test("the platform picker leads to the service page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "¿En qué está tu proyecto?" }).getByRole("link", { name: "PrestaShop" }).click();
  await expect(page).toHaveURL(/\/servicios\/prestashop$/);
  await expect(page.getByRole("heading", { level: 1, name: "Tiendas PrestaShop" })).toBeVisible();
});

test("the language switcher keeps the page", async ({ page }) => {
  await page.goto("/servicios/sitios-web");
  // On small screens the switcher lives in the menu.
  const menu = page.getByRole("button", { name: "Abrir menú" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: /English/ }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/en\/services\/websites$/);
});

test("service pages publish Service and BreadcrumbList structured data", async ({ page }) => {
  await page.goto("/en/services/wordpress");
  const types = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? "{}")["@type"]));
  expect(types).toEqual(expect.arrayContaining(["ProfessionalService", "Service", "BreadcrumbList"]));
});

test("sitemap lists every page with both languages, robots points to it", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/servicios/prestashop");
  expect(sitemap).toContain("/en/services/prestashop");
  expect(sitemap).toContain("/en/privacy-policy");

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin");
  expect(robots).toMatch(/Sitemap: .*\/sitemap\.xml/);
});
