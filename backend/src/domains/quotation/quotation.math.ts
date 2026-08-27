/**
 * Money for a bulk quote.
 *
 * Split out and kept pure because these are the numbers a customer is asked to
 * agree to and pay: a rounding slip here is a real rupee wrong on a real
 * invoice, and it must be checkable without a database.
 */

export interface QuotationLineInput {
  quantity: number;
  unitPrice: number;
  /** Bulk discount for this line, as a percentage. */
  discountPercent?: number;
  /** GST for this line, as a percentage. */
  taxPercent?: number;
}

export interface QuotationLineTotals {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  /** quantity x unitPrice, before any discount. */
  lineSubtotal: number;
  discountAmount: number;
  taxAmount: number;
  /** What the customer pays for this line, discount and tax included. */
  totalPrice: number;
}

export interface QuotationTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  lines: QuotationLineTotals[];
}

/**
 * Rounds to paise.
 *
 * Every money value is rounded at the point it is produced rather than only on
 * display, so the printed line totals always add up to the printed grand total.
 * A quote whose column does not sum to its own footer is one the customer is
 * entitled to argue with.
 */
export function toMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clampPercent(value: number | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.min(100, Math.max(0, value as number));
}

/** Tax applies to the discounted amount, which is how GST is charged. */
export function computeLine(line: QuotationLineInput): QuotationLineTotals {
  const quantity = Math.max(0, Math.trunc(line.quantity || 0));
  const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
  const discountPercent = clampPercent(line.discountPercent);
  const taxPercent = clampPercent(line.taxPercent);

  const lineSubtotal = toMoney(quantity * unitPrice);
  const discountAmount = toMoney((lineSubtotal * discountPercent) / 100);
  const taxable = toMoney(lineSubtotal - discountAmount);
  const taxAmount = toMoney((taxable * taxPercent) / 100);

  return {
    quantity,
    unitPrice,
    discountPercent,
    taxPercent,
    lineSubtotal,
    discountAmount,
    taxAmount,
    totalPrice: toMoney(taxable + taxAmount),
  };
}

export function computeQuotation(lines: QuotationLineInput[]): QuotationTotals {
  const computed = lines.map(computeLine);

  const subtotal = toMoney(computed.reduce((s, l) => s + l.lineSubtotal, 0));
  const discountTotal = toMoney(
    computed.reduce((s, l) => s + l.discountAmount, 0),
  );
  const taxTotal = toMoney(computed.reduce((s, l) => s + l.taxAmount, 0));

  return {
    subtotal,
    discountTotal,
    taxTotal,
    // Summed from the rounded line totals, so the footer equals the column.
    grandTotal: toMoney(computed.reduce((s, l) => s + l.totalPrice, 0)),
    lines: computed,
  };
}

/**
 * Human-readable quotation number.
 *
 * Carries the date so staff can find a quote from the paper copy, and a random
 * tail so two tills issuing at the same moment do not collide.
 */
export function buildQuotationNumber(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const tail = Math.floor(Math.random() * 46656)
    .toString(36)
    .toUpperCase()
    .padStart(3, '0');
  return `QT-${stamp}-${tail}`;
}
