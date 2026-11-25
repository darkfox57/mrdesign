"use client";

import { useLocale, useTranslations } from "next-intl";
import { useReducer, useState } from "react";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/routing";
import { cartCount, cartReducer, cartSubtotal, clampQuantity } from "@/lib/home/cart";
import { useRemovalFocus } from "@/lib/home/focus";
import { formatPrice } from "@/lib/home/price";
import { ChairIcon } from "./HomeStageScreen";
import { PieceCard } from "./PieceCard";

export type DemoVariant = { id: string; name: string; tone: "oak" | "walnut" | "graphite" };
export type DemoProductProps = { name: string; price: number; stock: string; variants: DemoVariant[] };

const toneText = { oak: "text-wood-oak", walnut: "text-wood-walnut", graphite: "text-wood-graphite" } as const;
const toneBg = { oak: "bg-wood-oak", walnut: "bg-wood-walnut", graphite: "bg-wood-graphite" } as const;

const stepper = "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center text-lg text-text";

// The product card and the cart: two pieces that share one demo cart, so adding the chair on one
// shows it in the other. Demo only: nothing is sold or stored.
export function CommercePieces({ product }: { product: DemoProductProps }) {
  const t = useTranslations("Home.pieces");
  const locale = useLocale() as Locale;
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [qty, setQty] = useState(1);
  const variant = product.variants.find((item) => item.id === variantId) ?? product.variants[0];
  const price = (amount: number) => formatPrice(amount, locale);
  const lineName = (item: DemoVariant) => `${product.name} · ${item.name}`;
  const count = cartCount(cart);
  const labels = { skeleton: t("skeleton"), finished: t("finished") };
  // Removing a line keeps keyboard focus in the cart.
  const { container: removalRef, willRemove } = useRemovalFocus<string>(cart);

  return (
    <>
      <PieceCard code="ProductDetail" title={t("product.title")} description={t("product.description")} labels={labels}>
        <div data-reveal="assemble" className="flex flex-wrap gap-5">
          <div
            data-x="ProductGallery"
            data-fill=""
            className={cn("flex min-h-56 flex-[1_1_12.5rem] items-center justify-center rounded-2xl bg-paper-deep transition-colors", toneText[variant.tone])}
          >
            <ChairIcon className="size-36" />
          </div>
          <div className="flex flex-[1_1_13.75rem] flex-col gap-3.5">
            <div data-x="ProductInfo" className="flex flex-col gap-1">
              <span className="text-xl font-semibold">{product.name}</span>
              <span className="text-lg">{price(product.price)}</span>
              <span className="text-caption text-success">{product.stock}</span>
            </div>
            <div data-x="VariantPicker" className="flex flex-col gap-2">
              <span id="piece-variant" className="text-caption text-graphite">
                {t("product.variant", { name: variant.name })}
              </span>
              <div role="group" aria-labelledby="piece-variant" className="flex flex-wrap gap-2">
                {product.variants.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={item.id === variant.id}
                    onClick={() => setVariantId(item.id)}
                    className="inline-flex min-h-11 min-w-11 cursor-pointer items-center gap-2 rounded-full border border-text/20 bg-white px-3.5 text-sm text-text aria-pressed:border-text aria-pressed:shadow-[inset_0_0_0_1px_var(--color-text)]"
                  >
                    <span aria-hidden="true" className={cn("size-3.5 rounded-full", toneBg[item.tone])} />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <div data-x="AddToCart" className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center rounded-full border border-text/20 bg-white">
                <button type="button" aria-label={t("product.less")} onClick={() => setQty(clampQuantity(qty - 1))} className={stepper}>
                  −
                </button>
                <span aria-live="polite" className="min-w-6 text-center font-semibold">
                  <span className="sr-only">{t("product.quantity")} </span>
                  {qty}
                </span>
                <button type="button" aria-label={t("product.more")} onClick={() => setQty(clampQuantity(qty + 1))} className={stepper}>
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "add", variant: variant.id, qty });
                  setQty(1);
                }}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-control bg-text px-5.5 text-md font-semibold text-paper transition-colors hover:bg-ink-high"
              >
                {t("product.add")}
              </button>
            </div>
          </div>
        </div>
      </PieceCard>

      <PieceCard code="CartDrawer" title={t("cart.title")} description={t("cart.description")} labels={labels}>
        <div
          ref={removalRef}
          tabIndex={-1}
          data-reveal="assemble"
          data-x="CartLines"
          aria-live="polite"
          role="group"
          aria-label={t("cart.title")}
          className="flex min-h-64 flex-1 flex-col rounded-2xl border border-line bg-white"
        >
          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="font-semibold">{t("cart.empty")}</span>
              <span className="text-sm text-graphite">{t("cart.emptyHint")}</span>
            </div>
          ) : (
            <>
              <ul>
                {cart.map((line) => {
                  const item = product.variants.find((candidate) => candidate.id === line.variant) ?? product.variants[0];
                  return (
                    <li key={line.variant} className="flex items-center gap-3.5 border-b border-text/8 px-4.5 py-3.5 motion-safe:animate-rise">
                      <div data-fill="" className={cn("size-12 flex-none rounded-[0.625rem]", toneBg[item.tone])} />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-md font-semibold">{lineName(item)}</span>
                        <span className="text-caption text-graphite">{t("cart.line", { qty: line.qty, price: price(product.price) })}</span>
                      </div>
                      <span className="text-md font-semibold">{price(line.qty * product.price)}</span>
                      <button
                        type="button"
                        data-remove-key={line.variant}
                        aria-label={t("cart.removeLabel", { name: lineName(item) })}
                        onClick={() => {
                          willRemove(
                            cart.map((entry) => entry.variant),
                            line.variant,
                          );
                          dispatch({ type: "remove", variant: line.variant });
                        }}
                        className="min-h-11 min-w-11 cursor-pointer text-caption text-graphite underline"
                      >
                        {t("cart.remove")}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div data-x="CartSummary" className="mt-auto flex flex-wrap items-center justify-between gap-3 px-4.5 py-4">
                <span className="text-md">
                  {t("cart.subtotal", { count })} <strong>{price(cartSubtotal(cart, product.price))}</strong>
                </span>
                <span className="inline-flex min-h-11 items-center rounded-full bg-brand-500 px-4.5 text-md font-semibold text-ink">{t("cart.checkout")}</span>
              </div>
            </>
          )}
        </div>
      </PieceCard>
    </>
  );
}
