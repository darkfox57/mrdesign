// X-ray mode: every element marked `data-x="ComponentName"` shows its outline and name, and a
// 12-column grid covers the page (styles in src/app/globals.css). The choice is the visitor's and
// persists in localStorage; the class lives on <html>, so it reaches every page and the header.

export const XRAY_CLASS = "xray";
export const XRAY_STORAGE_KEY = "mrdesign:xray";
// Fired on window when the mode changes, so every toggle on the page (header and mobile menu) follows.
export const XRAY_EVENT = "mrdesign:xray";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem" | "removeItem">;

// Storage can be missing or throw (private windows, blocked site data): both read as off.
export function readXray(storage: ReadableStorage | null | undefined): boolean {
  try {
    return storage?.getItem(XRAY_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function writeXray(storage: WritableStorage | null | undefined, on: boolean): void {
  try {
    if (on) storage?.setItem(XRAY_STORAGE_KEY, "on");
    else storage?.removeItem(XRAY_STORAGE_KEY);
  } catch {
    // The mode still applies to this page; it just will not be remembered.
  }
}

// Runs in <head> before the first paint (src/app/[locale]/layout.tsx), so a page loaded with X-ray
// on never flashes without it. Plain ES5 on purpose: it is not compiled.
export const xrayBootScript = `(function(){try{if(localStorage.getItem(${JSON.stringify(XRAY_STORAGE_KEY)})==="on")document.documentElement.classList.add(${JSON.stringify(XRAY_CLASS)})}catch(e){}})()`;
