// @vitest-environment node
// B1 (T14 verifier): parallel reset requests through the real action and the real limiter on the
// local database. Counting used to happen after an awaited check, so all of them passed it.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

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
const { throttleKey } = await import("@/lib/auth/login-rate-limit");

const local = isLocalDatabase(process.env.DATABASE_URL);
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
// Real addresses, as the proxy would forward them: documentation IPv6 (RFC 3849) with a random group
// per run, so neither another run nor the e2e specs (IPv4) share a counter with this one.
const group = Math.floor(Math.random() * 0xffff).toString(16);
const address = (i: number) => `2001:db8:${group}::${(i + 1).toString(16)}`;
const emails = Array.from({ length: 30 }, (_, i) => `race-ip-${i}-${stamp}@mrdesign.test`);
const accountEmail = `Race-${stamp}@MRDesign.test`;
const keys = [
  throttleKey("reset", "acct", accountEmail),
  ...emails.map((email) => throttleKey("reset", "acct", email)),
  ...Array.from({ length: 31 }, (_, i) => throttleKey("reset", "ip", address(i))),
];

function form(email: string) {
  const data = new FormData();
  data.set("email", email);
  return data;
}

describe.skipIf(!local)("requestPasswordReset under parallel requests", () => {
  const clear = () => db.authThrottle.deleteMany({ where: { key: { in: keys } } });
  beforeAll(clear);
  afterAll(clear);

  const slowSend = async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { status: true };
  };
  const throttled = (answers: Array<{ error?: string }>) => answers.filter((answer) => answer.error?.startsWith("Demasiados pedidos."));

  it("sends exactly 3 emails for one account however many requests arrive at once", async () => {
    // Mixed case on purpose: the account key is the lower-cased email, and so is the cleanup key.
    client.ips = Array.from({ length: 30 }, (_, i) => address(i));
    requestPasswordResetApi.mockReset().mockImplementation(slowSend);

    const answers = await Promise.all(Array.from({ length: 30 }, () => requestPasswordReset({}, form(accountEmail))));

    expect(requestPasswordResetApi).toHaveBeenCalledTimes(3);
    expect(answers.filter((answer) => answer.sent)).toHaveLength(3);
    expect(throttled(answers)).toHaveLength(27);
  });

  it("sends exactly 10 emails from one address however many requests arrive at once", async () => {
    client.ips = [address(30)];
    requestPasswordResetApi.mockReset().mockImplementation(slowSend);

    const answers = await Promise.all(emails.map((email) => requestPasswordReset({}, form(email))));

    expect(requestPasswordResetApi).toHaveBeenCalledTimes(10);
    expect(throttled(answers)).toHaveLength(20);
  });
});
