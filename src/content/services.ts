import type { Locale } from "@/i18n/routing";
import { serviceEntries, type ServiceEntry } from "./service-catalog";
import { serviceLines, type ServiceLineContent } from "./service-lines";

type Localized<T> = Record<Locale, T>;

export { serviceIds, type ServiceId } from "./service-catalog";

// A line of work with its approved page copy. Server-only in practice: client modules import the
// light registry in ./service-catalog instead.
export type Service = ServiceEntry & {
  // One sentence for cards: the approved meta description of the line page.
  summary: Localized<string>;
  // What the client receives, each named after the component it becomes.
  deliverables: ServiceLineContent["deliverables"];
  // The whole approved copy of the line page (src/content/service-lines).
  content: ServiceLineContent;
};

export const services: Service[] = serviceEntries.map((entry) => {
  const content = serviceLines[entry.id];
  return { ...entry, summary: content.metaDescription, deliverables: content.deliverables, content };
});

export function getService(locale: Locale, slug: string) {
  return services.find((service) => service.slug[locale] === slug);
}
