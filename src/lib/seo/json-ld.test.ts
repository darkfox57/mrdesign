import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { JsonLd } from "@/components/atoms/JsonLd";
import { contact } from "@/content/contact";
import { serviceEntries } from "@/content/service-catalog";
import es from "../../../messages/es.json";
import { articleJsonLd, caseStudyJsonLd, faqPageJsonLd, organizationJsonLd } from "./json-ld";
import { siteUrl } from "./site";

// next-intl's navigation does not load under vitest; the stand-in reads the real routing table.
vi.mock("@/i18n/navigation", () => import("@/lib/seo/test-navigation"));

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

describe("articleJsonLd", () => {
  const guide = {
    headline: "Cómo empezar tu negocio en línea, paso a paso",
    description: "Qué necesitas primero para empezar tu negocio en línea.",
    url: "/empezar-mi-negocio-en-linea",
    locale: "es",
  };

  it("describes a guide written and published by the business", () => {
    expect(articleJsonLd(guide)).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.headline,
      description: guide.description,
      url: `${siteUrl}${guide.url}`,
      mainEntityOfPage: `${siteUrl}${guide.url}`,
      inLanguage: "es",
      author: { "@id": organizationJsonLd["@id"] },
      publisher: { "@id": organizationJsonLd["@id"] },
    });
  });

  it("stays inside its script tag whatever the copy holds", () => {
    const hostile = { ...guide, headline: "</script><script>alert(1)</script>", description: "<b>a & b</b>" };
    const html = renderToStaticMarkup(createElement(JsonLd, { data: articleJsonLd(hostile) }));
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    const json = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(json)).toMatchObject({ headline: hostile.headline, description: hostile.description });
  });
});

describe("organizationJsonLd", () => {
  it("keeps the business identity and contact data", () => {
    expect(organizationJsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "@id": `${siteUrl}/#business`,
      name: "Mr. Design",
      url: siteUrl,
      email: contact.email,
      telephone: contact.phone,
      logo: `${siteUrl}/brand/icon.png`,
      address: { "@type": "PostalAddress", addressLocality: contact.city, addressCountry: contact.country },
    });
  });

  it("describes the business with the site's default description", () => {
    expect(organizationJsonLd.description).toBe(es.Metadata.description);
  });

  it("knows about the eight lines of work, by their Spanish names, in the approved order", () => {
    expect(organizationJsonLd.knowsAbout).toEqual(serviceEntries.map((entry) => entry.name.es));
  });

  it("offers one service per line, each with its absolute URL and no price", () => {
    expect(organizationJsonLd.makesOffer).toEqual(
      serviceEntries.map((entry) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: entry.name.es, url: `${siteUrl}/servicios/${entry.slug.es}` },
      })),
    );
    expect(JSON.stringify(organizationJsonLd)).not.toMatch(/price/i);
  });
});
