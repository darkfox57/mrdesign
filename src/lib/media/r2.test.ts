// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

function stubR2Env() {
  vi.stubEnv("R2_ACCOUNT_ID", "test-account");
  vi.stubEnv("R2_ACCESS_KEY_ID", "test-key-id");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
  vi.stubEnv("R2_BUCKET", "test-bucket");
  vi.stubEnv("R2_PUBLIC_URL", "https://img.example.com");
}

describe("presignUpload", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("signs the size, the type and the checksum, so R2 rejects any other file", async () => {
    stubR2Env();
    const { presignUpload } = await import("./r2");
    const { url, headers } = await presignUpload({ key: `media/${sha256}.png`, contentType: "image/png", size: 2048, sha256 });

    const signed = new URL(url);
    expect(signed.host).toBe("test-account.r2.cloudflarestorage.com");
    expect(signed.pathname).toBe(`/test-bucket/media/${sha256}.png`);
    const signedHeaders = signed.searchParams.get("X-Amz-SignedHeaders")?.split(";");
    expect(signedHeaders).toEqual(expect.arrayContaining(["content-length", "content-type", "host", "x-amz-checksum-sha256"]));
    // The checksum travels as a signed header the browser must send, not as a query value.
    expect(signed.searchParams.has("x-amz-checksum-sha256")).toBe(false);
    expect(Number(signed.searchParams.get("X-Amz-Expires"))).toBeLessThanOrEqual(300);
    expect([...signed.searchParams.keys()].some((key) => key.toLowerCase().includes("crc32"))).toBe(false);
    expect(headers).toEqual({
      "content-type": "image/png",
      "x-amz-checksum-sha256": "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
    });
  });

  it("reports whether every R2 variable is set, so the library can show the not configured state", async () => {
    stubR2Env();
    const { isR2Configured } = await import("./r2");
    expect(isR2Configured()).toBe(true);

    for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"]) {
      stubR2Env();
      vi.stubEnv(name, "");
      expect(isR2Configured(), name).toBe(false);
    }
  });

  it("accepts an R2_ENDPOINT override only for a loopback address, even in production", async () => {
    const hostFor = async (override: string) => {
      vi.resetModules();
      stubR2Env();
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("R2_ENDPOINT", override);
      const { presignUpload } = await import("./r2");
      const { url } = await presignUpload({ key: "media/x.png", contentType: "image/png", size: 1, sha256 });
      const signed = new URL(url);
      return `${signed.protocol}//${signed.host}`;
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // The e2e server runs a production build against the local fake bucket.
    expect(await hostFor("http://localhost:3199")).toBe("http://localhost:3199");
    expect(await hostFor("http://127.0.0.1:3199")).toBe("http://127.0.0.1:3199");
    expect(warn).not.toHaveBeenCalled();
    for (const override of ["https://evil.example.com", "http://localhost.evil.example.com", "http://10.0.0.5:9000", "ftp://localhost", "nope"]) {
      expect(await hostFor(override), override).toBe("https://test-account.r2.cloudflarestorage.com");
    }
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("R2_ENDPOINT"));
    warn.mockRestore();
  });

  it("fails with a clear message when R2 is not configured", async () => {
    vi.stubEnv("R2_ACCOUNT_ID", "");
    const { presignUpload } = await import("./r2");
    await expect(presignUpload({ key: "media/x.png", contentType: "image/png", size: 1, sha256 })).rejects.toThrow(
      "R2 is not configured",
    );
  });
});
