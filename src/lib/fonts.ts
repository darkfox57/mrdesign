import { Inter, JetBrains_Mono } from "next/font/google";
import { bricolage } from "@/app/fonts";

// The three families of the design, self-hosted at build time by next/font (no request to Google).
// Bricolage Grotesque for display type, Inter for text, JetBrains Mono for labels.
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
  display: "swap",
});

// For the <html> element of every root layout (public site and admin).
export const fontVariables = [bricolage.variable, inter.variable, jetbrainsMono.variable].join(" ");
