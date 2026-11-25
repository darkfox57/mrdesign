// The demo cart of the home's "pieces": the product card adds to it and the cart lists it. Demo data
// only, nothing is sold or stored. One line per variant; adding the same variant again merges it.

export type CartLine = { variant: string; qty: number };
export type CartAction = { type: "add"; variant: string; qty: number } | { type: "remove"; variant: string };

export const MAX_QUANTITY = 9;

export function cartReducer(cart: readonly CartLine[], action: CartAction): readonly CartLine[] {
  if (action.type === "remove") return cart.filter((line) => line.variant !== action.variant);
  if (!Number.isFinite(action.qty) || action.qty < 1) return cart;
  const found = cart.some((line) => line.variant === action.variant);
  return found
    ? cart.map((line) => (line.variant === action.variant ? { ...line, qty: line.qty + action.qty } : line))
    : [...cart, { variant: action.variant, qty: action.qty }];
}

export function cartCount(cart: readonly CartLine[]): number {
  return cart.reduce((total, line) => total + line.qty, 0);
}

export function cartSubtotal(cart: readonly CartLine[], unitPrice: number): number {
  return cartCount(cart) * unitPrice;
}

export function clampQuantity(qty: number): number {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(qty) || 1));
}
