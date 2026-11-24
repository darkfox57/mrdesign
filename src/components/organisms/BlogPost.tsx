import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatPostDate, PostCard } from "@/components/molecules/PostCard";
import { ClosingCta } from "@/components/organisms/ClosingCta";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import type { Post, PostCard as PostCardData } from "@/lib/blog/posts";
import { cn } from "@/lib/cn";
import { sanitizePostHtml } from "@/lib/sanitize-post-html";

// Typography for the post body, from the theme tokens only. The body is sanitized HTML, so it is
// styled through descendant selectors instead of classes on each element.
const prose = cn(
  "max-w-prose break-words text-ink",
  "[&>*+*]:mt-5",
  "[&_h2]:mt-12 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:tracking-tight",
  "[&_h3]:text-title [&_h3]:mt-10",
  "[&_h4]:mt-8 [&_h4]:text-lg [&_h4]:font-semibold",
  "[&_a]:font-medium [&_a]:text-brand-600 [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-brand-700",
  "[&_strong]:font-semibold",
  "[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li+li]:mt-2 [&_li]:pl-1",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-brand-500 [&_blockquote]:pl-5 [&_blockquote]:text-graphite",
  "[&_pre]:overflow-x-auto [&_pre]:rounded-control [&_pre]:bg-ink [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-on-ink",
  "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-brand-50 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:text-[0.9em]",
  "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-card",
  "[&_hr]:my-10 [&_hr]:border-line",
  // A wide table scrolls on its own instead of widening the page.
  "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border [&_th]:border-line [&_th]:bg-surface [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
  "[&_td]:border [&_td]:border-line [&_td]:px-3 [&_td]:py-2",
);

type BlogPostProps = { post: Post; related: PostCardData[]; locale: Locale };

export function BlogPost({ post, related, locale }: BlogPostProps) {
  const t = useTranslations("Blog");

  return (
    <>
      <article className="site-container py-16 lg:py-24">
        <div className="mx-auto max-w-prose">
          <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-graphite hover:text-ink">
            <span aria-hidden="true">←</span> {t("backToBlog")}
          </Link>
          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-graphite">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                href={{ pathname: "/blog/categoria/[category]", params: { category: category.slug } }}
                className="inline-flex min-h-11 items-center font-semibold text-brand-600 hover:underline"
              >
                {category.name}
              </Link>
            ))}
            {post.publishedAt ? <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt, locale)}</time> : null}
            {post.author ? <span>{t("byAuthor", { author: post.author.name })}</span> : null}
          </p>
          <h1 className="text-headline mt-4 break-words">{post.title}</h1>
          <p className="text-lead mt-6 text-graphite">{post.excerpt}</p>
        </div>

        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.coverImageAlt ?? ""}
            width={1600}
            height={900}
            priority
            sizes="(min-width: 76rem) 64rem, 100vw"
            className="mx-auto mt-12 aspect-video w-full max-w-5xl rounded-card object-cover"
          />
        ) : null}

        {/* Content is sanitized when it is saved; sanitizing again here keeps the page safe even if
            a future writer (ingest API, editor) forgets to. */}
        <div
          className={cn("post-content mx-auto mt-12", prose)}
          dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.content) }}
        />

        {post.tags.length > 0 ? (
          <div className="mx-auto mt-12 max-w-prose border-t border-line pt-6">
            <h2 className="sr-only">{t("tagsLabel")}</h2>
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag.slug} className="rounded-full border border-line bg-surface px-3 py-1 text-sm text-graphite">
                  {tag.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <ClosingCta title={t("ctaTitle")} text={t("ctaText")} button={t("ctaButton")} />

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="site-container pb-20 lg:pb-28">
          <h2 id="related-title" className="text-headline">
            {t("relatedTitle")}
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <PostCard post={item} locale={locale} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
