import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { contact } from "@/content/contact";
import { services } from "@/content/services";
import { routing, type Locale } from "@/i18n/routing";
import { sameRouteAlternates } from "@/lib/seo/alternates";
import { ContactForm } from "./ContactForm";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("Contact"), getLocale()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: sameRouteAlternates(locale as Locale, "/contacto"),
  };
}

const directLink = "flex min-h-11 items-center gap-3 font-medium hover:text-brand-600";

export default async function ContactPage() {
  const [t, locale] = await Promise.all([getTranslations("Contact"), getLocale()]);
  const projectOptions = [
    ...services.map((service) => ({ value: service.id, label: service.name[locale as Locale] })),
    { value: "other", label: t("fields.projectTypeOther") },
  ];

  return (
    <section className="site-container grid gap-12 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
      <div>
        <h1 className="text-display">{t("title")}</h1>
        <p className="text-lead mt-6 max-w-md text-graphite">{t("lead")}</p>

        <h2 className="mt-12 font-semibold">{t("directTitle")}</h2>
        <ul className="mt-3 grid gap-1">
          <li>
            <a href={contact.whatsappHref} className={directLink}>
              <MessageCircle aria-hidden="true" className="size-5 text-brand-600" />
              {t("whatsapp")}
            </a>
          </li>
          <li>
            <a href={`mailto:${contact.email}`} className={directLink}>
              <Mail aria-hidden="true" className="size-5 text-brand-600" />
              {contact.email}
            </a>
          </li>
          <li>
            <a href={contact.phoneHref} className={directLink}>
              <Phone aria-hidden="true" className="size-5 text-brand-600" />
              {contact.phone}
            </a>
          </li>
          <li className="flex min-h-11 items-center gap-3 text-graphite">
            <MapPin aria-hidden="true" className="size-5 text-brand-600" />
            {t("location", { city: contact.city })}
          </li>
        </ul>
      </div>

      <ContactForm projectOptions={projectOptions} />
    </section>
  );
}
