import { getLocale, getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/atoms/Eyebrow";
import { Pending } from "@/components/atoms/Pending";
import { contact } from "@/content/contact";
import { contactNeeds } from "@/content/home";
import type { Locale } from "@/i18n/routing";
import { HomeContactForm } from "./HomeContactForm";

const directLink = "font-semibold text-ink underline-offset-2 hover:underline";

export async function HomeContact() {
  const [t, locale] = await Promise.all([getTranslations("Home.contact"), getLocale() as Promise<Locale>]);

  return (
    <section id="contacto" data-surface="accent" aria-labelledby="t-cta" className="section-y bg-brand-500 text-ink">
      <div className="site-container grid grid-cols-1 items-start gap-16 lg:grid-cols-2">
        <div data-reveal="">
          <Eyebrow mark="ink" className="text-brand-950">
            {t("eyebrow")}
          </Eyebrow>
          <h2 id="t-cta" className="font-display-tight mt-5 text-cta">
            {t("title")}
          </h2>
          <p className="mt-6 max-w-[40ch] text-lg text-brand-950 lg:text-xl">{t("lead")}</p>
          <div className="mt-10 flex flex-col gap-2 text-md text-brand-950">
            <span className="font-semibold">{t("directTitle")}</span>
            <span>
              {t("directEmail")}{" "}
              <a href={`mailto:${contact.email}`} className={directLink}>
                {contact.email}
              </a>
            </span>
            <span>
              {t("directWhatsapp")}{" "}
              <a href={contact.whatsappHref} className={directLink}>
                {contact.phone}
              </a>
            </span>
            <span>
              {t("responseTime")} <Pending>{t("confirm")}</Pending>
            </span>
          </div>
        </div>
        <div data-reveal="">
          <HomeContactForm needs={contactNeeds.map((need) => ({ id: need.id, label: need.label[locale] }))} />
        </div>
      </div>
    </section>
  );
}
