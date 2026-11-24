// @vitest-environment node
// POST /api/blog request limit per API key (S9, A10): 60 requests per hour per key, checked after the
// key is authenticated and before the body is read. The key lookup and the ingest itself are stubbed;
// the limiter is the real one, so each test uses its own key ids.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authenticateKey, ingestPost } = vi.hoisted(() => ({ authenticateKey: vi.fn(), ingestPost: vi.fn() }));
vi.mock("@/lib/blog/ingest", () => ({ authenticateKey, ingestPost }));

const { POST } = await import("./route");

const LIMIT = 60;
const HOUR_MS = 60 * 60_000;
const LIMITED = { error: "Demasiadas solicitudes con esta API key. Vuelve a intentarlo más tarde." };
let run = 0;

// The key the stubbed lookup returns for each token: "valid-<id>" authenticates as key <id>.
function keyFor(token: string | null) {
  return token?.startsWith("valid-") ? { id: token.slice("valid-".length), revokedAt: null, publishImmediately: true } : null;
}

function post(token: string | null, body: BodyInit = JSON.stringify({ title: "Hola" }), headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/blog", {
      method: "POST",
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json", ...headers },
      body,
    }),
  );
}

// A body that records whether anything pulled from it. With a high-water mark of 0 the stream only
// pulls when a reader asks for data, never on its own.
function watchedBody() {
  const state = { read: false };
  const stream = new ReadableStream<Uint8Array>(
    {
      pull(controller) {
        state.read = true;
        controller.enqueue(new TextEncoder().encode(JSON.stringify({ title: "Hola" })));
        controller.close();
      },
    },
    { highWaterMark: 0 },
  );
  return { stream, state };
}

it("the watched body reports a read when the route reads it (probe control)", async () => {
  authenticateKey.mockResolvedValue({ id: `probe-${Date.now()}`, revokedAt: null, publishImmediately: true });
  ingestPost.mockResolvedValue({ status: 201, body: {} });
  const { stream, state } = watchedBody();
  expect((await postStream("valid-probe", stream)).status).toBe(201);
  expect(state.read).toBe(true);
});

const postStream = (token: string, stream: ReadableStream<Uint8Array>) =>
  POST(new Request("http://localhost/api/blog", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: stream, duplex: "half" } as RequestInit));

async function exhaust(token: string, body?: BodyInit) {
  for (let i = 0; i < LIMIT; i++) expect((await post(token, body)).status).not.toBe(429);
}

describe("POST /api/blog request limit", () => {
  let key: string;
  beforeEach(() => {
    key = `route-test-${Date.now()}-${run++}`;
    authenticateKey.mockReset().mockImplementation(async (token: string | null) => keyFor(token));
    ingestPost.mockReset().mockResolvedValue({ status: 201, body: { id: "post-1" } });
  });
  afterEach(() => vi.useRealTimers());

  it("answers 429 with Retry-After on the 61st request of a key within the hour, without reading the body", async () => {
    await exhaust(`valid-${key}`);
    expect(ingestPost).toHaveBeenCalledTimes(LIMIT);

    const { stream, state } = watchedBody();
    const response = await postStream(`valid-${key}`, stream);
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("3600");
    expect(await response.json()).toEqual(LIMITED);
    expect(state.read).toBe(false);
    expect(ingestPost).toHaveBeenCalledTimes(LIMIT);
  });

  it("counts failed authenticated requests too", async () => {
    await exhaust(`valid-${key}`, "not json");
    expect(ingestPost).not.toHaveBeenCalled();
    const response = await post(`valid-${key}`);
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("3600");
    expect(ingestPost).not.toHaveBeenCalled();
  });

  it("limits each key on its own", async () => {
    await exhaust(`valid-${key}`);
    expect((await post(`valid-${key}`)).status).toBe(429);
    expect((await post(`valid-${key}-other`)).status).toBe(201);
  });

  it("lets the key send again once the hour has passed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-24T10:00:00Z"));
    await exhaust(`valid-${key}`);
    expect((await post(`valid-${key}`)).status).toBe(429);
    vi.setSystemTime(new Date(Date.now() + HOUR_MS));
    expect((await post(`valid-${key}`)).status).toBe(201);
  });

  it("still answers 401 to an unknown or revoked key, never 429, and that does not use up a key's quota", async () => {
    for (let i = 0; i < LIMIT + 5; i++) {
      const response = await post(i % 2 ? "unknown" : null);
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toBe("Bearer");
      expect(response.headers.get("retry-after")).toBeNull();
      expect(await response.json()).toEqual({ error: "API key inválida o revocada." });
    }
    await exhaust(`valid-${key}`);
    expect((await post(`valid-${key}`)).status).toBe(429);
    // A key that stops authenticating (revoked) gets 401 even while its quota is spent.
    authenticateKey.mockResolvedValue(null);
    const revoked = await post(`valid-${key}`);
    expect(revoked.status).toBe(401);
    expect(await revoked.json()).toEqual({ error: "API key inválida o revocada." });
  });

  it("keeps 413, 400 and the ingest answer for a key within its limit", async () => {
    expect((await post(`valid-${key}`, "x", { "content-length": "1000001" })).status).toBe(413);
    const invalid = await post(`valid-${key}`, "not json");
    expect(invalid.status).toBe(400);
    expect(await invalid.json()).toEqual({ error: "El cuerpo no es JSON válido." });
    const created = await post(`valid-${key}`);
    expect(created.status).toBe(201);
    expect(await created.json()).toEqual({ id: "post-1" });
    expect(ingestPost).toHaveBeenCalledWith(expect.objectContaining({ id: key }), { title: "Hola" });
  });
});
