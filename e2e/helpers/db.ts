import { Client } from "pg";
import { E2E_DATABASE_URL } from "../test-env";

// One query against the local e2e database (never a shared one), closing the connection after it.
export async function sql<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return (await client.query(query, params)).rows as T[];
  } finally {
    await client.end();
  }
}

// How many cases the public pages of a locale show, with the same rule as src/lib/cases/public.ts.
export async function publicCaseCount(locale: "es" | "en"): Promise<number> {
  const [row] = await sql<{ count: string }>(
    `select count(*) from "Case" where status = 'PUBLISHED' and "clientAuthorized" = true and "publishedAt" <= now() and locale = $1`,
    [locale],
  );
  return Number(row.count);
}
