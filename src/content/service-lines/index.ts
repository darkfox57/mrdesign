import type { ServiceId } from "../service-catalog";
import { apps } from "./apps";
import { evolution } from "./evolution";
import { funnels } from "./funnels";
import { plugins } from "./plugins";
import { prestashop } from "./prestashop";
import { shopify } from "./shopify";
import type { ServiceLineContent } from "./types";
import { websites } from "./websites";
import { wordpress } from "./wordpress";

export type { ServiceLineContent } from "./types";

// The approved page copy of every line of work, by id. The order of the lines is services.ts's.
export const serviceLines: Record<ServiceId, ServiceLineContent> = {
  websites,
  funnels,
  shopify,
  prestashop,
  wordpress,
  apps,
  evolution,
  plugins,
};
