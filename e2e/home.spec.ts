import { expect, test, type Page } from "@playwright/test";

// Homepage design (T18, S10): sections, interactive selectors, FAQ, motion fallbacks and layout.
const headings = {
  es: {
    path: "/",
    h1: "Software que trabaja para tu negocio.",
    h2: [
      "¿Te suena alguno de estos problemas?",
      "Seis líneas de trabajo. Un mismo criterio.",
      "Trabajo real, contado con datos verificables.",
      "Por fases, con entregas que puedes ver.",
      "Primero el problema. Después la tecnología.",
      "Un estudio independiente. La persona con la que hablas es la que construye.",
      "Lo que suelen preguntarnos antes de empezar.",
      "¿Qué quieres resolver?",
    ],
  },
  en: {
    path: "/en",
    h1: "Software that works for your business.",
    h2: [
      "Does any of these problems sound familiar?",
      "Six lines of work. One standard.",
      "Real work, told with verifiable data.",
      "In phases, with deliveries you can see.",
      "The problem first. Then the technology.",
      "An independent studio. The person you talk to is the one who builds.",
      "What people usually ask us before starting.",
      "What do you want to solve?",
    ],
  },
} as const;

const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const locale of ["es", "en"] as const) {
  test(`${locale} home shows every section of the design in order`, async ({ page }) => {
    const { path, h1, h2 } = headings[locale];
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
    const titles = page.locator("main h2");
    await expect(titles).toHaveText([...h2]);
    await expect(page.getByRole("link", { name: locale === "es" ? "Saltar al contenido" : "Skip to content" })).toHaveAttribute(
      "href",
      "#contenido",
    );
  });
}

test("the hero legend highlights a layer on click", async ({ page }) => {
  await page.goto("/");
  const legend = page.getByRole("group", { name: "Las capas de un producto digital" });
  const data = legend.getByRole("button", { name: /Datos/ });
  await expect(data).toHaveAttribute("aria-pressed", "false");
  await data.click();
  await expect(data).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-stage]")).toHaveAttribute("data-active", "2");
  await data.click();
  await expect(data).toHaveAttribute("aria-pressed", "false");
});

test("choosing a problem shows its path and leads to its service line", async ({ page }) => {
  await page.goto("/");
  const problems = page.getByRole("group", { name: "Problemas frecuentes" });
  const spreadsheets = problems.getByRole("button", { name: /hojas de cálculo/ });
  await spreadsheets.click();
  await expect(spreadsheets).toHaveAttribute("aria-pressed", "true");
  const panel = page.locator("[data-problem-panel]");
  await expect(panel).toHaveAttribute("aria-live", "polite");
  await expect(panel).toContainText("Una herramienta hecha para tu proceso");
  await expect(panel).toContainText("Aplicaciones y plataformas");

  await panel.getByRole("link", { name: /Ver cómo funciona/ }).click();
  const services = page.getByRole("group", { name: "Servicios" });
  await expect(services.getByRole("button", { name: /Aplicaciones y plataformas/ })).toHaveAttribute("aria-pressed", "true");
});

test("the services selector switches the panel by click and keyboard", async ({ page }) => {
  await page.goto("/");
  const services = page.getByRole("group", { name: "Servicios" });
  const panel = page.locator("[data-service-panel]");
  await expect(services.getByRole("button", { name: /Sitios web/ })).toHaveAttribute("aria-pressed", "true");
  await expect(panel).toHaveAttribute("aria-live", "polite");

  await services.getByRole("button", { name: /Funnels de conversión/ }).click();
  await expect(services.getByRole("button", { name: /Funnels de conversión/ })).toHaveAttribute("aria-pressed", "true");
  await expect(services.getByRole("button", { name: /Sitios web/ })).toHaveAttribute("aria-pressed", "false");
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText("Funnels de conversión");
  await expect(panel.getByRole("img")).toHaveAttribute("aria-label", "Flujo: Fuente, Página, Formulario, Seguimiento, Medición");

  const integrations = services.getByRole("button", { name: /Integraciones y automatización/ });
  await integrations.focus();
  await page.keyboard.press("Enter");
  await expect(integrations).toHaveAttribute("aria-pressed", "true");
  await expect(panel.getByRole("heading", { level: 3 })).toHaveText("Integraciones y automatización");

  const evolution = services.getByRole("button", { name: /Evolución continua/ });
  await evolution.focus();
  await page.keyboard.press("Space");
  await expect(evolution).toHaveAttribute("aria-pressed", "true");
  await expect(panel).toContainText("[Confirmar alcance de soporte]");
});

test("the cases browser switches case and part by click and keyboard", async ({ page }) => {
  await page.goto("/");
  const cases = page.getByRole("group", { name: "Casos de estudio" });
  const parts = page.getByRole("group", { name: "Partes del caso" });
  const body = page.locator("[data-case-body]");
  await expect(body).toHaveAttribute("aria-live", "polite");
  await expect(body).toContainText("Vender llantas online");

  await cases.getByRole("button", { name: /LlantaMarket/ }).click();
  await expect(cases.getByRole("button", { name: /LlantaMarket/ })).toHaveAttribute("aria-pressed", "true");
  await expect(cases.getByRole("button", { name: /Llantas y Tires/ })).toHaveAttribute("aria-pressed", "false");
  await expect(body).toContainText("Lanzar una plataforma de llantas sin empezar desde cero.");

  const solution = parts.getByRole("button", { name: "Solución" });
  await solution.focus();
  await page.keyboard.press("Enter");
  await expect(solution).toHaveAttribute("aria-pressed", "true");
  await expect(body).toContainText("Una base existente, adaptada a una nueva operación.");
  await expect(body).toContainText("[Confirmar métrica]");

  // A new case starts again from its first part.
  await cases.getByRole("button", { name: /Llantas y Tires/ }).click();
  await expect(parts.getByRole("button", { name: "Reto" })).toHaveAttribute("aria-pressed", "true");
});

test("FAQ answers expand and collapse and stay in the page", async ({ page }) => {
  await page.goto("/");
  const firstAnswer = page.getByText(/Si tu proyecto no encaja con lo que hacemos/);
  await expect(firstAnswer).toBeVisible();

  const question = page.getByText("¿Cuánto tiempo toma un proyecto?", { exact: true });
  const answer = page.getByText(/Por eso empezamos con un diagnóstico/);
  await expect(answer).toHaveCount(1);
  await expect(answer).toBeHidden();
  await question.click();
  await expect(answer).toBeVisible();
  await question.click();
  await expect(answer).toBeHidden();
});

test("the home contact form sends through the contact action", async ({ page }, testInfo) => {
  // The contact action allows five messages per hour per address: one project is enough here.
  test.skip(testInfo.project.name !== "desktop", "one submission per run");
  await page.goto("/");
  const form = page.locator("#contacto form");
  const store = form.getByRole("button", { name: "Tienda online" });
  await store.click();
  await expect(store).toHaveAttribute("aria-pressed", "true");
  await form.getByLabel("Cuéntanos el reto").fill("Tenemos tienda online y el inventario se actualiza a mano.");
  await form.getByLabel("Nombre").fill("E2E Home");
  await form.getByLabel("Correo", { exact: true }).fill(`e2e-home-${Date.now()}@example.com`);
  await form.getByLabel(/Autorizo el tratamiento de mis datos/).check();
  await form.getByRole("button", { name: /Enviar y agendar una conversación/ }).click();

  await expect(page.getByRole("status")).toContainText("Gracias. Ya tenemos tu reto.");
  await page.getByRole("button", { name: "Enviar otro mensaje" }).click();
  await expect(page.locator("#contacto form").getByLabel("Nombre")).toHaveValue("");
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

test("motion starts with GSAP when the visitor allows it", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-home]")).toHaveAttribute("data-motion", "on");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("GSAP never starts and all content is visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("[data-home]")).not.toHaveAttribute("data-motion", "on");
    const hidden = await page.locator("[data-reveal], [data-hero-fade], [data-hero-line]").evaluateAll((nodes) =>
      nodes.filter((node) => {
        const style = getComputedStyle(node);
        return style.opacity !== "1" || style.visibility === "hidden";
      }).length,
    );
    expect(hidden).toBe(0);
    for (const title of headings.es.h2) {
      await page.getByRole("heading", { level: 2, name: title }).scrollIntoViewIfNeeded();
      await expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible();
    }
  });
});

test("no horizontal overflow at 390 px, also with panels open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/en"]) {
    await page.goto(path);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  }
  await page.goto("/");
  await page.getByRole("group", { name: "Servicios" }).getByRole("button", { name: /Tiendas y comercio/ }).click();
  await page.getByRole("group", { name: "Casos de estudio" }).getByRole("button", { name: /LlantaMarket/ }).click();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  // The home root clips overflow, so also check that no panel is wider than the screen.
  const widest = await page
    .locator("[data-problem-panel], [data-service-panel], [data-stagebox], #contacto form")
    .evaluateAll((nodes) => Math.max(...nodes.map((node) => node.getBoundingClientRect().right)));
  expect(widest).toBeLessThanOrEqual(390);
});
