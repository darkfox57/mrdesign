import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

type Href = Parameters<typeof getPathname>[0]["href"];

// Canonical URL plus one hreflang link per language version that exists; x-default is the
// Spanish version. Paths are relative: metadataBase (the layout) makes them absolute.
export function localizedAlternates(current: Locale, hrefs: Partial<Record<Locale, Href>>): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    const href = hrefs[locale];
    if (href) languages[locale] = getPathname({ href, locale });
  }
  const fallback = languages[routing.defaultLocale];
  if (fallback) languages["x-default"] = fallback;
  return { canonical: languages[current], languages };
}

// A page that exists in every language under the same route (and params).
export function sameRouteAlternates(current: Locale, href: Href): Metadata["alternates"] {
  return localizedAlternates(current, Object.fromEntries(routing.locales.map((locale) => [locale, href])));
}

// { es: slug, en: slug } -> { es: href, en: href }, for pages whose slug changes per language.
export function mapValues<T, U>(record: Partial<Record<Locale, T>>, map: (value: T) => U): Partial<Record<Locale, U>> {
  return Object.fromEntries(Object.entries(record).map(([locale, value]) => [locale, map(value as T)]));
}
