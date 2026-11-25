import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { siteUrl } from "./site";

export type Href = Parameters<typeof getPathname>[0]["href"];
export type Versions = Partial<Record<Locale, Href>>;

// One entry per language version that exists, each with its own <loc> and listing the existing
// versions as alternates. Database content may exist in one language only.
export function versionEntries(versions: Versions, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    Object.entries(versions).map(([locale, href]) => [locale, `${siteUrl}${getPathname({ locale: locale as Locale, href: href! })}`]),
  );
  return Object.values(languages).map((url) => ({ url, lastModified, alternates: { languages } }));
}

// A code-owned page exists in every language: one entry per language, each with every language as alternates.
export function everyLocaleEntries(hrefFor: (locale: Locale) => Href): MetadataRoute.Sitemap {
  return versionEntries(Object.fromEntries(routing.locales.map((locale) => [locale, hrefFor(locale)])));
}
