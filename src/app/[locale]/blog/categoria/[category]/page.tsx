import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/atoms/JsonLd";
import { BlogIndex } from "@/components/organisms/BlogIndex";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { parsePage } from "@/lib/blog/page-param";
import { categoryTranslations, findCategoryTranslation, getCategory, listCategories, listPosts } from "@/lib/blog/posts";
import { localizedAlternates, mapValues } from "@/lib/seo/alternates";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

const categoryHref = (slug: string) => ({ pathname: "/blog/categoria/[category]" as const, params: { category: slug } });

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [locale, { category: slug }, { page }] = await Promise.all([getLocale() as Promise<Locale>, params, searchParams]);
  const category = await getCategory(locale, slug);
  if (!category) return {};
  const [t, translations] = await Promise.all([getTranslations("Blog"), categoryTranslations(category.translationKey)]);
  const current = parsePage(page) ?? 1;
  return {
    title: current > 1 ? t("categoryMetaTitlePage", { category: category.name, page: current }) : category.name,
    description: category.description ?? t("categoryMetaDescription", { category: category.name }),
    // Later pages are their own canonical; only the first page has language versions.
    alternates:
      current > 1
        ? { canonical: `${getPathname({ href: categoryHref(category.slug), locale })}?page=${current}` }
        : localizedAlternates(locale, mapValues(translations, categoryHref)),
  };
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const [locale, { category: slug }, { page }] = await Promise.all([getLocale() as Promise<Locale>, params, searchParams]);
  const category = await getCategory(locale, slug);
  if (!category) {
    // A category slug from another locale (the language switcher keeps it) leads to its translation.
    // Slugs can change in the dashboard, so the redirect is temporary.
    const translation = await findCategoryTranslation(slug, locale);
    if (translation) redirect({ href: categoryHref(translation), locale });
    notFound();
  }
  const current = parsePage(page);
  if (current === null) notFound();

  const [t, listing, categories] = await Promise.all([
    getTranslations("Blog"),
    listPosts({ locale, page: current, categoryId: category.id }),
    listCategories(locale),
  ]);
  if (current > listing.pages) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("breadcrumb"), path: getPathname({ locale, href: "/blog" }) },
          { name: category.name, path: getPathname({ locale, href: categoryHref(category.slug) }) },
        ])}
      />
      <BlogIndex
        locale={locale}
        page={current}
        pages={listing.pages}
        posts={listing.posts}
        categories={categories}
        category={category}
      />
    </>
  );
}
