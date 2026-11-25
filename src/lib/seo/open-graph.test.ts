import { describe, expect, it } from "vitest";
import { pageMetadata, siteOpenGraph } from "./open-graph";

describe("siteOpenGraph", () => {
  it("describes the site in Spanish (Colombia) with English as the alternate locale", () => {
    expect(siteOpenGraph("es")).toEqual({ type: "website", siteName: "Mr. Design", locale: "es_CO", alternateLocale: ["en_US"] });
  });

  it("describes the site in English with Spanish as the alternate locale", () => {
    expect(siteOpenGraph("en")).toEqual({ type: "website", siteName: "Mr. Design", locale: "en_US", alternateLocale: ["es_CO"] });
  });

  // Left without title or description: Next fills them from each page's own metadata.
  it("sets no title, description or image of its own", () => {
    expect(siteOpenGraph("es")).not.toHaveProperty("title");
    expect(siteOpenGraph("es")).not.toHaveProperty("description");
    expect(siteOpenGraph("es")).not.toHaveProperty("images");
  });
});

describe("pageMetadata", () => {
  const alternates = { canonical: "/en/services/shopify", languages: { es: "/servicios/shopify", en: "/en/services/shopify" } };

  it("keeps the page's title, description and alternates", () => {
    const metadata = pageMetadata("en", { title: "Shopify stores", description: "I build stores.", alternates });
    expect(metadata.title).toBe("Shopify stores");
    expect(metadata.description).toBe("I build stores.");
    expect(metadata.alternates).toBe(alternates);
  });

  it("gives Open Graph the same title and description, the canonical as og:url and the site defaults", () => {
    expect(pageMetadata("en", { title: "Shopify stores", description: "I build stores.", alternates }).openGraph).toEqual({
      type: "website",
      siteName: "Mr. Design",
      locale: "en_US",
      alternateLocale: ["es_CO"],
      title: "Shopify stores",
      description: "I build stores.",
      url: "/en/services/shopify",
    });
  });

  it("uses the absolute title as is", () => {
    const metadata = pageMetadata("es", { title: { absolute: "Mr. Design: inicio" }, description: "d", alternates: { canonical: "/" } });
    expect(metadata.title).toEqual({ absolute: "Mr. Design: inicio" });
    expect(metadata.openGraph).toMatchObject({ title: "Mr. Design: inicio", url: "/", locale: "es_CO" });
  });
});
