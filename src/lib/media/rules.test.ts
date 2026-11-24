import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, altTextSchema, deleteMediaSchema, hexToBase64, mediaKey, publicMediaUrl, uploadRequestSchema } from "./rules";

const sha256 = "a".repeat(64);

describe("uploadRequestSchema", () => {
  const valid = { sha256, size: 1024, contentType: "image/webp", name: "foto.webp" };

  it("accepts a supported image within the size limit", () => {
    expect(uploadRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects files over the size limit", () => {
    const parsed = uploadRequestSchema.safeParse({ ...valid, size: MAX_IMAGE_BYTES + 1 });
    expect(parsed.error?.issues[0]?.message).toBe("La imagen pesa más de 5 MB.");
  });

  it("rejects types that are not images, including SVG (it can carry scripts)", () => {
    for (const contentType of ["application/pdf", "image/svg+xml", "text/html"]) {
      const parsed = uploadRequestSchema.safeParse({ ...valid, contentType });
      expect(parsed.error?.issues[0]?.message, contentType).toBe("Usa una imagen JPG, PNG, WebP, AVIF o GIF.");
    }
  });

  it("rejects a hash that is not 64 lowercase hex characters", () => {
    expect(uploadRequestSchema.safeParse({ ...valid, sha256: "ABC" }).success).toBe(false);
    expect(uploadRequestSchema.safeParse({ ...valid, sha256: "g".repeat(64) }).success).toBe(false);
  });
});

describe("mediaKey", () => {
  it("names the object after its content hash, so the same image always gets the same key", () => {
    expect(mediaKey(sha256, "image/jpeg")).toBe(`media/${sha256}.jpg`);
    expect(mediaKey(sha256, "image/png")).toBe(`media/${sha256}.png`);
  });
});

describe("hexToBase64", () => {
  it("converts the hex digest to the base64 form S3 checksums use", () => {
    // sha256("") in hex and base64.
    expect(hexToBase64("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855")).toBe(
      "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
    );
  });
});

describe("altTextSchema", () => {
  it("requires a description, so every image in the library can be used accessibly", () => {
    for (const alt of ["", "   "]) {
      const parsed = altTextSchema.safeParse({ mediaId: "m1", alt });
      expect(parsed.error?.issues[0]?.message, JSON.stringify(alt)).toBe("Escribe el texto alternativo.");
    }
  });

  it("accepts a trimmed description up to 300 characters", () => {
    expect(altTextSchema.safeParse({ mediaId: "m1", alt: "  Logo de MR Design  " }).data?.alt).toBe("Logo de MR Design");
    const parsed = altTextSchema.safeParse({ mediaId: "m1", alt: "a".repeat(301) });
    expect(parsed.error?.issues[0]?.message).toBe("Máximo 300 caracteres.");
  });
});

describe("deleteMediaSchema", () => {
  it("requires an image id", () => {
    expect(deleteMediaSchema.safeParse({ mediaId: "m1" }).success).toBe(true);
    expect(deleteMediaSchema.safeParse({ mediaId: "" }).success).toBe(false);
    expect(deleteMediaSchema.safeParse({ mediaId: null }).success).toBe(false);
  });
});

describe("publicMediaUrl", () => {
  it("joins the public base and the key with one slash", () => {
    expect(publicMediaUrl("https://img.example.com", "media/x.png")).toBe("https://img.example.com/media/x.png");
    expect(publicMediaUrl("https://img.example.com/", "media/x.png")).toBe("https://img.example.com/media/x.png");
  });
});
