import { describe, expect, it } from "vitest";
import { parsePostForm } from "./post-form";

const base = {
  locale: "es",
  title: "Cómo un agente de IA atiende WhatsApp",
  slug: "",
  excerpt: "Resumen del post.",
  content: "<p>Hola</p>",
  coverImageUrl: "",
  coverImageAlt: "",
  seoTitle: "",
  seoDescription: "",
  categoryIds: [] as string[],
};

describe("parsePostForm", () => {
  it("derives the slug from the title when it is left empty", () => {
    const parsed = parsePostForm(base);
    expect(parsed.success && parsed.data.slug).toBe("como-un-agente-de-ia-atiende-whatsapp");
  });

  it("normalizes a slug the user typed", () => {
    const parsed = parsePostForm({ ...base, slug: "Mi Post Ñandú" });
    expect(parsed.success && parsed.data.slug).toBe("mi-post-nandu");
  });

  it("sanitizes the content before it can be stored", () => {
    const parsed = parsePostForm({
      ...base,
      content: '<h1>Título</h1><p onclick="x()">Texto<script>alert(1)</script></p><img src="http://inseguro.com/a.png">',
    });
    expect(parsed.success && parsed.data.content).toBe("<h2>Título</h2><p>Texto</p>");
  });

  it("rejects a post without text in the content", () => {
    const parsed = parsePostForm({ ...base, content: "<p></p><p> </p>" });
    expect(parsed.success).toBe(false);
    expect(!parsed.success && parsed.fieldErrors.content).toBe("Escribe el contenido del post.");
  });

  it("keeps images as content", () => {
    const parsed = parsePostForm({ ...base, content: '<p><img src="https://img.example.com/media/a.png" alt="A"></p>' });
    expect(parsed.success).toBe(true);
  });

  it("requires the title and the excerpt and limits the SEO description to 160 characters", () => {
    const parsed = parsePostForm({ ...base, title: " ", excerpt: "", seoDescription: "x".repeat(161) });
    expect(!parsed.success && parsed.fieldErrors).toMatchObject({
      title: "Escribe el título.",
      excerpt: "Escribe el resumen.",
      seoDescription: "Máximo 160 caracteres.",
    });
  });

  it("accepts only https cover images and turns empty optional fields into null", () => {
    expect(parsePostForm({ ...base, coverImageUrl: "http://img.example.com/a.png" }).success).toBe(false);
    const parsed = parsePostForm({ ...base, coverImageUrl: "https://img.example.com/a.png", coverImageAlt: "Portada" });
    expect(parsed.success && parsed.data).toMatchObject({
      coverImageUrl: "https://img.example.com/a.png",
      coverImageAlt: "Portada",
      seoTitle: null,
      seoDescription: null,
    });
  });

  it("rejects an unknown language", () => {
    expect(parsePostForm({ ...base, locale: "de" }).success).toBe(false);
  });
});

describe("cover image origin", () => {
  const prefixes = ["https://img.example.com/media/", "https://res.cloudinary.com/ddnsuo8dz/"];

  it("accepts covers from the library or the site's Cloudinary account", () => {
    for (const coverImageUrl of ["https://img.example.com/media/a.png", "https://res.cloudinary.com/ddnsuo8dz/image/upload/a.jpg"]) {
      expect(parsePostForm({ ...base, coverImageUrl }, { coverPrefixes: prefixes }).success, coverImageUrl).toBe(true);
    }
  });

  it("rejects a cover from anywhere else, since the public pages could not render it", () => {
    for (const coverImageUrl of ["https://evil.example.com/a.png", "https://img.example.com/otra/a.png", "https://img.example.com.evil.com/media/a.png"]) {
      const parsed = parsePostForm({ ...base, coverImageUrl }, { coverPrefixes: prefixes });
      expect(!parsed.success && parsed.fieldErrors.coverImageUrl, coverImageUrl).toBe("Elige la portada desde la biblioteca de imágenes.");
    }
  });
});

