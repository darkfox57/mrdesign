import { describe, expect, it } from "vitest";
import { localizeHref } from "./links";

describe("localizeHref", () => {
  it("keeps Spanish paths as they are (Spanish has no prefix)", () => {
    expect(localizeHref("/contacto", "es")).toBe("/contacto");
    expect(localizeHref("/servicios", "es")).toBe("/servicios");
  });

  it("translates the site's own pages for English, with the language prefix", () => {
    expect(localizeHref("/contacto", "en")).toBe("/en/contact");
    expect(localizeHref("/servicios", "en")).toBe("/en/services");
    expect(localizeHref("/blog", "en")).toBe("/en/blog");
    expect(localizeHref("/", "en")).toBe("/en");
  });

  it("keeps anchors and query strings on translated pages", () => {
    expect(localizeHref("/portafolio#tiendas", "en")).toBe("/en/portfolio#tiendas");
    expect(localizeHref("/contacto?origen=landing", "en")).toBe("/en/contact?origen=landing");
  });

  it("leaves external links, mail links, anchors and unknown or dynamic paths untouched", () => {
    for (const href of ["https://mrdesign.agency/x", "mailto:contacto@mrdesign.agency", "#faq", "/blog/un-post", "/ruta-que-no-existe", ""]) {
      expect(localizeHref(href, "en"), href).toBe(href);
    }
  });
});
