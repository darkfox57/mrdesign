import type { Locale } from "@/i18n/routing";

type Localized<T> = Record<Locale, T>;

export type Service = {
  id: ServiceId;
  slug: Localized<string>;
  name: Localized<string>;
  // One sentence for cards and meta descriptions.
  summary: Localized<string>;
  // What the client receives, shown as a list on the service page.
  deliverables: Localized<string[]>;
  // Where the hero platform picker sends the visitor.
  platform: boolean;
};

export const serviceIds = ["websites", "apps", "plugins", "wordpress", "shopify", "prestashop"] as const;
export type ServiceId = (typeof serviceIds)[number];

export const services: Service[] = [
  {
    id: "websites",
    slug: { es: "sitios-web", en: "websites" },
    name: { es: "Sitios web a la medida", en: "Custom websites" },
    summary: {
      es: "Sitios corporativos y landing pages rápidos, fáciles de editar y listos para posicionar en Google.",
      en: "Fast company sites and landing pages that are easy to edit and ready to rank on Google.",
    },
    deliverables: {
      es: [
        "Diseño adaptado a tu marca, pensado primero para el celular",
        "Panel para editar textos, imágenes y páginas sin depender de nadie",
        "SEO técnico: metadatos, sitemap, datos estructurados y buena velocidad",
        "Formularios conectados a tu correo o a tu CRM",
      ],
      en: [
        "Design adapted to your brand, built for phones first",
        "An admin panel to edit text, images and pages on your own",
        "Technical SEO: metadata, sitemap, structured data and good speed",
        "Forms connected to your email or CRM",
      ],
    },
    platform: true,
  },
  {
    id: "apps",
    slug: { es: "aplicaciones", en: "apps" },
    name: { es: "Aplicaciones web y móviles", en: "Web and mobile apps" },
    summary: {
      es: "Portales de clientes, paneles internos y productos digitales, desde el primer prototipo hasta producción.",
      en: "Customer portals, internal dashboards and digital products, from the first prototype to production.",
    },
    deliverables: {
      es: [
        "Definición del alcance y prototipo navegable antes de programar",
        "Usuarios, roles y permisos",
        "Integraciones con pasarelas de pago, CRMs y APIs de terceros",
        "Despliegue, monitoreo y documentación para tu equipo",
      ],
      en: [
        "Scope definition and a clickable prototype before any code",
        "Users, roles and permissions",
        "Integrations with payment gateways, CRMs and third-party APIs",
        "Deployment, monitoring and documentation for your team",
      ],
    },
    platform: true,
  },
  {
    id: "plugins",
    slug: { es: "plugins", en: "plugins" },
    name: { es: "Plugins e integraciones", en: "Plugins and integrations" },
    summary: {
      es: "Plugins de WordPress, módulos de PrestaShop y apps de Shopify que hacen lo que tu negocio necesita.",
      en: "WordPress plugins, PrestaShop modules and Shopify apps that do what your business needs.",
    },
    deliverables: {
      es: [
        "Funcionalidad a la medida sin tocar el núcleo de la plataforma",
        "Conexión con tu ERP, facturación electrónica, inventario o envíos",
        "Código mantenible, compatible con las actualizaciones",
        "Pruebas y guía de instalación",
      ],
      en: [
        "Custom features without touching the platform core",
        "Connections to your ERP, e-invoicing, inventory or shipping",
        "Maintainable code that survives updates",
        "Tests and an installation guide",
      ],
    },
    platform: false,
  },
  {
    id: "wordpress",
    slug: { es: "wordpress", en: "wordpress" },
    name: { es: "Sitios y tiendas en WordPress", en: "WordPress sites and stores" },
    summary: {
      es: "Temas a la medida, bloques de Gutenberg, WooCommerce, migraciones y sitios lentos que vuelven a ser rápidos.",
      en: "Custom themes, Gutenberg blocks, WooCommerce, migrations, and slow sites made fast again.",
    },
    deliverables: {
      es: [
        "Tema propio, sin constructores pesados",
        "Bloques de Gutenberg para que armes tus páginas",
        "Tienda en WooCommerce con pagos y envíos configurados",
        "Optimización de velocidad y seguridad",
      ],
      en: [
        "A custom theme, without heavy page builders",
        "Gutenberg blocks so you can build your own pages",
        "A WooCommerce store with payments and shipping set up",
        "Speed and security optimization",
      ],
    },
    platform: true,
  },
  {
    id: "shopify",
    slug: { es: "shopify", en: "shopify" },
    name: { es: "Tiendas Shopify", en: "Shopify stores" },
    summary: {
      es: "Tiendas Shopify con tema a la medida, secciones editables y las integraciones que tu operación requiere.",
      en: "Shopify stores with a custom theme, editable sections and the integrations your operation needs.",
    },
    deliverables: {
      es: [
        "Tema Online Store 2.0 a la medida o adaptado",
        "Secciones y bloques que editas desde el personalizador",
        "Migración de productos, clientes y pedidos",
        "Apps privadas e integraciones",
      ],
      en: [
        "A custom or adapted Online Store 2.0 theme",
        "Sections and blocks you edit from the theme editor",
        "Migration of products, customers and orders",
        "Private apps and integrations",
      ],
    },
    platform: true,
  },
  {
    id: "prestashop",
    slug: { es: "prestashop", en: "prestashop" },
    name: { es: "Tiendas PrestaShop", en: "PrestaShop stores" },
    summary: {
      es: "Tiendas PrestaShop nuevas, actualizaciones de versión, módulos y temas a la medida.",
      en: "New PrestaShop stores, version upgrades, and custom modules and themes.",
    },
    deliverables: {
      es: [
        "Instalación y configuración de la tienda",
        "Actualización de versiones antiguas sin perder datos",
        "Módulos a la medida y ajustes a módulos existentes",
        "Tema adaptado a tu marca",
      ],
      en: [
        "Store installation and configuration",
        "Upgrades from old versions without losing data",
        "Custom modules and fixes to existing ones",
        "A theme adapted to your brand",
      ],
    },
    platform: true,
  },
];

export function getService(locale: Locale, slug: string) {
  return services.find((service) => service.slug[locale] === slug);
}
