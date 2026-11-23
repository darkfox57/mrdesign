import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalPage } from "@/components/templates/LegalPage";
import { termsAndConditions } from "@/content/legal";
import type { Locale } from "@/i18n/routing";
import { sameRouteAlternates } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as Locale;
  const document = termsAndConditions[locale];
  return {
    title: document.title,
    description: document.description,
    alternates: sameRouteAlternates(locale, "/terminos-y-condiciones"),
  };
}

export default async function TermsPage() {
  const locale = (await getLocale()) as Locale;
  return <LegalPage document={termsAndConditions[locale]} />;
}
