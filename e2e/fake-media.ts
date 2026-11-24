import type { Page } from "@playwright/test";

// The app only accepts https images, so the e2e server publishes media under this https origin
// (R2_PUBLIC_URL in playwright.config.ts). The browser never resolves it: requests are answered
// from the local fake bucket (e2e/fake-r2.mjs).
export const FAKE_MEDIA_ORIGIN = "https://media.e2e.test";
// Port of the fake bucket, started as a webServer in playwright.config.ts.
export const FAKE_R2_PORT = 3199;
// The fake bucket listens on 127.0.0.1 only.
const FAKE_R2_ORIGIN = `http://127.0.0.1:${FAKE_R2_PORT}`;

export async function serveFakeMedia(page: Page) {
  await page.route(`${FAKE_MEDIA_ORIGIN}/**`, async (route) => {
    const url = route.request().url().replace(FAKE_MEDIA_ORIGIN, FAKE_R2_ORIGIN);
    await route.fulfill({ response: await route.fetch({ url }) });
  });
}
