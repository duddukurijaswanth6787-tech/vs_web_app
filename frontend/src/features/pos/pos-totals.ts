import type { PosCartItem } from './pos.types';

/**
 * Cart totals for the till display.
 *
 * Deliberately mirrors the server's pos-totals.ts rule for rule: GST comes
 * from each product's own rate, and is charged on the amount left after the
 * discount. The server recomputes and is the authority -- this exists so the
 * cashier is never shown a figure the backend will then disagree with.
 *
 * The old screen applied a flat 5% to everything and subtracted the discount
 * after taxing, which both under-collected on higher-rate goods and
 * overcharged tax on every discounted bill.
 */

export interface CartTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

const toMoney = (value: number): number =>
  Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;

const clampPercent = (value: number | undefined): number =>
  Number.isFinite(value ?? NaN) ? Math.min(100, Math.max(0, value as number)) : 0;

export function computeCartTotals(
  cart: PosCartItem[],
  orderDiscount = 0,
): CartTotals {
  const gross = cart.reduce(
    (sum, i) =>
      sum + Math.max(0, Math.trunc(i.quantity || 0)) * Math.max(0, i.unitPrice || 0),
    0,
  );
  // Never discount more than the cart is worth, or the bill goes negative.
  const spread = Math.max(0, Math.min(Number(orderDiscount) || 0, gross));

  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  for (const item of cart) {
    const quantity = Math.max(0, Math.trunc(item.quantity || 0));
    const unitPrice = Math.max(0, item.unitPrice || 0);
    const lineSubtotal = toMoney(quantity * unitPrice);

    // The order discount is split across lines in proportion to their value,
    // because each line may carry a different GST rate.
    const share = gross > 0 ? (lineSubtotal / gross) * spread : 0;
    const discount = toMoney(
      Math.min(Math.max(0, item.discountAmount || 0) + share, lineSubtotal),
    );

    const taxable = toMoney(lineSubtotal - discount);
    const tax = toMoney((taxable * clampPercent(item.taxPercent)) / 100);

    subtotal += lineSubtotal;
    discountTotal += discount;
    taxTotal += tax;
    grandTotal += toMoney(taxable + tax);
  }

  return {
    subtotal: toMoney(subtotal),
    discountTotal: toMoney(discountTotal),
    taxTotal: toMoney(taxTotal),
    grandTotal: toMoney(grandTotal),
  };
}
