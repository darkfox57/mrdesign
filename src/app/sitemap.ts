import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { sitemapBlogEntries } from "@/lib/blog/posts";
import { siteUrl } from "@/lib/seo/site";

// Posts come from the database, which the Docker build cannot reach: render on request.
export const dynamic = "force-dynamic";

type Href = Parameters<typeof getPathname>[0]["href"];
type Versions = Partial<Record<Locale, Href>>;

const STATIC_PAGES: Href[] = [
  "/",
  "/servicios",
  "/portafolio",
  "/blog",
  "/contacto",
  "/politica-de-privacidad",
  "/terminos-y-condiciones",
];

// One entry per page and locale, each listing its language alternates.
function entry(hrefFor: (locale: Locale) => Href): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, `${siteUrl}${getPathname({ locale, href: hrefFor(locale) })}`]),
  );
  return { url: languages[routing.defaultLocale], alternates: { languages } };
}

// Database content may exist in one language only: one entry per version that exists, each
// listing only the versions that exist as alternates.
function versionEntries(versions: Versions, lastModified?: Date): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(
    Object.entries(versions).map(([locale, href]) => [locale, `${siteUrl}${getPathname({ locale: locale as Locale, href: href! })}`]),
  );
  return Object.values(languages).map((url) => ({ url, lastModified, alternates: { languages } }));
}

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
  const { posts, categories } = await sitemapBlogEntries();

  return [
    ...STATIC_PAGES.map((href) => entry(() => href)),
    ...services.map((service) =>
      entry((locale) => ({ pathname: "/servicios/[service]", params: { service: service.slug[locale] } })),
    ),
    ...byTranslation(posts, (post) => ({ pathname: "/blog/[slug]", params: { slug: post.slug } })).flatMap((group) =>
      versionEntries(group.versions, group.lastModified),
    ),
    ...byTranslation(categories, (category) => ({
      pathname: "/blog/categoria/[category]",
      params: { category: category.slug },
    })).flatMap((group) => versionEntries(group.versions)),
  ];
}
