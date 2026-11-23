import { getTranslations } from "next-intl/server";

// Placeholder home; the full page is built in task T4.
export default async function HomePage() {
  const t = await getTranslations("Metadata");

  return (
    <section className="site-container py-24">
      <h1 className="text-display max-w-4xl">{t("title")}</h1>
      <p className="text-lead mt-6 max-w-prose text-graphite">{t("description")}</p>
    </section>
  );
}
