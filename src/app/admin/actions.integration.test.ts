// @vitest-environment node
// The login action with the real limiter on the local database (rule 2). Only the password check
// (better-auth) is stubbed, so each test decides whether it rejects, fails or succeeds.
import { APIError } from "better-auth/api";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { signInEmail, client } = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  client: { ips: [] as string[], next: 0 },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": client.ips[client.next++ % client.ips.length] }),
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { signInEmail } } }));

const { signIn } = await import("./actions");
const { db } = await import("@/lib/db");
const { isLocalDatabase } = await import("@/lib/is-local-database");
const { throttleKey } = await import("@/lib/auth/login-rate-limit");

const local = isLocalDatabase(process.env.DATABASE_URL);
// Documentation addresses (RFC 3849) with a random group per run, so no other run or e2e row is hit.
const group = Math.floor(Math.random() * 0xffff).toString(16);
const address = (i: number) => `2001:db8:${group}::${(i + 1).toString(16)}`;
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const emails = { outage: `outage-${stamp}@mrdesign.test`, wrong: `wrong-${stamp}@mrdesign.test`, race: `race-${stamp}@mrdesign.test` };
const keys = [...Object.values(emails).map((email) => throttleKey("login", "acct", email)), ...Array.from({ length: 40 }, (_, i) => throttleKey("login", "ip", address(i)))];
const row = (key: string) => db.authThrottle.findUnique({ where: { key } });

const UNAVAILABLE = "No pudimos verificar el ingreso. Prueba de nuevo en unos minutos.";
const WRONG = "Email o contraseña incorrectos.";

function form(email: string, password = "a-password-123") {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

describe.skipIf(!local)("signIn with the real throttle", () => {
  const clear = () => db.authThrottle.deleteMany({ where: { key: { in: keys } } });
  beforeAll(clear);
  afterAll(clear);
  beforeEach(() => {
    signInEmail.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // R4 (T16, critical): a password check that fails for infrastructure reasons judged nothing, so
  // the attempt is given back. Before, ten database blips in a window locked a valid admin out.
  it("gives an infrastructure failure its attempt back on both keys, so ten of them lock nothing", async () => {
    client.ips = [address(0)];
    signInEmail.mockRejectedValue(new Error("Connection terminated unexpectedly"));

    for (let i = 0; i < 10; i++) expect(await signIn({}, form(emails.outage))).toEqual({ error: UNAVAILABLE, email: emails.outage });

    expect(await row(throttleKey("login", "acct", emails.outage))).toMatchObject({ failures: 0, lockedUntil: null });
    expect(await row(throttleKey("login", "ip", address(0)))).toMatchObject({ failures: 0, lockedUntil: null });
    signInEmail.mockRejectedValue(new APIError("UNAUTHORIZED"));
    expect(await signIn({}, form(emails.outage))).toEqual({ error: WRONG, email: emails.outage });
    expect(await row(throttleKey("login", "acct", emails.outage))).toMatchObject({ failures: 1 });
  });

  it("still counts a wrong password: the sixth one is refused without a check", async () => {
    client.ips = [address(1)];
    signInEmail.mockRejectedValue(new APIError("UNAUTHORIZED"));

    for (let i = 0; i < 5; i++) expect(await signIn({}, form(emails.wrong, `guess-${i}`))).toEqual({ error: WRONG, email: emails.wrong });
    const sixth = await signIn({}, form(emails.wrong, "guess-6"));

    expect(sixth.error).toMatch(/^Demasiados intentos\. Prueba de nuevo en \d+ min\.$/);
    expect(signInEmail).toHaveBeenCalledTimes(5);
  });

  // B1 through the action: every request comes from its own address, so only the account limit binds.
  it("checks at most 5 passwords when 30 wrong guesses arrive at once", async () => {
    client.ips = Array.from({ length: 30 }, (_, i) => address(10 + i));
    signInEmail.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      throw new APIError("UNAUTHORIZED");
    });

    const answers = await Promise.all(Array.from({ length: 30 }, (_, i) => signIn({}, form(emails.race, `guess-${i}`))));

    expect(signInEmail.mock.calls.length).toBeLessThanOrEqual(5);
    expect(answers.filter((answer) => answer.error === WRONG)).toHaveLength(signInEmail.mock.calls.length);
    expect(answers.filter((answer) => answer.error?.startsWith("Demasiados intentos."))).toHaveLength(30 - signInEmail.mock.calls.length);
  });
});
