import { expect, test, type Page } from "@playwright/test";

// X-ray mode (odd/tasks/site-build-experience.md, T3): a site-wide toggle in the header (in the menu
// on small screens) outlines and names every component marked data-x, lays a 12-column grid over
// the page and stays on across reloads and pages.

async function toggle(page: Page) {
  // On small screens the toggle lives in the menu.
  const menu = page.getByRole("button", { name: "Abrir menú" });
  if (await menu.isVisible()) await menu.click();
  return page.getByRole("button", { name: "Rayos X" }).filter({ visible: true });
}

async function closeMenu(page: Page) {
  const close = page.getByRole("button", { name: "Cerrar menú" });
  if (await close.isVisible()) await close.click();
}

const html = (page: Page) => page.locator("html");

test("the X-ray toggle outlines the components and persists after a reload", async ({ page }) => {
  await page.goto("/");
  const button = await toggle(page);
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await expect(html(page)).not.toHaveClass(/\bxray\b/);

  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect(html(page)).toHaveClass(/\bxray\b/);
  await closeMenu(page);

  const hero = page.locator("[data-x=Hero]");
  expect(await hero.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("dashed");
  expect(await hero.evaluate((node) => getComputedStyle(node, "::after").content)).toContain("<Hero>");
  await expect(page.locator(".xray-grid")).toHaveCSS("opacity", "1");

  await page.reload();
  await expect(html(page)).toHaveClass(/\bxray\b/);
  await expect(await toggle(page)).toHaveAttribute("aria-pressed", "true");
  await closeMenu(page);

  // The mode follows the visitor to other pages.
  await page.goto("/portafolio");
  await expect(html(page)).toHaveClass(/\bxray\b/);

  const off = await toggle(page);
  await off.click();
  await expect(off).toHaveAttribute("aria-pressed", "false");
  await expect(html(page)).not.toHaveClass(/\bxray\b/);
  await page.reload();
  await expect(html(page)).not.toHaveClass(/\bxray\b/);
});

test("the labels are decorative: no layout shift, no lost clicks, no extra accessible names", async ({ page }) => {
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  const before = await heading.boundingBox();
  const row = page.locator("#lineas [data-x=ServiceRow] a").first();
  const name = await row.evaluate((node) => node.textContent);

  await (await toggle(page)).click();
  await closeMenu(page);
  await expect(html(page)).toHaveClass(/\bxray\b/);
  expect(await heading.boundingBox()).toEqual(before);
  // The label is CSS content with an empty alternative text: assistive technology skips it.
  await expect(row).toHaveAccessibleName(/^(?!.*<ServiceRow>)/);
  expect(await row.evaluate((node) => node.textContent)).toBe(name);

  // Clicks go through the labels and the grid.
  const stage = page.locator("[data-x=BuildStage]");
  await stage.getByRole("button", { name: /02\s*Maquetación/ }).click();
  await expect(stage).toHaveAttribute("data-step", "1");
});

test("the English header names the toggle in English", async ({ page }) => {
  await page.goto("/en");
  const menu = page.getByRole("button", { name: "Open menu" });
  if (await menu.isVisible()) await menu.click();
  await expect(page.getByRole("button", { name: "X-ray" }).filter({ visible: true })).toHaveAttribute("aria-pressed", "false");
});
