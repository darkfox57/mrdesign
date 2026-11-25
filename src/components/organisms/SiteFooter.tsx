import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/atoms/Logo";
import { Pending } from "@/components/atoms/Pending";
import { contact } from "@/content/contact";
import { SHOW_PENDING_CONTENT } from "@/content/home";
import { Link } from "@/i18n/navigation";

const linkClass = "inline-flex min-h-11 items-center no-underline transition-colors hover:text-on-ink";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  const year = new Date().getFullYear();

  return (
    <footer data-surface="ink" className="border-t border-ink-line bg-ink text-sm text-on-ink-muted">
      <div className="site-container flex flex-wrap items-center justify-between gap-x-10 gap-y-5 py-10">
        {/* The signature closes every page: the work is signed. */}
        <Logo className="h-14 text-brand-500" />

        <nav aria-label={t("navigation")}>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
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
            <li>
              <Link href="/contacto" className={linkClass}>
                {t("contact")}
              </Link>
            </li>
          </ul>
        </nav>

        <ul aria-label={t("contact")} className="flex flex-wrap gap-x-5 gap-y-1">
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
          <li className="flex min-h-11 items-center">{contact.city}, Colombia</li>
        </ul>
      </div>

      <div className="border-t border-ink-line">
        <div className="site-container flex flex-wrap items-center justify-between gap-x-10 gap-y-2 py-5">
          <p>
            © {year} Mr. Design
            {/* The legal name and tax ID are still missing (SHOW_PENDING_CONTENT). */}
            {SHOW_PENDING_CONTENT ? (
              <>
                {" · "}
                <Pending>{t("legalNamePending")}</Pending>
              </>
            ) : null}
          </p>
          <nav aria-label={t("legal")}>
            <ul className="flex flex-wrap gap-x-5">
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
      </div>
    </footer>
  );
}
