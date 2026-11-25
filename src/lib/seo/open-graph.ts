import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_NAME = "Mr. Design";

// Open Graph locales: Spanish for Colombia (the business is in Bogotá), English for the US.
const OG_LOCALE: Record<Locale, string> = { es: "es_CO", en: "en_US" };

type OpenGraph = NonNullable<Metadata["openGraph"]>;

// The layout's Open Graph defaults. No title or description: Next fills them from each page's own
// metadata. No image: the only brand image (public/brand/icon.png) is 75x75, below what social
// networks accept for a preview.
export function siteOpenGraph(locale: Locale) {
  return {
    type: "website",
    siteName: SITE_NAME,
    locale: OG_LOCALE[locale],
    alternateLocale: routing.locales.filter((other) => other !== locale).map((other) => OG_LOCALE[other]),
  } satisfies OpenGraph;
}

type PageSeo = {
  title: string | { absolute: string };
  description: string;
  alternates: Metadata["alternates"];
};

// A page's metadata with matching Open Graph: same title and description, the canonical as og:url.
// A page's openGraph replaces the layout's whole object, so the site defaults are repeated here.
export function pageMetadata(locale: Locale, { title, description, alternates }: PageSeo): Metadata {
  const canonical = alternates?.canonical;
  return {
    title,
    description,
    alternates,
    openGraph: {
      ...siteOpenGraph(locale),
      title: typeof title === "string" ? title : title.absolute,
      description,
      ...(typeof canonical === "string" ? { url: canonical } : {}),
    },
  };
}
