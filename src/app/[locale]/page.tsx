import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ScrollReveals } from "@/components/motion/ScrollReveals";
import { HomeContact } from "@/components/organisms/home/HomeContact";
import { HomeHero } from "@/components/organisms/home/HomeHero";
import { HomeCases, HomePieces, HomeProblems, HomeProcess, HomeServiceLines } from "@/components/organisms/home/HomeSections";
import type { Locale } from "@/i18n/routing";
import { listPublicCases } from "@/lib/cases/public";
import { casesOrEmpty } from "@/lib/cases/view";
import { sectionNumbers } from "@/lib/home/pending";
import { sameRouteAlternates } from "@/lib/seo/alternates";

// The home shows published cases, which live in the database the Docker build cannot reach: render
// on request (publishing a case also revalidates "/", see src/lib/cases/paths.ts).
export const dynamic = "force-dynamic";

// Featured cases first (listPublicCases orders them), at most this many on the home.
const HOME_CASES = 3;

export async function generateMetadata(): Promise<Metadata> {
  const [t, meta, locale] = await Promise.all([getTranslations("Home"), getTranslations("Metadata"), getLocale()]);
  return {
    title: { absolute: `Mr. Design: ${t("metaTitle")}` },
    description: meta("description"),
    alternates: sameRouteAlternates(locale as Locale, "/"),
  };
}

// The homepage of the approved prototype (odd/tasks/site-build-experience.md, T4): the site builds
// itself in the hero, then problems, working pieces, lines of work, cases, process and contact.
export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  // A database outage hides the cases instead of failing the home.
  const cases = (await casesOrEmpty(() => listPublicCases(locale))).slice(0, HOME_CASES);

  // The numbered sections in the design's order. The cases section exists only with published cases.
  const numbers = sectionNumbers([
    { id: "problems", visible: true },
    { id: "pieces", visible: true },
    { id: "lines", visible: true },
    { id: "cases", visible: cases.length > 0 },
    { id: "process", visible: true },
  ] as const);

  return (
    <ScrollReveals>
      <HomeHero />
      <HomeProblems number={numbers.problems!} />
      <HomePieces number={numbers.pieces!} />
      <HomeServiceLines number={numbers.lines!} />
      {numbers.cases ? <HomeCases number={numbers.cases} cases={cases} /> : null}
      <HomeProcess number={numbers.process!} />
      <HomeContact />
    </ScrollReveals>
  );
}
