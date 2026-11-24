import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { mediaRemotePatterns } from "./src/lib/media/remote-pattern";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image deployed on Dokploy (see Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  // Images uploaded from the dashboard to R2: only the media folder of R2_PUBLIC_URL, which must
  // be set at build time too. Without it, next/image loads no remote image.
  images: { remotePatterns: mediaRemotePatterns(process.env.R2_PUBLIC_URL) },
  turbopack: { root: __dirname },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
