import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_URL } from "./e2e/test-env";

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Several Chromium processes at once stall static file requests on Windows; one worker keeps runs reliable.
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 1,
  outputDir: "./test-results",
  use: { baseURL: BASE_URL },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    timeout: 300_000,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    // Process env wins over .env: the e2e server never touches a shared database.
    env: { DATABASE_URL: E2E_DATABASE_URL, SITE_URL: BASE_URL },
  },
});
