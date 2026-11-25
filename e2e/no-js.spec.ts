import { expect, test } from "@playwright/test";
import en from "../messages/en.json";
import es from "../messages/es.json";
import { founderGuide as guide } from "../src/content/founder-guide";
import { services } from "../src/content/services";

// SEO and AI readability (odd/tasks/site-build-experience.md, T7, S6): every key page is complete in the
// server HTML, with its answer-first text, its structured data and, where it has one, its FAQ. Crawlers
// and AI assistants that do not run JavaScript read the same page a visitor does.
test.use({ javaScriptEnabled: false });

const shopify = services.find((service) => service.id === "shopify")!;
const websites = services.find((service) => service.id === "websites")!;
const stripTags = (text: string) => text.replace(/<[^>]+>/g, "");

type Faq = { q: { es: string; en: string }; a: { es: string; en: string } };
type PageCase = { path: string; locale: "es" | "en"; h1: string; answer: string; faqs?: Faq[] };

const pages: PageCase[] = [
  { path: "/", locale: "es", h1: stripTags(es.Home.hero.title), answer: es.Home.hero.sub },
  { path: "/servicios", locale: "es", h1: es.Services.title, answer: es.Services.lead },
  {
    path: `/servicios/${shopify.slug.es}`,
    locale: "es",
    h1: shopify.content.h1.es,
    answer: shopify.content.summary.es,
    faqs: shopify.content.faqs,
  },
  {
    path: `/en/services/${websites.slug.en}`,
    locale: "en",
    h1: websites.content.h1.en,
    answer: websites.content.summary.en,
    faqs: websites.content.faqs,
  },
  { path: "/empezar-mi-negocio-en-linea", locale: "es", h1: guide.h1.es, answer: guide.lead.es, faqs: guide.faqs },
  { path: "/en/start-my-business-online", locale: "en", h1: guide.h1.en, answer: guide.lead.en, faqs: guide.faqs },
  { path: "/portafolio", locale: "es", h1: es.Portfolio.title, answer: es.Portfolio.lead },
  { path: "/contacto", locale: "es", h1: es.Contact.title, answer: es.Contact.lead },
];

for (const { path, locale, h1, answer, faqs } of pages) {
  test(`${path} is complete without JavaScript`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    const main = page.locator("main");
    await expect(main.getByText(answer, { exact: true })).toBeVisible();

    // Structured data: every block parses, and the business is described once per page.
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? "") as { "@type"?: string }));
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.filter((block) => block["@type"] === "ProfessionalService")).toHaveLength(1);

    // No text in the main content waits for a script to make it visible.
    const hidden = await main.evaluate((root) =>
      [...root.querySelectorAll<HTMLElement>("[style]")]
        .filter((element) => /opacity:\s*0(?![.\d])|visibility:\s*hidden/.test(element.getAttribute("style") ?? ""))
        .filter((element) => (element.textContent ?? "").trim().length > 0)
        .map((element) => element.outerHTML.slice(0, 120)),
    );
    expect(hidden).toEqual([]);

    if (faqs) {
      const faqList = page.locator("[data-x=FaqList]");
      for (const item of faqs) {
        await expect(faqList).toContainText(item.q[locale]);
        await expect(faqList).toContainText(item.a[locale]);
      }
    }
  });
}

test("/llms.txt maps the lines of work and the guide in both languages", async ({ request, baseURL }) => {
  // Served as is: the proxy never localizes or redirects it.
  const response = await request.get("/llms.txt", { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^text\/plain/);
  const text = await response.text();

  expect(text.startsWith("# Mr. Design\n")).toBe(true);
  expect(text).toContain(`> ${es.Metadata.description}`);
  // One summary blockquote (Spanish); the English summary is a plain paragraph and every section is H2.
  expect(text).toContain(`\n${en.Metadata.description}\n`);
  expect(text).not.toMatch(/^###/m);
  for (const service of services) {
    expect(text).toContain(`(${baseURL}/servicios/${service.slug.es}):`);
    expect(text).toContain(`(${baseURL}/en/services/${service.slug.en}):`);
  }
  expect(text).toContain(`(${baseURL}/empezar-mi-negocio-en-linea):`);
  expect(text).toContain(`(${baseURL}/en/start-my-business-online):`);
});
