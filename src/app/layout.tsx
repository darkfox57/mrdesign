import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MR Design",
  description: "Web, app and e-commerce development.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
