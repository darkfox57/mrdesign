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
