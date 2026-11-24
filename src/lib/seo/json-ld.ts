import { contact } from "@/content/contact";
import { siteUrl } from "./site";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${siteUrl}/#business`,
  name: "MR Design",
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
