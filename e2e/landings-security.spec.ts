import { expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

// Verifier probes (temporary). Admin flows on desktop only.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "desktop only");

async function sql<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows as T[];
  } finally {
    await client.end();
  }
}

const reseed = () =>
  execFileSync("npx", ["tsx", "scripts/seed-e2e-landings.ts"], {
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
    stdio: "pipe",
    shell: process.platform === "win32",
  });

const fingerprint = async () =>
  (await sql<{ h: string }>(`select md5(string_agg(row(l.*)::text, '|' order by id)) h from "Landing" l`))[0].h;

const landingRow = async () =>
  (await sql<{ blocks: unknown; draftBlocks: unknown; status: string; slug: string }>(
    `select blocks, "draftBlocks", status, slug from "Landing" where "translationKey" = 'e2e-landing'`,
  ))[0];

async function logIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function openBuilder(page: Page) {
  await page.goto("/admin/landings");
  await page.getByRole("link", { name: "Editar E2E Landing", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/landings\/[^/]+\/visual$/);
  await expect(page.frameLocator("iframe").getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
}

type Captured = { url: string; headers: Record<string, string>; body: Buffer };
async function captureAction(page: Page, trigger: () => Promise<void>): Promise<Captured> {
  let captured: Captured | null = null;
  await page.route("**/admin/**", async (route) => {
    const request = route.request();
    const headers = await request.allHeaders();
    if (request.method() === "POST" && headers["next-action"] && !captured) {
      const replayable = Object.fromEntries(Object.entries(headers).filter(([key]) => !["cookie", "host", "content-length"].includes(key)));
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

test.beforeEach(({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});
test.afterEach(({}, info) => {
  if (info.status !== "skipped") reseed();
});

test("anonymous replays of save, publish and discard change nothing", async ({ page, playwright }) => {
  await logIn(page);
  await openBuilder(page);
  const origin = new URL(page.url()).origin;
  const save = await captureAction(page, () => page.getByText("Guardar borrador", { exact: true }).click());
  await openBuilder(page);
  const publish = await captureAction(page, () => page.getByRole("button", { name: "Publicar", exact: true }).click());
  await openBuilder(page);

  // A real draft so discard has something to clear.
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado." })).toBeVisible();
  const discard = await captureAction(page, () => page.getByRole("button", { name: "Descartar borrador" }).click());

  const before = await fingerprint();
  expect((await landingRow()).draftBlocks).not.toBeNull();
  const anonymous = await playwright.request.newContext({ baseURL: origin });
  for (const action of [save, publish, discard]) {
    const response = await anonymous.post(action.url, { headers: action.headers, data: action.body, maxRedirects: 0 });
    console.log("anonymous replay status", response.status(), response.headers().location ?? "");
  }
  await anonymous.dispose();
  // Past the proxy's optimistic cookie check: a forged session cookie, and the public login path.
  const forged = await playwright.request.newContext({ baseURL: origin });
  for (const action of [save, publish, discard]) {
    const withCookie = await forged.post(action.url, {
      headers: { ...action.headers, cookie: "better-auth.session_token=forged.value" },
      data: action.body,
      maxRedirects: 0,
    });
    const viaLogin = await forged.post(`${origin}/admin/login`, { headers: action.headers, data: action.body, maxRedirects: 0 });
    console.log("forged cookie", withCookie.status(), withCookie.headers().location ?? "", "| via /admin/login", viaLogin.status(), viaLogin.headers().location ?? "", (await viaLogin.text()).slice(0, 80));
  }
  await forged.dispose();
  expect(await fingerprint()).toBe(before);
  expect((await landingRow()).status).toBe("DRAFT");
});

test("an admin replay with hostile JSON stores nothing", async ({ page }) => {
  await logIn(page);
  await openBuilder(page);
  const save = await captureAction(page, () => page.getByText("Guardar borrador", { exact: true }).click());
  await openBuilder(page);
  const publish = await captureAction(page, () => page.getByRole("button", { name: "Publicar", exact: true }).click());
  const body = JSON.parse(save.body.toString("utf8")) as [string, { root: unknown; content: unknown[] }];
  console.log("captured body head", save.body.toString("utf8").slice(0, 120));

  const button = (href: string) => ({ type: "Button", props: { id: "hx", label: "x", href, variant: "primary", align: "left" } });
  const image = (imageUrl: string) => ({
    type: "TextImage",
    props: { id: "ti", title: "t", text: "", imageUrl, imageAlt: "a", imageSide: "left", background: "paper" },
  });
  const hostile: unknown[] = [
    button("javascript:alert(1)"),
    button("//evil.example"),
    { type: "Conversation", props: { id: "c" } },
    { type: "Button", props: { id: "s", label: "x", href: "/", variant: "primary", align: "left", style: { color: "red" } } },
    image("https://evil.example/media/a.png"),
    { type: "Columns", props: { id: "co", ratio: "1-1", background: "paper", left: [{ type: "Cta", props: {} }], right: [] } },
  ];
  const before = await fingerprint();
  for (const [name, action] of [["save", save], ["publish", publish]] as const) {
    for (const block of hostile) {
      const data = [body[0], { ...body[1], content: [...body[1].content, block] }];
      const response = await page.request.post(action.url, { headers: action.headers, data: JSON.stringify(data), maxRedirects: 0 });
      const text = await response.text();
      console.log(name, (block as { type: string }).type, response.status(), /No se guard|no permitido|desconocido|biblioteca|no va en|Unrecognized|Invalid/.test(text) ? "rejected-msg" : text.slice(-200));
    }
    // A different landing id the client does not own: unknown id.
    const response = await page.request.post(action.url, { headers: action.headers, data: JSON.stringify(["no-such-id", body[1]]), maxRedirects: 0 });
    console.log(name, "unknown id", response.status(), (await response.text()).includes("ya no existe") ? "GONE" : "other");
  }
  expect(await fingerprint()).toBe(before);

  // Positive control: the unchanged admin body is accepted (the replay path works).
  const ok = await page.request.post(save.url, { headers: save.headers, data: save.body, maxRedirects: 0 });
  expect(ok.status()).toBe(200);
  expect((await landingRow()).draftBlocks).not.toBeNull();
});

const PREFIX = "verify-tmp";
const hero = (title: string, lead = "", primaryHref = "/contacto") => ({
  type: "Hero",
  props: { id: "h1", eyebrow: "", title, lead, primaryLabel: "Go", primaryHref, secondaryLabel: "", secondaryHref: "", background: "paper", side: [] },
});
const faq = (answer: string) => ({ type: "Faq", props: { id: "f1", title: "FAQ", background: "paper", items: [{ question: "Q<b>?</b>", answer }] } });

async function insertLanding(slug: string, locale: "es" | "en", status: "PUBLISHED" | "DRAFT", blocks: unknown, opts: { key?: string; publishedAt?: string } = {}) {
  await sql(
    `insert into "Landing" (id, locale, "translationKey", slug, title, blocks, status, "publishedAt", "updatedAt")
     values ($1, $2::"Locale", $3, $4, $5, $6::jsonb, $7::"ContentStatus", $8::timestamp, now())`,
    [`${PREFIX}-${slug}-${locale}`, locale, opts.key ?? `${PREFIX}-${slug}`, slug, `Title ${slug}`, JSON.stringify(blocks), status, opts.publishedAt ?? (status === "PUBLISHED" ? new Date(Date.now() - 60_000).toISOString() : null)],
  );
}

test.describe("public route", () => {
  test.beforeAll(async () => {
    await sql(`delete from "Landing" where id like '${PREFIX}-%'`);
    await insertLanding(`${PREFIX}-xss`, "es", "PUBLISHED", {
      root: { props: {} },
      content: [hero("<img src=x onerror=window.__pwned=1>", "lead"), faq("</script><script>window.__pwned=2</script>")],
    });
    await insertLanding(`${PREFIX}-bad-link`, "es", "PUBLISHED", { root: { props: {} }, content: [hero("Bad", "", "javascript:alert(1)")] });
    await insertLanding(`${PREFIX}-bad-type`, "es", "PUBLISHED", { root: { props: {} }, content: [{ type: "Conversation", props: { id: "c" } }] });
    await insertLanding(`${PREFIX}-bad-shape`, "es", "PUBLISHED", "just a string");
    await insertLanding(`${PREFIX}-future`, "es", "PUBLISHED", { root: { props: {} }, content: [hero("Future")] }, { publishedAt: "2099-01-01T00:00:00Z" });
    await insertLanding(`${PREFIX}-draft`, "es", "DRAFT", { root: { props: {} }, content: [hero("Draft")] });
    // Pair: es published, en draft with a different slug.
    await insertLanding(`${PREFIX}-pair-es`, "es", "PUBLISHED", { root: { props: {} }, content: [hero("Pair")] }, { key: `${PREFIX}-pair` });
    await insertLanding(`${PREFIX}-pair-en`, "en", "DRAFT", { root: { props: {} }, content: [hero("Pair EN")] }, { key: `${PREFIX}-pair` });
  });
  test.afterAll(async () => {
    await sql(`delete from "Landing" where id like '${PREFIX}-%'`);
  });

  test("block text renders as text and JSON-LD is escaped", async ({ page }) => {
    const response = await page.goto(`/soluciones/${PREFIX}-xss`);
    expect(response?.status()).toBe(200);
    expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("<img src=x onerror=window.__pwned=1>");
    const html = await response!.text();
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("</script><script>window.__pwned");
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqLd = ld.map((text) => JSON.parse(text)).find((data) => data["@type"] === "FAQPage");
    expect(faqLd.mainEntity[0].acceptedAnswer.text).toBe("</script><script>window.__pwned=2</script>");
    // hreflang only for versions that exist (es only).
    const hreflangs = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((links) => links.map((l) => l.getAttribute("hreflang")));
    console.log("hreflangs (es only)", hreflangs);
    expect(hreflangs).not.toContain("en");
  });

  test("invalid stored blocks, future, drafts and unknown slugs are 404", async ({ request }) => {
    for (const slug of ["bad-link", "bad-type", "bad-shape", "future", "draft", "nope"]) {
      const response = await request.get(`/soluciones/${PREFIX}-${slug}`, { maxRedirects: 0 });
      console.log(slug, response.status());
      expect(response.status()).toBe(404);
    }
    for (const path of ["/soluciones/%2F%2Fevil.example", "/soluciones/..%2F..%2Fevil", "/en/solutions/%2F%2Fevil.example", "/soluciones/https:%2F%2Fevil.example"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      console.log(path, response.status(), response.headers().location ?? "");
      expect([404, 400]).toContain(response.status());
    }
  });

  test("cross-locale slug redirects in-site; draft translation is not targeted", async ({ request }) => {
    // en slug of the es landing: en version is a draft, so home.
    const response = await request.get(`/en/solutions/${PREFIX}-pair-es`, { maxRedirects: 0 });
    console.log("cross-locale", response.status(), response.headers().location);
    expect([307, 308]).toContain(response.status());
    const location = response.headers().location!;
    expect(new URL(location, "http://localhost:3100").origin).toBe("http://localhost:3100");
    expect(location).not.toContain(`${PREFIX}-pair-en`);
    // The en draft slug from es: not visible, 404.
    expect((await request.get(`/soluciones/${PREFIX}-pair-en`, { maxRedirects: 0 })).status()).toBe(404);
  });

  test("sitemap lists only renderable published landings", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain(`/soluciones/${PREFIX}-xss`);
    expect(xml).toContain(`/soluciones/${PREFIX}-pair-es`);
    for (const slug of ["bad-link", "bad-type", "bad-shape", "future", "draft", "pair-en"]) expect(xml).not.toMatch(new RegExp(`${PREFIX}-${slug}[<"]`));
    expect(xml).not.toContain(`/en/solutions/${PREFIX}-pair`);
  });
});
