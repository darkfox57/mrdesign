import { expect, test, type Page } from "@playwright/test";

// Fixtures come from scripts/seed-e2e-blog.ts (run by global-setup.ts).
test.use({ reducedMotion: "reduce" });

const fixtures = {
  index: { es: "/blog", en: "/en/blog" },
  post: { es: "/blog/e2e-post-publicado", en: "/en/blog/e2e-published-post" },
  postTitle: { es: "E2E Post publicado", en: "E2E Published post" },
  draft: { es: "/blog/e2e-post-borrador", en: "/en/blog/e2e-draft-post" },
  category: { es: "/blog/categoria/e2e-desarrollo", en: "/en/blog/category/e2e-development" },
  categoryName: { es: "E2E Desarrollo", en: "E2E Development" },
} as const;

const locales = ["es", "en"] as const;

async function expectAlternates(page: Page, canonical: string, languages: Partial<Record<"es" | "en", string>>) {
  const href = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(new URL(href!).pathname).toBe(canonical);
  for (const locale of locales) {
    const link = page.locator(`link[rel="alternate"][hreflang="${locale}"]`);
    const expected = languages[locale];
    if (expected) expect(new URL((await link.getAttribute("href"))!).pathname).toBe(expected);
    else await expect(link).toHaveCount(0);
  }
}

async function jsonLd(page: Page) {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? "{}") as Record<string, unknown>));
}

for (const locale of locales) {
  test(`${fixtures.index[locale]} renders with canonical and hreflang, without drafts`, async ({ page }) => {
    const response = await page.goto(fixtures.index[locale]);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toHaveCount(1);
    await expectAlternates(page, fixtures.index[locale], fixtures.index);
    await expect(page.getByText(locale === "es" ? "E2E Post borrador" : "E2E Draft post")).toHaveCount(0);
  });

  test(`${fixtures.post[locale]} renders the post with BlogPosting and BreadcrumbList data`, async ({ page }) => {
    const response = await page.goto(fixtures.post[locale]);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(fixtures.postTitle[locale]);
    await expect(page.getByRole("heading", { level: 2, name: "Qué cambia" })).toBeVisible();
    // The first article is the post; related posts below are articles too.
    const article = page.locator("article").first();
    await expect(article.locator("time").first()).toHaveAttribute("datetime", "2026-01-15T12:00:00.000Z");
    await expect(article.getByRole("link", { name: fixtures.categoryName[locale] })).toHaveAttribute(
      "href",
      fixtures.category[locale],
    );
    await expectAlternates(page, fixtures.post[locale], fixtures.post);

    const data = await jsonLd(page);
    const posting = data.find((item) => item["@type"] === "BlogPosting");
    expect(posting).toMatchObject({ headline: fixtures.postTitle[locale], inLanguage: locale, datePublished: "2026-01-15T12:00:00.000Z" });
    expect(new URL(posting!.url as string).pathname).toBe(fixtures.post[locale]);
    expect(data.map((item) => item["@type"])).toEqual(expect.arrayContaining(["ProfessionalService", "BlogPosting", "BreadcrumbList"]));
  });

  test(`${fixtures.draft[locale]} is a draft and returns 404`, async ({ page }) => {
    expect((await page.goto(fixtures.draft[locale]))?.status()).toBe(404);
  });

  test(`${fixtures.category[locale]} lists its posts with canonical and hreflang`, async ({ page }) => {
    const response = await page.goto(fixtures.category[locale]);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(fixtures.categoryName[locale]);
    await expect(page.getByRole("link", { name: fixtures.postTitle[locale], exact: true })).toHaveAttribute("href", fixtures.post[locale]);
    await expectAlternates(page, fixtures.category[locale], fixtures.category);
    const types = (await jsonLd(page)).map((item) => item["@type"]);
    expect(types).toContain("BreadcrumbList");
  });
}

test("the category filter leads from the blog to the category page", async ({ page }) => {
  await page.goto("/blog");
  await page.getByRole("navigation", { name: "Categorías" }).getByRole("link", { name: /E2E Desarrollo/ }).click();
  await expect(page).toHaveURL(/\/blog\/categoria\/e2e-desarrollo$/);
  await expect(page.getByRole("heading", { level: 1, name: "E2E Desarrollo" })).toBeVisible();
});

test("the site Blog link reaches the blog", async ({ page }) => {
  await page.goto("/");
  // The mobile menu renders its links only when opened; the footer link is always there.
  await expect(page.getByRole("link", { name: "Blog", exact: true }).first()).toHaveAttribute("href", "/blog");
});

test("a post sanitizes its HTML when it renders", async ({ page }) => {
  await page.goto("/blog/e2e-post-publicado");
  const content = page.locator(".post-content");
  await expect(content).toContainText("Texto con atributo inseguro");
  expect(await content.innerHTML()).not.toMatch(/onclick|<script|data-e2e-unsafe/);
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
});

test("unknown slugs, drafts from the other locale and unknown categories return 404", async ({ page }) => {
  expect((await page.goto("/blog/no-existe"))?.status()).toBe(404);
  expect((await page.goto("/en/blog/e2e-post-borrador"))?.status()).toBe(404);
  expect((await page.goto("/blog/categoria/no-existe"))?.status()).toBe(404);
  expect((await page.goto("/en/blog/category/no-existe"))?.status()).toBe(404);
});

test("a slug from the other locale redirects to this locale's version", async ({ page }) => {
  await page.goto("/en/blog/e2e-post-publicado");
  await expect(page).toHaveURL(/\/en\/blog\/e2e-published-post$/);
  await expect(page.getByRole("heading", { level: 1, name: "E2E Published post" })).toBeVisible();

  await page.goto("/blog/e2e-published-post");
  await expect(page).toHaveURL(/\/blog\/e2e-post-publicado$/);

  await page.goto("/en/blog/category/e2e-desarrollo");
  await expect(page).toHaveURL(/\/en\/blog\/category\/e2e-development$/);
  await page.goto("/blog/categoria/e2e-development");
  await expect(page).toHaveURL(/\/blog\/categoria\/e2e-desarrollo$/);
});

test("a post without a translation declares only its own language and sends the other locale to the blog", async ({ page }) => {
  expect((await page.goto("/blog/e2e-solo-espanol"))?.status()).toBe(200);
  await expectAlternates(page, "/blog/e2e-solo-espanol", { es: "/blog/e2e-solo-espanol" });

  await page.goto("/en/blog/e2e-solo-espanol");
  await expect(page).toHaveURL(/\/en\/blog$/);
});

test("the language switcher on a post opens its translation", async ({ page }) => {
  await page.goto("/blog/e2e-post-publicado");
  // On small screens the switcher lives in the menu.
  const menu = page.getByRole("button", { name: "Abrir menú" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: /English/ }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/en\/blog\/e2e-published-post$/);
});

test("invalid or out-of-range pages return 404", async ({ page }) => {
  expect((await page.goto("/blog?page=1e1"))?.status()).toBe(404);
  expect((await page.goto("/blog?page=0"))?.status()).toBe(404);
  expect((await page.goto("/en/blog?page=500"))?.status()).toBe(404);
  expect((await page.goto("/blog/categoria/e2e-desarrollo?page=2"))?.status()).toBe(404);
});

test("the sitemap lists published posts and categories in both languages, never drafts", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const locale of locales) {
    expect(sitemap).toContain(`${fixtures.post[locale]}</loc>`);
    expect(sitemap).toContain(`${fixtures.category[locale]}</loc>`);
    expect(sitemap).not.toContain(fixtures.draft[locale]);
  }
  // The blog index is one entry with the Spanish URL and both languages as alternates.
  expect(sitemap).toContain("/blog</loc>");
  expect(sitemap).toContain('/en/blog"');
  // The existing pages are still listed.
  expect(sitemap).toContain("/servicios/prestashop");
});

test("blog pages have no horizontal scroll at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  const paths = [
    ...Object.values(fixtures.index),
    ...Object.values(fixtures.post),
    ...Object.values(fixtures.category),
    "/blog/e2e-solo-espanol",
  ];
  for (const path of paths) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});
