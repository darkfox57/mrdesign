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
import { SHOW_CASES } from "@/content/home";
import type { Locale } from "@/i18n/routing";
import { sectionNumbers } from "@/lib/home/pending";
import { sameRouteAlternates } from "@/lib/seo/alternates";

export async function generateMetadata(): Promise<Metadata> {
  const [t, meta, locale] = await Promise.all([getTranslations("Home"), getTranslations("Metadata"), getLocale()]);
  return {
    title: { absolute: `Mr. Design: ${t("metaTitle")}` },
    description: meta("description"),
    alternates: sameRouteAlternates(locale as Locale, "/"),
  };
}

// The numbered sections in the design's order. The cases wait for the clients' authorization.
const numbers = sectionNumbers([
  { id: "problems", visible: true },
  { id: "services", visible: true },
  { id: "cases", visible: SHOW_CASES },
  { id: "process", visible: true },
  { id: "criteria", visible: true },
  { id: "about", visible: true },
  { id: "faq", visible: true },
] as const);

// The homepage design (odd/tasks/nextjs-platform.md, S10): every section in the design's order.
export default function HomePage() {
  return (
    <HomeMotion>
      <HomeHero />
      <ServiceSelectionProvider>
        <HomeProblems number={numbers.problems!} />
        <HomeServices number={numbers.services!} />
      </ServiceSelectionProvider>
      {numbers.cases ? <HomeCases number={numbers.cases} /> : null}
      <HomeProcess number={numbers.process!} />
      <HomeCriteria number={numbers.criteria!} />
      <HomeAbout number={numbers.about!} />
      <HomeFaq number={numbers.faq!} />
      <HomeContact />
    </HomeMotion>
  );
}
