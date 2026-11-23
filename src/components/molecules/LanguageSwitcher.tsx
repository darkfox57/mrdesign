"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

const names: Record<Locale, string> = { es: "Español", en: "English" };

type LanguageSwitcherProps = { tone?: "light" | "dark"; className?: string };

// Plain links (no JS needed to switch): each points to the current page in another locale.
export function LanguageSwitcher({ tone = "light", className }: LanguageSwitcherProps) {
  const t = useTranslations("Language");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useParams();

  return (
    <nav aria-label={t("label")} className={className}>
      <ul className="flex items-center gap-1">
        {routing.locales.map((target) => {
          const current = target === locale;
          return (
            <li key={target}>
              <Link
                // Typed routes cannot narrow a runtime pathname; params come from the current route.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={{ pathname, params } as any}
                locale={target}
                hrefLang={target}
                lang={target}
                aria-current={current ? "true" : undefined}
                title={names[target]}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-sm font-medium uppercase transition-colors",
                  tone === "light"
                    ? current
                      ? "text-ink"
                      : "text-graphite hover:text-ink"
                    : current
                      ? "text-white"
                      : "text-on-ink-muted hover:text-white",
                )}
              >
                <span aria-hidden="true">{target}</span>
                <span className="sr-only">
                  {names[target]}
                  {current ? ` (${t("current")})` : ""}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
