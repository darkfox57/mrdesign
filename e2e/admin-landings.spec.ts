import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

async function query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(sql, values)).rows as T[];
  } finally {
    await client.end();
  }
}

// The tests that publish work on landings of their own; the seeded ones are only read here. The
// slug never starts with "e2e-": the landing seed deletes those.
const RUN = `spec-list-${Date.now()}`;
let counter = 0;
const PAGE = JSON.stringify({
  root: { props: {} },
  content: [{ type: "Button", props: { id: "b", label: "Hablemos", href: "/contacto", variant: "primary", align: "left" } }],
});

async function ownLanding({ withPage = true } = {}) {
  counter += 1;
  const id = `${RUN}-${counter}`;
  await query(
    `insert into "Landing" (id, locale, "translationKey", slug, title, blocks, status, "updatedAt")
     values ($1, 'es', $1, $1, $2, $3::jsonb, 'DRAFT', now())`,
    [id, `Lista ${id}`, withPage ? PAGE : null],
  );
  return { id, slug: id, title: `Lista ${id}` };
}

const statusOf = async (id: string) => (await query<{ status: string }>(`select status from "Landing" where id = $1`, [id]))[0]?.status;

test.afterEach(() => query(`delete from "Landing" where id like $1`, [`${RUN}-%`]));

async function logIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("lists the landings with their language, status and public address", async ({ page }) => {
  await logIn(page);
  await page.goto("/admin/landings");
  await expect(page.getByRole("heading", { level: 1, name: "Landings" })).toBeVisible();

  const published = page.getByRole("row").filter({ hasText: "E2E Landing con bloques" });
  await expect(published.getByText("Publicado", { exact: true })).toBeVisible();
  await expect(published.getByText("/soluciones/e2e-builder", { exact: true })).toBeVisible();
  await expect(published.getByRole("link", { name: "Ver en el sitio" })).toHaveAttribute("href", "/soluciones/e2e-builder");
  // Both languages exist: no translate link for it.
  await expect(published.getByText("Completas")).toBeVisible();

  const draft = page.getByRole("row").filter({ hasText: "E2E Landing borrador" });
  await expect(draft.getByText("Borrador", { exact: true })).toBeVisible();
  await expect(draft.getByRole("link", { name: "Traducir E2E Landing borrador al inglés" })).toBeVisible();

  // The title opens the visual editor.
  await expect(page.getByRole("link", { name: "Editar E2E Landing borrador", exact: true })).toHaveAttribute(
    "href",
    /\/admin\/landings\/[^/]+\/visual$/,
  );
});

test("publishes a landing with blocks from the list and unpublishes it", async ({ page }) => {
  const landing = await ownLanding();
  await logIn(page);
  await page.goto("/admin/landings");
  expect((await page.request.get(`/soluciones/${landing.slug}`, { maxRedirects: 0 })).status()).toBe(404);

  await page.getByRole("button", { name: `Publicar ${landing.title}`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Despublicar ${landing.title}`, exact: true })).toBeVisible();
  const [row] = await query<{ status: string; publishedAt: Date | null }>(`select status, "publishedAt" from "Landing" where id = $1`, [landing.id]);
  expect(row.status).toBe("PUBLISHED");
  expect(row.publishedAt).not.toBeNull();
  expect((await page.request.get(`/soluciones/${landing.slug}`)).status()).toBe(200);

  await page.getByRole("button", { name: `Despublicar ${landing.title}`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Publicar ${landing.title}`, exact: true })).toBeVisible();
  expect((await page.request.get(`/soluciones/${landing.slug}`, { maxRedirects: 0 })).status()).toBe(404);
});

test("refuses to publish a landing that has no page yet", async ({ page }) => {
  const landing = await ownLanding({ withPage: false });
  await logIn(page);
  await page.goto("/admin/landings");
  await page.getByRole("button", { name: `Publicar ${landing.title}`, exact: true }).click();
  // Next.js also renders an empty route announcer with role="alert".
  await expect(
    page.getByRole("alert").filter({ hasText: "Esta landing todavía no tiene página. Ármala y publícala desde el editor visual." }),
  ).toBeVisible();
  expect(await statusOf(landing.id)).toBe("DRAFT");
});

test("answers that a landing deleted after the list loaded no longer exists", async ({ page }) => {
  const landing = await ownLanding();
  await logIn(page);
  await page.goto("/admin/landings");
  await query(`delete from "Landing" where id = $1`, [landing.id]);
  await page.getByRole("button", { name: `Publicar ${landing.title}`, exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "La landing ya no existe. Recarga la página." })).toBeVisible();
});

type Captured = { url: string; headers: Record<string, string>; body: Buffer };

// Captures the publish request without letting it through, so the test can replay it.
async function capturePublish(page: Page, title: string): Promise<Captured> {
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
  await page.getByRole("button", { name: `Publicar ${title}`, exact: true }).click();
  await expect.poll(() => captured !== null).toBe(true);
  await page.unrouteAll({ behavior: "ignoreErrors" });
  return captured!;
}

test("an anonymous replay of the publish action changes nothing, and an editor can publish", async ({ page, browser, playwright }) => {
  const landing = await ownLanding();
  await logIn(page);
  await page.goto("/admin/landings");

  const action = await capturePublish(page, landing.title);
  const anonymous = await playwright.request.newContext({ baseURL: new URL(page.url()).origin });
  const replay = await anonymous.post(action.url, { headers: action.headers, data: action.body, maxRedirects: 0 });
  // The proxy turns a cookie-less POST into a GET of the login page.
  expect(replay.status()).toBe(303);
  expect(replay.headers().location).toContain("/admin/login");
  await anonymous.dispose();
  expect(await statusOf(landing.id)).toBe("DRAFT");

  // Editors hold content:publish, like admins. A role without it is turned away by
  // requirePermission (src/lib/auth/require-permission.roles.test.ts); no configured role lacks it.
  const email = `landing-editor-${Date.now()}@mrdesign.test`;
  await page.goto("/admin/usuarios");
  const form = page.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Landings");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill("landing-editor-password-1");
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(page.getByRole("row").filter({ hasText: email })).toBeVisible();
  const context = await browser.newContext();
  try {
    const editor = await context.newPage();
    await editor.goto("/admin/login");
    await editor.getByLabel("Email").fill(email);
    await editor.getByLabel("Contraseña").fill("landing-editor-password-1");
    await editor.getByRole("button", { name: "Ingresar" }).click();
    await expect(editor).toHaveURL(/\/admin$/);
    await editor.goto("/admin/landings");
    await editor.getByRole("button", { name: `Publicar ${landing.title}`, exact: true }).click();
    await expect(editor.getByRole("button", { name: `Despublicar ${landing.title}`, exact: true })).toBeVisible();
    expect(await statusOf(landing.id)).toBe("PUBLISHED");
  } finally {
    await context.close();
  }
});

test("an archived landing is not published or unpublished, even by a replayed request", async ({ page }) => {
  const landing = await ownLanding();
  await logIn(page);
  await page.goto("/admin/landings");
  const action = await capturePublish(page, landing.title);
  await query(`update "Landing" set status = 'ARCHIVED' where id = $1`, [landing.id]);

  // The list offers no publish button for it.
  await page.reload();
  await expect(page.getByRole("button", { name: `Publicar ${landing.title}`, exact: true })).toHaveCount(0);
  // The admin's own request, replayed with the session, gets the same answer.
  const replay = await page.request.post(action.url, { headers: action.headers, data: action.body, maxRedirects: 0 });
  expect(replay.status()).toBe(200);
  expect(await replay.text()).toContain("Esta landing está archivada: no se publica ni se despublica desde la lista.");
  expect(await statusOf(landing.id)).toBe("ARCHIVED");
});

test("the landings list and the new landing form need a session", async ({ request }) => {
  for (const path of ["/admin/landings", "/admin/landings/nueva"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(307);
    expect(response.headers().location, path).toContain("/admin/login");
  }
});
