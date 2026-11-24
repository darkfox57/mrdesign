import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

// Verifier probe (temporary): one user's consecutive writes, and a fast double save.
test.skip(({ viewport }) => (viewport?.width ?? 0) < 1024, "desktop only");

async function query<T>(sql: string, values: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(sql, values)).rows as T[];
  } finally {
    await client.end();
  }
}

const RUN = `spec-vtmp-${Date.now()}`;
let id = "";
let counter = 0;
const hero = (title: string) => ({
  type: "Hero",
  props: { id: "hero", eyebrow: "", title, lead: "", primaryLabel: "Go", primaryHref: "/contacto", secondaryLabel: "", secondaryHref: "", background: "paper", side: [] },
});

test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  counter += 1;
  id = `${RUN}-${counter}`;
  await query(
    `insert into "Landing" (id, locale, "translationKey", slug, title, blocks, status, "updatedAt") values ($1, 'es', $1, $1, $1, $2::jsonb, 'DRAFT', now())`,
    [id, JSON.stringify({ root: { props: {} }, content: [hero("Inicio")] })],
  );
});
test.afterEach(() => query(`delete from "Landing" where id like $1`, [`${RUN}-%`]));

async function open(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Contraseña").fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto(`/admin/landings/${id}/visual`);
  await expect(page.frameLocator("iframe").getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
}

const draftTitle = async () =>
  ((await query<{ d: { content: { props: { title: string } }[] } | null }>(`select "draftBlocks" d from "Landing" where id = $1`, [id]))[0].d)?.content[0].props.title;

async function setTitle(page: Page, text: string) {
  await page.frameLocator("iframe").getByRole("heading", { level: 1 }).click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(text);
}

test("one user: save, save, save, publish, save in a row all succeed", async ({ page }) => {
  await open(page);
  for (const text of ["Uno", "Dos", "Tres"]) {
    await setTitle(page, text);
    await page.getByText("Guardar borrador", { exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Borrador guardado." })).toBeVisible();
    await expect.poll(draftTitle).toBe(text);
  }
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Landing publicada." })).toBeVisible();
  await setTitle(page, "Cuatro");
  await page.getByText("Guardar borrador", { exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado." })).toBeVisible();
  await expect.poll(draftTitle).toBe("Cuatro");
  await expect(page.getByRole("alert").filter({ hasText: "No se guardó" })).toHaveCount(0);
});

test("a fast double click on Guardar borrador saves once, with no false conflict", async ({ page }) => {
  await open(page);
  await setTitle(page, "Doble");
  const save = page.getByText("Guardar borrador", { exact: true });
  await save.dblclick();
  await page.waitForTimeout(2500);
  const alert = await page.getByRole("alert").filter({ hasText: "No se guardó" }).count();
  const status = await page.getByRole("status").filter({ hasText: "Borrador guardado." }).count();
  expect(alert).toBe(0);
  expect(status).toBe(1);
  expect(await draftTitle()).toBe("Doble");
  // a later save still works
  await setTitle(page, "Después");
  await save.click();
  await expect(page.getByRole("status").filter({ hasText: "Borrador guardado." })).toBeVisible();
  await expect.poll(draftTitle).toBe("Después");
});
