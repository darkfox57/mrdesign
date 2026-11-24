import { describe, expect, it } from "vitest";
import { mediaRemotePatterns } from "./remote-pattern";

describe("mediaRemotePatterns", () => {
  it("lets next/image load only the media folder of the public bucket host", () => {
    expect(mediaRemotePatterns("https://img.mrdesign.agency")).toEqual([
      { protocol: "https", hostname: "img.mrdesign.agency", pathname: "/media/**" },
    ]);
  });

  it("keeps a path prefix and a port of the public URL", () => {
    expect(mediaRemotePatterns("https://media.e2e.test/test-bucket/")).toEqual([
      { protocol: "https", hostname: "media.e2e.test", pathname: "/test-bucket/media/**" },
    ]);
    expect(mediaRemotePatterns("http://localhost:9000/bucket")).toEqual([
      { protocol: "http", hostname: "localhost", port: "9000", pathname: "/bucket/media/**" },
    ]);
  });

  it("allows no remote image when the public URL is missing or not http(s)", () => {
    for (const value of [undefined, "", "not a url", "ftp://img.example.com"]) {
      expect(mediaRemotePatterns(value), String(value)).toEqual([]);
    }
  });
});
