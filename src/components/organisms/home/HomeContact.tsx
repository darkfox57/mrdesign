import { getLocale, getTranslations } from "next-intl/server";
import { Pending } from "@/components/atoms/Pending";
import { contact } from "@/content/contact";
import { contactIntents, SHOW_PENDING_CONTENT } from "@/content/home";
import { services } from "@/content/services";
import type { Locale } from "@/i18n/routing";
import { HomeContactPanel } from "./HomeContactPanel";

const directLink = "font-semibold text-ink underline-offset-2 hover:underline";

// The closing call to action: "¿Qué construimos?", the intent chips and the real contact form.
export async function HomeContact() {
  const [t, contactPage, locale] = await Promise.all([getTranslations("Home.contact"), getTranslations("Contact"), getLocale() as Promise<Locale>]);
  const projectOptions = [
    ...services.map((service) => ({ value: service.id, label: service.name[locale] })),
    { value: "other" as const, label: contactPage("fields.projectTypeOther") },
  ];

  return (
    <section id="contacto" data-x="CallToAction" data-surface="accent" aria-labelledby="t-cta" className="section-y relative bg-brand-500 text-ink">
      <div className="site-container flex flex-col gap-10">
        <h2 id="t-cta" data-reveal="" className="font-display-tight text-cta">
          {t("title")}
        </h2>
        <HomeContactPanel
          intents={contactIntents.map((intent) => ({
            id: intent.id,
            label: intent.label[locale],
            message: intent.message[locale],
            projectType: intent.projectType,
          }))}
          intentsLabel={t("intentsLabel")}
          projectOptions={projectOptions}
          showPending={SHOW_PENDING_CONTENT}
          aside={
            <div className="flex flex-col gap-2 text-md text-brand-950">
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
              {SHOW_PENDING_CONTENT ? (
                <span>
                  {t("responseTime")} <Pending>{t("confirm")}</Pending>
                </span>
              ) : null}
            </div>
          }
        />
      </div>
    </section>
  );
}
