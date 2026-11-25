import type { Locale } from "@/i18n/routing";

// The demo store that assembles in the home's build stage ("Taller Lumen"). Every name and price is
// demo content inside the stage: it is not a client, a product or an order.

type Text = Record<Locale, string>;

// The six steps of the build, in the order I work. `log` is the build log line of that step.
export const homeBuildSteps: { id: string; label: Text; log: Text }[] = [
  {
    id: "structure",
    label: { es: "Estructura", en: "Structure" },
    log: { es: "› grid · 12 columnas, pensado primero para el celular", en: "› grid · 12 columns, designed for phones first" },
  },
  {
    id: "layout",
    label: { es: "Maquetación", en: "Layout" },
    log: { es: "› layout · header, portada y catálogo en su lugar", en: "› layout · header, banner and catalog in place" },
  },
  {
    id: "content",
    label: { es: "Contenido", en: "Content" },
    log: {
      es: "› content · textos, fotos y precios que editas desde el panel",
      en: "› content · copy, photos and prices you edit from the panel",
    },
  },
  {
    id: "commerce",
    label: { es: "Comercio", en: "Commerce" },
    log: { es: "› cart · addToCart(producto, cantidad) recalcula el total", en: "› cart · addToCart(product, quantity) recalculates the total" },
  },
  {
    id: "forms",
    label: { es: "Formularios", en: "Forms" },
    log: { es: "› checkout · validación mientras escribes y pago seguro", en: "› checkout · validation as you type and secure payment" },
  },
  {
    id: "live",
    label: { es: "En vivo", en: "Live" },
    log: {
      es: "✓ deploy · https, sitemap y datos estructurados para Google y la IA",
      en: "✓ deploy · https, sitemap and structured data for Google and AI",
    },
  },
];

export const demoStore = {
  name: "Taller Lumen",
  host: "demo.mrdesign.com.co",
  nav: { es: ["Sillas", "Mesas", "Contacto"], en: ["Chairs", "Tables", "Contact"] } as Record<Locale, string[]>,
  headline: { es: ["Muebles hechos", "a mano."], en: ["Furniture made", "by hand."] } as Record<Locale, string[]>,
  promise: { es: "Envío a todo el país · Pago seguro", en: "Nationwide shipping · Secure payment" } as Text,
  add: { es: "Agregar", en: "Add" } as Text,
  // The brand stays "Taller Lumen"; the product names are translated.
  products: [
    { name: { es: "Silla Lumen", en: "Lumen chair" }, price: 420_000, tone: "oak" },
    { name: { es: "Banca Ceiba", en: "Ceiba bench" }, price: 610_000, tone: "graphite" },
    { name: { es: "Taburete Guadua", en: "Guadua stool" }, price: 280_000, tone: "brand" },
  ] as { name: Text; price: number; tone: "oak" | "graphite" | "brand" }[],
  cart: {
    title: { es: "Tu carrito", en: "Your cart" } as Text,
    item: { es: "Silla Lumen · Roble", en: "Lumen chair · Oak" } as Text,
    subtotal: { es: "Subtotal", en: "Subtotal" } as Text,
    checkout: { es: "Ir a pagar", en: "Go to checkout" } as Text,
  },
  checkout: {
    title: { es: "Finalizar compra", en: "Checkout" } as Text,
    fields: [
      { label: { es: "Nombre", en: "Name" }, value: "Laura Restrepo" },
      { label: { es: "Correo", en: "Email" }, value: "laura@correo.com", valid: true },
      { label: { es: "Dirección de envío", en: "Shipping address" }, value: "Calle 10 # 43-21, Medellín" },
    ] as { label: Text; value: string; valid?: boolean }[],
    pay: { es: "Pagar", en: "Pay" } as Text,
  },
  toast: { es: "Pedido #1042 confirmado · correo enviado", en: "Order #1042 confirmed · email sent" } as Text,
  live: { es: "En producción", en: "In production" } as Text,
};
