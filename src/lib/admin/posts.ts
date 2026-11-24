import { z } from "zod";
import { routing, type Locale } from "@/i18n/routing";

export const ADMIN_POSTS_PER_PAGE = 25;
export const BLOG_ADMIN_PATH = "/admin/blog";

export const POST_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const STATUS_LABELS: Record<PostStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  es: "Español",
  en: "Inglés",
};

// For sentences such as "Traducir al inglés".
export const LOCALE_IN_SENTENCE: Record<Locale, string> = {
  es: "español",
  en: "inglés",
};

// Filters come from the URL: an unknown value shows everything instead of failing the page.
export const postListFilterSchema = z.object({
  status: z.enum(POST_STATUSES).optional().catch(undefined),
  locale: z.enum(routing.locales).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1).default(1),
});

export const publicationSchema = z.object({
  postId: z.string().min(1),
  intent: z.enum(["publish", "unpublish"]),
});

// Publishing keeps a date the post already has and only stamps today's date on a first
// publish. Unpublishing keeps the date for a later publish.
export function publicationChange(intent: "publish" | "unpublish", publishedAt: Date | null, now = new Date()) {
  return intent === "publish"
    ? { status: "PUBLISHED" as const, publishedAt: publishedAt ?? now }
    : { status: "DRAFT" as const, publishedAt };
}

// The public blog routes to refresh after a post changes. revalidatePath needs the route the
// proxy rewrites to (src/app/[locale]/blog, see "Using revalidatePath with rewrites" in the Next
// docs), not the public URL getPathname builds: every locale carries its prefix, Spanish too.
// Revalidated as a layout, each path covers the index, every post and the category pages. Both
// locales go, because a translation's language switcher links to the post that changed.
export function publicBlogPaths() {
  return routing.locales.map((locale) => `/${locale}/blog`);
}
