/**
 * Cart totals for the phone till.
 *
 * Mirrors the server's pos-totals.ts: GST comes from each product's own rate
 * and is charged on the amount left after the discount. The server recomputes
 * and is the authority; this exists so the screen never shows a figure the
 * backend will then disagree with.
 *
 * The app used to apply a flat 5% to every cart, which under-collected on
 * higher-rate goods and overcharged tax whenever a discount was applied.
 */

export interface MobileCartLine {
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  /** From Product.taxPercentage, carried by the scan result. */
  taxPercent?: number;
}

export interface MobileCartTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
}

const toMoney = (value: number): number =>
  Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;

const clampPercent = (value?: number): number =>
  Number.isFinite(value ?? NaN) ? Math.min(100, Math.max(0, value as number)) : 0;

export function computeMobileTotals(
  lines: MobileCartLine[],
  orderDiscount = 0,
): MobileCartTotals {
  const gross = lines.reduce(
    (sum, l) =>
      sum + Math.max(0, Math.trunc(l.quantity || 0)) * Math.max(0, l.unitPrice || 0),
    0,
  );
  const spread = Math.max(0, Math.min(Number(orderDiscount) || 0, gross));

  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  for (const line of lines) {
    const quantity = Math.max(0, Math.trunc(line.quantity || 0));
    const unitPrice = Math.max(0, line.unitPrice || 0);
    const lineSubtotal = toMoney(quantity * unitPrice);

    // Split in proportion to line value, because lines can be taxed at
    // different rates.
    const share = gross > 0 ? (lineSubtotal / gross) * spread : 0;
    const discount = toMoney(
      Math.min(Math.max(0, line.discountAmount || 0) + share, lineSubtotal),
    );

    const taxable = toMoney(lineSubtotal - discount);
    const tax = toMoney((taxable * clampPercent(line.taxPercent)) / 100);

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
