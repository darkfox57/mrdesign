import type { ComponentType } from "react";
import type { ServiceId } from "@/content/services";
import { FunnelsScreen, WebsitesScreen } from "./SiteScreens";
import { AppsScreen, EvolutionScreen, PluginsScreen } from "./SystemScreens";
import { PrestashopScreen, ShopifyScreen, WordpressScreen } from "./StoreScreens";

// Each line's own screen for its build stage, and the address its browser bar shows. The demo brand
// is the home's ("Taller Lumen"), so every stage builds for the same fictional client.
const screens: Record<ServiceId, { Screen: ComponentType; host: string }> = {
  websites: { Screen: WebsitesScreen, host: "tallerlumen.co" },
  funnels: { Screen: FunnelsScreen, host: "tallerlumen.co/promo" },
  shopify: { Screen: ShopifyScreen, host: "tallerlumen.co/collections" },
  prestashop: { Screen: PrestashopScreen, host: "shop.tallerlumen.co" },
  wordpress: { Screen: WordpressScreen, host: "tallerlumen.co/wp-admin" },
  apps: { Screen: AppsScreen, host: "app.tallerlumen.co" },
  evolution: { Screen: EvolutionScreen, host: "tallerlumen.co" },
  plugins: { Screen: PluginsScreen, host: "tallerlumen.co/wp-admin/sync" },
};

export function lineScreen(id: ServiceId) {
  return screens[id];
}
