import { describe, expect, it } from "vitest";
import { imageHostErrors } from "./images";
import { parsePageFields } from "./page-fields";
import { validateBuilderData } from "./validate";

const fields = { title: "Tiendas Shopify", slug: "Tiendas Shopify", seoTitle: "", seoDescription: "Tu tienda lista para vender" };

describe("parsePageFields", () => {
  it("returns the landing columns with a normalized slug and empty SEO texts as null", () => {
    expect(parsePageFields(fields)).toEqual({
      success: true,
      data: { title: "Tiendas Shopify", slug: "tiendas-shopify", seoTitle: null, seoDescription: "Tu tienda lista para vender" },
    });
  });

  it("names the page field to fix when the title or slug is empty or a text is too long", () => {
    const result = parsePageFields({ ...fields, title: " ", slug: "¿?", seoTitle: "x".repeat(71), seoDescription: "x".repeat(161) });
    expect(result).toEqual({
      success: false,
      errors: [
        "Título de la página: no puede quedar vacío.",
        "Slug: no puede quedar vacío.",
        "Título SEO: máximo 70 caracteres.",
        "Descripción SEO: máximo 160 caracteres.",
      ],
    });
  });
});

describe("validateBuilderData root props", () => {
  const page = () => ({ root: { props: {} }, content: [] });

  it("accepts the page fields as root props and rejects unknown ones or texts over the limit", () => {
    const valid = { ...page(), root: { props: fields } };
    expect(validateBuilderData(valid).success).toBe(true);
    expect(validateBuilderData({ ...page(), root: { props: { ...fields, other: "x" } } }).success).toBe(false);
    expect(validateBuilderData({ ...page(), root: { props: { ...fields, seoTitle: "x".repeat(71) } } }).success).toBe(false);
  });
});

describe("imageHostErrors", () => {
  const textImage = (id: string, imageUrl: string) => ({
    type: "TextImage",
    props: { id, title: "", text: "", imageUrl, imageAlt: "", imageSide: "left", background: "paper" },
  });
  const prefixes = ["https://media.example/bucket/media/"];

  it("accepts library images and empty images, and rejects other hosts at any depth", () => {
    const page = {
      root: { props: {} },
      content: [
        textImage("a", "https://media.example/bucket/media/one.webp"),
        textImage("b", ""),
        textImage("c", "https://evil.example/x.png"),
        {
          type: "Columns",
          props: { id: "d", ratio: "1-1", background: "paper", left: [textImage("e", "https://evil.example/y.png")], right: [] },
        },
      ],
    };
    expect(imageHostErrors(page, prefixes)).toEqual([
      "Imagen https://evil.example/x.png: elige una imagen de la biblioteca.",
      "Imagen https://evil.example/y.png: elige una imagen de la biblioteca.",
    ]);
  });
});
