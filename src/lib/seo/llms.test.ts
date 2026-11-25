import { describe, expect, it, vi } from "vitest";
import { founderGuide } from "@/content/founder-guide";
import { services } from "@/content/services";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import { buildLlmsTxt } from "./llms";
import { siteUrl } from "./site";

// next-intl's navigation does not load under vitest; the stand-in reads the real routing table.
vi.mock("@/i18n/navigation", () => import("@/lib/seo/test-navigation"));

const text = buildLlmsTxt();
const lines = text.split("\n");
const englishAt = lines.indexOf(`## ${en.Llms.lines}`);

describe("buildLlmsTxt", () => {
  it("starts with the site name and a one-paragraph summary taken from the site's own description", () => {
    expect(lines[0]).toBe("# Mr. Design");
    expect(lines[1]).toBe("");
    expect(lines[2]).toBe(`> ${es.Metadata.description}`);
  });

  it("lists every line of work in Spanish with its absolute URL and summary, in the approved order", () => {
    const spanish = lines.slice(0, englishAt);
    const entries = services.map((service) => `- [${service.name.es}](${siteUrl}/servicios/${service.slug.es}): ${service.summary.es}`);
    for (const entry of entries) expect(spanish).toContain(entry);
    expect(entries.map((entry) => spanish.indexOf(entry))).toEqual([...entries.map((entry) => spanish.indexOf(entry))].sort((a, b) => a - b));
  });

  it("lists the founder guide and the key pages in Spanish with their existing descriptions", () => {
    const spanish = lines.slice(0, englishAt);
    expect(spanish).toContain(`- [${founderGuide.h1.es}](${siteUrl}/empezar-mi-negocio-en-linea): ${founderGuide.lead.es}`);
    expect(spanish).toContain(`- [${es.Services.metaTitle}](${siteUrl}/servicios): ${es.Services.metaDescription}`);
    expect(spanish).toContain(`- [${es.Portfolio.metaTitle}](${siteUrl}/portafolio): ${es.Portfolio.metaDescription}`);
    expect(spanish).toContain(`- [${es.Blog.metaTitle}](${siteUrl}/blog): ${es.Blog.metaDescription}`);
    expect(spanish).toContain(`- [${es.Contact.metaTitle}](${siteUrl}/contacto): ${es.Contact.metaDescription}`);
  });

  it("repeats the same pages under an English section with their /en URLs and English copy", () => {
    expect(englishAt).toBeGreaterThan(lines.indexOf(`## ${es.Llms.lines}`));
    expect(lines.slice(0, lines.indexOf(`## ${es.Llms.lines}`))).toContain(en.Metadata.description);
    const english = lines.slice(englishAt);
    for (const service of services) {
      expect(english).toContain(`- [${service.name.en}](${siteUrl}/en/services/${service.slug.en}): ${service.summary.en}`);
    }
    expect(english).toContain(`- [${founderGuide.h1.en}](${siteUrl}/en/start-my-business-online): ${founderGuide.lead.en}`);
    expect(english).toContain(`- [${en.Services.metaTitle}](${siteUrl}/en/services): ${en.Services.metaDescription}`);
    expect(english).toContain(`- [${en.Portfolio.metaTitle}](${siteUrl}/en/portfolio): ${en.Portfolio.metaDescription}`);
    expect(english).toContain(`- [${en.Blog.metaTitle}](${siteUrl}/en/blog): ${en.Blog.metaDescription}`);
    expect(english).toContain(`- [${en.Contact.metaTitle}](${siteUrl}/en/contact): ${en.Contact.metaDescription}`);
  });

  it("uses markdown sections and keeps every link absolute", () => {
    expect(lines.filter((line) => line.startsWith("# "))).toHaveLength(1);
    expect(lines.filter((line) => line.startsWith("## ")).length).toBeGreaterThanOrEqual(4);
    const urls = [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
    expect(urls.length).toBe(2 * (services.length + 5));
    for (const url of urls) expect(url.startsWith(`${siteUrl}/`)).toBe(true);
  });

  it("follows the llms.txt structure: one summary blockquote and only H2 sections, so parsers keep the English sections", () => {
    expect(lines.filter((line) => line.startsWith("> "))).toHaveLength(1);
    expect(lines.filter((line) => line.startsWith("###"))).toEqual([]);
    expect(lines).toContain(`## ${en.Llms.lines}`);
    expect(lines).toContain(`## ${en.Llms.guide}`);
    expect(lines).toContain(`## ${en.Llms.pages}`);
  });

  it("keeps every entry on one line, so the list stays parseable", () => {
    for (const line of lines.filter((entry) => entry.startsWith("- "))) expect(line).toMatch(/^- \[[^\]]+\]\([^)]+\): \S/);
    expect(text.endsWith("\n")).toBe(true);
  });
});
