import { expect, test, type APIRequestContext, type Browser, type Page, type Request } from "@playwright/test";
import { Client } from "pg";
import { serveFakeMedia } from "./fake-media";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

// Server actions are public HTTP endpoints: replaying an admin's exact request as an editor or an
// anonymous client must change nothing. The admin replay is the positive control.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "Admin flows run once, on desktop");

async function sql(query: string, params: unknown[] = []) {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows;
  } finally {
    await client.end();
  }
}

async function logIn(page: Page, email = E2E_ADMIN.email, password = E2E_ADMIN.password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function newEditor(admin: Page, browser: Browser, tag: string) {
  const email = `${tag}-${Date.now()}@mrdesign.test`;
  const password = `${tag}-password-1`;
  await admin.goto("/admin/usuarios");
  const form = admin.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Replay");
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

// Headers that belong to the original session or connection, never replayed.
const DROPPED_HEADERS = new Set(["cookie", "host", "content-length"]);

// Captures the next server action POST from the page and aborts it, so nothing changes.
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

async function insertMessage(name: string) {
  const id = `replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await sql(
    'insert into "ContactSubmission" (id, name, email, phone, company, "projectType", message, consent, locale) values ($1, $2, $3, $4, $5, $6, $7, true, $8::"Locale")',
    [id, name, `${id}@mrdesign.test`, "+57 300 000 0000", "Replay Co", "shopify", `Mensaje de ${name}`, "es"],
  );
  return id;
}

test("an editor or anonymous replay of the inbox actions changes nothing; the admin replay does", async ({
  page,
  browser,
  playwright,
}, info) => {
  const id = await insertMessage(`Replay ${Date.now()}`);
  await logIn(page);
  const { editor, context } = await newEditor(page, browser, "replay-inbox");

  await page.goto(`/admin/mensajes/${id}`);
  const setRead = await captureAction(page, () => page.getByRole("button", { name: "Marcar como leído" }).click());
  expect((await sql('select "readAt" from "ContactSubmission" where id = $1', [id]))[0].readAt).toBeNull();

  await page.goto(`/admin/mensajes/${id}`);
  page.once("dialog", (dialog) => dialog.accept());
  const del = await captureAction(page, () => page.getByRole("button", { name: "Eliminar mensaje" }).click());
  expect(await sql('select id from "ContactSubmission" where id = $1', [id])).toHaveLength(1);

  await replay(editor.request, setRead);
  await replay(editor.request, del);
  const anon = await playwright.request.newContext({ baseURL: info.project.use.baseURL });
  await replay(anon, setRead);
  await replay(anon, del);
  const after = await sql('select "readAt" from "ContactSubmission" where id = $1', [id]);
  expect(after).toHaveLength(1);
  expect(after[0].readAt).toBeNull();

  // Positive control: the same bytes from the admin take effect, so the replays reached the action.
  await replay(page.request, setRead);
  expect((await sql('select "readAt" from "ContactSubmission" where id = $1', [id]))[0].readAt).not.toBeNull();
  await replay(page.request, del);
  expect(await sql('select id from "ContactSubmission" where id = $1', [id])).toHaveLength(0);
  await anon.dispose();
  await context.close();
});

test("an editor replay of the media delete action keeps the image; the admin replay deletes it", async ({
  page,
  browser,
}) => {
  await serveFakeMedia(page);
  const sha = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  const name = `replay-${Date.now()}.png`;
  const mediaId = `replay-media-${Date.now()}`;
  await sql(
    'insert into "MediaFile" (id, sha256, key, url, "contentType", size, "originalName", alt) values ($1, $2, $3, $4, $5, $6, $7, $8)',
    [mediaId, sha, `media/${sha}.png`, `https://media.e2e.test/test-bucket/media/${sha}.png`, "image/png", 10, name, "alt"],
  );
  await logIn(page);
  const { editor, context } = await newEditor(page, browser, "replay-media");

  await page.goto("/admin/imagenes");
  const del = await captureAction(page, () => page.getByRole("button", { name: `Eliminar ${name}` }).click());
  expect(await sql('select id from "MediaFile" where id = $1', [mediaId])).toHaveLength(1);

  await replay(editor.request, del);
  expect(await sql('select id from "MediaFile" where id = $1', [mediaId])).toHaveLength(1);

  await replay(page.request, del);
  expect(await sql('select id from "MediaFile" where id = $1', [mediaId])).toHaveLength(0);
  await context.close();
});
