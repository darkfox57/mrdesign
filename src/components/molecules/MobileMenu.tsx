"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

type MobileMenuProps = {
  // Accessible names; they contain the visible text, so voice control finds the button.
  openLabel: string;
  closeLabel: string;
  openText: string;
  closeText: string;
  children: ReactNode;
};

export function MobileMenu({ openLabel, closeLabel, openText, closeText, children }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const panelId = useId();
  const pathname = usePathname();

  // Navigating to another page closes the menu.
  const isOpen = open && openedAt === pathname;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? closeLabel : openLabel}
        onClick={() => {
          setOpen(!isOpen);
          setOpenedAt(pathname);
        }}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-[1.5px] border-ink-line px-4 text-sm font-semibold text-on-ink transition-colors hover:border-on-ink"
      >
        {isOpen ? closeText : openText}
      </button>
      <div
        id={panelId}
        hidden={!isOpen}
        data-surface="ink"
        className="fixed inset-x-0 top-18 bottom-0 overflow-y-auto border-t border-ink-line bg-ink text-on-ink"
      >
        <div className="site-container pt-2 pb-8">{children}</div>
      </div>
    </div>
  );
}
