import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { siteUrl } from "@/lib/seo/site";

type Href = Parameters<typeof getPathname>[0]["href"];

const STATIC_PAGES: Href[] = [
  "/",
  "/servicios",
  "/portafolio",
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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_PAGES.map((href) => entry(() => href)),
    ...services.map((service) =>
      entry((locale) => ({ pathname: "/servicios/[service]", params: { service: service.slug[locale] } })),
    ),
  ];
}
