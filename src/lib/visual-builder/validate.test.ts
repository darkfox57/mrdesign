import { describe, expect, it } from "vitest";
import { imageHostErrors } from "./images";
import { validateBuilderData } from "./validate";

// Control characters and backslashes are built from char codes: editors and tooling can collapse
// escape sequences written in source.
const BACKSLASH = String.fromCharCode(92);
const TAB = String.fromCharCode(9);
const NEWLINE = String.fromCharCode(10);
const NUL = String.fromCharCode(0);

const IMAGE = "https://media.example.com/bucket/media/abc.png";

type Block = { type: string; props: Record<string, unknown> };

// One valid block of each type, with every field the schema requires.
const blocks = {
  Hero: (): Block => ({
    type: "Hero",
    props: {
      id: "hero",
      eyebrow: "Desarrollo web",
      title: "Tu tienda en línea, lista para vender",
      lead: "Diseño y desarrollo a la medida.",
      primaryLabel: "Cuéntame tu proyecto",
      primaryHref: "/contacto",
      secondaryLabel: "Ver servicios",
      secondaryHref: "/servicios",
      background: "paper",
      side: [],
    },
  }),
  Cards: (): Block => ({
    type: "Cards",
    props: {
      id: "cards",
      title: "Lo que cambia",
      intro: "",
      background: "surface",
      columns: "3",
      items: [{ title: "Rápida", text: "Carga en menos de dos segundos." }],
    },
  }),
  Faq: (): Block => ({
    type: "Faq",
    props: { id: "faq", title: "Preguntas frecuentes", background: "paper", items: [{ question: "¿Cuánto tarda?", answer: "Depende del alcance." }] },
  }),
  Columns: (): Block => ({
    type: "Columns",
    props: { id: "cols", ratio: "1-1", background: "paper", left: [], right: [] },
  }),
  TextImage: (): Block => ({
    type: "TextImage",
    props: {
      id: "ti",
      title: "Un sitio que se administra solo",
      text: "Un párrafo.",
      imageUrl: IMAGE,
      imageAlt: "Captura del panel",
      imageSide: "right",
      background: "paper",
    },
  }),
  Button: (): Block => ({
    type: "Button",
    props: { id: "btn", label: "Hablemos", href: "/contacto", variant: "primary", align: "left" },
  }),
  Cta: (): Block => ({
    type: "Cta",
    props: { id: "cta", title: "¿Empezamos?", text: "", buttonLabel: "Escríbeme", buttonHref: "mailto:contacto@mrdesign.agency", background: "brand" },
  }),
};

type BlockName = keyof typeof blocks;

// The link field of each block that has one; TextImage has none (its image is checked apart).
const LINK_FIELD: Partial<Record<BlockName, string>> = {
  Hero: "primaryHref",
  Button: "href",
  Cta: "buttonHref",
};

const page = (...content: Block[]) => ({ root: { props: {} }, content });

describe("validateBuilderData: each block schema", () => {
  for (const name of Object.keys(blocks) as BlockName[]) {
    describe(name, () => {
      it("accepts valid data", () => {
        const result = validateBuilderData(page(blocks[name]()));
        expect(result.success, JSON.stringify(!result.success && result.errors)).toBe(true);
      });

      it("rejects an unknown field", () => {
        const block = blocks[name]();
        block.props.className = "text-red-500";
        const result = validateBuilderData(page(block));
        expect(result.success).toBe(false);
      });

      it("rejects an unsafe link", () => {
        const block = blocks[name]();
        const field = LINK_FIELD[name];
        if (field) {
          block.props[field] = "javascript:alert(1)";
          const result = validateBuilderData(page(block));
          expect(!result.success && result.errors.join(" ")).toContain("enlace no permitido");
          return;
        }
        // Blocks without a link of their own: Columns gets it through a Button it holds, TextImage
        // through its image URL.
        if (name === "Columns") {
          const button = blocks.Button();
          button.props.href = "javascript:alert(1)";
          block.props.left = [button];
        } else if (name === "TextImage") {
          block.props.imageUrl = "javascript:alert(1)";
        } else {
          // Cards and Faq have no link fields at all: a link smuggled in as an extra field is refused.
          block.props.href = "javascript:alert(1)";
        }
        expect(validateBuilderData(page(block)).success).toBe(false);
      });
    });
  }

  it("accepts every variant of each block", () => {
    const variants: [BlockName, string, string[]][] = [
      ["Hero", "background", ["paper", "ink"]],
      ["Cards", "background", ["paper", "surface", "ink"]],
      ["Cards", "columns", ["2", "3"]],
      ["Faq", "background", ["paper", "surface"]],
      ["Columns", "ratio", ["1-1", "2-1", "1-2"]],
      ["Columns", "background", ["paper", "surface", "ink"]],
      ["TextImage", "imageSide", ["left", "right"]],
      ["TextImage", "background", ["paper", "surface", "ink"]],
      ["Button", "variant", ["primary", "secondary"]],
      ["Button", "align", ["left", "center"]],
      ["Cta", "background", ["brand", "ink"]],
    ];
    for (const [name, field, values] of variants) {
      for (const value of values) {
        const block = blocks[name]();
        block.props[field] = value;
        expect(validateBuilderData(page(block)).success, `${name}.${field}=${value}`).toBe(true);
      }
      const block = blocks[name]();
      block.props[field] = "custom";
      expect(validateBuilderData(page(block)).success, `${name}.${field}=custom`).toBe(false);
    }
  });
});

describe("validateBuilderData: links and images", () => {
  it("accepts relative, anchor, https and mailto links, and an empty one", () => {
    for (const href of ["/contacto", "#faq", "https://mrdesign.agency", "mailto:contacto@mrdesign.agency", ""]) {
      const button = blocks.Button();
      button.props.href = href;
      expect(validateBuilderData(page(button)).success, href).toBe(true);
    }
  });

  it("rejects javascript:, data:, plain http and protocol-relative links", () => {
    for (const href of ["javascript:alert(1)", " JavaScript:alert(1)", "http://inseguro.com", "data:text/html,x", "//evil.com"]) {
      const button = blocks.Button();
      button.props.href = href;
      expect(validateBuilderData(page(button)).success, href).toBe(false);
    }
  });

  it("rejects links that browsers resolve off-site through a backslash or control characters", () => {
    for (const href of [`/${BACKSLASH}evil.com`, `/${TAB}/evil.com`, `/${NEWLINE}/evil.com`, `/${BACKSLASH}/evil.com`, `/ok${NUL}`]) {
      const button = blocks.Button();
      button.props.href = href;
      expect(validateBuilderData(page(button)).success, JSON.stringify(href)).toBe(false);
    }
  });

  it("accepts an empty image and rejects one that is not https or has spaces or control characters", () => {
    const empty = blocks.TextImage();
    empty.props.imageUrl = "";
    expect(validateBuilderData(page(empty)).success).toBe(true);
    for (const imageUrl of ["http://x.com/a.png", "https://x.com/a b.png", `https://x.com/a${NUL}b.png`, "data:image/png;base64,x"]) {
      const block = blocks.TextImage();
      block.props.imageUrl = imageUrl;
      expect(validateBuilderData(page(block)).success, JSON.stringify(imageUrl)).toBe(false);
    }
  });
});

describe("validateBuilderData: slots, limits and shape", () => {
  it("accepts text with an image and a button inside columns and inside the hero's side", () => {
    const columns = blocks.Columns();
    columns.props.left = [blocks.TextImage()];
    columns.props.right = [blocks.Button()];
    const hero = blocks.Hero();
    hero.props.side = [blocks.TextImage()];
    expect(validateBuilderData(page(hero, columns)).success).toBe(true);
  });

  it("rejects a block in a slot that does not allow it", () => {
    const columns = blocks.Columns();
    columns.props.left = [blocks.Faq()];
    const result = validateBuilderData(page(columns));
    expect(!result.success && result.errors).toContain("Bloque 1 > left 1: Faq no va en este lugar.");
  });

  it("validates blocks nested in slots", () => {
    const columns = blocks.Columns();
    const button = blocks.Button();
    button.props.variant = "ghost";
    columns.props.right = [button];
    expect(validateBuilderData(page(columns)).success).toBe(false);
  });

  it("rejects a block type the builder does not have, DatiHub blocks included", () => {
    for (const type of ["Script", "Conversation", "Modules", "CaseStudy"]) {
      const result = validateBuilderData(page({ type, props: { id: "x" } }));
      expect(!result.success && result.errors, type).toContain(`Bloque 1: tipo de bloque desconocido (${type}).`);
    }
  });

  it("rejects a block without an id", () => {
    const button = blocks.Button();
    delete button.props.id;
    expect(validateBuilderData(page(button)).success).toBe(false);
  });

  it("accepts 100 blocks and rejects 101", () => {
    const many = (count: number) => Array.from({ length: count }, (_, index) => ({ ...blocks.Button(), props: { ...blocks.Button().props, id: `b${index}` } }));
    expect(validateBuilderData(page(...many(100))).success).toBe(true);
    const result = validateBuilderData(page(...many(101)));
    expect(!result.success && result.errors).toEqual(["La página tiene más de 100 bloques."]);
  });

  it("rejects nesting past three levels", async () => {
    // No block allows a container in its slots today, so the depth limit is checked with a stand-in
    // registry entry: a Columns block whose slots accept Columns again.
    const { BLOCKS } = await import("./validate");
    const original = BLOCKS.Columns.slots;
    BLOCKS.Columns.slots = { left: ["Columns", "Button"], right: ["Columns", "Button"] };
    try {
      const level = (depth: number): Block => {
        const columns = blocks.Columns();
        columns.props.left = depth > 1 ? [level(depth - 1)] : [blocks.Button()];
        return columns;
      };
      // Three levels: columns > columns > columns. The button inside the third would be a fourth.
      const three = blocks.Columns();
      three.props.left = [{ ...blocks.Columns(), props: { ...blocks.Columns().props, left: [blocks.Columns()] } }];
      expect(validateBuilderData(page(three)).success).toBe(true);
      const result = validateBuilderData(page(level(3)));
      expect(!result.success && result.errors.join(" ")).toContain("demasiados niveles de bloques anidados");
    } finally {
      BLOCKS.Columns.slots = original;
    }
  });

  it("rejects something that is not a page", () => {
    expect(validateBuilderData("nope").success).toBe(false);
    expect(validateBuilderData({ content: "x" }).success).toBe(false);
  });

  it("rejects block types that are object built-ins instead of throwing", () => {
    for (const type of ["toString", "constructor", "__proto__", "hasOwnProperty"]) {
      expect(validateBuilderData({ content: [{ type, props: { id: "x" } }] }).success, type).toBe(false);
    }
  });

  it("stores only what the schemas describe: extra keys on a block object are dropped", () => {
    const block = { ...blocks.Button(), junk: "x" };
    const result = validateBuilderData(page(block));
    expect(result.success && Object.keys(result.data.content[0])).toEqual(["type", "props"]);
  });

  it("accepts the page fields as root props and rejects unknown ones", () => {
    expect(validateBuilderData({ root: { props: { title: "T", slug: "t", seoTitle: "", seoDescription: "" } }, content: [] }).success).toBe(true);
    expect(validateBuilderData({ root: { props: { title: "T", onload: "x" } }, content: [] }).success).toBe(false);
  });
});

describe("imageHostErrors path check", () => {
  const prefixes = ["https://media.example.com/bucket/media/"];
  const page = (imageUrl: string) => ({
    content: [{ type: "TextImage", props: { id: "a", title: "", text: "", imageUrl, imageAlt: "", imageSide: "left", background: "paper" } }],
  });

  it("rejects a library URL that walks out of the prefix", () => {
    expect(imageHostErrors(page(IMAGE), prefixes)).toEqual([]);
    const outside = "https://media.example.com/bucket/media/../private/x.png";
    expect(imageHostErrors(page(outside), prefixes)).toEqual([`Imagen ${outside}: elige una imagen de la biblioteca.`]);
  });
});
