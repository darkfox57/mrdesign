// e2e tests always run against the local database, never a shared one from .env.
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://mrdesign:mrdesign@localhost:5434/mrdesign";
