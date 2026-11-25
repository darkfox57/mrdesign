import { describe, expect, it, vi } from "vitest";
import { everyLocaleEntries, versionEntries } from "./sitemap-entries";
import { siteUrl } from "./site";

// next-intl's navigation does not load under vitest; the stand-in reads the real routing table.
vi.mock("@/i18n/navigation", () => import("@/lib/seo/test-navigation"));

describe("everyLocaleEntries", () => {
  it("gives a code-owned page one <loc> per language, each listing every language as an alternate", () => {
    const languages = { es: `${siteUrl}/servicios`, en: `${siteUrl}/en/services` };
    expect(everyLocaleEntries(() => "/servicios")).toEqual([
      { url: `${siteUrl}/servicios`, alternates: { languages } },
      { url: `${siteUrl}/en/services`, alternates: { languages } },
    ]);
  });

  it("uses each language's own slug", () => {
    const entries = everyLocaleEntries((locale) => ({
      pathname: "/servicios/[service]",
      params: { service: locale === "es" ? "sitios-web" : "websites" },
    }));
    expect(entries.map((entry) => entry.url)).toEqual([`${siteUrl}/servicios/sitios-web`, `${siteUrl}/en/services/websites`]);
    expect(entries[1].alternates?.languages).toEqual({
      es: `${siteUrl}/servicios/sitios-web`,
      en: `${siteUrl}/en/services/websites`,
    });
  });
});

describe("versionEntries", () => {
  it("lists only the versions that exist, each with those versions as alternates and the last change", () => {
    const lastModified = new Date("2026-11-01T00:00:00Z");
    const languages = { es: `${siteUrl}/blog/hola` };
    expect(versionEntries({ es: { pathname: "/blog/[slug]", params: { slug: "hola" } } }, lastModified)).toEqual([
      { url: `${siteUrl}/blog/hola`, lastModified, alternates: { languages } },
    ]);
  });
});
