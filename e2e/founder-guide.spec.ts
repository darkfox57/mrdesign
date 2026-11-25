import { expect, test, type Page } from "@playwright/test";
import { founderGuide as guide } from "../src/content/founder-guide";
import { serviceEntries, type ServiceId } from "../src/content/service-catalog";

// The founder guide (odd/tasks/site-build-experience.md, T6, S6, S8): the approved copy in es and en,
// its own build stage, an index of its parts, the FAQ and structured data, readable without JavaScript.
test.use({ reducedMotion: "reduce" });

type Locale = "es" | "en";
const locales: Locale[] = ["es", "en"];
const paths: Record<Locale, string> = { es: "/empezar-mi-negocio-en-linea", en: "/en/start-my-business-online" };
const linePath = (line: ServiceId, locale: Locale) => {
  const slug = serviceEntries.find((entry) => entry.id === line)!.slug[locale];
  return locale === "es" ? `/servicios/${slug}` : `/en/services/${slug}`;
};
const itemLinks = guide.sections.flatMap((section) => section.items.flatMap((item) => (item.link ? [item.link] : [])));

async function jsonLd(page: Page) {
  return page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent ?? "{}") as Record<string, unknown>));
}

for (const locale of locales) {
  const path = paths[locale];

  test(`${path} renders its h1, metadata, structured data, stage and index`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(guide.h1[locale]);
    await expect(page).toHaveTitle(`${guide.metaTitle[locale]} | Mr. Design`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", guide.metaDescription[locale]);
    // The keywords are an editorial reference: never a meta tag, never on the page.
    await expect(page.locator('meta[name="keywords"]')).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(guide.keywords[locale][0]);

    expect(new URL((await page.locator('link[rel="canonical"]').getAttribute("href"))!).pathname).toBe(path);
    for (const other of locales) {
      const href = await page.locator(`link[rel="alternate"][hreflang="${other}"]`).getAttribute("href");
      expect(new URL(href!).pathname).toBe(paths[other]);
    }

    const data = await jsonLd(page);
    const byType = (type: string) => data.find((item) => item["@type"] === type);
    const article = byType("Article") as { url: string; author: { "@id": string }; publisher: { "@id": string } };
    expect(article).toMatchObject({ headline: guide.h1[locale], description: guide.metaDescription[locale], inLanguage: locale });
    expect(new URL(article.url).pathname).toBe(path);
    const organization = byType("ProfessionalService") as { "@id": string };
    expect(article.author["@id"]).toBe(organization["@id"]);
    expect(article.publisher["@id"]).toBe(organization["@id"]);
    const faq = byType("FAQPage") as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(faq.mainEntity.map((item) => item.name)).toEqual(guide.faqs.map((item) => item.q[locale]));
    expect(faq.mainEntity.map((item) => item.acceptedAnswer.text)).toEqual(guide.faqs.map((item) => item.a[locale]));
    const breadcrumb = byType("BreadcrumbList") as { itemListElement: { name: string; item: string }[] };
    expect(breadcrumb.itemListElement.map((item) => item.name)).toEqual(
      locale === "es" ? ["Inicio", "Empezar tu negocio en línea"] : ["Home", "Start your business online"],
    );
    expect(new URL(breadcrumb.itemListElement[1].item).pathname).toBe(path);

    // The guide's own stage: six steps on the rail and its log lines as text.
    const stage = page.locator("[data-x=GuideStage]");
    await expect(stage.getByRole("group").getByRole("button")).toHaveCount(6);
    await expect(stage.getByRole("log")).toContainText(guide.buildSteps[5].logLine[locale]);

    // The index links to every part, and every part is an h2 at its anchor.
    const index = page.locator("[data-x=GuideIndex] nav a");
    await expect(index).toHaveCount(guide.sections.length);
    for (const [position, section] of guide.sections.entries()) {
      await expect(index.nth(position)).toHaveAttribute("href", `#${section.id}`);
      await expect(page.locator(`section#${section.id} h2`)).toHaveText(section.title[locale]);
    }

    // The closing call to action leads to the contact page.
    await expect(page.getByRole("link", { name: guide.cta.button[locale] }).last()).toHaveAttribute(
      "href",
      locale === "es" ? "/contacto" : "/en/contact",
    );

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test(`${path} links its items to the line pages`, async ({ page }) => {
    await page.goto(path);
    const links = page.locator("[data-x=GuideSection] [data-x=GuideItem] a");
    await expect(links).toHaveCount(itemLinks.length);
    for (const [position, link] of itemLinks.entries()) {
      await expect(links.nth(position)).toContainText(link.label[locale]);
      await expect(links.nth(position)).toHaveAttribute("href", linePath(link.line, locale));
    }
    // A link reaches its page.
    await links.first().click();
    await expect(page).toHaveURL(new RegExp(`${linePath(itemLinks[0].line, locale)}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of locales) {
    test(`the ${locale} guide carries its lead, parts and FAQ answers in the HTML`, async ({ page }) => {
      await page.goto(paths[locale]);
      await expect(page.locator("[data-x=AnswerSummary]")).toHaveText(guide.lead[locale]);
      for (const section of guide.sections) {
        const part = page.locator(`section#${section.id}`);
        await expect(part).toContainText(section.intro[locale]);
        for (const item of section.items) {
          await expect(part).toContainText(item.title[locale]);
          await expect(part).toContainText(item.body[locale]);
        }
      }
      const faq = page.locator("[data-x=FaqList]");
      for (const item of guide.faqs) {
        await expect(faq).toContainText(item.q[locale]);
        await expect(faq).toContainText(item.a[locale]);
      }
      // The stage shows the finished build, and the steps tell the whole story as text.
      await expect(page.locator("[data-x=GuideStage]")).toHaveAttribute("data-step", "5");
      for (const step of guide.buildSteps) await expect(page.locator("[data-x=GuideBuild]")).toContainText(step.note[locale]);
    });
  }
});

test("an index link jumps to its part", async ({ page }) => {
  await page.goto(paths.es);
  const section = guide.sections[2];
  await page.locator("[data-x=GuideIndex] nav").getByRole("link", { name: section.title.es }).click();
  await expect(page).toHaveURL(new RegExp(`#${section.id}$`));
  await expect(page.locator(`section#${section.id} h2`)).toBeInViewport();
});

test("the guide's stage plays its steps from the rail", async ({ page }) => {
  await page.goto(paths.es);
  const stage = page.locator("[data-x=GuideStage]");
  await stage.getByRole("button", { name: /02\s*Validación/ }).click();
  await expect(stage).toHaveAttribute("data-step", "1");
  await expect(stage).toHaveAttribute("data-on", "0 1");
});
