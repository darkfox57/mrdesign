import { describe, expect, it } from "vitest";
import { canPublishLanding, editorStartData, parseNewLanding, translationStart } from "./landing-create";

const heroBlock = {
  type: "Hero",
  props: {
    id: "Hero-1",
    eyebrow: "",
    title: "Tu tienda Shopify, lista para vender",
    lead: "Diseño, catálogo y pagos.",
    primaryLabel: "Cuéntame tu proyecto",
    primaryHref: "/contacto",
    secondaryLabel: "",
    secondaryHref: "",
    background: "paper",
    side: [],
  },
};

describe("parseNewLanding", () => {
  it("accepts language, title and slug, and normalizes the slug", () => {
    const parsed = parseNewLanding({ locale: "en", title: "Shopify stores", slug: "Shopify Stores" });
    expect(parsed).toEqual({ success: true, data: { locale: "en", title: "Shopify stores", slug: "shopify-stores" } });
  });

  it("builds the slug from the title when it is left empty", () => {
    const parsed = parseNewLanding({ locale: "es", title: "Tiendas en línea", slug: "" });
    expect(parsed.success && parsed.data.slug).toBe("tiendas-en-linea");
  });

  it("names every wrong field, in Spanish", () => {
    const parsed = parseNewLanding({ locale: "fr", title: " ", slug: "" });
    expect(parsed).toEqual({ success: false, errors: ["Idioma: elige español o inglés.", "Título: no puede quedar vacío."] });
  });

  it("rejects a title over the limit and a slug with no letters or numbers", () => {
    expect(parseNewLanding({ locale: "es", title: "x".repeat(201), slug: "" })).toEqual({
      success: false,
      errors: ["Título: máximo 200 caracteres."],
    });
    expect(parseNewLanding({ locale: "es", title: "Salud", slug: "¿?" })).toEqual({ success: false, errors: ["Slug: necesita letras o números."] });
  });

  it("ignores values that are not text", () => {
    expect(parseNewLanding({ locale: ["es"], title: 5, slug: null }).success).toBe(false);
  });
});

describe("translationStart", () => {
  it("starts a translation from the original's draft, else its published blocks, without its page fields", () => {
    const published = { root: { props: { title: "Tiendas", slug: "tiendas" } }, content: [heroBlock] };
    const draft = { root: { props: { title: "Tiendas (borrador)" } }, content: [heroBlock, heroBlock] };
    expect(translationStart({ blocks: published, draftBlocks: draft })).toEqual({ root: { props: {} }, content: [heroBlock, heroBlock] });
    expect(translationStart({ blocks: published, draftBlocks: null })).toEqual({ root: { props: {} }, content: [heroBlock] });
  });

  it("starts an empty page when the original has no valid blocks", () => {
    expect(translationStart({ blocks: null, draftBlocks: null })).toEqual({ root: { props: {} }, content: [] });
    expect(translationStart({ blocks: { content: [{ type: "Script", props: {} }] }, draftBlocks: null })).toEqual({ root: { props: {} }, content: [] });
  });
});

describe("editorStartData", () => {
  const landing = { title: "Tiendas", slug: "tiendas", seoTitle: null, seoDescription: "Vende en línea", blocks: null, draftBlocks: null };
  const pageFields = { title: "Tiendas", slug: "tiendas", seoTitle: "", seoDescription: "Vende en línea" };

  it("starts from the draft, then the published blocks, then an empty page", () => {
    const published = { root: { props: {} }, content: [heroBlock] };
    const draft = { root: { props: { title: "Tiendas nuevas" } }, content: [heroBlock, heroBlock] };
    expect(editorStartData({ ...landing, blocks: published, draftBlocks: draft })).toEqual({
      root: { props: { ...pageFields, title: "Tiendas nuevas" } },
      content: [heroBlock, heroBlock],
    });
    expect(editorStartData({ ...landing, blocks: published })).toEqual({ root: { props: pageFields }, content: [heroBlock] });
    expect(editorStartData(landing)).toEqual({ root: { props: pageFields }, content: [] });
  });

  it("starts from an empty page when the stored blocks are malformed", () => {
    expect(editorStartData({ ...landing, draftBlocks: { content: "x" } })).toEqual({ root: { props: pageFields }, content: [] });
  });
});

describe("canPublishLanding", () => {
  it("allows a landing with published blocks", () => {
    expect(canPublishLanding({ blocks: { root: { props: {} }, content: [] } })).toBe(true);
  });

  it("refuses a landing that was never published from the visual editor", () => {
    expect(canPublishLanding({ blocks: null })).toBe(false);
  });
});
