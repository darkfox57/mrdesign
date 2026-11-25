import { routing, type Locale } from "@/i18n/routing";

// Test stand-in for getPathname from @/i18n/navigation, which does not load under vitest (next-intl
// imports "next/navigation" without an extension). It reads the real localized pathnames of
// src/i18n/routing.ts and applies the "as-needed" prefix: the default language unprefixed, the others
// under /<locale>. Use it with vi.mock("@/i18n/navigation", () => import("@/lib/seo/test-navigation")).
// The e2e specs check the real paths.

type Href = string | { pathname: string; params?: Record<string, string> };

export function getPathname({ locale, href }: { locale: Locale; href: Href }): string {
  const pathname = typeof href === "string" ? href : href.pathname;
  const params = typeof href === "string" ? {} : (href.params ?? {});
  const localized = (routing.pathnames as Record<string, string | Record<Locale, string>>)[pathname];
  if (localized === undefined) throw new Error(`Unknown pathname ${pathname}`);
  const template = typeof localized === "string" ? localized : localized[locale];
  const path = template.replace(/\[(\w+)\]/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing param ${name} for ${pathname}`);
    return encodeURIComponent(value);
  });
  if (locale === routing.defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}
