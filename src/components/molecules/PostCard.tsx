import Image from "next/image";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import type { PostCard as PostCardData } from "@/lib/blog/posts";

export function formatPostDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(date);
}

export function PostCard({ post, locale }: { post: PostCardData; locale: Locale }) {
  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface transition-colors hover:border-ink">
      {post.coverImageUrl ? (
        // The title next to it names the post, so a cover without alt text is decorative.
        <Image
          src={post.coverImageUrl}
          alt={post.coverImageAlt ?? ""}
          width={800}
          height={450}
          sizes="(min-width: 64rem) 24rem, (min-width: 48rem) 50vw, 100vw"
          className="aspect-video w-full object-cover"
        />
      ) : null}
      <div className="flex grow flex-col p-6">
        <p className="text-sm text-graphite">
          {post.categories[0] ? <span className="font-semibold text-brand-600">{post.categories[0].name} · </span> : null}
          {post.publishedAt ? <time dateTime={post.publishedAt.toISOString()}>{formatPostDate(post.publishedAt, locale)}</time> : null}
        </p>
        <h2 className="text-title mt-3 break-words">
          {/* The link covers the whole card; the title stays its accessible name. */}
          <Link
            href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
            className="after:absolute after:inset-0 after:content-[''] hover:text-brand-600"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mt-3 text-graphite">{post.excerpt}</p>
      </div>
    </article>
  );
}
