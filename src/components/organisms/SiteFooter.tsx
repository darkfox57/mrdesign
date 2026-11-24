import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/atoms/Logo";
import { contact } from "@/content/contact";
import { Link } from "@/i18n/navigation";

const linkClass = "inline-flex min-h-11 items-center text-on-ink-muted transition-colors hover:text-white";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-on-ink">
      <div className="site-container grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          {/* The signature closes every page: the work is signed. */}
          <Logo className="h-24 text-brand-500" />
          <p className="mt-6 max-w-xs text-on-ink-muted">{t("tagline")}</p>
        </div>

        <nav aria-labelledby="footer-site">
          <h2 id="footer-site" className="font-semibold text-white">
            {t("navigation")}
          </h2>
          <ul className="mt-3">
            <li>
              <Link href="/servicios" className={linkClass}>
                {nav("services")}
              </Link>
            </li>
            <li>
              <Link href="/portafolio" className={linkClass}>
                {nav("portfolio")}
              </Link>
            </li>
            <li>
              <Link href="/blog" className={linkClass}>
                {nav("blog")}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-semibold text-white">{t("contact")}</h2>
          <ul className="mt-3">
            <li>
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {contact.email}
              </a>
            </li>
            <li>
              <a href={contact.phoneHref} className={linkClass}>
                {contact.phone}
              </a>
            </li>
            <li className="flex min-h-11 items-center text-on-ink-muted">{contact.city}, Colombia</li>
          </ul>
        </div>

        <nav aria-labelledby="footer-legal">
          <h2 id="footer-legal" className="font-semibold text-white">
            {t("legal")}
          </h2>
          <ul className="mt-3">
            <li>
              <Link href="/politica-de-privacidad" className={linkClass}>
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terminos-y-condiciones" className={linkClass}>
                {t("terms")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-ink-line">
        <p className="site-container py-6 text-sm text-on-ink-muted">
          © {year} Mr. Design. {t("rights")}
        </p>
      </div>
    </footer>
  );
}
