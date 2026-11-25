// Lines of work a success case can belong to, in display order. The single source of the ids that
// cases store (Case.lines); the public line pages map onto these same ids.
export const CASE_LINES = ["websites", "funnels", "shopify", "prestashop", "wordpress", "apps", "evolution", "plugins"] as const;

export type CaseLine = (typeof CASE_LINES)[number];

// Dashboard labels (Spanish only, like the rest of the dashboard).
export const CASE_LINE_LABELS: Record<CaseLine, string> = {
  websites: "Sitios web a la medida",
  funnels: "Landing pages y embudos",
  shopify: "Tiendas Shopify",
  prestashop: "Tiendas PrestaShop",
  wordpress: "WordPress",
  apps: "Aplicaciones web y móviles",
  evolution: "Evolución de plataformas",
  plugins: "Plugins e integraciones",
};

export const isCaseLine = (value: string): value is CaseLine => (CASE_LINES as readonly string[]).includes(value);
