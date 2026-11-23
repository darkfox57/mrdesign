import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/atoms/ButtonLink";
import { Logo } from "@/components/atoms/Logo";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { MobileMenu } from "@/components/molecules/MobileMenu";
import { Link } from "@/i18n/navigation";

const items = [
  { href: "/servicios", key: "services" },
  { href: "/portafolio", key: "portfolio" },
  { href: "/blog", key: "blog" },
] as const;

export async function SiteHeader() {
  const t = await getTranslations("Nav");

  return (
    // Solid background on purpose: backdrop-filter would make the header the containing block of the
    // fixed mobile menu panel, collapsing it to the header's height.
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-control focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        {t("skip")}
      </a>
      <div className="site-container flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label={t("home")} className="shrink-0 text-brand-600">
          <Logo className="h-11" decorative />
        </Link>

        <nav aria-label={t("label")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-control px-3 font-medium text-graphite transition-colors hover:text-ink"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <ButtonLink href="/contacto">{t("contact")}</ButtonLink>
        </div>

        <MobileMenu openLabel={t("openMenu")} closeLabel={t("closeMenu")}>
          <nav aria-label={t("label")}>
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.key} className="border-b border-line">
                  <Link href={item.href} className="text-title flex min-h-14 items-center">
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ButtonLink href="/contacto" className="mt-8 w-full">
            {t("contact")}
          </ButtonLink>
          <LanguageSwitcher className="mt-6" />
        </MobileMenu>
      </div>
    </header>
  );
}
