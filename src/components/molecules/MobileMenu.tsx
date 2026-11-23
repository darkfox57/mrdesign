"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

type MobileMenuProps = {
  openLabel: string;
  closeLabel: string;
  children: ReactNode;
};

export function MobileMenu({ openLabel, closeLabel, children }: MobileMenuProps) {
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
        className="inline-flex size-11 items-center justify-center rounded-control text-ink hover:bg-white"
      >
        {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <div
        id={panelId}
        hidden={!isOpen}
        className="fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-t border-line bg-paper"
      >
        <div className="site-container py-6">{children}</div>
      </div>
    </div>
  );
}
