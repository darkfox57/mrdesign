import type { Locale } from "@/i18n/routing";

// The light registry of the lines of work: ids, slugs and names only. It imports no page copy, so
// client modules (the contact forms, the admin inbox) can use it without shipping the line pages
// to the browser (src/content/service-lines/client-boundary.test.ts).

type Localized<T> = Record<Locale, T>;

// The lines of work, in the approved order (odd/tasks/site-build-experience.md, L6 and L12). The
// same ids, in the same order, as the lines a success case can belong to (src/lib/cases/lines.ts).
export const serviceIds = ["websites", "funnels", "shopify", "prestashop", "wordpress", "apps", "evolution", "plugins"] as const;
export type ServiceId = (typeof serviceIds)[number];

export type ServiceEntry = {
  id: ServiceId;
  // Indexed URLs: never change a published slug.
  slug: Localized<string>;
  name: Localized<string>;
  // Where the hero platform picker sends the visitor.
  platform: boolean;
};

// The single source of each line's slug and name; the page copy lives in src/content/service-lines.
export const serviceEntries: ServiceEntry[] = [
  { id: "websites", slug: { es: "sitios-web", en: "websites" }, name: { es: "Sitios web a la medida", en: "Custom websites" }, platform: true },
  {
    id: "funnels",
    slug: { es: "landing-pages", en: "landing-pages" },
    name: { es: "Landing pages y embudos", en: "Landing pages and funnels" },
    platform: false,
  },
  { id: "shopify", slug: { es: "shopify", en: "shopify" }, name: { es: "Tiendas Shopify", en: "Shopify stores" }, platform: true },
  { id: "prestashop", slug: { es: "prestashop", en: "prestashop" }, name: { es: "Tiendas PrestaShop", en: "PrestaShop stores" }, platform: true },
  {
    id: "wordpress",
    slug: { es: "wordpress", en: "wordpress" },
    name: { es: "Sitios y tiendas en WordPress", en: "WordPress sites and stores" },
    platform: true,
  },
  { id: "apps", slug: { es: "aplicaciones", en: "apps" }, name: { es: "Aplicaciones web y móviles", en: "Web and mobile apps" }, platform: true },
  {
    id: "evolution",
    slug: { es: "evolucion-de-plataformas", en: "platform-evolution" },
    name: { es: "Evolución de plataformas", en: "Platform evolution" },
    platform: false,
  },
  { id: "plugins", slug: { es: "plugins", en: "plugins" }, name: { es: "Plugins e integraciones", en: "Plugins and integrations" }, platform: false },
];
