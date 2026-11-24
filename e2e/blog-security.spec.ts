import { createHash, randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Browser, type Page, type Request } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

// Independent verifier probes for T7 (S4, S6): /api/blog auth and contract, API key action replays,
// public blog visibility, JSON-LD escaping and the media delete guard.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

const BASE = "http://localhost:3100";
const RUN = `${Date.now()}`;

async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows;
  } finally {
    await client.end();
  }
}

// A key stored the way createApiKey stores it (hash and prefix only).
async function insertKey(name: string, { publish = true, revoked = false } = {}) {
  const key = `mrd_${randomBytes(32).toString("base64url")}`;
  await sql('insert into "ApiKey" (id, name, "keyHash", prefix, "publishImmediately", "revokedAt") values ($1, $2, $3, $4, $5, $6)', [
    `verify-key-${RUN}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    createHash("sha256").update(key).digest("hex"),
    key.slice(0, 12),
    publish,
    revoked ? new Date() : null,
  ]);
  return key;
}

const ingest = (request: APIRequestContext, key: string | null, data: unknown, headers: Record<string, string> = {}) =>
  request.post("/api/blog", { headers: { ...(key ? { Authorization: `Bearer ${key}` } : {}), ...headers }, data, maxRedirects: 0 });

const validBody = (slug: string, extra: Record<string, unknown> = {}) => ({
  title: "Verificador",
  slug,
  description: "Post del verificador.",
  content: "<p>Hola.</p>",
  ...extra,
});

test.afterAll(async () => {
  await sql('delete from "Post" where slug like $1', [`e2e-verify-${RUN}%`]);
  await sql('delete from "Category" where slug like $1', [`e2e-api-verify-${RUN}%`]);
  await sql('delete from "ApiKey" where name like $1', [`Verify ${RUN}%`]);
  await sql('delete from "MediaFile" where id like $1', [`verify-media-${RUN}%`]);
});

test("every missing, malformed, unknown or revoked key gets 401 before the body is read", async ({ request }) => {
  const revoked = await insertKey(`Verify ${RUN} revoked`, { revoked: true });
  const cases: Array<Record<string, string>> = [
    {},
    { Authorization: "Basic abc" },
    { Authorization: "Bearer" },
    { Authorization: "Bearer a b" },
    { Authorization: "Bearer mrd_unknown" },
    { Authorization: `Bearer ${revoked}` },
  ];
  // An oversized and invalid body: a 413 or 400 would mean the body was read before auth.
  const huge = "x".repeat(1_500_000);
  for (const headers of cases) {
    const response = await request.post("/api/blog", { headers: { "Content-Type": "application/json", ...headers }, data: huge });
    expect(response.status(), JSON.stringify(headers)).toBe(401);
    expect(response.headers()["www-authenticate"]).toBe("Bearer");
    expect(await response.json()).toEqual({ error: "API key inválida o revocada." });
  }
  expect(await sql('select id from "Post" where slug like $1', [`e2e-verify-${RUN}%`])).toHaveLength(0);
});

test("a valid key gets 413 over 1 MB, with or without Content-Length, and 400 for invalid JSON or fields", async ({ request }) => {
  const key = await insertKey(`Verify ${RUN} limits`);
  const big = JSON.stringify(validBody(`e2e-verify-${RUN}-big`, { content: `<p>${"a".repeat(1_100_000)}</p>` }));
  const withLength = await request.post("/api/blog", { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, data: Buffer.from(big) });
  expect(withLength.status()).toBe(413);

  // Chunked: no Content-Length, so only the streamed byte count can stop it.
  const bytes = new TextEncoder().encode(big);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += 64_000) controller.enqueue(bytes.slice(offset, offset + 64_000));
      controller.close();
    },
  });
  const chunked = await fetch(`${BASE}/api/blog`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
  expect(chunked.status).toBe(413);

  const notJson = await request.post("/api/blog", { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, data: Buffer.from("{nope") });
  expect(notJson.status()).toBe(400);
  expect(await notJson.json()).toEqual({ error: "El cuerpo no es JSON válido." });

  const array = await ingest(request, key, [1, 2]);
  expect(array.status()).toBe(400);
  expect(await array.json()).toEqual({ error: "Datos inválidos.", fields: { body: "El cuerpo tiene que ser un objeto JSON." } });

  const missing = await ingest(request, key, { description: "x", content: "<p>x</p>" });
  expect(missing.status()).toBe(400);
  expect((await missing.json()).fields).toMatchObject({ title: "Escribe el título." });

  const locale = await ingest(request, key, validBody(`e2e-verify-${RUN}-fr`, { locale: "fr" }));
  expect(await locale.json()).toEqual({ error: "Datos inválidos.", fields: { locale: "Elige un idioma." } });

  const wrongType = await ingest(request, key, validBody(`e2e-verify-${RUN}-type`, { title: 123 }));
  expect(await wrongType.json()).toEqual({ error: "Datos inválidos.", fields: { title: "Tiene que ser texto." } });

  const outsideLibrary = ["https://evil.example/media/a.png", "https://media.e2e.test.evil/test-bucket/media/a.png", "javascript:alert(1)"];
  for (const img of [...outsideLibrary, "https://media.e2e.test/test-bucket/media/../a.png"]) {
    const cover = await ingest(request, key, validBody(`e2e-verify-${RUN}-img`, { img }));
    expect(cover.status(), img).toBe(400);
    expect(Object.keys((await cover.json()).fields)).toEqual(["img"]);
  }

  const onlyScript = await ingest(request, key, validBody(`e2e-verify-${RUN}-script`, { content: "<script>alert(1)</script>" }));
  expect(onlyScript.status()).toBe(400);
  expect((await onlyScript.json()).fields).toEqual({ content: "Escribe el contenido del post." });

  expect(await sql('select id from "Post" where slug like $1', [`e2e-verify-${RUN}%`])).toHaveLength(0);
});

// S9, A10: 60 requests per hour per key. Cheap requests (invalid JSON, 400) count the same as posts.
test("a key over 60 requests in the hour gets 429 with Retry-After before the body is read; other keys are unaffected", async ({ request }) => {
  const key = await insertKey(`Verify ${RUN} rate`);
  const other = await insertKey(`Verify ${RUN} rate other`);
  const notJson = (token: string, data: string | Buffer = "{") =>
    request.post("/api/blog", { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, data });

  for (let i = 0; i < 60; i++) expect((await notJson(key)).status(), `request ${i + 1}`).toBe(400);

  // Oversized and invalid: a 413 or 400 would mean the body was read before the limit.
  const limited = await notJson(key, "x".repeat(1_500_000));
  expect(limited.status()).toBe(429);
  expect(limited.headers()["retry-after"]).toBe("3600");
  expect(await limited.json()).toEqual({ error: "Demasiadas solicitudes con esta API key. Vuelve a intentarlo más tarde." });

  const valid = await ingest(request, key, validBody(`e2e-verify-${RUN}-rate`));
  expect(valid.status()).toBe(429);
  expect(await sql('select id from "Post" where slug = $1', [`e2e-verify-${RUN}-rate`])).toHaveLength(0);

  expect((await notJson(other)).status()).toBe(400);
  expect((await ingest(request, "mrd_unknown", validBody(`e2e-verify-${RUN}-rate`))).status()).toBe(401);
});

test("ingest stores sanitized HTML, keeps the response contract, and refuses a taken slug", async ({ request, page }) => {
  const key = await insertKey(`Verify ${RUN} publish`);
  const slug = `e2e-verify-${RUN}-xss`;
  const evil =
    '<p onclick="alert(1)">Texto</p><script>alert(1)</script><img src="x" onerror="alert(1)"><img src="data:image/png;base64,AA">' +
    '<a href="javascript:alert(1)">j</a><a href="data:text/html,x">d</a><iframe src="https://evil.example"></iframe>' +
    '<p style="color:red">s</p><style>body{display:none}</style><svg onload="alert(1)"></svg>';
  const created = await ingest(request, key, validBody(slug, { content: evil, status: "DRAFT", publishedAt: "2000-01-01" }));
  expect(created.status()).toBe(201);
  const body = await created.json();
  expect(Object.keys(body).sort()).toEqual(["id", "locale", "slug", "status", "url"]);
  expect(body).toMatchObject({ slug, locale: "es", status: "PUBLISHED", url: `${BASE}/blog/${slug}` });

  const [stored] = await sql('select content, source, status from "Post" where id = $1', [body.id]);
  expect(stored.source).toBe("API");
  for (const banned of ["<script", "onclick", "onerror", "onload", "javascript:", "data:", "<iframe", "style", "<svg"]) {
    expect(stored.content, banned).not.toContain(banned);
  }

  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  await page.goto(`/blog/${slug}`);
  await expect(page.getByText("Texto")).toBeVisible();
  expect(await page.locator(".post-content script, .post-content iframe, .post-content [onerror], .post-content [onclick]").count()).toBe(0);
  expect(dialogs).toEqual([]);

  const again = await ingest(request, key, validBody(slug));
  expect(again.status()).toBe(400);
  expect(await again.json()).toEqual({ error: "Datos inválidos.", fields: { slug: "Ya existe un post con ese slug en este idioma." } });
});

test("a draft key never publishes, even when the body asks for it", async ({ request }) => {
  const key = await insertKey(`Verify ${RUN} draft`, { publish: false });
  const slug = `e2e-verify-${RUN}-draft`;
  const created = await ingest(request, key, validBody(slug, { status: "PUBLISHED", publishImmediately: true, publishedAt: new Date().toISOString() }));
  expect(created.status()).toBe(201);
  expect((await created.json()).status).toBe("DRAFT");
  const [post] = await sql('select status, "publishedAt" from "Post" where slug = $1', [slug]);
  expect(post).toEqual({ status: "DRAFT", publishedAt: null });
  expect((await request.get(`/blog/${slug}`, { maxRedirects: 0 })).status()).toBe(404);
});

test("JSON-LD escapes a hostile title and slug-like params never redirect off site", async ({ request, page }) => {
  const key = await insertKey(`Verify ${RUN} jsonld`);
  const slug = `e2e-verify-${RUN}-jsonld`;
  const title = '</script><script>window.__pwned=1</script><!--';
  const created = await ingest(request, key, validBody(slug, { title, description: '"><img src=x onerror=alert(1)>' }));
  expect(created.status()).toBe(201);

  await page.goto(`/blog/${slug}`);
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  const scripts = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ""));
  for (const text of scripts) expect(text).not.toContain("<");
  const posting = scripts.map((text) => JSON.parse(text)).find((data) => data["@type"] === "BlogPosting");
  expect(posting.headline).toBe(title);

  for (const path of ["/blog/%2F%2Fevil.example", "/blog/https:%2F%2Fevil.example", "/en/blog/%2F%2Fevil.example", "/blog/categoria/%2F%2Fevil.example"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(404);
    expect(response.headers()["location"], path).toBeUndefined();
  }
});

test("archived and future posts stay hidden: direct slug, category page, other locale and sitemap", async ({ request }) => {
  const key = await insertKey(`Verify ${RUN} archive`);
  const category = `e2e-api-verify-${RUN}`;
  const make = async (suffix: string) => {
    const slug = `e2e-verify-${RUN}-${suffix}`;
    const response = await ingest(request, key, validBody(slug, { categories: [category] }));
    expect(response.status()).toBe(201);
    return slug;
  };
  const visible = await make("visible");
  const archived = await make("archived");
  const future = await make("future");
  await sql(`update "Post" set status = 'ARCHIVED' where slug = $1`, [archived]);
  await sql(`update "Post" set "publishedAt" = now() + interval '30 days' where slug = $1`, [future]);

  expect((await request.get(`/blog/${visible}`)).status()).toBe(200);
  for (const slug of [archived, future]) {
    expect((await request.get(`/blog/${slug}`, { maxRedirects: 0 })).status(), slug).toBe(404);
    expect((await request.get(`/en/blog/${slug}`, { maxRedirects: 0 })).status(), `en ${slug}`).toBe(404);
  }
  const categoryPage = await (await request.get(`/blog/categoria/${category}`)).text();
  expect(categoryPage).toContain(visible);
  expect(categoryPage).not.toContain(archived);
  expect(categoryPage).not.toContain(future);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain(visible);
  expect(sitemap).not.toContain(archived);
  expect(sitemap).not.toContain(future);

  // With its only post archived, the category disappears too.
  await sql(`update "Post" set status = 'ARCHIVED' where slug = $1`, [visible]);
  expect((await request.get(`/blog/categoria/${category}`, { maxRedirects: 0 })).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain(category);
});

async function logIn(page: Page, email = E2E_ADMIN.email, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function newEditor(admin: Page, browser: Browser) {
  const email = `verify-editor-${RUN}@mrdesign.test`;
  const password = "verify-editor-password-1";
  await admin.goto("/admin/usuarios");
  const form = admin.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Verify");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(admin.getByRole("row").filter({ hasText: email })).toBeVisible();
  const context = await browser.newContext();
  const editor = await context.newPage();
  await logIn(editor, email, password);
  return { editor, context };
}

type Captured = { url: string; headers: Record<string, string>; body: Buffer };
const DROPPED_HEADERS = new Set(["cookie", "host", "content-length"]);

async function captureAction(page: Page, trigger: () => Promise<void>): Promise<Captured> {
  let captured: Captured | null = null;
  await page.route("**/admin/**", async (route) => {
    const request: Request = route.request();
    const headers = await request.allHeaders();
    if (request.method() === "POST" && headers["next-action"] && !captured) {
      const replayable = Object.fromEntries(Object.entries(headers).filter(([key]) => !DROPPED_HEADERS.has(key)));
      captured = { url: request.url(), headers: replayable, body: request.postDataBuffer() ?? Buffer.alloc(0) };
      await route.abort();
      return;
    }
    await route.continue();
  });
  await trigger();
  await expect.poll(() => captured !== null).toBe(true);
  await page.unrouteAll({ behavior: "ignoreErrors" });
  return captured!;
}

const replay = (request: APIRequestContext, action: Captured) =>
  request.post(action.url, { headers: action.headers, data: action.body, maxRedirects: 0 });

test("editor and anonymous replays of the API key actions change nothing; the admin replay does", async ({ page, browser, playwright }) => {
  const name = `Verify ${RUN} replay create`;
  await logIn(page);
  const { editor, context } = await newEditor(page, browser);
  const anon = await playwright.request.newContext({ baseURL: BASE });
  try {
    await page.goto("/admin/api-keys");
    const form = page.getByRole("form", { name: "Nueva API key" });
    await form.getByLabel("Nombre").fill(name);
    const create = await captureAction(page, () => form.getByRole("button", { name: "Crear API key" }).click());
    expect(await sql('select id from "ApiKey" where name = $1', [name])).toHaveLength(0);

    const revokeName = `Verify ${RUN} replay revoke`;
    const revokeKey = await insertKey(revokeName);
    await page.goto("/admin/api-keys");
    page.once("dialog", (dialog) => dialog.accept());
    const revoke = await captureAction(page, () => page.getByRole("button", { name: `Revocar ${revokeName}`, exact: true }).click());

    for (const client of [editor.request, anon]) {
      await replay(client, create);
      await replay(client, revoke);
    }
    expect(await sql('select id from "ApiKey" where name = $1', [name])).toHaveLength(0);
    expect((await sql('select "revokedAt" from "ApiKey" where name = $1', [revokeName]))[0].revokedAt).toBeNull();
    expect((await ingest(anon, revokeKey, validBody(`e2e-verify-${RUN}-before-revoke`))).status()).toBe(201);

    // Positive control: the admin's own bytes take effect.
    await replay(page.request, create);
    expect(await sql('select id from "ApiKey" where name = $1', [name])).toHaveLength(1);
    await replay(page.request, revoke);
    expect((await sql('select "revokedAt" from "ApiKey" where name = $1', [revokeName]))[0].revokedAt).not.toBeNull();
    expect((await ingest(anon, revokeKey, validBody(`e2e-verify-${RUN}-after-revoke`))).status()).toBe(401);
  } finally {
    await anon.dispose();
    await context.close();
  }
});

test("an image used inside a post's content or as its cover cannot be deleted", async ({ page }) => {
  await logIn(page);
  for (const where of ["content", "cover"] as const) {
    const sha = createHash("sha256").update(`${RUN}-${where}`).digest("hex");
    const name = `verify-${RUN}-${where}.png`;
    const url = `https://media.e2e.test/test-bucket/media/${sha}.png`;
    const mediaId = `verify-media-${RUN}-${where}`;
    await sql(
      'insert into "MediaFile" (id, sha256, key, url, "contentType", size, "originalName", alt) values ($1, $2, $3, $4, $5, $6, $7, $8)',
      [mediaId, sha, `media/${sha}.png`, url, "image/png", 10, name, "alt"],
    );
    await sql(
      'insert into "Post" (id, "translationKey", locale, slug, title, excerpt, content, "coverImageUrl", "updatedAt") values ($1, $1, $2, $3, $4, $5, $6, $7, now())',
      [
        `verify-post-${RUN}-${where}`,
        "es",
        `e2e-verify-${RUN}-media-${where}`,
        `Verify media ${where}`,
        "Resumen.",
        where === "content" ? `<p>Texto</p><img src="${url}" alt="a" />` : "<p>Texto</p>",
        where === "cover" ? url : null,
      ],
    );
    await page.goto("/admin/imagenes");
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Eliminar ${name}` }).click();
    await expect(page.getByText(/No se puede eliminar: está en uso \(Post: Verify media/)).toBeVisible();
    expect(await sql('select id from "MediaFile" where id = $1', [mediaId])).toHaveLength(1);
  }
});
