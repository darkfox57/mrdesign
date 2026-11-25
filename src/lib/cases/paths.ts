import { routing } from "@/i18n/routing";

export type RevalidationTarget = { path: string; type: "page" | "layout" };

// The public pages that show cases, as the routes the proxy rewrites to (every locale carries its
// prefix, Spanish too, and English keeps the Spanish folder name; see publicBlogPaths). The home
// page, and the portfolio as a layout: it covers the index and every case page under it, whatever
// the slug, so a renamed case refreshes its old URL too, and so do the translations and related
// cases that link to it.
export function publicCasePaths(): RevalidationTarget[] {
  return routing.locales.flatMap((locale) => [
    { path: `/${locale}`, type: "page" as const },
    { path: `/${locale}/portafolio`, type: "layout" as const },
  ]);
}
