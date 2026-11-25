import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BlogIndex } from "@/components/organisms/BlogIndex";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { parsePage } from "@/lib/blog/page-param";
import { listCategories, listPosts } from "@/lib/blog/posts";
import { sameRouteAlternates } from "@/lib/seo/alternates";
import { pageMetadata } from "@/lib/seo/open-graph";

// Posts live in the database, which the Docker build cannot reach: render on request.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [t, locale, { page }] = await Promise.all([getTranslations("Blog"), getLocale() as Promise<Locale>, searchParams]);
  const current = parsePage(page) ?? 1;
  return pageMetadata(locale, {
    title: current > 1 ? t("metaTitlePage", { page: current }) : t("metaTitle"),
    description: t("metaDescription"),
    // Later pages are their own canonical; only the first page has language versions.
    alternates:
      current > 1
        ? { canonical: `${getPathname({ href: "/blog", locale })}?page=${current}` }
        : sameRouteAlternates(locale, "/blog"),
  });
}

export default async function BlogPage({ searchParams }: Props) {
  const [locale, { page }] = await Promise.all([getLocale() as Promise<Locale>, searchParams]);
  const current = parsePage(page);
  if (current === null) notFound();

  const [listing, categories] = await Promise.all([listPosts({ locale, page: current }), listCategories(locale)]);
  // An empty blog still has one page (the empty state); anything past the last page is a 404.
  if (current > listing.pages) notFound();

  return <BlogIndex locale={locale} page={current} pages={listing.pages} posts={listing.posts} categories={categories} />;
}
