import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { HomeContact } from "@/components/organisms/home/HomeContact";
import { HomeHero } from "@/components/organisms/home/HomeHero";
import { HomeMotion } from "@/components/organisms/home/HomeMotion";
import {
  HomeAbout,
  HomeCases,
  HomeCriteria,
  HomeFaq,
  HomeProblems,
  HomeProcess,
  HomeServices,
} from "@/components/organisms/home/HomeSections";
import { ServiceSelectionProvider } from "@/components/organisms/home/ServiceSelection";
import type { Locale } from "@/i18n/routing";
import { sameRouteAlternates } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const [t, meta, locale] = await Promise.all([getTranslations("Home"), getTranslations("Metadata"), getLocale()]);
  return {
    title: { absolute: `Mr. Design: ${t("metaTitle")}` },
    description: meta("description"),
    alternates: sameRouteAlternates(locale as Locale, "/"),
  };
}

// The homepage design (odd/tasks/nextjs-platform.md, S10): every section in the design's order.
export default function HomePage() {
  return (
    <HomeMotion>
      <HomeHero />
      <ServiceSelectionProvider>
        <HomeProblems />
        <HomeServices />
      </ServiceSelectionProvider>
      <HomeCases />
      <HomeProcess />
      <HomeCriteria />
      <HomeAbout />
      <HomeFaq />
      <HomeContact />
    </HomeMotion>
  );
}
