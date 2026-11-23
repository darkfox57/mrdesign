import { expect, test } from "@playwright/test";

test("shows field errors and keeps what the visitor typed", async ({ page }) => {
  await page.goto("/contacto");
  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Email").fill("no-es-un-email");
  await page.getByRole("button", { name: "Enviar mensaje" }).click();

  await expect(page.getByText("Escribe un email válido.")).toBeVisible();
  await expect(page.getByText("Elige qué necesitas.")).toBeVisible();
  await expect(page.getByText("Acepta la política de privacidad para que pueda responderte.")).toBeVisible();
  await expect(page.getByLabel("Nombre")).toHaveValue("Ana");
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
});

test("sends a message in English and confirms it", async ({ page }) => {
  await page.goto("/en/contact");
  await page.getByLabel("Name").fill("E2E Visitor");
  await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.com`);
  await page.getByLabel("What do you need?").selectOption("shopify");
  await page.getByLabel("Tell me about your project").fill("I need to migrate my store to Shopify.");
  await page.getByLabel(/I accept the/).check();
  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByRole("status")).toContainText("I got your message");
});
