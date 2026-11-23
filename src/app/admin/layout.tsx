import type { Metadata } from "next";
import { bricolage } from "../fonts";
import "../globals.css";

// Root layout for the dashboard. It lives outside [locale]: the admin UI is Spanish only.
export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel MR Design" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="es" className={bricolage.variable}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
