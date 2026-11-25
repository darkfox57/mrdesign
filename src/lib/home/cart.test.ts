import { describe, expect, it } from "vitest";
import { cartCount, cartReducer, cartSubtotal, clampQuantity, MAX_QUANTITY } from "./cart";

describe("cartReducer", () => {
  it("adds a new variant as a new line", () => {
    expect(cartReducer([], { type: "add", variant: "oak", qty: 2 })).toEqual([{ variant: "oak", qty: 2 }]);
  });

  it("merges the same variant into one line", () => {
    const cart = cartReducer([{ variant: "oak", qty: 2 }], { type: "add", variant: "oak", qty: 3 });
    expect(cart).toEqual([{ variant: "oak", qty: 5 }]);
  });

  it("keeps different variants on separate lines, in the order they were added", () => {
    const cart = cartReducer([{ variant: "oak", qty: 1 }], { type: "add", variant: "walnut", qty: 1 });
    expect(cart).toEqual([
      { variant: "oak", qty: 1 },
      { variant: "walnut", qty: 1 },
    ]);
  });

  it("removes a variant's line", () => {
    const cart = [
      { variant: "oak", qty: 1 },
      { variant: "walnut", qty: 4 },
    ];
    expect(cartReducer(cart, { type: "remove", variant: "oak" })).toEqual([{ variant: "walnut", qty: 4 }]);
  });

  it("ignores an empty or invalid quantity", () => {
    const cart = [{ variant: "oak", qty: 1 }];
    expect(cartReducer(cart, { type: "add", variant: "oak", qty: 0 })).toBe(cart);
    expect(cartReducer(cart, { type: "add", variant: "oak", qty: Number.NaN })).toBe(cart);
  });

  it("never mutates the previous cart", () => {
    const cart = Object.freeze([Object.freeze({ variant: "oak", qty: 1 })]);
    expect(() => cartReducer(cart, { type: "add", variant: "oak", qty: 1 })).not.toThrow();
    expect(cart[0].qty).toBe(1);
  });
});

describe("cart totals", () => {
  const cart = [
    { variant: "oak", qty: 2 },
    { variant: "walnut", qty: 1 },
  ];

  it("counts every unit", () => {
    expect(cartCount(cart)).toBe(3);
    expect(cartCount([])).toBe(0);
  });

  it("multiplies the units by the unit price", () => {
    expect(cartSubtotal(cart, 420_000)).toBe(1_260_000);
    expect(cartSubtotal([], 420_000)).toBe(0);
  });
});

describe("clampQuantity", () => {
  it("keeps the picker between 1 and the maximum", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(4)).toBe(4);
    expect(clampQuantity(MAX_QUANTITY + 3)).toBe(MAX_QUANTITY);
  });
});
