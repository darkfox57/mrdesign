// e2e tests always run against the local database, never a shared one from .env.
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://mrdesign:mrdesign@localhost:5434/mrdesign";

// Local-only test account, created by global-setup.ts in the docker database.
export const E2E_ADMIN = {
  email: "e2e-admin@mrdesign.test",
  name: "Admin E2E",
  password: "e2e-local-password-not-secret",
};
