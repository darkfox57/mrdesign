import { describe, expect, it } from "vitest";
import { caseStudyJsonLd, organizationJsonLd } from "./json-ld";
import { siteUrl } from "./site";

const base = {
  title: "Una tienda que se arma sola",
  summary: "Rehice la tienda en Shopify y el checkout dejó de perder pedidos.",
  url: "/portafolio/tienda-que-se-arma",
  locale: "es",
  image: "https://img.example.com/media/cover.png",
  lines: ["Tiendas Shopify", "Plugins e integraciones"],
  stack: ["Shopify", "Liquid"],
  year: 2025,
};

describe("caseStudyJsonLd", () => {
  it("describes the case as a CreativeWork made by the business", () => {
    expect(caseStudyJsonLd(base)).toEqual({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: base.title,
      description: base.summary,
      url: `${siteUrl}${base.url}`,
      mainEntityOfPage: `${siteUrl}${base.url}`,
      inLanguage: "es",
      image: base.image,
      keywords: "Tiendas Shopify, Plugins e integraciones, Shopify, Liquid",
      about: [
        { "@type": "Thing", name: "Tiendas Shopify" },
        { "@type": "Thing", name: "Plugins e integraciones" },
      ],
      dateCreated: "2025",
      creator: { "@id": organizationJsonLd["@id"] },
    });
  });

  it("makes a site-relative cover absolute", () => {
    expect(caseStudyJsonLd({ ...base, image: "/portfolio/cover.jpg" }).image).toBe(`${siteUrl}/portfolio/cover.jpg`);
  });

  it("leaves out what the case does not have: image, year, keywords and topics", () => {
    const data = caseStudyJsonLd({ ...base, image: null, year: null, lines: [], stack: [] });
    expect(data).not.toHaveProperty("image");
    expect(data).not.toHaveProperty("dateCreated");
    expect(data).not.toHaveProperty("keywords");
    expect(data).not.toHaveProperty("about");
  });
});
