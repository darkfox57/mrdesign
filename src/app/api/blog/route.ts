import { NextResponse } from "next/server";
import { bearerToken } from "@/lib/api-keys";
import { authenticateKey, ingestPost } from "@/lib/blog/ingest";

// Blog ingest for any system holding an API key from /admin/api-keys. Contract in docs/api-blog.md.
// Authorization: Bearer <key>; the key decides whether the post is published or left as a draft.
const MAX_BODY_BYTES = 1_000_000;

const tooLarge = () => NextResponse.json({ error: "El cuerpo supera 1 MB." }, { status: 413 });

// Reads at most `limit` bytes, counting them as they arrive: Content-Length can be missing
// (chunked bodies) or wrong, so it is never trusted. Returns null when the body is bigger.
async function readLimited(request: Request, limit: number) {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function POST(request: Request) {
  // Authenticate before touching the body: without a valid key nothing is read.
  const key = await authenticateKey(bearerToken(request.headers.get("authorization")));
  if (!key) {
    await request.body?.cancel().catch(() => {});
    return NextResponse.json({ error: "API key inválida o revocada." }, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    await request.body?.cancel().catch(() => {});
    return tooLarge();
  }
  const text = await readLimited(request, MAX_BODY_BYTES);
  if (text === null) return tooLarge();

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "El cuerpo no es JSON válido." }, { status: 400 });
  }

  const result = await ingestPost(key, body);
  return NextResponse.json(result.body, { status: result.status });
}
