import { founderGuide } from "@/content/founder-guide";
import { services } from "@/content/services";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import type { Href } from "./sitemap-entries";
import { siteUrl } from "./site";

// /llms.txt (https://llmstxt.org): a markdown map of the site for AI assistants. Every word comes from
// the site's own copy (the line pages, the founder guide and the page descriptions); nothing is added.

const messages = { es, en };

const url = (locale: Locale, href: Href) => `${siteUrl}${getPathname({ locale, href })}`;
const link = (name: string, href: string, description: string) => `- [${name}](${href}): ${description}`;

function sections(locale: Locale): string[] {
  const t = messages[locale];
  const heading = t.Llms;
  return [
    `## ${heading.lines}`,
    "",
    ...services.map((service) =>
      link(
        service.name[locale],
        url(locale, { pathname: "/servicios/[service]", params: { service: service.slug[locale] } }),
        service.summary[locale],
      ),
    ),
    "",
    `## ${heading.guide}`,
    "",
    link(founderGuide.h1[locale], url(locale, "/empezar-mi-negocio-en-linea"), founderGuide.lead[locale]),
    "",
    `## ${heading.pages}`,
    "",
    link(t.Services.metaTitle, url(locale, "/servicios"), t.Services.metaDescription),
    link(t.Portfolio.metaTitle, url(locale, "/portafolio"), t.Portfolio.metaDescription),
    link(t.Blog.metaTitle, url(locale, "/blog"), t.Blog.metaDescription),
    link(t.Contact.metaTitle, url(locale, "/contacto"), t.Contact.metaDescription),
  ];
}

// Spanish first (the default language), then the same pages in English. The format allows one
// summary blockquote and H2 file-list sections only, so the English summary is a plain paragraph and
// the English sections are H2 too (their headings differ from the Spanish ones).
export function buildLlmsTxt(): string {
  return [
    "# Mr. Design",
    "",
    `> ${es.Metadata.description}`,
    "",
    en.Metadata.description,
    "",
    ...sections("es"),
    "",
    ...sections("en"),
    "",
  ].join("\n");
}
