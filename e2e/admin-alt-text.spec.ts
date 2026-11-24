import { expect, test, type APIRequestContext, type Browser, type Page, type Request } from "@playwright/test";
import { Client } from "pg";
import { serveFakeMedia } from "./fake-media";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

// Verifier probe (T11, S4): an editor changes the alt text of the images they uploaded only, through the UI
// or by replaying the server action with another image's id; an admin changes any image's alt text.
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

// Same request with the image id swapped, as an attacker would send it.
const retarget = (action: Captured, from: string, to: string): Captured => ({
  ...action,
  body: Buffer.from(action.body.toString("latin1").split(from).join(to), "latin1"),
});

async function insertImage(id: string, uploadedById: string | null) {
  const sha = Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
  await sql(
    'insert into "MediaFile" (id, sha256, key, url, "contentType", size, "originalName", alt, "uploadedById") values ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
    [id, sha, `media/${sha}.png`, `https://media.e2e.test/test-bucket/media/${sha}.png`, "image/png", 10, `${id}.png`, "original", uploadedById],
  );
}

const altOf = async (id: string) => (await sql('select alt from "MediaFile" where id = $1', [id]))[0]?.alt;

async function newEditor(admin: Page, browser: Browser) {
  const email = `verify-alt-${Date.now()}@mrdesign.test`;
  const password = "verify-alt-password-1";
  await admin.goto("/admin/usuarios");
  const form = admin.getByRole("form", { name: "Nuevo usuario" });
  await form.getByLabel("Nombre").fill("Editor Verify");
  await form.getByLabel("Email").fill(email);
  await form.getByLabel("Contraseña").fill(password);
  await form.getByLabel("Rol").selectOption("editor");
  await form.getByRole("button", { name: "Crear usuario" }).click();
  await expect(admin.getByRole("row").filter({ hasText: email })).toBeVisible();
  const [{ id }] = await sql('select id from "user" where email = $1', [email]);
  const context = await browser.newContext();
  const editor = await context.newPage();
  await logIn(editor, email, password);
  return { editor, context, editorId: id as string };
}

test("alt text: editors only their own images (UI and replay); admins any image", async ({ page, browser, playwright }, info) => {
  const stamp = Date.now();
  const own = `vfy-own-${stamp}`;
  const adminImg = `vfy-adm-${stamp}`;
  const orphan = `vfy-orp-${stamp}`;
  await logIn(page);
  const [{ id: adminId }] = await sql('select id from "user" where email = $1', [E2E_ADMIN.email]);
  const { editor, context, editorId } = await newEditor(page, browser);
  await insertImage(own, editorId);
  await insertImage(adminImg, adminId);
  await insertImage(orphan, null);

  await serveFakeMedia(editor);
  await editor.goto("/admin/imagenes");
  const card = (name: string) => editor.getByRole("listitem").filter({ hasText: `${name}.png` });
  await expect(card(own).getByRole("button", { name: `Guardar texto de ${own}.png`, exact: true })).toBeVisible();
  for (const other of [adminImg, orphan]) {
    await expect(card(other)).toBeVisible();
    await expect(card(other).getByRole("button", { name: /Guardar texto/ })).toHaveCount(0);
    await expect(card(other).getByRole("textbox")).toHaveCount(0);
  }

  await card(own).getByLabel(`Texto alternativo de ${own}.png`).fill("Texto del editor");
  const save = await captureAction(editor, () => card(own).getByRole("button", { name: `Guardar texto de ${own}.png`, exact: true }).click());
  expect(await altOf(own)).toBe("original");
  expect(save.body.toString("latin1")).toContain(own);

  // Editor replays with another image's id: nothing changes and the action says why.
  for (const target of [adminImg, orphan]) {
    const response = await replay(editor.request, retarget(save, own, target));
    expect(await response.text()).toContain("Solo puedes cambiar el texto alternativo de las imágenes que subiste.");
    expect(await altOf(target)).toBe("original");
  }
  // Anonymous replays change nothing either.
  const anon = await playwright.request.newContext({ baseURL: info.project.use.baseURL });
  for (const target of [own, adminImg, orphan]) await replay(anon, retarget(save, own, target));
  for (const target of [own, adminImg, orphan]) expect(await altOf(target)).toBe("original");

  // Positive controls: the editor's own replay works, and the admin's replay works on every image.
  await replay(editor.request, save);
  expect(await altOf(own)).toBe("Texto del editor");
  for (const target of [adminImg, orphan]) {
    await replay(page.request, retarget(save, own, target));
    expect(await altOf(target)).toBe("Texto del editor");
  }

  await anon.dispose();
  await context.close();
  await sql('delete from "MediaFile" where id = any($1)', [[own, adminImg, orphan]]);
});
