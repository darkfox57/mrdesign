import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/atoms/ButtonLink";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <section className="site-container py-24">
      <h1 className="text-headline max-w-2xl">{t("title")}</h1>
      <p className="text-lead mt-6 max-w-prose text-graphite">{t("body")}</p>
      <ButtonLink href="/" className="mt-10">
        {t("home")}
      </ButtonLink>
    </section>
  );
}
