import { beforeEach, describe, expect, it } from "vitest";
import { clientIp } from "../client-ip";
import { createLoginRateLimiter } from "./login-rate-limit";

describe("clientIp", () => {
  it("uses the entry added by the proxy (the last one), not the one the client sent", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "6.6.6.6, 203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip and then to a constant", () => {
    expect(clientIp(new Headers({ "x-real-ip": "203.0.113.8" }))).toBe("203.0.113.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

const MINUTE = 60_000;

describe("login rate limiter", () => {
  let limiter: ReturnType<typeof createLoginRateLimiter>;
  beforeEach(() => {
    limiter = createLoginRateLimiter({ windowMs: 15 * MINUTE, maxPerAccount: 5, maxPerIp: 20 });
  });

  it("allows attempts until the per-account limit is reached", () => {
    for (let i = 0; i < 5; i++) {
      expect(limiter.check("1.1.1.1", "a@x.com", 0).allowed).toBe(true);
      limiter.recordFailure("1.1.1.1", "a@x.com", 0);
    }
    expect(limiter.check("1.1.1.1", "a@x.com", 0)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 });
  });

  it("keeps the account locked when the attacker changes IP", () => {
    for (let i = 0; i < 5; i++) limiter.recordFailure(`10.0.0.${i}`, "a@x.com", 0);
    expect(limiter.check("10.9.9.9", "a@x.com", 0).allowed).toBe(false);
  });

  it("treats the email case-insensitively", () => {
    for (let i = 0; i < 5; i++) limiter.recordFailure("1.1.1.1", "A@X.com", 0);
    expect(limiter.check("1.1.1.1", "a@x.com", 0).allowed).toBe(false);
  });

  it("limits one IP across many accounts", () => {
    for (let i = 0; i < 20; i++) limiter.recordFailure("2.2.2.2", `user${i}@x.com`, 0);
    expect(limiter.check("2.2.2.2", "fresh@x.com", 0).allowed).toBe(false);
    expect(limiter.check("3.3.3.3", "fresh@x.com", 0).allowed).toBe(true);
  });

  it("forgets failures once the window has passed", () => {
    for (let i = 0; i < 5; i++) limiter.recordFailure("1.1.1.1", "a@x.com", 0);
    expect(limiter.check("1.1.1.1", "a@x.com", 15 * MINUTE + 1).allowed).toBe(true);
  });

  it("keeps memory bounded when an attacker sprays many emails", () => {
    const small = createLoginRateLimiter({ windowMs: 15 * MINUTE, maxPerAccount: 5, maxPerIp: 20, maxKeys: 100 });
    for (let i = 0; i < 1000; i++) small.recordFailure(`10.0.${i % 250}.1`, `spray${i}@x.com`, i);
    expect(small.size()).toBeLessThanOrEqual(100);
  });

  it("never evicts a locked account to make room, even under an email spray", () => {
    const small = createLoginRateLimiter({ windowMs: 15 * MINUTE, maxPerAccount: 5, maxPerIp: 20, maxKeys: 100 });
    for (let i = 0; i < 5; i++) small.recordFailure("1.1.1.1", "target@x.com", 0);
    for (let i = 0; i < 1000; i++) small.recordFailure(`10.0.${i % 250}.1`, `spray${i}@x.com`, 1);

    expect(small.check("9.9.9.9", "target@x.com", 2).allowed).toBe(false);
  });

  it("keeps memory bounded when an attacker rotating addresses locks many accounts", () => {
    const small = createLoginRateLimiter({ windowMs: 15 * MINUTE, maxPerAccount: 5, maxPerIp: 20, maxKeys: 100, maxLockedKeys: 50 });
    for (let i = 0; i < 1000; i++) {
      for (let j = 0; j < 5; j++) small.recordFailure(`10.${i % 250}.${j}.${Math.floor(i / 250)}`, `locked${i}@x.com`, i);
    }

    expect(small.size()).toBeLessThanOrEqual(150);
    // The newest lock is kept: the oldest locks are the ones that make room.
    expect(small.check("9.9.9.9", "locked999@x.com", 1000).allowed).toBe(false);
  });

  it("evicts expired locks before live counters", () => {
    const tiny = createLoginRateLimiter({ windowMs: 15 * MINUTE, maxPerAccount: 2, maxPerIp: 100, maxKeys: 3, maxLockedKeys: 1 });
    for (let i = 0; i < 2; i++) tiny.recordFailure("1.1.1.1", "old@x.com", 0);
    const later = 15 * MINUTE + 1;
    tiny.recordFailure("2.2.2.2", "victim@x.com", later);
    tiny.recordFailure("2.2.2.2", "other@x.com", later + 1);
    tiny.recordFailure("3.3.3.3", "victim@x.com", later + 2);

    // The expired lock of old@x.com makes room; the live counter of victim@x.com keeps counting.
    expect(tiny.check("4.4.4.4", "victim@x.com", later + 3).allowed).toBe(false);
    expect(tiny.size()).toBeLessThanOrEqual(4);
  });

  it("reports the later unlock time when both the account and the address are locked", () => {
    for (let i = 0; i < 20; i++) limiter.recordFailure("2.2.2.2", `user${i}@x.com`, 0);
    for (let i = 0; i < 5; i++) limiter.recordFailure(`10.0.0.${i}`, "target@x.com", 5 * MINUTE);

    // The address unlocks at minute 15, the account at minute 20: only then can it try again.
    expect(limiter.check("2.2.2.2", "target@x.com", 5 * MINUTE)).toEqual({ allowed: false, retryAfterSeconds: 15 * 60 });
  });

  it("clears the account after a successful login", () => {
    for (let i = 0; i < 4; i++) limiter.recordFailure("1.1.1.1", "a@x.com", 0);
    limiter.clear("1.1.1.1", "a@x.com");
    for (let i = 0; i < 4; i++) limiter.recordFailure("1.1.1.1", "a@x.com", 0);
    expect(limiter.check("1.1.1.1", "a@x.com", 0).allowed).toBe(true);
  });
});
