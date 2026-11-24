import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { PostCard } from "@/components/molecules/PostCard";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import type { PostCard as PostCardData } from "@/lib/blog/posts";
import { cn } from "@/lib/cn";

type Category = { id: string; name: string; slug: string; description: string | null };
type CategoryLink = { id: string; name: string; slug: string; postCount: number };

type BlogIndexProps = {
  locale: Locale;
  page: number;
  pages: number;
  posts: PostCardData[];
  categories: CategoryLink[];
  category?: Category;
};

// The blog index and each category page: same layout, the category only filters.
export function BlogIndex({ locale, page, pages, posts, categories, category }: BlogIndexProps) {
  const t = useTranslations("Blog");

  const pageHref = (target: number) =>
    category
      ? {
          pathname: "/blog/categoria/[category]" as const,
          params: { category: category.slug },
          query: target > 1 ? { page: target } : {},
        }
      : { pathname: "/blog" as const, query: target > 1 ? { page: target } : {} };

  return (
    <section className="site-container py-16 lg:py-24">
      <h1 className="text-display max-w-3xl">{category?.name ?? t("title")}</h1>
      <p className="text-lead mt-6 max-w-prose text-graphite">{category?.description ?? t("lead")}</p>

      {categories.length > 0 ? (
        <nav aria-label={t("categoriesLabel")} className="mt-10">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link href="/blog" aria-current={category ? undefined : "page"} className={chip(!category)}>
                {t("allCategories")}
              </Link>
            </li>
            {categories.map((item) => (
              <li key={item.id}>
                <Link
                  href={{ pathname: "/blog/categoria/[category]", params: { category: item.slug } }}
                  aria-current={item.id === category?.id ? "page" : undefined}
                  className={chip(item.id === category?.id)}
                >
                  {item.name} <span className="text-graphite">({item.postCount})</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {posts.length === 0 ? (
        <div className="mt-12 max-w-prose rounded-card border border-line bg-surface p-6 sm:p-8">
          <h2 className="text-title">{t("emptyTitle")}</h2>
          <p className="mt-3 text-graphite">{t("emptyText")}</p>
          <ButtonLink href="/servicios" variant="secondary" className="mt-6">
            {t("emptyCta")}
          </ButtonLink>
        </div>
      ) : (
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} locale={locale} />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <nav aria-label={t("pagination")} className="mt-12 flex items-center justify-between gap-4">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} rel="prev" className={pagerLink}>
              <span aria-hidden="true">←</span> {t("previous")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-graphite">{t("pageOf", { page, pages })}</span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} rel="next" className={pagerLink}>
              {t("next")} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  );
}

const pagerLink = "inline-flex min-h-11 items-center gap-2 font-semibold text-ink hover:text-brand-600";

function chip(active: boolean) {
  return cn(
    // gap, because flex drops the space between the name and the count.
    "inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-sm font-medium transition-colors",
    active ? "border-ink bg-ink text-white [&>span]:text-on-ink-muted" : "border-line bg-surface text-ink hover:border-ink",
  );
}
