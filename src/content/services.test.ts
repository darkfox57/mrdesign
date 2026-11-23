import { describe, expect, it } from "vitest";
import { routing } from "@/i18n/routing";
import { getService, serviceIds, services } from "./services";

describe("services", () => {
  it("defines exactly one service per id", () => {
    expect(services.map((service) => service.id).sort()).toEqual([...serviceIds].sort());
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
        expect(service.deliverables[locale].length).toBeGreaterThan(0);
      }
    }
  });
});
