import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  // Spanish stays unprefixed; English lives under /en.
  localePrefix: "as-needed",
  // The URL decides the language. No redirects based on Accept-Language or cookies:
  // they hide language versions from crawlers and change shared links.
  localeDetection: false,
  // Each page declares its own hreflang alternates (src/lib/seo/alternates.ts), because slugs differ per locale.
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/servicios": { es: "/servicios", en: "/services" },
    "/servicios/[service]": { es: "/servicios/[service]", en: "/services/[service]" },
    "/portafolio": { es: "/portafolio", en: "/portfolio" },
    "/blog": "/blog",
    "/blog/[slug]": "/blog/[slug]",
    "/contacto": { es: "/contacto", en: "/contact" },
    "/politica-de-privacidad": { es: "/politica-de-privacidad", en: "/privacy-policy" },
    "/terminos-y-condiciones": { es: "/terminos-y-condiciones", en: "/terms-and-conditions" },
  },
});

export type Locale = (typeof routing.locales)[number];
