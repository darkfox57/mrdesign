import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { cache } from "react";
import { JsonLd } from "@/components/atoms/JsonLd";
import { BlogPost } from "@/components/organisms/BlogPost";
import { getPathname, redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { findPostTranslation, getPost, postTranslations, relatedPosts } from "@/lib/blog/posts";
import { localizedAlternates, mapValues } from "@/lib/seo/alternates";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const postHref = (slug: string) => ({ pathname: "/blog/[slug]" as const, params: { slug } });

// generateMetadata and the page read the same post: one query per request.
const loadPost = cache((locale: Locale, slug: string) => getPost(locale, slug));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [locale, { slug }] = await Promise.all([getLocale() as Promise<Locale>, params]);
  const post = await loadPost(locale, slug);
  if (!post) return {};
  const translations = await postTranslations(post.translationKey);
  return {
    // hreflang only for the language versions that are published.
    alternates: localizedAlternates(locale, mapValues(translations, postHref)),
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    openGraph: {
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const [locale, { slug }] = await Promise.all([getLocale() as Promise<Locale>, params]);
  const post = await loadPost(locale, slug);
  if (!post) {
    // A slug from the other locale (the language switcher keeps it) leads to its translation, or to
    // this locale's blog when there is none. Unknown slugs, drafts and archived posts are a 404.
    // Slugs can change in the dashboard, so the redirect is temporary.
    const translation = await findPostTranslation(slug, locale);
    if (!translation) notFound();
    // next-intl's redirect throws, but its type does not say so.
    return redirect({ href: translation.slug ? postHref(translation.slug) : "/blog", locale });
  }

  const [t, related] = await Promise.all([getTranslations("Blog"), relatedPosts(post, 3)]);
  const path = getPathname({ locale, href: postHref(post.slug) });

  return (
    <>
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          description: post.excerpt,
          url: path,
          locale: post.locale,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          image: post.coverImageUrl,
          authorName: post.author?.name ?? null,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: t("breadcrumb"), path: getPathname({ locale, href: "/blog" }) },
          { name: post.title, path },
        ])}
      />
      <BlogPost post={post} related={related} locale={locale} />
    </>
  );
}
