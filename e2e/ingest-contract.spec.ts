import { createHash, randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { Client } from "pg";
import { E2E_DATABASE_URL } from "./test-env";

// TEMPORARY verifier probe (T12): the docs/api-blog.md 400 table over real HTTP, the 201 contract,
// cover path normalization through the API, concurrent new terms, and immediate public visibility.
// Since T17 a library image must be the exact URL of a MediaFile row: the probe inserts its own.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "API probes run once, on desktop");

const RUN = `${Date.now()}`;
const P = `e2e-vfy12-${RUN}`;
const LIB = "https://media.e2e.test/test-bucket/media/";

async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows;
  } finally {
    await client.end();
  }
}

async function insertKey(publish: boolean) {
  const key = `mrd_${randomBytes(32).toString("base64url")}`;
  await sql('insert into "ApiKey" (id, name, "keyHash", prefix, "publishImmediately") values ($1, $2, $3, $4, $5)', [
    `vfy12-key-${RUN}-${Math.random().toString(36).slice(2, 8)}`,
    `Vfy12 ${RUN}`,
    createHash("sha256").update(key).digest("hex"),
    key.slice(0, 12),
    publish,
  ]);
  return key;
}

// A library image of this run: a MediaFile row whose exact URL the API accepts.
async function insertMedia(name: string) {
  const sha = createHash("sha256").update(`${RUN}-${name}`).digest("hex");
  const url = `${LIB}${sha}.png`;
  await sql('insert into "MediaFile" (id, sha256, key, url, "contentType", size, "originalName") values ($1, $2, $3, $4, $5, $6, $7)', [
    `vfy12-media-${RUN}-${name}`,
    sha,
    `media/${sha}.png`,
    url,
    "image/png",
    10,
    `vfy12-${RUN}-${name}.png`,
  ]);
  return url;
}

const COVER_MISSING = "La portada no está en la biblioteca de imágenes del panel: puede que la hayan borrado.";

const ingest = (request: APIRequestContext, key: string, data: unknown) =>
  request.post("/api/blog", { headers: { Authorization: `Bearer ${key}` }, data, maxRedirects: 0 });

const valid = (slug: string, extra: Record<string, unknown> = {}) => ({
  title: `Vfy12 ${slug}`,
  slug,
  description: "Probe.",
  content: "<p>Hola.</p>",
  ...extra,
});

async function snapshot() {
  const [posts, tags, cats] = await Promise.all([
    sql('select count(*)::int n from "Post"'),
    sql('select count(*)::int n from "Tag"'),
    sql('select count(*)::int n from "Category"'),
  ]);
  return { posts: posts[0].n, tags: tags[0].n, cats: cats[0].n };
}

test.afterAll(async () => {
  await sql('delete from "Post" where slug like $1', [`${P}%`]);
  await sql('delete from "Tag" where name like $1', [`vfy12 ${RUN}%`]);
  await sql('delete from "Category" where name like $1', [`vfy12 ${RUN}%`]);
  await sql('delete from "ApiKey" where name like $1', [`Vfy12 ${RUN}%`]);
  await sql('delete from "MediaFile" where "originalName" like $1', [`vfy12-${RUN}-%`]);
});

test("every row of the 400 table, exact bodies, nothing stored", async ({ request }) => {
  const key = await insertKey(false);
  const before = await snapshot();
  const tag61 = "a".repeat(61);
  const cases: Array<[string, unknown, Record<string, string>]> = [
    ["array body", [1, 2], { body: "El cuerpo tiene que ser un objeto JSON." }],
    ["string body", Buffer.from(JSON.stringify("hola")), { body: "El cuerpo tiene que ser un objeto JSON." }],
    ["null body", null, { body: "El cuerpo tiene que ser un objeto JSON." }],
    ["title number", valid(`${P}-a`, { title: 123 }), { title: "Tiene que ser texto." }],
    ["slug null", valid(`${P}-a`, { slug: null }), { slug: "Tiene que ser texto." }],
    ["img object", valid(`${P}-a`, { img: {} }), { img: "Tiene que ser texto." }],
    ["imgAlt bool", valid(`${P}-a`, { imgAlt: false }), { imgAlt: "Tiene que ser texto." }],
    ["description arr", valid(`${P}-a`, { description: ["x"] }), { description: "Tiene que ser texto." }],
    ["content bool", valid(`${P}-a`, { content: true }), { content: "Tiene que ser texto." }],
    ["locale number", valid(`${P}-a`, { locale: 1 }), { locale: "Tiene que ser texto." }],
    ["seoTitle number", valid(`${P}-a`, { seoTitle: 1 }), { seoTitle: "Tiene que ser texto." }],
    ["seoDescription number", valid(`${P}-a`, { seoDescription: 1 }), { seoDescription: "Tiene que ser texto." }],
    ["tags number", valid(`${P}-a`, { tags: 5 }), { tags: "Usa texto separado por comas o una lista de textos." }],
    ["tags with number", valid(`${P}-a`, { tags: ["a", 1] }), { tags: "Usa texto separado por comas o una lista de textos." }],
    ["tags objects", valid(`${P}-a`, { tags: [{ name: "a" }] }), { tags: "Usa texto separado por comas o una lista de textos." }],
    ["categories string", valid(`${P}-a`, { categories: "Ecommerce" }), { categories: "Usa una lista de nombres." }],
    ["categories object", valid(`${P}-a`, { categories: { name: "x" } }), { categories: "Usa una lista de nombres." }],
    ["tag empty in list", valid(`${P}-a`, { tags: ["ok", ""] }), { tags: "Cada etiqueta necesita un nombre con letras o números, de hasta 60 caracteres." }],
    ["tag symbols", valid(`${P}-a`, { tags: "ok, !!!" }), { tags: "Cada etiqueta necesita un nombre con letras o números, de hasta 60 caracteres." }],
    ["tag 61", valid(`${P}-a`, { tags: [tag61] }), { tags: "Cada etiqueta necesita un nombre con letras o números, de hasta 60 caracteres." }],
    ["category bad key", valid(`${P}-a`, { categories: [{ nombre: "x" }] }), { categories: "Cada categoría necesita un nombre con letras o números, de hasta 60 caracteres." }],
    ["category number", valid(`${P}-a`, { categories: [3] }), { categories: "Cada categoría necesita un nombre con letras o números, de hasta 60 caracteres." }],
    ["category null", valid(`${P}-a`, { categories: [null] }), { categories: "Cada categoría necesita un nombre con letras o números, de hasta 60 caracteres." }],
    ["21 tags", valid(`${P}-a`, { tags: Array.from({ length: 21 }, (_, i) => `vfy12 ${RUN} t${i}`) }), { tags: "Máximo 20 etiquetas." }],
    ["11 categories", valid(`${P}-a`, { categories: Array.from({ length: 11 }, (_, i) => `vfy12 ${RUN} c${i}`) }), { categories: "Máximo 10 categorías." }],
    ["unknown locale", valid(`${P}-a`, { locale: "fr" }), { locale: "Elige un idioma." }],
    ["cover outside", valid(`${P}-a`, { img: "https://evil.example/a.png" }), { img: "La portada tiene que estar en la biblioteca de imágenes del panel." }],
    ["cover not in the library", valid(`${P}-a`, { img: `${LIB}${"0".repeat(64)}.png` }), { img: COVER_MISSING }],
    [
      "content image not in the library",
      valid(`${P}-a`, { content: `<p>Hola.</p><img src="${LIB}${"0".repeat(64)}.png" alt="x">` }),
      { content: `La imagen ${LIB}${"0".repeat(64)}.png no está en la biblioteca de imágenes del panel: puede que la hayan borrado.` },
    ],
    [
      "several at once",
      valid(`${P}-a`, { tags: Array.from({ length: 21 }, (_, i) => `vfy12 ${RUN} t${i}`), categories: [""], img: "https://evil.example/a.png" }),
      {
        img: "La portada tiene que estar en la biblioteca de imágenes del panel.",
        tags: "Máximo 20 etiquetas.",
        categories: "Cada categoría necesita un nombre con letras o números, de hasta 60 caracteres.",
      },
    ],
  ];
  const report: string[] = [];
  for (const [label, data, fields] of cases) {
    const response = await ingest(request, key, data);
    const body = await response.json();
    report.push(`${label}: ${response.status()} ${JSON.stringify(body)}`);
    expect.soft(response.status(), label).toBe(400);
    expect.soft(body, label).toEqual({ error: "Datos inválidos.", fields });
  }
  console.log(report.join("\n"));
  expect(await snapshot()).toEqual(before);
});

test("201 contract: shape, dedupe, trailing comma, 20 tags and 10 categories, library cover", async ({ request }) => {
  const key = await insertKey(false);
  const cover = await insertMedia("contract");
  const slug = `${P}-ok`;
  const tags = [...Array.from({ length: 20 }, (_, i) => `vfy12 ${RUN} t${i}`), `VFY12 ${RUN} T0`];
  const categories = [...Array.from({ length: 10 }, (_, i) => `vfy12 ${RUN} c${i}`), { name: `vfy12 ${RUN} c0` }];
  const response = await ingest(request, key, valid(slug, { tags, categories, img: cover, imgAlt: "alt" }));
  const body = await response.json();
  console.log("201 body", JSON.stringify(body));
  expect(response.status()).toBe(201);
  expect(Object.keys(body).sort()).toEqual(["id", "locale", "slug", "status", "url"]);
  expect(body).toMatchObject({ slug, locale: "es", status: "DRAFT", url: `http://localhost:3100/blog/${slug}` });
  const rows = await sql('select (select count(*)::int from "_PostToTag" where "A" = p.id) t, (select count(*)::int from "_CategoryToPost" where "B" = p.id) c, "coverImageUrl" from "Post" p where slug = $1', [slug]);
  expect(rows[0]).toMatchObject({ t: 20, c: 10, coverImageUrl: cover });

  const comma = await ingest(request, key, valid(`${P}-comma`, { tags: `vfy12 ${RUN} x, vfy12 ${RUN} y,` }));
  expect(comma.status()).toBe(201);
});

test("cover path tricks through the API answer 400 img", async ({ request }) => {
  const key = await insertKey(false);
  const before = await snapshot();
  const BS = String.fromCharCode(92);
  const bad = [
    `${LIB}../a.png`,
    `${LIB}%2e%2e/a.png`,
    `${LIB}.%2E/a.png`,
    `${LIB}..%2Fa.png`,
    `${LIB}..%5Ca.png`,
    `${LIB}..${BS}a.png`,
    "https://media.e2e.test/test-bucket//media/a.png",
    "https://user@media.e2e.test/test-bucket/media/a.png",
    "https://media.e2e.test@evil.example/test-bucket/media/a.png",
    "https://media.e2e.test:8443/test-bucket/media/a.png",
    "https://media.e2e.test./test-bucket/media/a.png",
  ];
  for (const img of bad) {
    const response = await ingest(request, key, valid(`${P}-img`, { img }));
    expect.soft(response.status(), img).toBe(400);
    expect.soft(await response.json(), img).toEqual({ error: "Datos inválidos.", fields: { img: "La portada tiene que estar en la biblioteca de imágenes del panel." } });
  }
  expect(await snapshot()).toEqual(before);
  // Inside the library path but not an image's exact URL: the cover check passes, the library has no such row.
  const exact = await insertMedia("tricks");
  const variants = [exact.replace("https://media.e2e.test", "HTTPS://MEDIA.E2E.TEST"), `${exact}?v=1`, exact.replace("/media/", "/media/sub/../")];
  for (const img of variants) {
    const response = await ingest(request, key, valid(`${P}-variant`, { img }));
    expect.soft(response.status(), img).toBe(400);
    expect.soft(await response.json(), img).toEqual({ error: "Datos inválidos.", fields: { img: COVER_MISSING } });
  }
  expect(await snapshot()).toEqual(before);
  const accepted = await ingest(request, key, valid(`${P}-okimg`, { img: exact }));
  expect(accepted.status()).toBe(201);
});

test("concurrent identical new tag over HTTP: 201 or 400, never 500", async ({ request }) => {
  const key = await insertKey(false);
  const statuses: number[] = [];
  for (let round = 0; round < 4; round++) {
    const tag = `vfy12 ${RUN} race ${round}`;
    const responses = await Promise.all([0, 1, 2, 3].map((i) => ingest(request, key, valid(`${P}-race${round}-${i}`, { tags: [tag], categories: [`vfy12 ${RUN} racecat ${round}`] }))));
    for (const response of responses) statuses.push(response.status());
    expect((await sql('select count(*)::int n from "Tag" where name = $1', [tag]))[0].n).toBe(1);
  }
  console.log("race statuses", statuses.join(","));
  for (const status of statuses) expect([201, 400]).toContain(status);
});

test("a published post from the API shows on /blog and /en/blog right away", async ({ request, page }) => {
  const key = await insertKey(true);
  await page.goto("/blog");
  await page.goto("/en/blog");
  for (const [locale, index] of [["es", "/blog"], ["en", "/en/blog"]] as const) {
    const slug = `${P}-pub-${locale}`;
    const category = `vfy12 ${RUN} cat ${locale}`;
    const response = await ingest(request, key, valid(slug, { locale, categories: [category] }));
    expect(response.status()).toBe(201);
    const { url } = await response.json();
    await page.goto(index);
    await expect(page.getByRole("link", { name: `Vfy12 ${slug}` }).first()).toBeVisible();
    const postResponse = await page.goto(new URL(url).pathname);
    expect(postResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`Vfy12 ${slug}`);
  }
});
