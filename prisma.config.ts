import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // process.env instead of env(): `prisma generate` (postinstall) must work without a database URL.
  // Commands that connect (migrate, deploy) still fail clearly when it is missing.
  datasource: { url: process.env.DATABASE_URL },
});
