import { contact } from "@/content/contact";
import { siteUrl } from "./site";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "MR Design",
  url: siteUrl,
  email: contact.email,
  telephone: contact.phone,
  logo: `${siteUrl}/brand/icon.png`,
  address: { "@type": "PostalAddress", addressLocality: contact.city, addressCountry: contact.country },
};
