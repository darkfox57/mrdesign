import { buildLlmsTxt } from "@/lib/seo/llms";

// Code-owned copy only, no database: built once at build time. The proxy matcher skips paths with an
// extension, so /llms.txt is never localized or redirected.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
