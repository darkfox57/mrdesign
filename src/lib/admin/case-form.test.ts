import { describe, expect, it } from "vitest";
import { CLIENT_AUTHORIZATION_REQUIRED, caseToFormInput, parseCaseForm, type CaseFormInput } from "./case-form";

const LIBRARY = "https://img.test/media/";
const image = (n: number) => `${LIBRARY}${String(n).padStart(64, "0")}.png`;

const empty: CaseFormInput = {
  locale: "es",
  title: "",
  client: "",
  year: "",
  slug: "",
  lines: [],
  summary: "",
  challenge: "",
  solution: "",
  result: "",
  metrics: [],
  stack: "",
  websiteUrl: "",
  coverImageUrl: "",
  coverImageAlt: "",
  gallery: [],
  clientAuthorized: false,
  featured: false,
  sortOrder: "",
  seoTitle: "",
  seoDescription: "",
};

const complete: CaseFormInput = {
  ...empty,
  title: "Una tienda que vende sola",
  client: "Le Coq Sportif",
  year: "2024",
  lines: ["shopify", "plugins"],
  summary: "Migré la tienda a Shopify y conecté el inventario.",
  challenge: "El inventario vivía en hojas de cálculo.",
  solution: "Un plugin que sincroniza el ERP con la tienda.",
  result: "La tienda se actualiza sola cada hora.",
  coverImageUrl: image(1),
  coverImageAlt: "Tenis blancos en la portada de la tienda",
  clientAuthorized: true,
};

const draft = (input: Partial<CaseFormInput>) => parseCaseForm({ ...empty, client: "Cliente", ...input }, { mode: "draft", libraryPrefixes: [LIBRARY] });
const publish = (input: Partial<CaseFormInput>) => parseCaseForm({ ...complete, ...input }, { mode: "publish", libraryPrefixes: [LIBRARY] });
const errorsOf = (result: ReturnType<typeof parseCaseForm>) => (result.success ? {} : result.fieldErrors);

describe("parseCaseForm", () => {
  it("saves a draft with every text field empty, the slug from the client", () => {
    const result = draft({});
    expect(result).toMatchObject({
      success: true,
      data: { slug: "cliente", title: "", summary: "", challenge: "", solution: "", result: "", lines: [], coverImageUrl: null, year: null },
    });
  });

  it("needs a title, client or slug to build the slug of a draft", () => {
    expect(errorsOf(parseCaseForm(empty, { mode: "draft", libraryPrefixes: [LIBRARY] }))).toEqual({
      slug: "Escribe el título, el cliente o el slug.",
    });
  });

  it("normalizes the slug, from the title before the client", () => {
    expect(draft({ title: "Tienda Ágil", slug: "" })).toMatchObject({ data: { slug: "tienda-agil" } });
    expect(draft({ slug: "Mi Caso Ñandú" })).toMatchObject({ data: { slug: "mi-caso-nandu" } });
  });

  it("publishes a complete, authorized case", () => {
    expect(publish({})).toMatchObject({ success: true, data: { clientAuthorized: true, lines: ["shopify", "plugins"], year: 2024 } });
  });

  it("refuses to publish without the client's authorization", () => {
    expect(errorsOf(publish({ clientAuthorized: false }))).toEqual({ clientAuthorized: CLIENT_AUTHORIZATION_REQUIRED });
    expect(CLIENT_AUTHORIZATION_REQUIRED).toBe("Para publicar, el cliente tiene que haber autorizado el caso.");
  });

  it("refuses to publish without every required text, a line, and a cover with its alt text", () => {
    expect(
      errorsOf(publish({ title: "", client: " ", summary: "", challenge: "", solution: "", result: "", lines: [], coverImageUrl: "", coverImageAlt: "" })),
    ).toEqual({
      title: "Escribe el título.",
      client: "Escribe el cliente.",
      summary: "Escribe el resumen.",
      challenge: "Escribe el reto.",
      solution: "Escribe la solución.",
      result: "Escribe el resultado.",
      lines: "Elige al menos una línea de trabajo.",
      coverImageUrl: "Elige la portada.",
      coverImageAlt: "Escribe el texto alternativo de la portada.",
      slug: "Escribe el título, el cliente o el slug.",
    });
  });

  it("accepts only known line ids, once each, in the canonical order", () => {
    expect(draft({ lines: ["plugins", "websites", "plugins"] })).toMatchObject({ data: { lines: ["websites", "plugins"] } });
    expect(errorsOf(draft({ lines: ["websites", "seo"] }))).toEqual({ lines: "Elige líneas de trabajo de la lista." });
  });

  it("keeps up to 6 complete metrics, drops empty rows and refuses incomplete ones", () => {
    const metric = { label: "Pedidos al mes", value: "+40 %", source: "Informe de Shopify, enero 2025" };
    expect(draft({ metrics: [metric, { label: "", value: " ", source: "" }] })).toMatchObject({ data: { metrics: [metric] } });
    expect(errorsOf(draft({ metrics: [{ ...metric, source: "" }] }))).toEqual({
      metrics: "Cada métrica necesita nombre, valor y cómo se verifica.",
    });
    expect(errorsOf(draft({ metrics: Array.from({ length: 7 }, () => metric) }))).toEqual({ metrics: "Máximo 6 métricas." });
  });

  it("keeps up to 12 gallery images from the library, each with alt text to publish", () => {
    expect(draft({ gallery: [{ url: image(2), alt: "" }, { url: "", alt: "" }] })).toMatchObject({ data: { gallery: [{ url: image(2), alt: "" }] } });
    expect(errorsOf(draft({ gallery: [{ url: "https://elsewhere.test/a.png", alt: "A" }] }))).toEqual({
      gallery: "Elige las imágenes de la galería desde la biblioteca.",
    });
    expect(errorsOf(draft({ gallery: Array.from({ length: 13 }, (_, n) => ({ url: image(n + 2), alt: "A" })) }))).toEqual({
      gallery: "Máximo 12 imágenes en la galería.",
    });
    expect(errorsOf(publish({ gallery: [{ url: image(2), alt: "" }] }))).toEqual({
      gallery: "Escribe el texto alternativo de cada imagen de la galería.",
    });
  });

  it("takes the cover from the library only", () => {
    expect(errorsOf(draft({ coverImageUrl: "https://elsewhere.test/a.png" }))).toEqual({
      coverImageUrl: "Elige la portada desde la biblioteca de imágenes.",
    });
  });

  it("accepts only an https website", () => {
    expect(draft({ websiteUrl: "https://lecoqsportif.com.co" })).toMatchObject({ data: { websiteUrl: "https://lecoqsportif.com.co" } });
    expect(errorsOf(draft({ websiteUrl: "http://lecoqsportif.com.co" }))).toEqual({ websiteUrl: "El sitio tiene que ser una URL https." });
    expect(errorsOf(draft({ websiteUrl: "javascript:alert(1)" }))).toEqual({ websiteUrl: "El sitio tiene que ser una URL https." });
  });

  it("splits the stack by commas or lines, once each", () => {
    expect(draft({ stack: "Shopify, Liquid\nNode.js, shopify" })).toMatchObject({ data: { stack: ["Shopify", "Liquid", "Node.js"] } });
  });

  it("reads the year and the order as whole numbers", () => {
    expect(draft({ year: "2023", sortOrder: "3" })).toMatchObject({ data: { year: 2023, sortOrder: 3 } });
    expect(errorsOf(draft({ year: "20x3" }))).toEqual({ year: "Escribe un año entre 1990 y 2100." });
    expect(errorsOf(draft({ sortOrder: "1.5" }))).toEqual({ sortOrder: "Escribe un número entero." });
  });
});

describe("caseToFormInput", () => {
  it("turns a stored case back into what the form sends, so it parses the same", () => {
    const parsed = publish({ metrics: [{ label: "L", value: "V", source: "S" }], gallery: [{ url: image(3), alt: "G" }], stack: "Shopify" });
    if (!parsed.success) throw new Error("expected a valid case");
    const input = caseToFormInput({ ...parsed.data, metrics: parsed.data.metrics, gallery: parsed.data.gallery });
    expect(parseCaseForm(input, { mode: "publish", libraryPrefixes: [LIBRARY] })).toEqual(parsed);
  });

  it("reads malformed stored metrics or gallery as empty", () => {
    const parsed = draft({});
    if (!parsed.success) throw new Error("expected a valid case");
    expect(caseToFormInput({ ...parsed.data, metrics: "nope", gallery: [{ url: 1 }] })).toMatchObject({ metrics: [], gallery: [] });
  });
});

describe("caseFormInputFromFormData", () => {
  it("reads the repeated metric and gallery rows and the checkboxes", async () => {
    const { caseFormInputFromFormData } = await import("./case-form");
    const form = new FormData();
    form.set("client", "Cliente");
    form.append("lines", "shopify");
    form.append("metricLabel", "Pedidos");
    form.append("metricValue", "+40 %");
    form.append("metricSource", "Informe");
    form.append("galleryUrl", image(4));
    form.append("galleryAlt", "Ficha de producto");
    form.set("clientAuthorized", "on");
    expect(caseFormInputFromFormData(form)).toMatchObject({
      client: "Cliente",
      lines: ["shopify"],
      metrics: [{ label: "Pedidos", value: "+40 %", source: "Informe" }],
      gallery: [{ url: image(4), alt: "Ficha de producto" }],
      clientAuthorized: true,
      featured: false,
    });
  });
});
