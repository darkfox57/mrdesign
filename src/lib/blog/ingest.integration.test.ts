// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

vi.mock("server-only", () => ({}));
const revalidatePath = vi.fn();
vi.mock("next/cache", () => ({ revalidatePath }));
// next-intl's navigation does not load under vitest (it imports "next/navigation" without an
// extension). This stand-in gives the same paths as the real one for the blog routes (es
// unprefixed unless forcePrefix, en under /en), checked against next-intl 4.16.
type Href = string | { pathname: string; params: { slug: string } };
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ locale, href, forcePrefix }: { locale: string; href: Href; forcePrefix?: boolean }) => {
    const path = typeof href === "string" ? href : href.pathname.replace("[slug]", href.params.slug);
    return `${forcePrefix || locale !== "es" ? `/${locale}` : ""}${path}`;
  },
}));

const COVERS = "https://img.ingest.test";
process.env.R2_PUBLIC_URL = COVERS;

const { db } = await import("../db");
const { isLocalDatabase } = await import("../is-local-database");
const { generateApiKey } = await import("../api-keys");
const { siteUrl } = await import("../seo/site");
const { authenticateKey, ingestPost } = await import("./ingest");

// These tests create and delete rows: they only run against a local database (docker compose).
const runAgainstDatabase = isLocalDatabase(process.env.DATABASE_URL);
const title = runAgainstDatabase ? "blog ingest" : "blog ingest (skipped: DATABASE_URL is not the local docker database, see .env.example)";
const run = `ingest-${Date.now()}`;

async function newKey(options: { publishImmediately: boolean; revoked?: boolean }) {
  const { key, prefix, keyHash } = generateApiKey();
  await db.apiKey.create({
    data: { name: `${run} key`, prefix, keyHash, publishImmediately: options.publishImmediately, revokedAt: options.revoked ? new Date() : null },
  });
  return key;
}

async function authenticated(options: { publishImmediately: boolean }) {
  const key = await authenticateKey(await newKey(options));
  if (!key) throw new Error("the key did not authenticate");
  return key;
}

const body = (slug: string, extra: Record<string, unknown> = {}) => ({
  title: "Cómo elegir una tienda online",
  slug,
  description: "Qué mirar antes de elegir Shopify o PrestaShop.",
  content: "<p>Contenido del post.</p>",
  ...extra,
});

describe.skipIf(!runAgainstDatabase)(title, () => {
  let publisher: Awaited<ReturnType<typeof authenticated>>;
  let drafter: Awaited<ReturnType<typeof authenticated>>;

  beforeAll(async () => {
    publisher = await authenticated({ publishImmediately: true });
    drafter = await authenticated({ publishImmediately: false });
  });

  beforeEach(() => {
    revalidatePath.mockClear();
  });

  afterAll(async () => {
    await db.post.deleteMany({ where: { slug: { startsWith: run } } });
    await db.category.deleteMany({ where: { slug: { startsWith: run } } });
    await db.tag.deleteMany({ where: { slug: { startsWith: run } } });
    await db.apiKey.deleteMany({ where: { name: { startsWith: run } } });
  });

  describe("authenticateKey", () => {
    it("accepts an active key and rejects a missing, unknown or revoked one", async () => {
      expect(await authenticateKey(await newKey({ publishImmediately: true }))).toMatchObject({ publishImmediately: true });
      expect(await authenticateKey(null)).toBeNull();
      expect(await authenticateKey(generateApiKey().key)).toBeNull();
      expect(await authenticateKey(await newKey({ publishImmediately: true, revoked: true }))).toBeNull();
    });
  });

  it("publishes the post when the key publishes immediately, records the key use and revalidates the blog", async () => {
    const slug = `${run}-publicado`;
    const result = await ingestPost(publisher, body(slug, { tags: `${run} tienda, ${run} shopify`, categories: [`${run} Comercio`, { name: `${run} Comercio` }] }));

    expect(result).toEqual({
      status: 201,
      body: { id: expect.any(String), slug, locale: "es", status: "PUBLISHED", url: `${siteUrl}/blog/${slug}` },
    });
    const post = await db.post.findUniqueOrThrow({
      where: { locale_slug: { locale: "es", slug } },
      include: { tags: { select: { name: true } }, categories: { select: { name: true } } },
    });
    expect(post).toMatchObject({ status: "PUBLISHED", source: "API" });
    expect(post.publishedAt).toBeInstanceOf(Date);
    expect(post.tags.map((tag) => tag.name).sort()).toEqual([`${run} shopify`, `${run} tienda`]);
    expect(post.categories.map((category) => category.name)).toEqual([`${run} Comercio`]);
    expect((await db.apiKey.findUniqueOrThrow({ where: { id: publisher.id } })).lastUsedAt).toBeInstanceOf(Date);
    // The same paths the dashboard revalidates: each locale's blog route as a layout.
    expect(revalidatePath.mock.calls).toEqual([
      ["/es/blog", "layout"],
      ["/en/blog", "layout"],
    ]);
  });

  it("leaves the post as a draft when the key is in draft mode", async () => {
    const slug = `${run}-borrador`;
    const result = await ingestPost(drafter, body(slug, { locale: "en" }));

    expect(result).toMatchObject({ status: 201, body: { slug, locale: "en", status: "DRAFT", url: `${siteUrl}/en/blog/${slug}` } });
    const post = await db.post.findUniqueOrThrow({ where: { locale_slug: { locale: "en", slug } } });
    expect(post.status).toBe("DRAFT");
    expect(post.publishedAt).toBeNull();
    expect((await db.apiKey.findUniqueOrThrow({ where: { id: drafter.id } })).lastUsedAt).toBeInstanceOf(Date);
  });

  it("sanitizes unsafe HTML before storing it", async () => {
    const slug = `${run}-html`;
    const content = '<p onclick="steal()">Hola</p><script>alert(1)</script><img src="javascript:alert(1)"><a href="javascript:alert(1)">enlace</a>';
    const result = await ingestPost(drafter, body(slug, { content }));

    expect(result.status).toBe(201);
    const stored = (await db.post.findUniqueOrThrow({ where: { locale_slug: { locale: "es", slug } } })).content;
    expect(stored).toContain("Hola");
    expect(stored).not.toMatch(/<script|onclick|javascript:/i);
  });

  it("accepts a cover from the image library and rejects one from anywhere else", async () => {
    const inside = await ingestPost(drafter, body(`${run}-portada`, { img: `${COVERS}/media/2026/foto.webp`, imgAlt: "Una tienda" }));
    expect(inside.status).toBe(201);

    const outside = await ingestPost(drafter, body(`${run}-portada-externa`, { img: "https://example.com/foto.webp" }));
    expect(outside).toEqual({
      status: 400,
      body: { error: "Datos inválidos.", fields: { img: "La portada tiene que estar en la biblioteca de imágenes del panel." } },
    });
    expect(await db.post.count({ where: { slug: `${run}-portada-externa` } })).toBe(0);

    // An http cover fails before the library check, with its own message (docs/api-blog.md).
    const http = await ingestPost(drafter, body(`${run}-portada-http`, { img: `${COVERS.replace("https:", "http:")}/media/2026/foto.webp` }));
    expect(http).toEqual({ status: 400, body: { error: "Datos inválidos.", fields: { img: "La portada tiene que ser una URL https." } } });
    expect(await db.post.count({ where: { slug: `${run}-portada-http` } })).toBe(0);
  });

  it("rejects a slug another post of the same language already uses, and allows it in the other language", async () => {
    const slug = `${run}-repetido`;
    expect((await ingestPost(drafter, body(slug))).status).toBe(201);

    const again = await ingestPost(drafter, body(slug));
    expect(again).toEqual({
      status: 400,
      body: { error: "Datos inválidos.", fields: { slug: "Ya existe un post con ese slug en este idioma." } },
    });
    expect(await db.post.count({ where: { locale: "es", slug } })).toBe(1);

    expect(await ingestPost(drafter, body(slug, { locale: "en" }))).toMatchObject({ status: 201, body: { slug, locale: "en" } });
  });

  it("names the field that failed, with the API's field names", async () => {
    expect(await ingestPost(drafter, [])).toEqual({ status: 400, body: { error: "Datos inválidos.", fields: { body: "El cuerpo tiene que ser un objeto JSON." } } });

    const missing = await ingestPost(drafter, { content: "<p>Algo</p>", locale: "fr" });
    expect(missing).toMatchObject({ status: 400, body: { fields: { title: "Escribe el título.", description: "Escribe el resumen.", locale: "Elige un idioma." } } });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("names each field that has the wrong JSON type", async () => {
    const slug = `${run}-tipos`;
    const result = await ingestPost(drafter, { ...body(slug), title: 123, content: true, tags: ["a", 1], categories: "Ecommerce" });
    expect(result).toEqual({
      status: 400,
      body: {
        error: "Datos inválidos.",
        fields: {
          title: "Tiene que ser texto.",
          content: "Tiene que ser texto.",
          tags: "Usa texto separado por comas o una lista de textos.",
          categories: "Usa una lista de nombres.",
        },
      },
    });
    expect(await db.post.count({ where: { slug } })).toBe(0);
  });

  it("rejects tags and categories it would have to drop or cut, instead of storing fewer", async () => {
    const slug = `${run}-terminos`;
    const tooMany = Array.from({ length: 21 }, (_, index) => `${run} etiqueta ${index}`);
    expect(await ingestPost(drafter, body(slug, { tags: tooMany }))).toEqual({
      status: 400,
      body: { error: "Datos inválidos.", fields: { tags: "Máximo 20 etiquetas." } },
    });
    expect(await ingestPost(drafter, body(slug, { tags: [`${run} buena`, " "], categories: [{ nombre: "x" }] }))).toEqual({
      status: 400,
      body: {
        error: "Datos inválidos.",
        fields: {
          tags: "Cada etiqueta necesita un nombre con letras o números, de hasta 60 caracteres.",
          categories: "Cada categoría necesita un nombre con letras o números, de hasta 60 caracteres.",
        },
      },
    });
    expect(await db.post.count({ where: { slug } })).toBe(0);
    expect(await db.tag.count({ where: { name: `${run} buena` } })).toBe(0);
  });

  it("answers 201 or 400 to parallel requests creating the same new tag and category, and stores each term once", async () => {
    // Real parallel ingests through the real transaction: the requests that lose the race for a
    // new term answer 400 and leave nothing behind, not even their own new tag.
    for (let round = 0; round < 4; round++) {
      const tag = `${run} paralela ${round}`;
      const category = `${run} Paralela ${round}`;
      const requests = [0, 1, 2, 3].map((index) => ({
        slug: `${run}-paralela-${round}-${index}`,
        extraTag: `${run} propia ${round} ${index}`,
      }));
      const results = await Promise.all(
        requests.map(({ slug, extraTag }) => ingestPost(drafter, body(slug, { tags: [tag, extraTag], categories: [category] }))),
      );

      expect(results.some((result) => result.status === 201), `round ${round}`).toBe(true);
      for (const [index, result] of results.entries()) {
        const { slug, extraTag } = requests[index];
        if (result.status === 201) {
          expect(result.body.slug).toBe(slug);
        } else {
          expect([
            { error: "Datos inválidos.", fields: { tags: "Otra petición creó las mismas etiquetas a la vez. Vuelve a intentarlo." } },
            { error: "Datos inválidos.", fields: { categories: "Otra petición creó las mismas categorías a la vez. Vuelve a intentarlo." } },
          ]).toContainEqual(result.body);
        }
        const stored = result.status === 201 ? 1 : 0;
        expect(await db.post.count({ where: { slug } }), slug).toBe(stored);
        expect(await db.tag.count({ where: { locale: "es", name: extraTag } }), extraTag).toBe(stored);
      }
      expect(await db.tag.count({ where: { locale: "es", name: tag } })).toBe(1);
      expect(await db.category.count({ where: { locale: "es", name: category } })).toBe(1);
    }
  }, 60_000);

  it("answers a clear 400 to a unique error on an index it does not know, and stores nothing", async () => {
    const slug = `${run}-indice-desconocido`;
    const unknownIndex = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7.10.1",
      meta: { modelName: "Post", driverAdapterError: { cause: { constraint: { index: "Post_externalId_key" } } } },
    });
    const transaction = vi.spyOn(db, "$transaction").mockRejectedValueOnce(unknownIndex);
    try {
      expect(await ingestPost(drafter, body(slug))).toEqual({
        status: 400,
        body: { error: "Otro registro ya usa alguno de estos datos. Revisa el post y vuelve a intentarlo." },
      });
    } finally {
      transaction.mockRestore();
    }
    expect(await db.post.count({ where: { slug } })).toBe(0);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
