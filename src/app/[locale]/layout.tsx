import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/atoms/JsonLd";
import { XrayGrid } from "@/components/motion/XrayGrid";
import { SiteFooter } from "@/components/organisms/SiteFooter";
import { SiteHeader } from "@/components/organisms/SiteHeader";
import { routing, type Locale } from "@/i18n/routing";
import { organizationJsonLd } from "@/lib/seo/json-ld";
import { siteOpenGraph } from "@/lib/seo/open-graph";
import { siteUrl } from "@/lib/seo/site";
import { fontVariables } from "@/lib/fonts";
import { xrayBootScript } from "@/lib/motion/xray";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("Metadata"), getLocale() as Promise<Locale>]);

  return {
    metadataBase: new URL(siteUrl),
    title: { default: t("title"), template: "%s | Mr. Design" },
    description: t("description"),
    icons: { icon: "/brand/icon.png", apple: "/brand/icon.png" },
    // Social defaults for every page. Next fills og:title and og:description from each page's own
    // metadata; pages with a canonical add og:url through pageMetadata (src/lib/seo/open-graph.ts).
    // No twitter default: Next derives the card from Open Graph, large when the page has an image.
    openGraph: siteOpenGraph(locale),
  };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return (
    // suppressHydrationWarning: the X-ray boot script may add a class to <html> before hydration.
    <html lang={locale} className={fontVariables} suppressHydrationWarning>
      <head>
        {/* Runs before the first paint, so a visitor who left X-ray on never sees the page flash without it. */}
        <script dangerouslySetInnerHTML={{ __html: xrayBootScript }} />
      </head>
      <body className="antialiased">
        <JsonLd data={organizationJsonLd} />
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="contenido" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
        <XrayGrid />
      </body>
    </html>
  );
}
