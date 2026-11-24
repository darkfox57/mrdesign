import { describe, expect, it } from "vitest";
import { faqJsonLd, firstHeroLead } from "./page-data";
import type { BuilderPage } from "./validate";

const faq = (id: string, items: { question: string; answer: string }[]) => ({ type: "Faq", props: { id, title: "FAQ", items } });

const page = (content: BuilderPage["content"]): BuilderPage => ({ root: { props: {} }, content });

describe("faqJsonLd", () => {
  it("builds one FAQPage from every Faq block, in page order", () => {
    const data = page([
      faq("Faq-1", [{ question: "¿24/7?", answer: "Sí." }]),
      { type: "Cards", props: { id: "Cards-1", title: "T", intro: "", background: "paper", columns: "3", items: [] } },
      faq("Faq-2", [{ question: "¿Precio?", answer: "Según alcance." }]),
    ]);
    expect(faqJsonLd(data)).toEqual({
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "¿24/7?", acceptedAnswer: { "@type": "Answer", text: "Sí." } },
        { "@type": "Question", name: "¿Precio?", acceptedAnswer: { "@type": "Answer", text: "Según alcance." } },
      ],
    });
  });

  it("finds Faq blocks inside slots", () => {
    const data = page([
      {
        type: "Columns",
        props: { id: "Columns-1", ratio: "1-1", background: "paper", left: [faq("Faq-1", [{ question: "¿Dentro?", answer: "Sí." }])], right: [] },
      },
    ]);
    expect(faqJsonLd(data)?.mainEntity).toEqual([
      { "@type": "Question", name: "¿Dentro?", acceptedAnswer: { "@type": "Answer", text: "Sí." } },
    ]);
  });

  it("returns null when the page has no FAQ items", () => {
    expect(faqJsonLd(page([faq("Faq-1", [])]))).toBeNull();
    expect(faqJsonLd(page([]))).toBeNull();
  });
});

describe("firstHeroLead", () => {
  it("returns the lead of the first Hero block", () => {
    const hero = (id: string, lead: string) => ({ type: "Hero", props: { id, lead, side: [] } });
    expect(firstHeroLead(page([faq("Faq-1", []), hero("Hero-1", "Primera"), hero("Hero-2", "Segunda")]))).toBe("Primera");
  });

  it("returns undefined without a Hero block or with an empty lead", () => {
    expect(firstHeroLead(page([]))).toBeUndefined();
    expect(firstHeroLead(page([{ type: "Hero", props: { id: "Hero-1", lead: "  ", side: [] } }]))).toBeUndefined();
  });
});
