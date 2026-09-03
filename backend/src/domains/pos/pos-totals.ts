/**
 * Money for a till sale.
 *
 * Two bugs lived in the old arithmetic, both of them real rupees:
 *
 *  1. GST was hardcoded at 5% on every line, ignoring Product.taxPercentage,
 *     which the shop already sets and which the online checkout already
 *     honours. Indian apparel is 5% below Rs 1000 a piece and 12% at or above,
 *     so the counter under-collected on anything expensive and the shop
 *     absorbed the difference.
 *
 *  2. Tax was charged on the pre-discount subtotal and the discount subtracted
 *     afterwards, so every discounted bill overcharged the customer tax.
 *
 * Kept pure so both can be pinned by tests without a database, and so the
 * server can recompute what a till sends rather than trusting it.
 */

export interface PosLineInput {
  quantity: number;
  unitPrice: number;
  /** Absolute discount on this line, in rupees. */
  discountAmount?: number;
  /** GST for this line, as a percentage. Comes from Product.taxPercentage. */
  taxPercent?: number;
}

export interface PosLineTotals {
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  /** quantity x unitPrice, before discount. */
  lineSubtotal: number;
  discountAmount: number;
  /** The amount GST is actually charged on. */
  taxableAmount: number;
  taxAmount: number;
  /** What the customer pays for this line. */
  totalPrice: number;
}

export interface PosTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  lines: PosLineTotals[];
}

/** Rounds to paise, at the point each value is produced. */
export function toMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampPercent(value: number | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.min(100, Math.max(0, value as number));
}

export function computePosLine(line: PosLineInput): PosLineTotals {
  const quantity = Math.max(0, Math.trunc(line.quantity || 0));
  const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
  const taxPercent = clampPercent(line.taxPercent);

  const lineSubtotal = toMoney(quantity * unitPrice);
  // A discount can never exceed the line, or the bill would go negative and
  // the till would owe the customer money on an item they are buying.
  const rawDiscount = Math.max(0, Number(line.discountAmount) || 0);
  const discountAmount = toMoney(Math.min(rawDiscount, lineSubtotal));

  const linePayable = toMoney(lineSubtotal - discountAmount);
  const taxableAmount = taxPercent > 0 ? toMoney(linePayable / (1 + taxPercent / 100)) : linePayable;
  const taxAmount = toMoney(linePayable - taxableAmount);

  return {
    quantity,
    unitPrice,
    taxPercent,
    lineSubtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalPrice: linePayable,
  };
}

/**
 * Totals a cart.
 *
 * An order-level discount is spread across the lines in proportion to their
 * value before tax is worked out, because GST is charged per line at that
 * line's own rate -- taking the discount off the grand total instead would
 * apply one blended rate to goods taxed at different ones.
 */
export function computePosTotals(
  lines: PosLineInput[],
  orderDiscount = 0,
): PosTotals {
  const gross = lines.reduce(
    (sum, l) =>
      sum +
      Math.max(0, Math.trunc(l.quantity || 0)) *
        Math.max(0, Number(l.unitPrice) || 0),
    0,
  );

  const spread = Math.max(0, Math.min(Number(orderDiscount) || 0, gross));

  const computed = lines.map((line) => {
    const lineGross =
      Math.max(0, Math.trunc(line.quantity || 0)) *
      Math.max(0, Number(line.unitPrice) || 0);
    const share = gross > 0 ? (lineGross / gross) * spread : 0;
    return computePosLine({
      ...line,
      discountAmount: (Number(line.discountAmount) || 0) + share,
    });
  });

  return {
    subtotal: toMoney(computed.reduce((s, l) => s + l.lineSubtotal, 0)),
    discountTotal: toMoney(computed.reduce((s, l) => s + l.discountAmount, 0)),
    taxTotal: toMoney(computed.reduce((s, l) => s + l.taxAmount, 0)),
    // Summed from rounded line totals so the printed column equals the footer.
    grandTotal: toMoney(computed.reduce((s, l) => s + l.totalPrice, 0)),
    lines: computed,
  };
}
