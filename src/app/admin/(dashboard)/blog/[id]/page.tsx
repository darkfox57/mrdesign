import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { STATUS_LABELS } from "@/lib/admin/posts";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PostForm } from "../PostForm";
import { PublishButton } from "../PublishButton";
import { TranslationsPanel } from "../TranslationsPanel";

export const metadata: Metadata = { title: "Editar post" };

export default async function EditPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  // The page checks the session itself: the layout's check does not stop it from rendering.
  await requireSession();
  const { id } = await params;
  const [post, categories] = await Promise.all([
    db.post.findUnique({ where: { id }, include: { categories: { select: { id: true } } } }),
    db.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, locale: true } }),
  ]);
  if (!post) notFound();
  const published = post.status === "PUBLISHED";
  const publicPath = getPathname({ locale: post.locale, href: { pathname: "/blog/[slug]", params: { slug: post.slug } } });

  return (
    <>
      <Link href="/admin/blog" className="text-sm font-medium text-brand-700 underline underline-offset-2">
        Volver al blog
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline text-ink">Editar post</h1>
        <div className="flex items-center gap-3">
          <span className={published ? "font-medium text-ink" : "text-graphite"}>{STATUS_LABELS[post.status]}</span>
          {published ? (
            <Link href={publicPath} target="_blank" className="text-sm text-brand-700 underline underline-offset-2">
              Ver en el sitio
            </Link>
          ) : null}
          {post.status === "ARCHIVED" ? null : <PublishButton postId={post.id} title={post.title} published={published} />}
        </div>
      </div>
      <div className="mt-4">
        <TranslationsPanel post={post} />
      </div>
      <div className="mt-6">
        <PostForm
          postId={post.id}
          categories={categories}
          initial={{
            locale: post.locale,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            coverImageUrl: post.coverImageUrl ?? "",
            coverImageAlt: post.coverImageAlt ?? "",
            seoTitle: post.seoTitle ?? "",
            seoDescription: post.seoDescription ?? "",
            categoryIds: post.categories.map((category) => category.id),
          }}
        />
      </div>
    </>
  );
}
