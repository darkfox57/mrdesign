import type { Locale } from "@/i18n/routing";

// Prices of the demo store (Colombian pesos, no decimals). Spanish writes them as a Colombian shop
// does ("$ 420.000"); English names the currency, since "$" alone reads as US dollars.
export function formatPrice(amount: number, locale: Locale): string {
  return locale === "es" ? `$ ${amount.toLocaleString("es-CO")}` : `COP ${amount.toLocaleString("en-US")}`;
}
