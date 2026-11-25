import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import type { Locale } from "@/i18n/routing";
import { sitemapBlogEntries } from "@/lib/blog/posts";
import { sitemapPublicCases } from "@/lib/cases/public";
import { sitemapLandings } from "@/lib/landings/landings";
import { landingHref } from "@/lib/landings/routes";
import { everyLocaleEntries, versionEntries, type Href, type Versions } from "@/lib/seo/sitemap-entries";

// Posts, landings and cases come from the database, which the Docker build cannot reach: render on request.
export const dynamic = "force-dynamic";

const STATIC_PAGES: Href[] = [
  "/",
  "/servicios",
  "/portafolio",
  "/blog",
  "/contacto",
  "/empezar-mi-negocio-en-linea",
  "/politica-de-privacidad",
  "/terminos-y-condiciones",
];

// Rows of one content type grouped by translation ({ es: href, en: href }), with the latest change.
function byTranslation<T extends { locale: Locale; translationKey: string; updatedAt?: Date }>(
  rows: T[],
  href: (row: T) => Href,
) {
  const groups = new Map<string, { versions: Versions; lastModified?: Date }>();
  for (const row of rows) {
    const group = groups.get(row.translationKey) ?? { versions: {} };
    group.versions[row.locale] = href(row);
    if (row.updatedAt && (!group.lastModified || row.updatedAt > group.lastModified)) group.lastModified = row.updatedAt;
    groups.set(row.translationKey, group);
  }
  return [...groups.values()];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ posts, categories }, landings, cases] = await Promise.all([sitemapBlogEntries(), sitemapLandings(), sitemapPublicCases()]);

  return [
    // Code-owned pages exist in every language: each language gets its own <loc>.
    ...STATIC_PAGES.flatMap((href) => everyLocaleEntries(() => href)),
    ...services.flatMap((service) =>
      everyLocaleEntries((locale) => ({ pathname: "/servicios/[service]", params: { service: service.slug[locale] } })),
    ),
    ...byTranslation(posts, (post) => ({ pathname: "/blog/[slug]", params: { slug: post.slug } })).flatMap((group) =>
      versionEntries(group.versions, group.lastModified),
    ),
    ...byTranslation(categories, (category) => ({
      pathname: "/blog/categoria/[category]",
      params: { category: category.slug },
    })).flatMap((group) => versionEntries(group.versions)),
    ...byTranslation(landings, (landing) => landingHref(landing.slug)).flatMap((group) =>
      versionEntries(group.versions, group.lastModified),
    ),
    ...byTranslation(cases, (item) => ({ pathname: "/portafolio/[slug]", params: { slug: item.slug } })).flatMap((group) =>
      versionEntries(group.versions, group.lastModified),
    ),
  ];
}
