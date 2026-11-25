import { expect, test, type Page } from "@playwright/test";
import { publicCaseCount, sql } from "./helpers/db";

// The home of the approved prototype (odd/tasks/site-build-experience.md, T3 and T4): the build
// stage, the two problem paths, the working pieces, the lines of work, the published cases, the
// process and the real contact form. Content pending the client (SHOW_PENDING_CONTENT = false) is
// never rendered.
const home = {
  es: {
    path: "/",
    h1: "Mira cómo se construye lo que vas a vender.",
    h2: [
      "¿Te suena alguno de estos problemas?",
      "Cada pieza está pensada para que alguien compre, escriba o vuelva.",
      /líneas de trabajo\. Cada una con su página, su proceso y sus casos\.$/,
      "Así se construye un proyecto conmigo.",
      "¿Qué construimos?",
    ],
    cases: "Casos reales, contados con datos que se pueden verificar.",
  },
  en: {
    path: "/en",
    h1: "Watch how your next sale gets built.",
    h2: [
      "Does any of these problems sound familiar?",
      "Every piece is designed so someone buys, writes or comes back.",
      /lines of work\. Each with its own page, process and cases\.$/,
      "This is how a project gets built with me.",
      "What shall we build?",
    ],
    cases: "Real cases, told with data you can verify.",
  },
} as const;

const horizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const sectionTitles = async (page: Page, casesTitle: string) =>
  (await page.locator("main h2").allTextContents()).map((text) => text.trim()).filter((text) => text !== casesTitle);

for (const locale of ["es", "en"] as const) {
  test(`${locale} home shows every section of the design in order`, async ({ page }) => {
    const { path, h1, h2, cases } = home[locale];
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    const titles = await sectionTitles(page, cases);
    expect(titles).toHaveLength(h2.length);
    h2.forEach((expected, index) => expect(titles[index]).toMatch(expected));
  });
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of ["es", "en"] as const) {
    test(`${locale} home is complete in the server HTML`, async ({ page }) => {
      const { path, h1, h2, cases } = home[locale];
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
      for (const title of h2) await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
      expect(await sectionTitles(page, cases)).toHaveLength(h2.length);
      // The stage shows the finished build, and its whole log is real text.
      const rail = page.locator("[data-x=BuildStage] [role=group] button");
      await expect(rail).toHaveCount(6);
      await expect(rail.last()).toHaveAttribute("aria-current", "step");
      await expect(page.locator("[data-x=BuildStage] [role=log] p").filter({ visible: true })).toHaveCount(6);
      // The first problem is shown solved, with its approach and result.
      await expect(page.locator("[data-x=ProblemDiagnosis]")).toHaveAttribute("data-fixed", "");
    });
  }
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the stage shows the final build step and nothing waits to be revealed", async ({ page }) => {
    await page.goto("/");
    const stage = page.locator("[data-x=BuildStage]");
    await stage.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(stage).toHaveAttribute("data-step", "5");
    await expect(stage.getByRole("button", { name: /06\s*En vivo/ })).toHaveAttribute("aria-current", "step");
    await expect(stage.getByRole("button", { name: "Reproducir" })).toBeVisible();
    await expect(page.locator("[data-reveals]")).not.toHaveAttribute("data-motion", "on");
    const hidden = await page.locator("[data-reveal]").evaluateAll(
      (nodes) => nodes.filter((node) => getComputedStyle(node).opacity !== "1").length,
    );
    expect(hidden).toBe(0);
  });
});

test("scroll reveals start with GSAP when motion is allowed", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-reveals]")).toHaveAttribute("data-motion", "on");
});

test("the home runs without script errors while it builds and reveals", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.goto("/");
  await expect(page.locator("[data-reveals]")).toHaveAttribute("data-motion", "on");
  for (const id of ["#problemas", "#piezas", "#lineas", "#proceso", "#contacto"]) {
    await page.locator(id).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }
  expect(errors).toEqual([]);
});

test("clicking a rail step shows that step and pauses the build", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator("[data-x=BuildStage]");
  const content = stage.getByRole("button", { name: /03\s*Contenido/ });
  await content.click();
  await expect(content).toHaveAttribute("aria-current", "step");
  await expect(stage).toHaveAttribute("data-step", "2");
  await expect(stage.locator("[role=log] p").filter({ visible: true })).toHaveCount(3);
  await expect(stage.locator("[role=log]")).toHaveAttribute("aria-live", "polite");
  await expect(stage.getByRole("button", { name: "Reproducir" })).toBeVisible();

  await stage.getByRole("button", { name: /06\s*En vivo/ }).click();
  await expect(stage).toHaveAttribute("data-step", "5");
  await expect(stage.locator("[role=log] p").filter({ visible: true })).toHaveCount(6);
  await expect(stage.locator("[role=log] p").last()).toHaveText(/deploy/);
});

test("the audience toggle switches the problem list and its lines of work", async ({ page }) => {
  await page.goto("/");
  const audience = page.getByRole("group", { name: "¿En qué punto estás?" });
  const problems = page.getByRole("group", { name: "Problemas frecuentes" });
  const panel = page.locator("[data-x=ProblemDiagnosis]");

  await expect(audience.getByRole("button", { name: "Estoy empezando" })).toHaveAttribute("aria-pressed", "true");
  await expect(problems.getByRole("button")).toHaveCount(5);
  await expect(problems.getByRole("button", { name: /Quiero algo que crezca conmigo, no rehacerlo en un año/ })).toBeVisible();
  await expect(panel).toContainText("Dónde estás");

  await audience.getByRole("button", { name: "Ya tengo un negocio funcionando" }).click();
  await expect(audience.getByRole("button", { name: "Ya tengo un negocio funcionando" })).toHaveAttribute("aria-pressed", "true");
  await expect(problems.getByRole("button", { name: /Tengo la idea/ })).toHaveCount(0);
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText("Tu web no representa lo que hace tu empresa");
  await expect(panel).toContainText("Problema");

  await problems.getByRole("button", { name: /hojas de cálculo/ }).click();
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText("Tu operación depende de hojas de cálculo y copiar y pegar");
  // The fix shows itself, then the line of work leads to its page.
  await expect(panel).toHaveAttribute("data-fixed", "");
  await expect(panel.getByRole("link", { name: "Línea: Aplicaciones web y móviles →" })).toHaveAttribute("href", "/servicios/aplicaciones");
  await panel.getByRole("button", { name: "Ver el arreglo otra vez" }).click();
  await expect(panel).toHaveAttribute("data-fixed", "");
});

test("adding to the cart updates the cart piece", async ({ page }) => {
  await page.goto("/");
  const pieces = page.locator("#piezas");
  const cart = pieces.locator("[data-x=CartLines]");
  await expect(cart).toContainText("Tu carrito está vacío");

  await pieces.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(cart).toContainText("Silla Lumen · Roble");
  await expect(cart).toContainText("Subtotal (1 producto) $ 420.000");

  await pieces.getByRole("button", { name: "Nogal" }).click();
  await pieces.getByRole("button", { name: "Agregar una" }).click();
  await pieces.getByRole("button", { name: "Agregar al carrito" }).click();
  await expect(cart.getByRole("listitem")).toHaveCount(2);
  await expect(cart).toContainText("Subtotal (3 productos) $ 1.260.000");

  await cart.getByRole("button", { name: "Quitar Silla Lumen · Roble del carrito" }).click();
  await expect(cart.getByRole("listitem")).toHaveCount(1);
  await expect(cart).toContainText("Subtotal (2 productos) $ 840.000");
});

test("the demo form validates as you type and says it sends nothing", async ({ page }) => {
  await page.goto("/");
  const piece = page.locator("#piezas article").filter({ hasText: "<ContactForm />" });
  await piece.getByLabel("Nombre").fill("Laura Restrepo");
  await piece.getByLabel("Correo").fill("laura@");
  await piece.getByLabel("Correo").blur();
  await expect(piece.getByText("Revisa el correo: le falta algo, como la @ o el dominio.")).toBeVisible();
  await piece.getByLabel("Correo").fill("laura@correo.com");
  await expect(piece.getByText("Correo válido.")).toBeVisible();
  await piece.getByRole("button", { name: "Enviar" }).click();
  await expect(piece.getByRole("status")).toContainText("Gracias, Laura.");
  await expect(piece.getByRole("status")).toContainText("Aquí no se envió nada.");
});

test("the contents piece adds and removes blocks, and every piece shows its skeleton", async ({ page }) => {
  await page.goto("/");
  const piece = page.locator("#piezas article").filter({ hasText: "<ContentBlocks />" });
  const remove = piece.getByRole("button", { name: /^Quitar bloque/ });
  await expect(remove).toHaveCount(3);
  await piece.getByRole("button", { name: "+ Imagen" }).click();
  await expect(remove).toHaveCount(4);
  await piece.getByRole("button", { name: "Quitar bloque: Título" }).click();
  await expect(remove).toHaveCount(3);

  await piece.getByRole("button", { name: "Ver esqueleto" }).click();
  await expect(piece).toHaveAttribute("data-skeleton", "");
  await piece.getByRole("button", { name: "Ver terminado" }).click();
  await expect(piece).not.toHaveAttribute("data-skeleton", "");
});

test.describe("keyboard focus never falls to the page body", () => {
  const focusInside = (page: Page, selector: string) =>
    page.evaluate((scope) => {
      const active = document.activeElement;
      return Boolean(active && active !== document.body && document.querySelector(scope)?.contains(active));
    }, selector);

  test("removing a cart line moves focus to the next line, then to the cart", async ({ page }) => {
    await page.goto("/");
    const pieces = page.locator("#piezas");
    await pieces.getByRole("button", { name: "Agregar al carrito" }).click();
    await pieces.getByRole("button", { name: "Nogal" }).click();
    await pieces.getByRole("button", { name: "Agregar al carrito" }).click();
    const cart = pieces.locator("[data-x=CartLines]");

    await cart.getByRole("button", { name: "Quitar Silla Lumen · Roble del carrito" }).focus();
    await page.keyboard.press("Enter");
    await expect(cart.getByRole("listitem")).toHaveCount(1);
    await expect(cart.getByRole("button", { name: "Quitar Silla Lumen · Nogal del carrito" })).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(cart).toContainText("Tu carrito está vacío");
    expect(await focusInside(page, "#piezas article:has([data-x=CartLines])")).toBe(true);
  });

  test("removing blocks moves focus to the next block, then to the article", async ({ page }) => {
    await page.goto("/");
    const piece = page.locator("#piezas article").filter({ hasText: "<ContentBlocks />" });
    await piece.getByRole("button", { name: "Quitar bloque: Título" }).focus();
    await page.keyboard.press("Enter");
    await expect(piece.getByRole("button", { name: "Quitar bloque: Párrafo" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(piece.getByRole("button", { name: "Quitar bloque: Cita" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(piece).toContainText("Agrega un bloque para empezar.");
    expect(await focusInside(page, "#piezas article:has([data-x=ArticlePreview])")).toBe(true);
  });

  test("the demo form announces its confirmation and returns focus to the form", async ({ page }) => {
    await page.goto("/");
    const piece = page.locator("#piezas article").filter({ hasText: "<ContactForm />" });
    // The live region exists, empty, before anything is sent, so its message is announced.
    const status = piece.getByRole("status");
    await expect(status).toHaveCount(1);
    await expect(status).toHaveText("");

    await piece.getByLabel("Nombre").fill("Laura");
    await piece.getByLabel("Correo").fill("laura@correo.com");
    await piece.getByRole("button", { name: "Enviar" }).press("Enter");
    await expect(status).toContainText("Gracias, Laura.");
    await expect(piece.getByRole("heading", { name: "Gracias, Laura." })).toBeFocused();

    await piece.getByRole("button", { name: "Volver a probar" }).press("Enter");
    await expect(piece.getByLabel("Nombre")).toBeFocused();
  });
});

test("the problem panel stays quiet until the visitor picks, then announces one status", async ({ page }) => {
  await page.goto("/");
  const panel = page.locator("[data-x=ProblemDiagnosis]");
  await panel.scrollIntoViewIfNeeded();
  // The intro animation plays on its own: nothing in the panel is announced for it.
  await expect(panel.locator("[aria-live=polite]")).toHaveCount(0);
  await expect(panel).not.toHaveAttribute("aria-live", "polite");

  await page.getByRole("group", { name: "Problemas frecuentes" }).getByRole("button", { name: /Necesito que me tomen en serio/ }).click();
  const live = panel.locator("[aria-live=polite]");
  await expect(live).toHaveCount(1);
  await expect(live).toHaveAttribute("aria-atomic", "true");
  await expect(live).toHaveText(/en marcha · así arrancaría/);
});

test("the dot on a fixed link travels a few times and comes to rest", async ({ page }) => {
  await page.goto("/");
  const counts = await page
    .locator("[data-x=ProblemDiagnosis] [aria-hidden=true] span")
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node, "::after").animationIterationCount).filter((count) => count !== "1"));
  expect(counts).not.toContain("infinite");
});

test("a focused rail step shows its whole focus ring", async ({ page }) => {
  await page.goto("/");
  const stage = page.locator("[data-x=BuildStage]");
  const first = stage.getByRole("button", { name: /01\s*Estructura/ });
  await first.focus();
  await page.keyboard.press("Tab");
  const second = stage.getByRole("button", { name: /02\s*Maquetación/ });
  await expect(second).toBeFocused();
  // An inset ring: it stays inside the button, so the rail's scroll box never clips it.
  const { offset, width } = await second.evaluate((node) => {
    const style = getComputedStyle(node);
    return { offset: parseFloat(style.outlineOffset), width: parseFloat(style.outlineWidth) };
  });
  expect(width).toBeGreaterThan(0);
  expect(offset + width).toBeLessThanOrEqual(0);
});

test("no leftover magnetic hooks remain on the page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-magnetic]")).toHaveCount(0);
});

test("an intent preselects the project type of the contact form", async ({ page }) => {
  await page.goto("/");
  const cta = page.locator("#contacto");
  const intents = cta.getByRole("group", { name: "Tipo de proyecto" });
  const projectType = cta.locator("form").getByLabel("¿Qué necesitas?");
  await expect(intents.getByRole("button").first()).toHaveText("Estoy empezando mi negocio");
  await expect(intents.getByRole("button", { name: "Estoy empezando mi negocio" })).toHaveAttribute("aria-pressed", "true");
  await expect(projectType).toHaveValue("other");

  await intents.getByRole("button", { name: "Un sitio web" }).click();
  await expect(projectType).toHaveValue("websites");
  await expect(cta).toContainText("Cuéntame a quién le hablas");
  // A store could be Shopify, PrestaShop or custom: no project type is guessed.
  await intents.getByRole("button", { name: "Una tienda en línea" }).click();
  await expect(projectType).toHaveValue("other");
});

test("the home contact form sends through the contact action", async ({ page }, testInfo) => {
  // The contact action allows five messages per hour per address: one project is enough here.
  test.skip(testInfo.project.name !== "desktop", "one submission per run");
  const email = `e2e-home-${Date.now()}@example.com`;
  await page.goto("/");
  const cta = page.locator("#contacto");
  await cta.getByRole("group", { name: "Tipo de proyecto" }).getByRole("button", { name: "Una aplicación" }).click();
  const form = cta.locator("form");
  await form.getByLabel("Cuéntame el reto").fill("Tenemos los pedidos en hojas de cálculo y queremos ordenarlos.");
  await form.getByLabel("Nombre").fill("E2E Home");
  await form.getByLabel("Correo", { exact: true }).fill(email);
  await form.getByLabel(/Autorizo el tratamiento de mis datos/).check();
  await form.getByRole("button", { name: /Enviar y agendar una conversación/ }).click();

  await expect(cta.getByRole("status")).toContainText("Gracias. Ya tengo tu reto.");
  const rows = await sql<{ projectType: string }>(`select "projectType" from "ContactSubmission" where email = $1`, [email]);
  expect(rows.map((row) => row.projectType)).toEqual(["apps"]);
  await sql(`delete from "ContactSubmission" where email = $1`, [email]);

  await cta.getByRole("button", { name: "Enviar otro mensaje" }).click();
  await expect(cta.locator("form").getByLabel("Nombre")).toHaveValue("");
  await expect(cta.locator("form").getByLabel("¿Qué necesitas?")).toHaveValue("apps");
});

test("the home contact form shows the action's field errors", async ({ page }) => {
  await page.goto("/");
  const form = page.locator("#contacto form");
  await form.getByLabel("Nombre").fill("Ana");
  await form.getByLabel("Correo", { exact: true }).fill("no-es-un-email");
  await form.getByRole("button", { name: /Enviar y agendar una conversación/ }).click();
  await expect(form.getByText("Escribe un email válido.")).toBeVisible();
  await expect(form.getByLabel("Nombre")).toHaveValue("Ana");
});

test("every line of work in services.ts has its row and page link", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#lineas [data-x=ServiceRow] a");
  await expect(rows).toHaveCount(6);
  await expect(rows.first()).toHaveAttribute("href", "/servicios/sitios-web");
  await expect(page.locator('#lineas a[href="/servicios/shopify"]')).toHaveCount(1);
});

test("no horizontal scroll at 360 px, also with panels open", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const path of ["/", "/en"]) {
    await page.goto(path);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  }
  await page.goto("/");
  await page.getByRole("button", { name: "Ya tengo un negocio funcionando" }).click();
  await page.locator("#piezas").getByRole("button", { name: "Agregar al carrito" }).click();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  // The page root clips overflow, so also check that no section content is wider than the screen.
  const widest = await page
    .locator("[data-x=BuildStage], [data-x=ProblemDiagnosis], #piezas article, #contacto form")
    .evaluateAll((nodes) => Math.max(...nodes.map((node) => node.getBoundingClientRect().right)));
  expect(widest).toBeLessThanOrEqual(360);
});

test.describe("pending content stays hidden", () => {
  const placeholder = /\[[^\]]+\]/;

  for (const path of ["/", "/en"]) {
    test(`${path} shows no placeholder`, async ({ page }) => {
      await page.goto(path);
      expect(await page.locator("body").innerText()).not.toMatch(placeholder);
    });
  }

  for (const locale of ["es", "en"] as const) {
    test(`${locale} numbers its sections without gaps, with the cases only when published`, async ({ page }) => {
      const published = await publicCaseCount(locale);
      await page.goto(home[locale].path);
      await expect(page.locator("#casos")).toHaveCount(published > 0 ? 1 : 0);
      const numbers = await page
        .locator("main section p")
        .evaluateAll((nodes) =>
          nodes.map((node) => /^(\d{2}) — /.exec(node.textContent?.trim() ?? "")?.[1]).filter((value) => value !== undefined),
        );
      expect(numbers).toEqual(published > 0 ? ["01", "02", "03", "04", "05"] : ["01", "02", "03", "04"]);
    });
  }
});

test.describe("published cases", () => {
  // Not "e2e-case-" nor "e2e-pubcase-": other specs delete those prefixes.
  const prefix = `e2e-homecase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const insert = `insert into "Case" (id, locale, "translationKey", slug, title, client, year, lines, summary, challenge, solution, result,
      metrics, stack, gallery, "clientAuthorized", status, featured, "publishedAt", "updatedAt")
    values ($1, 'es', $1, $1, $2, 'Cliente E2E', 2025, '{shopify}', 'Resumen E2E.', 'Reto.', 'Solución.', 'Resultado.',
      '[]', '{}', '[]', $3, $4, $5, now() - interval '1 minute', now())`;

  test.beforeAll(async () => {
    await sql(insert, [`${prefix}-a`, `Caso destacado ${prefix}`, true, "PUBLISHED", true]);
    await sql(insert, [`${prefix}-b`, `Caso sin autorizar ${prefix}`, false, "PUBLISHED", false]);
  });

  test.afterAll(async () => {
    await sql(`delete from "Case" where slug like $1`, [`${prefix}%`]);
  });

  test("the home lists up to three published cases, featured first, linking to their pages", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#casos");
    await expect(section.getByRole("heading", { level: 2 })).toHaveText(home.es.cases);
    const cards = section.locator("[data-x=CaseCard]");
    expect(await cards.count()).toBeLessThanOrEqual(3);
    await expect(cards.first().getByRole("link")).toHaveAttribute("href", `/portafolio/${prefix}-a`);
    await expect(section).not.toContainText(`Caso sin autorizar ${prefix}`);
    await expect(section.getByRole("link", { name: /Ver todos los casos/ })).toHaveAttribute("href", "/portafolio");
  });
});
