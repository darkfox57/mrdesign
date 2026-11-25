"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { readXray, writeXray, XRAY_CLASS, XRAY_EVENT, XRAY_STORAGE_KEY } from "@/lib/motion/xray";

// The mode lives in the `xray` class on <html>: the boot script in the layout sets it before paint,
// and every toggle on the page (header and mobile menu) reads and changes that one source.
function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== XRAY_STORAGE_KEY) return;
    // Another tab changed the mode: follow it here too.
    document.documentElement.classList.toggle(XRAY_CLASS, readXray(window.localStorage));
    onChange();
  };
  window.addEventListener(XRAY_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(XRAY_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const isOn = () => document.documentElement.classList.contains(XRAY_CLASS);
// The server never knows the visitor's choice: it renders the toggle off, and React updates it after
// hydration without a mismatch.
const isOnOnServer = () => false;

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function setXray(on: boolean) {
  document.documentElement.classList.toggle(XRAY_CLASS, on);
  writeXray(storage(), on);
  window.dispatchEvent(new Event(XRAY_EVENT));
}

// A switch-like button: `aria-pressed` carries the state, the visible label stays the same.
export function XrayToggle({ label, className }: { label: string; className?: string }) {
  const on = useSyncExternalStore(subscribe, isOn, isOnOnServer);

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setXray(!on)}
      className={cn(
        "group inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full border-[1.5px] border-ink-line px-3.5 font-mono text-caption text-on-ink transition-colors hover:border-on-ink aria-pressed:border-brand-500 aria-pressed:text-brand-400",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="relative h-4 w-7 rounded-full bg-ink-high transition-colors group-aria-pressed:bg-brand-500 after:absolute after:top-0.5 after:left-0.5 after:size-3 after:rounded-full after:bg-on-ink-muted after:transition-transform group-aria-pressed:after:translate-x-3 group-aria-pressed:after:bg-brand-950"
      />
      {label}
    </button>
  );
}
