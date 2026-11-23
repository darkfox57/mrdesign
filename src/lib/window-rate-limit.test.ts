import { describe, expect, it } from "vitest";
import { createWindowRateLimiter } from "./window-rate-limit";

describe("createWindowRateLimiter", () => {
  it("allows up to the limit within the window, then blocks", () => {
    const limiter = createWindowRateLimiter({ windowMs: 60_000, max: 3 });
    expect([0, 1, 2, 3].map(() => limiter.take("1.1.1.1", 0))).toEqual([true, true, true, false]);
  });

  it("counts each key on its own and frees slots after the window", () => {
    const limiter = createWindowRateLimiter({ windowMs: 60_000, max: 1 });
    expect(limiter.take("a", 0)).toBe(true);
    expect(limiter.take("b", 0)).toBe(true);
    expect(limiter.take("a", 30_000)).toBe(false);
    expect(limiter.take("a", 60_001)).toBe(true);
  });

  it("keeps memory bounded", () => {
    const limiter = createWindowRateLimiter({ windowMs: 60_000, max: 1, maxKeys: 50 });
    for (let i = 0; i < 500; i++) limiter.take(`ip-${i}`, i);
    expect(limiter.size()).toBeLessThanOrEqual(50);
  });
});
