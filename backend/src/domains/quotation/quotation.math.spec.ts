import {
  buildQuotationNumber,
  computeLine,
  computeQuotation,
  toMoney,
} from './quotation.math';

/**
 * These are the figures a customer is quoted and then billed. A line that does
 * not match its own printed total, or a footer that does not match its column,
 * is an argument at the counter -- so the arithmetic is pinned here.
 */
describe('quotation money', () => {
  it('prices a plain line', () => {
    const line = computeLine({ quantity: 10, unitPrice: 250 });

    expect(line.lineSubtotal).toBe(2500);
    expect(line.discountAmount).toBe(0);
    expect(line.totalPrice).toBe(2500);
  });

  it('applies a bulk discount before tax, the way GST is charged', () => {
    const line = computeLine({
      quantity: 10,
      unitPrice: 1000,
      discountPercent: 20,
      taxPercent: 5,
    });

    expect(line.lineSubtotal).toBe(10000);
    expect(line.discountAmount).toBe(2000);
    // 5% of 8000, not of 10000 -- taxing the pre-discount amount would
    // overcharge the customer by 100 on this line alone.
    expect(line.taxAmount).toBe(400);
    expect(line.totalPrice).toBe(8400);
  });

  it('keeps the footer equal to the column', () => {
    // Values chosen to leave a third of a paisa on each line.
    const totals = computeQuotation([
      { quantity: 3, unitPrice: 33.33, taxPercent: 12 },
      { quantity: 7, unitPrice: 19.99, discountPercent: 7.5, taxPercent: 12 },
      { quantity: 1, unitPrice: 0.05, taxPercent: 18 },
    ]);

    const summed = toMoney(totals.lines.reduce((s, l) => s + l.totalPrice, 0));
    expect(totals.grandTotal).toBe(summed);
  });

  it('reports subtotal, discount and tax separately', () => {
    const totals = computeQuotation([
      { quantity: 2, unitPrice: 500, discountPercent: 10, taxPercent: 5 },
      { quantity: 1, unitPrice: 1000, discountPercent: 0, taxPercent: 5 },
    ]);

    expect(totals.subtotal).toBe(2000);
    expect(totals.discountTotal).toBe(100);
    expect(totals.taxTotal).toBe(95);
    expect(totals.grandTotal).toBe(1995);
  });

  it('refuses a discount above 100 percent rather than paying the customer', () => {
    const line = computeLine({
      quantity: 1,
      unitPrice: 100,
      discountPercent: 250,
    });

    expect(line.discountPercent).toBe(100);
    expect(line.totalPrice).toBe(0);
    expect(line.totalPrice).toBeGreaterThanOrEqual(0);
  });

  it.each([
    [
      'negative discount',
      { quantity: 1, unitPrice: 100, discountPercent: -50 },
    ],
    ['negative price', { quantity: 1, unitPrice: -100 }],
    ['negative quantity', { quantity: -5, unitPrice: 100 }],
    ['NaN price', { quantity: 1, unitPrice: Number.NaN }],
  ])('never returns a negative total for %s', (_label, input) => {
    expect(computeLine(input).totalPrice).toBeGreaterThanOrEqual(0);
  });

  it('treats a fractional quantity as whole units', () => {
    // You cannot sell 2.7 dresses; the till would deduct a fraction of one.
    expect(computeLine({ quantity: 2.7, unitPrice: 100 }).quantity).toBe(2);
  });

  it('totals an empty quote to zero rather than NaN', () => {
    expect(computeQuotation([])).toMatchObject({
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 0,
    });
  });

  it('rounds half up to paise', () => {
    expect(toMoney(0.005)).toBe(0.01);
    expect(toMoney(1.005)).toBe(1.01);
    expect(toMoney(2.675)).toBe(2.68);
  });
});

describe('quotation numbers', () => {
  it('carries the date so a paper copy can be found', () => {
    expect(buildQuotationNumber(new Date('2026-08-27T10:00:00Z'))).toMatch(
      /^QT-20260827-[0-9A-Z]{3}$/,
    );
  });

  it('does not collide across a burst of issues', () => {
    const now = new Date('2026-08-27T10:00:00Z');
    const issued = new Set(
      Array.from({ length: 400 }, () => buildQuotationNumber(now)),
    );
    // Same millisecond, same date: only the random tail separates them.
    expect(issued.size).toBeGreaterThan(300);
  });
});
