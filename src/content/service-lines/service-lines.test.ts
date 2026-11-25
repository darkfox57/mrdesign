import { describe, expect, it } from "vitest";
import { routing, type Locale } from "@/i18n/routing";
import { serviceIds, services } from "../services";
import { serviceLines } from ".";

// The approved copy of the eight line pages (odd/tasks/site-build-experience.md, T5, S1, S5, S6).

// Every string in a value, however deeply nested.
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(strings);
  return [];
}

// Only the strings of one locale: every { es, en } pair contributes its `locale` side. Plain strings
// outside a pair (deliverable codes, visual hints for the stage) belong to no locale.
function localeStrings(value: unknown, locale: Locale): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => localeStrings(item, locale));
  if (typeof value === "object" && value !== null) {
    if (routing.locales.every((key) => key in value)) return strings((value as Record<Locale, unknown>)[locale]);
    return Object.values(value).flatMap((item) => localeStrings(item, locale));
  }
  return [];
}

const lines = services.map((service) => ({ id: service.id, content: serviceLines[service.id] }));

describe("the line pages' copy", () => {
  it("has one page of copy per line of work, and no other", () => {
    expect(Object.keys(serviceLines).sort()).toEqual([...serviceIds].sort());
  });

  it.each(lines)("$id has every field in es and en", ({ content }) => {
    for (const locale of routing.locales) {
      for (const field of [content.h1, content.metaTitle, content.metaDescription, content.summary, content.audience]) {
        expect(field[locale].trim()).not.toBe("");
      }
      expect(content.keywords[locale].length).toBeGreaterThan(0);
      expect(content.comparison.columns[locale].length).toBeGreaterThan(1);
      for (const row of content.comparison.rows) {
        expect(row.label[locale].trim()).not.toBe("");
        expect(row.cells[locale]).toHaveLength(content.comparison.columns[locale].length);
      }
    }
    expect(content.comparison.highlight).toBeGreaterThanOrEqual(0);
    expect(content.comparison.highlight).toBeLessThan(content.comparison.columns.es.length);
    expect(content.comparison.columns.en).toHaveLength(content.comparison.columns.es.length);
    // No locale is missing a string or carries an empty one. Keywords are each language's own
    // searches, not translations of each other, so their lists may differ in length.
    const { keywords, ...translated } = content;
    expect(keywords.es.length + keywords.en.length).toBeGreaterThan(0);
    expect(localeStrings(translated, "es")).toHaveLength(localeStrings(translated, "en").length);
    for (const text of strings(content)) expect(text.trim()).not.toBe("");
  });

  it.each(lines)("$id has six build steps, each with a label, a note, a log line and a visual hint", ({ content }) => {
    expect(content.buildSteps).toHaveLength(6);
    for (const locale of routing.locales) {
      const labels = content.buildSteps.map((step) => step.label[locale]);
      // The stage's rail is keyed by label.
      expect(new Set(labels).size).toBe(labels.length);
      for (const step of content.buildSteps) {
        expect(step.note[locale].trim()).not.toBe("");
        expect(step.logLine[locale].trim()).not.toBe("");
      }
    }
    for (const step of content.buildSteps) expect(step.visualHint.trim()).not.toBe("");
  });

  it.each(lines)("$id has its six deliverables, each named after a component", ({ content }) => {
    expect(content.deliverables).toHaveLength(6);
    for (const deliverable of content.deliverables) expect(deliverable.code).toMatch(/^<[A-Z][A-Za-z]* \/>$/);
  });

  it.each(lines)("$id answers six frequent questions", ({ content }) => {
    expect(content.faqs).toHaveLength(6);
    for (const faq of content.faqs) {
      for (const locale of routing.locales) {
        expect(faq.q[locale].trim()).not.toBe("");
        expect(faq.a[locale].trim()).not.toBe("");
      }
    }
  });

  it.each(lines)("$id relates only to other lines that exist", ({ id, content }) => {
    expect(content.related.length).toBeGreaterThan(0);
    for (const related of content.related) {
      expect(serviceIds).toContain(related.id);
      expect(related.id).not.toBe(id);
    }
    const ids = content.related.map((related) => related.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps the meta titles and descriptions within what search engines show", () => {
    for (const { content } of lines) {
      for (const locale of routing.locales) {
        expect(content.metaTitle[locale].length).toBeLessThanOrEqual(70);
        expect(content.metaDescription[locale].length).toBeLessThanOrEqual(170);
      }
    }
  });
});

describe("the line pages' promises (S5)", () => {
  // "No voy a competir por precios" and "sin rangos de inversión" (L5, L13): no currency, no amount.
  const money = /[$€£]|\b(USD|COP|EUR|MXN)\b|\b\d[\d.,]*\s*(mil|millones|k|dólares|pesos|dollars)\b/i;
  // "Los precios y tiempos dependen del tamaño del proyecto" (L13): no week or day counts either.
  const duration =
    /\b(\d+|una?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|quince|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen)\s+(semanas?|días?|meses|weeks?|days?|months?)\b/i;
  const allCopy = lines.flatMap(({ content }) => strings(content));

  it("never states a price or an investment figure", () => {
    expect(allCopy.filter((text) => money.test(text))).toEqual([]);
  });

  it("never promises a number of weeks or days in a FAQ answer", () => {
    const answers = lines.flatMap(({ content }) => content.faqs.flatMap((faq) => strings(faq.a)));
    expect(answers.filter((text) => duration.test(text))).toEqual([]);
  });

  it("catches the figures it looks for", () => {
    expect(money.test("Desde $ 2.000.000")).toBe(true);
    expect(money.test("from 500 USD")).toBe(true);
    expect(duration.test("Toma entre 4 y 6 semanas")).toBe(true);
    expect(duration.test("It takes two weeks")).toBe(true);
    expect(duration.test("una redirección 301")).toBe(false);
  });
});

describe("the line pages' voice (S5)", () => {
  // First person singular: "I" do the work, never a "we" company. The approved copy (L13) keeps four
  // phrases where "we" means the visitor and me together, the way the home keeps "¿Qué construimos?".
  const plural =
    /\b(empezamos|construimos|hacemos|trabajamos|diseñamos|desarrollamos|ofrecemos|creamos|entregamos|somos|tenemos|hablamos|podemos|usamos|nuestro|nuestra|nuestros|nuestras|nosotros)\b/i;
  const together = ["Lo hablamos antes de construir", "podemos acordar que yo lo mantenga", "te lo digo y lo usamos", "cómo trabajamos esos ajustes"];
  const spanish = lines.flatMap(({ content }) => localeStrings(content, "es"));

  it("never speaks in the first person plural in Spanish", () => {
    const offenders = spanish
      .map((text) => together.reduce((rest, phrase) => rest.replace(phrase, ""), text))
      .filter((text) => plural.test(text));
    expect(offenders).toEqual([]);
  });

  it("keeps each shared phrase exactly once, so the exception cannot hide new copy", () => {
    for (const phrase of together) expect(spanish.filter((text) => text.includes(phrase))).toHaveLength(1);
  });

  it("speaks to the visitor as tú, never as usted", () => {
    expect(spanish.filter((text) => /\b(usted|ustedes|su negocio|su empresa)\b/i.test(text))).toEqual([]);
  });
});
