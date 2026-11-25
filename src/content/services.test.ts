import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { CASE_LINES } from "@/lib/cases/lines";
import { getService, serviceIds, services } from "./services";

describe("services", () => {
  it("lists the eight lines of work in the approved order", () => {
    expect(services.map((service) => service.id)).toEqual([
      "websites",
      "funnels",
      "shopify",
      "prestashop",
      "wordpress",
      "apps",
      "evolution",
      "plugins",
    ]);
    expect(services.map((service) => service.id)).toEqual([...serviceIds]);
  });

  it("uses the same ids, in the same order, as the lines a success case can belong to", () => {
    expect([...serviceIds]).toEqual([...CASE_LINES]);
  });

  it("keeps the six slugs that are already indexed", () => {
    const slugs = Object.fromEntries(services.map((service) => [service.id, service.slug]));
    expect(slugs.websites).toEqual({ es: "sitios-web", en: "websites" });
    expect(slugs.shopify).toEqual({ es: "shopify", en: "shopify" });
    expect(slugs.prestashop).toEqual({ es: "prestashop", en: "prestashop" });
    expect(slugs.wordpress).toEqual({ es: "wordpress", en: "wordpress" });
    expect(slugs.apps).toEqual({ es: "aplicaciones", en: "apps" });
    expect(slugs.plugins).toEqual({ es: "plugins", en: "plugins" });
  });

  it("gives the two new lines their approved slugs", () => {
    const slugs = Object.fromEntries(services.map((service) => [service.id, service.slug]));
    expect(slugs.funnels).toEqual({ es: "landing-pages", en: "landing-pages" });
    expect(slugs.evolution).toEqual({ es: "evolucion-de-plataformas", en: "platform-evolution" });
  });

  it.each(routing.locales)("has unique, URL-safe slugs in %s", (locale) => {
    const slugs = services.map((service) => service.slug[locale]);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(routing.locales)("finds every service by its %s slug, and nothing else", (locale) => {
    for (const service of services) expect(getService(locale, service.slug[locale])).toBe(service);
    expect(getService(locale, "does-not-exist")).toBeUndefined();
  });

  it("has content in every locale", () => {
    for (const service of services) {
      for (const locale of routing.locales) {
        expect(service.name[locale]).not.toBe("");
        expect(service.summary[locale]).not.toBe("");
        expect(service.deliverables.length).toBeGreaterThan(0);
      }
    }
  });

  it("uses each line's approved meta description as its one-sentence summary", () => {
    for (const service of services) expect(service.summary).toBe(service.content.metaDescription);
  });
});
