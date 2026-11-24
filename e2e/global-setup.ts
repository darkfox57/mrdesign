import { execFileSync } from "node:child_process";
import { E2E_ADMIN, E2E_DATABASE_URL } from "./test-env";

// Seeds the blog and landing fixtures and creates the e2e admin in the local database (docker
// compose). Idempotent.
export default function globalSetup() {
  // The seeds refuse any database but the local one; a failure stops the run.
  for (const seed of ["scripts/seed-e2e-blog.ts", "scripts/seed-e2e-landings.ts"]) {
    execFileSync("npx", ["tsx", seed], {
      env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL },
      stdio: "pipe",
      shell: process.platform === "win32",
    });
  }

  try {
    execFileSync("npx", ["tsx", "scripts/create-admin.ts"], {
      env: {
        ...process.env,
        DATABASE_URL: E2E_DATABASE_URL,
        ADMIN_EMAIL: E2E_ADMIN.email,
        ADMIN_NAME: E2E_ADMIN.name,
        ADMIN_PASSWORD: E2E_ADMIN.password,
      },
      stdio: "pipe",
      shell: process.platform === "win32",
    });
  } catch (error) {
    // Only the script's own "account exists" refusal is expected on a second run.
    const output = String((error as { stderr?: Buffer }).stderr ?? "");
    if (!output.includes(`A user with email ${E2E_ADMIN.email} already exists.`)) throw error;
  }
}
