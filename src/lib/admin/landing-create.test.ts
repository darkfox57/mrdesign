import { describe, expect, it } from "vitest";
import {
  EDITOR_NOTICES,
  canPublishLanding,
  editorStartData,
  hasLandingDraft,
  parseLandingId,
  parseNewLanding,
  resolveTranslationRequest,
  translationStart,
} from "./landing-create";

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

  it("cuts an over-limit slug at 80 characters without leaving a trailing hyphen", () => {
    const parsed = parseNewLanding({ locale: "es", title: "Tiendas", slug: `${"a".repeat(79)} b` });
    expect(parsed.success && parsed.data.slug).toBe("a".repeat(79));
    const long = parseNewLanding({ locale: "es", title: "x".repeat(150), slug: "" });
    expect(long.success && long.data.slug).toBe("x".repeat(80));
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
  const published = { root: { props: {} }, content: [heroBlock] };
  const draft = { root: { props: { title: "Tiendas nuevas" } }, content: [heroBlock, heroBlock] };
  const unknownBlock = { root: { props: {} }, content: [{ type: "Script", props: { id: "s" } }] };

  it("starts from the draft, then the published blocks, then an empty page", () => {
    expect(editorStartData({ ...landing, blocks: published, draftBlocks: draft })).toEqual({
      data: { root: { props: { ...pageFields, title: "Tiendas nuevas" } }, content: [heroBlock, heroBlock] },
      notice: null,
    });
    expect(editorStartData({ ...landing, blocks: published })).toEqual({ data: { root: { props: pageFields }, content: [heroBlock] }, notice: null });
    expect(editorStartData(landing)).toEqual({ data: { root: { props: pageFields }, content: [] }, notice: null });
  });

  it("starts from the published blocks, with a notice, when the stored draft fails validation", () => {
    // An unknown block type, and draft page fields the schema does not know.
    for (const invalid of [unknownBlock, { root: { props: { color: "red" } }, content: [] }]) {
      expect(editorStartData({ ...landing, blocks: published, draftBlocks: invalid })).toEqual({
        data: { root: { props: pageFields }, content: [heroBlock] },
        notice: EDITOR_NOTICES.invalidDraft,
      });
    }
  });

  it("starts from an empty page, with a notice, when no stored page passes validation", () => {
    expect(editorStartData({ ...landing, draftBlocks: { content: "x" } })).toEqual({
      data: { root: { props: pageFields }, content: [] },
      notice: EDITOR_NOTICES.invalidPage,
    });
    expect(editorStartData({ ...landing, blocks: unknownBlock, draftBlocks: unknownBlock })).toEqual({
      data: { root: { props: pageFields }, content: [] },
      notice: EDITOR_NOTICES.invalidPage,
    });
    expect(editorStartData({ ...landing, blocks: unknownBlock })).toEqual({
      data: { root: { props: pageFields }, content: [] },
      notice: EDITOR_NOTICES.invalidPage,
    });
  });

  it("never hands unvalidated block props to the editor", () => {
    const extra = { root: { props: {} }, content: [{ ...heroBlock, props: { ...heroBlock.props, onClick: "alert(1)" } }] };
    expect(editorStartData({ ...landing, blocks: extra }).data.content).toEqual([]);
  });
});

describe("hasLandingDraft", () => {
  it("is true whenever a draft is stored, even one equal to the published page", () => {
    const published = { root: { props: {} }, content: [heroBlock] };
    expect(hasLandingDraft({ draftBlocks: published })).toBe(true);
    expect(hasLandingDraft({ draftBlocks: null })).toBe(false);
  });
});

describe("parseLandingId", () => {
  it("accepts an id and refuses anything else", () => {
    expect(parseLandingId("cmabc123xyz")).toBe("cmabc123xyz");
    for (const raw of ["", "x".repeat(101), "a b", "../x", "id;drop", undefined, ["a"], 5]) {
      expect(parseLandingId(raw), String(raw)).toBeNull();
    }
  });
});

describe("resolveTranslationRequest", () => {
  const source = { id: "src1", title: "Tiendas", locale: "es" as const };
  const find = async (id: string) => (id === source.id ? source : null);

  it("is a plain new landing without ?traducir", async () => {
    expect(await resolveTranslationRequest({ idioma: "en" }, find)).toEqual({ kind: "none" });
  });

  it("returns the source and the target language of a well-formed link", async () => {
    expect(await resolveTranslationRequest({ traducir: "src1", idioma: "en" }, find)).toEqual({ kind: "ready", source, locale: "en" });
  });

  it("explains a missing or unknown language", async () => {
    for (const idioma of [undefined, "", "fr"]) {
      expect(await resolveTranslationRequest({ traducir: "src1", idioma }, find), String(idioma)).toEqual({
        kind: "invalid",
        message: "El enlace de traducción no indica a qué idioma traducir. Vuelve a las landings y usa «Traducir al…» de la landing.",
      });
    }
  });

  it("explains a target language equal to the source's", async () => {
    expect(await resolveTranslationRequest({ traducir: "src1", idioma: "es" }, find)).toEqual({
      kind: "invalid",
      message: "«Tiendas» ya está en español: la traducción tiene que ser a otro idioma.",
    });
  });

  it("explains a source that does not exist or is not a valid id, without looking up an invalid one", async () => {
    const lookups: string[] = [];
    const tracked = async (id: string) => {
      lookups.push(id);
      return find(id);
    };
    for (const traducir of ["missing", "", "x".repeat(500)]) {
      expect(await resolveTranslationRequest({ traducir, idioma: "en" }, tracked), traducir).toEqual({
        kind: "invalid",
        message: "La landing que quieres traducir no existe. Vuelve a las landings y elige otra.",
      });
    }
    expect(lookups).toEqual(["missing"]);
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
