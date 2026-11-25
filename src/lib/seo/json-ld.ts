import { contact } from "@/content/contact";
import { siteUrl } from "./site";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${siteUrl}/#business`,
  name: "Mr. Design",
  url: siteUrl,
  email: contact.email,
  telephone: contact.phone,
  logo: `${siteUrl}/brand/icon.png`,
  address: { "@type": "PostalAddress", addressLocality: contact.city, addressCountry: contact.country },
};

type ServiceJsonLd = { name: string; description: string; url: string };

export function serviceJsonLd({ name, description, url }: ServiceJsonLd) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${siteUrl}${url}`,
    provider: { "@id": `${siteUrl}/#business` },
    areaServed: "Worldwide",
  };
}

type BlogPostingJsonLd = {
  title: string;
  description: string;
  url: string;
  locale: string;
  publishedAt: Date | null;
  updatedAt: Date;
  image: string | null;
  authorName: string | null;
};

// A blog post. Without a named author, the business itself is the author.
export function blogPostingJsonLd({ title, description, url, locale, publishedAt, updatedAt, image, authorName }: BlogPostingJsonLd) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: `${siteUrl}${url}`,
    mainEntityOfPage: `${siteUrl}${url}`,
    inLanguage: locale,
    datePublished: publishedAt?.toISOString(),
    dateModified: updatedAt.toISOString(),
    ...(image ? { image } : {}),
    author: authorName ? { "@type": "Person", name: authorName } : { "@id": organizationJsonLd["@id"] },
    publisher: { "@id": organizationJsonLd["@id"] },
  };
}

type ArticleJsonLd = { headline: string; description: string; url: string; locale: string };

// An evergreen guide written and published by the business (the founder guide). It carries no dates:
// the copy is code-owned, and a made-up publication date would be invented data.
export function articleJsonLd({ headline, description, url, locale }: ArticleJsonLd) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: `${siteUrl}${url}`,
    mainEntityOfPage: `${siteUrl}${url}`,
    inLanguage: locale,
    author: { "@id": organizationJsonLd["@id"] },
    publisher: { "@id": organizationJsonLd["@id"] },
  };
}

type CaseStudyJsonLd = {
  title: string;
  summary: string;
  url: string;
  locale: string;
  image: string | null;
  // Localized line-of-work labels.
  lines: string[];
  stack: string[];
  year: number | null;
};

// A success case: the work the business made. Lines and stack become its keywords; the lines are
// also its topics. Fields the case does not have are left out.
export function caseStudyJsonLd({ title, summary, url, locale, image, lines, stack, year }: CaseStudyJsonLd) {
  const keywords = [...lines, ...stack];
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description: summary,
    url: `${siteUrl}${url}`,
    mainEntityOfPage: `${siteUrl}${url}`,
    inLanguage: locale,
    ...(image ? { image: image.startsWith("/") ? `${siteUrl}${image}` : image } : {}),
    ...(keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
    ...(lines.length > 0 ? { about: lines.map((name) => ({ "@type": "Thing", name })) } : {}),
    ...(year ? { dateCreated: String(year) } : {}),
    creator: { "@id": organizationJsonLd["@id"] },
  };
}

// Frequent questions of a page, each with its answer as plain text. The JsonLd atom escapes the
// copy, so no question or answer can close the script tag.
export function faqPageJsonLd(faqs: Array<{ question: string; answer: string }>, url?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(url ? { url: `${siteUrl}${url}` } : {}),
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}
