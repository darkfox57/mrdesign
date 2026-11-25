import { describe, expect, it } from "vitest";
import { routing, type Locale } from "@/i18n/routing";
import { serviceIds } from "./service-catalog";
import { founderGuide } from "./founder-guide";

// The approved copy of the founder guide (odd/tasks/site-build-experience.md, T6, S5, S6, S8; L16).

// Every string in a value, however deeply nested.
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(strings);
  return [];
}

// Only the strings of one locale: every { es, en } pair contributes its `locale` side. Plain strings
// outside a pair (section ids, line ids, visual hints for the stage) belong to no locale.
function localeStrings(value: unknown, locale: Locale): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => localeStrings(item, locale));
  if (typeof value === "object" && value !== null) {
    if (routing.locales.every((key) => key in value)) return strings((value as Record<Locale, unknown>)[locale]);
    return Object.values(value).flatMap((item) => localeStrings(item, locale));
  }
  return [];
}

const guide = founderGuide;

describe("the founder guide's copy", () => {
  it("lives at the localized pathnames of its slug", () => {
    expect(routing.pathnames["/empezar-mi-negocio-en-linea"]).toEqual({ es: `/${guide.slug.es}`, en: `/${guide.slug.en}` });
  });

  it("has every text in es and en, none of them empty", () => {
    // Keywords are each language's own searches, not translations of each other.
    const { keywords, ...translated } = guide;
    for (const locale of routing.locales) expect(keywords[locale].length).toBeGreaterThan(0);
    expect(localeStrings(translated, "es")).toHaveLength(localeStrings(translated, "en").length);
    for (const text of strings(guide)) expect(text.trim()).not.toBe("");
  });

  it("has six build steps, each with a label, a note, a log line and a visual hint", () => {
    expect(guide.buildSteps).toHaveLength(6);
    for (const locale of routing.locales) {
      const labels = guide.buildSteps.map((step) => step.label[locale]);
      // The stage's rail is keyed by label.
      expect(new Set(labels).size).toBe(labels.length);
      for (const step of guide.buildSteps) {
        expect(step.note[locale].trim()).not.toBe("");
        expect(step.logLine[locale].trim()).not.toBe("");
      }
    }
    for (const step of guide.buildSteps) expect(step.visualHint.trim()).not.toBe("");
  });

  it("gives every section an anchor id, a title, an intro and its items", () => {
    expect(guide.sections.length).toBeGreaterThan(0);
    const ids = guide.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const section of guide.sections) {
      expect(section.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(section.items.length).toBeGreaterThan(0);
      for (const locale of routing.locales) {
        expect(section.title[locale].trim()).not.toBe("");
        expect(section.intro[locale].trim()).not.toBe("");
        for (const item of section.items) {
          expect(item.title[locale].trim()).not.toBe("");
          expect(item.body[locale].trim()).not.toBe("");
        }
      }
    }
  });

  it("links items only to lines of work that exist", () => {
    const links = guide.sections.flatMap((section) => section.items.flatMap((item) => (item.link ? [item.link] : [])));
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(serviceIds).toContain(link.line);
      for (const locale of routing.locales) expect(link.label[locale].trim()).not.toBe("");
    }
  });

  it("answers its frequent questions and closes with a call to action", () => {
    expect(guide.faqs.length).toBeGreaterThan(0);
    for (const locale of routing.locales) {
      for (const faq of guide.faqs) {
        expect(faq.q[locale].trim()).not.toBe("");
        expect(faq.a[locale].trim()).not.toBe("");
      }
      expect(guide.cta.title[locale].trim()).not.toBe("");
      expect(guide.cta.text[locale].trim()).not.toBe("");
      expect(guide.cta.button[locale].trim()).not.toBe("");
    }
  });

  it("keeps the meta title and description within what search engines show", () => {
    for (const locale of routing.locales) {
      expect(guide.metaTitle[locale].length).toBeLessThanOrEqual(70);
      expect(guide.metaDescription[locale].length).toBeLessThanOrEqual(170);
    }
  });
});

describe("the founder guide's promises (S5)", () => {
  // "No voy a competir por precios" and "sin rangos de inversión" (L5, L13): no currency, no amount.
  const money = /[$€£]|\b(USD|COP|EUR|MXN)\b|\b\d[\d.,]*\s*(mil|millones|k|dólares|pesos|dollars)\b/i;
  // "Los precios y tiempos dependen del tamaño del proyecto" (L13): no day, week or month counts.
  const duration =
    /\b(\d+|una?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|quince|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen)\s+(semanas?|días?|meses|weeks?|days?|months?)\b/i;
  const allCopy = strings(guide);

  it("never states a price or an investment figure", () => {
    expect(allCopy.filter((text) => money.test(text))).toEqual([]);
  });

  it("never counts days, weeks or months", () => {
    expect(allCopy.filter((text) => duration.test(text))).toEqual([]);
  });
});

describe("the founder guide's voice (S5)", () => {
  // First person singular: "I" do the work, never a "we" company. The approved copy has no exception.
  const plural =
    /\b(empezamos|construimos|hacemos|trabajamos|diseñamos|desarrollamos|ofrecemos|creamos|entregamos|somos|tenemos|hablamos|podemos|usamos|nuestro|nuestra|nuestros|nuestras|nosotros)\b/i;
  const spanish = localeStrings(guide, "es");

  it("never speaks in the first person plural in Spanish", () => {
    expect(spanish.filter((text) => plural.test(text))).toEqual([]);
  });

  it("speaks to the visitor as tú, never as usted", () => {
    expect(spanish.filter((text) => /\b(usted|ustedes|su negocio|su empresa)\b/i.test(text))).toEqual([]);
  });
});
