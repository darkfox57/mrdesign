// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { API_KEY_PREFIX_LENGTH, bearerToken, generateApiKey, hashApiKey } from "./api-keys";

describe("generateApiKey", () => {
  it("creates a long random key with a short visible prefix and stores only its hash", () => {
    const { key, prefix, keyHash } = generateApiKey();
    expect(key).toMatch(/^mrd_[A-Za-z0-9_-]{43}$/);
    expect(prefix).toBe(key.slice(0, API_KEY_PREFIX_LENGTH));
    expect(prefix).toMatch(/^mrd_[A-Za-z0-9_-]{8}$/);
    expect(keyHash).toBe(createHash("sha256").update(key).digest("hex"));
    expect(keyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(keyHash).not.toContain(key.slice(4));
  });

  it("never repeats a key", () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey().key));
    expect(keys.size).toBe(50);
  });
});

describe("hashApiKey", () => {
  it("matches the stored hash for the same key", () => {
    const { key, keyHash } = generateApiKey();
    expect(hashApiKey(key)).toBe(keyHash);
  });

  it("gives a different hash for a different key", () => {
    expect(hashApiKey("mrd_a")).not.toBe(hashApiKey("mrd_b"));
  });
});

describe("bearerToken", () => {
  it("reads the key from an Authorization: Bearer header", () => {
    expect(bearerToken("Bearer mrd_abc")).toBe("mrd_abc");
    expect(bearerToken("bearer   mrd_abc  ")).toBe("mrd_abc");
  });

  it("returns null for a missing or different scheme", () => {
    expect(bearerToken(null)).toBeNull();
    expect(bearerToken("")).toBeNull();
    expect(bearerToken("Basic mrd_abc")).toBeNull();
    expect(bearerToken("Bearer ")).toBeNull();
  });

  it("returns null for a malformed header", () => {
    expect(bearerToken("Bearermrd_abc")).toBeNull();
    expect(bearerToken("Bearer mrd_abc extra")).toBeNull();
    expect(bearerToken("mrd_abc")).toBeNull();
    expect(bearerToken("Token Bearer mrd_abc")).toBeNull();
  });
});
