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
    <header data-surface="ink" className="sticky top-0 z-40 border-b border-ink-line bg-ink text-on-ink">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-brand-500 focus:px-4 focus:py-2.5 focus:font-semibold focus:text-ink"
      >
        {t("skip")}
      </a>
      <div className="site-container flex h-18 items-center justify-between gap-6">
        <Link href="/" aria-label={t("home")} className="shrink-0 text-on-ink">
          <Logo className="h-11" decorative />
        </Link>

        <nav aria-label={t("label")} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full px-3.5 text-md text-on-ink-muted no-underline transition-colors hover:bg-on-ink/6 hover:text-on-ink"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher tone="dark" />
          <ButtonLink href="/contacto" size="md" data-magnetic="">
            {t("contact")}
          </ButtonLink>
        </div>

        <MobileMenu openLabel={t("openMenu")} closeLabel={t("closeMenu")} openText={t("menu")} closeText={t("close")}>
          <nav aria-label={t("label")}>
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="flex min-h-11 items-center py-3 text-xl font-semibold no-underline">
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ButtonLink href="/contacto" className="mt-4 w-full">
            {t("contact")}
          </ButtonLink>
          <LanguageSwitcher tone="dark" className="mt-6" />
        </MobileMenu>
      </div>
    </header>
  );
}
