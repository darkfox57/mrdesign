"use client";

import { useEffect, useRef } from "react";

// Where keyboard focus goes when a control removes its own item (a cart line, a block): the item
// that takes its place, else the previous one, else null (the list's container takes it). Without
// this, focus falls to <body> and a keyboard user loses their place (WCAG 2.4.3).
export function focusAfterRemoval<K>(keys: readonly K[], removed: K): K | null {
  const index = keys.indexOf(removed);
  if (index === -1) return null;
  return keys[index + 1] ?? keys[index - 1] ?? null;
}

// Moves focus after `items` changes. Each remove button carries `data-remove-key={key}` inside the
// container; when no item is left, the container (tabIndex={-1}) takes focus.
export function useRemovalFocus<K extends string | number>(items: readonly unknown[]) {
  const container = useRef<HTMLDivElement>(null);
  const target = useRef<{ key: K | null } | null>(null);

  useEffect(() => {
    const pending = target.current;
    const root = container.current;
    if (!pending || !root) return;
    target.current = null;
    const button =
      pending.key === null ? null : root.querySelector<HTMLElement>(`[data-remove-key="${CSS.escape(String(pending.key))}"]`);
    (button ?? root).focus();
  }, [items]);

  // Call before removing `key` from `keys`.
  const willRemove = (keys: readonly K[], key: K) => {
    target.current = { key: focusAfterRemoval(keys, key) };
  };

  return { container, willRemove };
}
