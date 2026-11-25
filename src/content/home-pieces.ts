import type { Locale } from "@/i18n/routing";
import type { BlockType } from "@/lib/home/blocks";
import { demoStore } from "./home-stage";

// Demo content of the home's working pieces (product card, cart, form, contents). Product names,
// prices and article text are demo content: nothing is sold, sent or published.

type Text = Record<Locale, string>;

// The same chair the build stage sells, so its name and price match everywhere.
const chair = demoStore.products[0];

export const demoProduct = {
  name: chair.name,
  price: chair.price,
  stock: { es: "En stock · llega en 3 a 5 días", en: "In stock · arrives in 3 to 5 days" } as Text,
  // `tone` names a color token (--color-wood-*), so the swatch and the drawing follow the theme.
  variants: [
    { id: "oak", name: { es: "Roble", en: "Oak" }, tone: "oak" },
    { id: "walnut", name: { es: "Nogal", en: "Walnut" }, tone: "walnut" },
    { id: "graphite", name: { es: "Grafito", en: "Graphite" }, tone: "graphite" },
  ] as { id: string; name: Text; tone: "oak" | "walnut" | "graphite" }[],
};

// The kinds the demo form offers. The real contact form has its own list (services.ts).
export const demoFormKinds: Text[] = [
  { es: "Tienda en línea", en: "Online store" },
  { es: "Sitio web", en: "Website" },
  { es: "Aplicación", en: "Application" },
  { es: "Plugin o integración", en: "Plugin or integration" },
];

// What each block of the demo article shows.
export const demoBlocks: Record<BlockType, Text | null> = {
  title: { es: "Cómo elegir madera para muebles de interior", en: "How to choose wood for indoor furniture" },
  text: {
    es: "El roble aguanta el uso diario; el nogal envejece con un tono más cálido. Te cuento cuándo conviene cada uno.",
    en: "Oak stands up to daily use; walnut ages into a warmer tone. Here is when each one makes sense.",
  },
  // An image block is a picture placeholder: it has no text.
  image: null,
  quote: { es: "“La madera buena se nota en diez años, no en diez días.”", en: "“Good wood shows in ten years, not in ten days.”" },
};
