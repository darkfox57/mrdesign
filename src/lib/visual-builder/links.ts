import { routing, type Locale } from "@/i18n/routing";

// Builder blocks store links as Spanish paths ("/contacto"). On the English version of
// a landing they must point to that language's page ("/en/contact"). Only the site's fixed pages
// are translated; anything else (external, mailto, anchors, posts) is left as written.
// Reads routing.pathnames directly (no next-intl navigation), so it also runs outside Next.
type Pathnames = Record<string, string | Partial<Record<Locale, string>>>;
const pathnames = routing.pathnames as Pathnames;

export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const match = href.match(/^([^?#]*)(.*)$/);
  const [path, suffix] = [match?.[1] ?? href, match?.[2] ?? ""];
  const entry = pathnames[path];
  if (!entry || path.includes("[")) return href;

  const localized = typeof entry === "string" ? entry : (entry[locale] ?? path);
  // Spanish has no prefix ("as-needed"); the other languages do.
  if (locale === routing.defaultLocale) return `${localized}${suffix}`;
  return `/${locale}${localized === "/" ? "" : localized}${suffix}`;
}
