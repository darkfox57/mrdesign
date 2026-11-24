// @vitest-environment node
// B1 (T14 verifier): parallel reset requests through the real action and the real limiter on the
// local database. Counting used to happen after an awaited check, so all of them passed it.
import { afterAll, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

// Each request may come from its own address (`client.ips`), so only the limit under test binds.
const { requestPasswordResetApi, client } = vi.hoisted(() => ({
  requestPasswordResetApi: vi.fn(),
  client: { ips: [] as string[], next: 0 },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": client.ips[client.next++ % client.ips.length] }),
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { requestPasswordReset: requestPasswordResetApi } } }));

const { requestPasswordReset } = await import("../password-actions");
const { db } = await import("@/lib/db");
const { isLocalDatabase } = await import("@/lib/is-local-database");

const local = isLocalDatabase(process.env.DATABASE_URL);
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const keys: string[] = [];

function form(email: string) {
  const data = new FormData();
  data.set("email", email);
  return data;
}

describe.skipIf(!local)("requestPasswordReset under parallel requests", () => {
  afterAll(async () => {
    await db.authThrottle.deleteMany({ where: { key: { in: keys } } });
  });

  const slowSend = async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { status: true };
  };
  const address = (i: number) => `198.18.${200 + (i % 50)}.${Date.now() % 250}`;
  const throttled = (answers: Array<{ error?: string }>) => answers.filter((answer) => answer.error?.startsWith("Demasiados pedidos."));

  it("sends exactly 3 emails for one account however many requests arrive at once", async () => {
    const email = `race-${stamp}@mrdesign.test`;
    client.ips = Array.from({ length: 30 }, (_, i) => `${address(i)}-${stamp}-${i}`);
    keys.push(`reset:acct:${sha256(email)}`, ...client.ips.map((ip) => `reset:ip:${sha256(ip)}`));
    requestPasswordResetApi.mockReset().mockImplementation(slowSend);

    const answers = await Promise.all(Array.from({ length: 30 }, () => requestPasswordReset({}, form(email))));

    expect(requestPasswordResetApi).toHaveBeenCalledTimes(3);
    expect(answers.filter((answer) => answer.sent)).toHaveLength(3);
    expect(throttled(answers)).toHaveLength(27);
  });

  it("sends exactly 10 emails from one address however many requests arrive at once", async () => {
    client.ips = [`${address(0)}-${stamp}-one`];
    const emails = Array.from({ length: 30 }, (_, i) => `race-ip-${i}-${stamp}@mrdesign.test`);
    keys.push(`reset:ip:${sha256(client.ips[0])}`, ...emails.map((email) => `reset:acct:${sha256(email)}`));
    requestPasswordResetApi.mockReset().mockImplementation(slowSend);

    const answers = await Promise.all(emails.map((email) => requestPasswordReset({}, form(email))));

    expect(requestPasswordResetApi).toHaveBeenCalledTimes(10);
    expect(throttled(answers)).toHaveLength(20);
  });
});
