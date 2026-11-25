import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd } from "@/components/atoms/JsonLd";
import { caseStudyJsonLd, faqPageJsonLd, organizationJsonLd } from "./json-ld";
import { siteUrl } from "./site";

describe("faqPageJsonLd", () => {
  const faqs = [
    { question: "¿Puedo editar la tienda yo mismo?", answer: "Sí, desde el administrador de Shopify." },
    { question: "¿Cuánto cuesta?", answer: "Depende del tamaño del proyecto." },
  ];

  it("describes every question with its accepted answer, in order", () => {
    expect(faqPageJsonLd(faqs)).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Puedo editar la tienda yo mismo?",
          acceptedAnswer: { "@type": "Answer", text: "Sí, desde el administrador de Shopify." },
        },
        {
          "@type": "Question",
          name: "¿Cuánto cuesta?",
          acceptedAnswer: { "@type": "Answer", text: "Depende del tamaño del proyecto." },
        },
      ],
    });
  });

  it("names the page it describes when given its path", () => {
    expect(faqPageJsonLd(faqs, "/servicios/shopify")).toMatchObject({ url: `${siteUrl}/servicios/shopify` });
    expect(faqPageJsonLd(faqs)).not.toHaveProperty("url");
  });

  it("stays inside its script tag whatever the copy holds", () => {
    const hostile = [{ question: "</script><script>alert(1)</script>", answer: "<b>a & b</b>" }];
    const html = renderToStaticMarkup(createElement(JsonLd, { data: faqPageJsonLd(hostile) }));
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    const json = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(json).mainEntity[0]).toEqual({
      "@type": "Question",
      name: "</script><script>alert(1)</script>",
      acceptedAnswer: { "@type": "Answer", text: "<b>a & b</b>" },
    });
  });
});

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
