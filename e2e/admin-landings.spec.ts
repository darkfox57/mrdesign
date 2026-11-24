import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

async function query<T>(sql: string): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(sql)).rows as T[];
  } finally {
    await client.end();
  }
}

// Back to what scripts/seed-e2e-landings.ts leaves, so the public specs never see it published.
const resetDraft = () => query(`update "Landing" set status = 'DRAFT', "publishedAt" = null where "translationKey" = 'e2e-landing-draft'`);
test.afterEach(resetDraft);

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
  await logIn(page);
  await page.goto("/admin/landings");
  expect((await page.request.get("/soluciones/e2e-borrador", { maxRedirects: 0 })).status()).toBe(404);

  await page.getByRole("button", { name: "Publicar E2E Landing borrador", exact: true }).click();
  await expect(page.getByRole("button", { name: "Despublicar E2E Landing borrador", exact: true })).toBeVisible();
  const [row] = await query<{ status: string; publishedAt: Date | null }>(
    `select status, "publishedAt" from "Landing" where "translationKey" = 'e2e-landing-draft'`,
  );
  expect(row.status).toBe("PUBLISHED");
  expect(row.publishedAt).not.toBeNull();
  expect((await page.request.get("/soluciones/e2e-borrador")).status()).toBe(200);

  await page.getByRole("button", { name: "Despublicar E2E Landing borrador", exact: true }).click();
  await expect(page.getByRole("button", { name: "Publicar E2E Landing borrador", exact: true })).toBeVisible();
  expect((await page.request.get("/soluciones/e2e-borrador", { maxRedirects: 0 })).status()).toBe(404);
});

test("refuses to publish a landing that has no page yet", async ({ page }) => {
  await logIn(page);
  await page.goto("/admin/landings");
  await page.getByRole("button", { name: "Publicar E2E Landing sin página", exact: true }).click();
  // Next.js also renders an empty route announcer with role="alert".
  await expect(
    page.getByRole("alert").filter({ hasText: "Esta landing todavía no tiene página. Ármala y publícala desde el editor visual." }),
  ).toBeVisible();
  const [row] = await query<{ status: string }>(`select status from "Landing" where "translationKey" = 'e2e-landing-empty'`);
  expect(row.status).toBe("DRAFT");
});

test("an anonymous replay of the publish action changes nothing, and an editor can publish", async ({ page, browser, playwright }) => {
  await logIn(page);
  await page.goto("/admin/landings");

  // Capture the admin's publish request without letting it through, then replay it with no session.
  let captured: { url: string; headers: Record<string, string>; body: Buffer } | null = null;
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
  await page.getByRole("button", { name: "Publicar E2E Landing borrador", exact: true }).click();
  await expect.poll(() => captured !== null).toBe(true);
  await page.unrouteAll({ behavior: "ignoreErrors" });
  const anonymous = await playwright.request.newContext({ baseURL: new URL(page.url()).origin });
  const action = captured!;
  await anonymous.post(action.url, { headers: action.headers, data: action.body, maxRedirects: 0 });
  await anonymous.dispose();
  const status = async () =>
    (await query<{ status: string }>(`select status from "Landing" where "translationKey" = 'e2e-landing-draft'`))[0].status;
  expect(await status()).toBe("DRAFT");

  // Editors hold content:publish, like admins.
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
    await editor.getByRole("button", { name: "Publicar E2E Landing borrador", exact: true }).click();
    await expect(editor.getByRole("button", { name: "Despublicar E2E Landing borrador", exact: true })).toBeVisible();
    expect(await status()).toBe("PUBLISHED");
  } finally {
    await context.close();
  }
});

test("the landings list and the new landing form need a session", async ({ request }) => {
  for (const path of ["/admin/landings", "/admin/landings/nueva"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(307);
    expect(response.headers().location, path).toContain("/admin/login");
  }
});
