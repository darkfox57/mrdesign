import { getFormatter, getTranslations } from "next-intl/server";
import type { LegalDocument } from "@/content/legal";

export async function LegalPage({ document }: { document: LegalDocument }) {
  const [t, format] = await Promise.all([getTranslations("Legal"), getFormatter()]);
  const date = format.dateTime(new Date(`${document.updated}T12:00:00Z`), { dateStyle: "long" });

  return (
    <article className="site-container py-16 lg:py-24">
      <h1 className="text-display max-w-3xl">{document.title}</h1>
      <p className="mt-4 text-graphite">{t("updated", { date })}</p>
      <div className="mt-12 max-w-prose">
        {document.sections.map((section) => (
          <section key={section.title} className="mt-10 first:mt-0">
            <h2 className="text-title">{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-graphite">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
