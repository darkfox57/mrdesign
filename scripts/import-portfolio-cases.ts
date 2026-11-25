// Imports the projects of src/content/portfolio.ts as draft success cases, one per language
// (src/lib/cases/import-portfolio.ts). Idempotent: a second run creates nothing.
//
// It writes to the database DATABASE_URL names and never reads .env, so the target is always the
// one typed on the command line:
//   DATABASE_URL="postgresql://..." npm run cases:import
// Against production, only the owner runs it, explicitly. See docs/admin.md.
import { projects } from "@/content/portfolio";
import { importPortfolioCases, requireExplicitDatabaseUrl } from "@/lib/cases/import-portfolio";

async function main() {
  const target = requireExplicitDatabaseUrl(process.env);
  console.log(`Importing ${projects.length} portfolio projects as draft cases into ${target}.`);

  // Loaded after the check: the client reads DATABASE_URL when it is created.
  const { db } = await import("@/lib/db");
  try {
    const outcomes = await importPortfolioCases(db, projects);
    for (const { outcome, locale, slug, client } of outcomes) console.log(`${outcome.padEnd(7)} ${locale} ${slug} (${client})`);
    const created = outcomes.filter((item) => item.outcome === "created").length;
    console.log(`Created ${created}, skipped ${outcomes.length - created} that already existed.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
