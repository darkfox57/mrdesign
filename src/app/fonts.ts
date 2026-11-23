import { Bricolage_Grotesque } from "next/font/google";

// Self-hosted at build time by next/font. Variable weight, width and optical size.
// Shared by the public site and the admin root layouts.
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  axes: ["opsz", "wdth"],
  display: "swap",
});
