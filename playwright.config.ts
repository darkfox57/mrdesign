import { defineConfig, devices } from "@playwright/test";
import { FAKE_MEDIA_ORIGIN, FAKE_R2_PORT } from "./e2e/fake-media";
import { E2E_DATABASE_URL } from "./e2e/test-env";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Several Chromium processes at once stall static file requests on Windows; one worker keeps runs reliable.
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 1,
  outputDir: "./test-results",
  globalSetup: "./e2e/global-setup.ts",
  use: { baseURL: BASE_URL },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: [
    {
      command: `npm run build && npm run start -- -p ${PORT}`,
      timeout: 300_000,
      port: PORT,
      // On Windows the server can outlive the run; reusing it would test a stale build.
      reuseExistingServer: false,
      // Process env wins over .env: the e2e server never touches a shared database.
      env: {
        DATABASE_URL: E2E_DATABASE_URL,
        SITE_URL: BASE_URL,
        BETTER_AUTH_URL: BASE_URL,
        BETTER_AUTH_SECRET: "e2e-only-secret-not-used-anywhere-else-0123456789",
        // Tests never send real email, even if .env has a Brevo key.
        BREVO_API_KEY: "",
        // Uploads go to the local fake bucket (e2e/fake-r2.mjs), never to the real R2.
        R2_ENDPOINT: `http://localhost:${FAKE_R2_PORT}`,
        R2_ACCOUNT_ID: "e2e",
        R2_ACCESS_KEY_ID: "e2e",
        R2_SECRET_ACCESS_KEY: "e2e",
        R2_BUCKET: "test-bucket",
        // https like the real bucket; e2e/fake-media.ts answers it from the fake bucket.
        R2_PUBLIC_URL: `${FAKE_MEDIA_ORIGIN}/test-bucket`,
      },
    },
    {
      command: "node e2e/fake-r2.mjs",
      port: FAKE_R2_PORT,
      reuseExistingServer: false,
      env: { FAKE_R2_PORT: String(FAKE_R2_PORT) },
    },
  ],
});
