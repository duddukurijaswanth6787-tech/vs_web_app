import { computePosLine, computePosTotals, toMoney } from './pos-totals';

/**
 * The two bugs this replaced were both real money on real bills, so they get
 * named tests rather than being folded into general coverage.
 */
describe('POS totals', () => {
  it('charges each line at its own GST rate, not a flat 5%', () => {
    // Indian apparel: 5% under Rs 1000 a piece, 12% at or above. A cart with
    // one of each is exactly the case the hardcoded rate got wrong.
    const totals = computePosTotals([
      { quantity: 1, unitPrice: 800, taxPercent: 5 },
      { quantity: 1, unitPrice: 2400, taxPercent: 12 },
    ]);

    expect(totals.lines[0].taxAmount).toBe(40);
    expect(totals.lines[1].taxAmount).toBe(288);
    expect(totals.taxTotal).toBe(328);
    // The old flat 5% would have collected 160 on the pair.
    expect(totals.taxTotal).not.toBe(160);
  });

  it('charges tax on the discounted amount, not the full price', () => {
    const line = computePosLine({
      quantity: 1,
      unitPrice: 5000,
      discountAmount: 1000,
      taxPercent: 5,
    });

    expect(line.taxableAmount).toBe(4000);
    expect(line.taxAmount).toBe(200);
    expect(line.totalPrice).toBe(4200);
    // Taxing the pre-discount 5000 would have charged 250 -- Rs 50 the
    // customer does not owe.
    expect(line.taxAmount).not.toBe(250);
  });

  it('spreads an order-level discount across lines before taxing them', () => {
    // Two lines at different rates: taking the discount off the grand total
    // would tax the whole cart at one blended rate.
    const totals = computePosTotals(
      [
        { quantity: 1, unitPrice: 1000, taxPercent: 5 },
        { quantity: 1, unitPrice: 1000, taxPercent: 12 },
      ],
      200,
    );

    expect(totals.discountTotal).toBe(200);
    expect(totals.lines[0].taxableAmount).toBe(900);
    expect(totals.lines[1].taxableAmount).toBe(900);
    expect(totals.lines[0].taxAmount).toBe(45);
    expect(totals.lines[1].taxAmount).toBe(108);
    expect(totals.grandTotal).toBe(1953);
  });

  it('keeps the footer equal to the column', () => {
    const totals = computePosTotals([
      { quantity: 3, unitPrice: 333.33, taxPercent: 12 },
      { quantity: 7, unitPrice: 19.99, discountAmount: 11.11, taxPercent: 5 },
      { quantity: 1, unitPrice: 0.05, taxPercent: 18 },
    ]);

    const summed = toMoney(totals.lines.reduce((s, l) => s + l.totalPrice, 0));
    expect(totals.grandTotal).toBe(summed);
  });

  it('never lets a discount push a line negative', () => {
    const line = computePosLine({
      quantity: 1,
      unitPrice: 500,
      discountAmount: 900,
      taxPercent: 5,
    });

    expect(line.discountAmount).toBe(500);
    expect(line.totalPrice).toBe(0);
  });

  it('caps an order discount at the value of the cart', () => {
    const totals = computePosTotals(
      [{ quantity: 1, unitPrice: 100, taxPercent: 5 }],
      99999,
    );

    expect(totals.grandTotal).toBe(0);
    expect(totals.discountTotal).toBe(100);
  });

  it('treats a missing tax rate as zero rather than guessing one', () => {
    // Silently assuming a rate is how the 5% bug happened in the first place.
    const line = computePosLine({ quantity: 2, unitPrice: 100 });

    expect(line.taxPercent).toBe(0);
    expect(line.taxAmount).toBe(0);
    expect(line.totalPrice).toBe(200);
  });

  it.each([
    ['NaN price', { quantity: 1, unitPrice: Number.NaN }],
    ['negative price', { quantity: 1, unitPrice: -100 }],
    ['negative quantity', { quantity: -3, unitPrice: 100 }],
    ['negative discount', { quantity: 1, unitPrice: 100, discountAmount: -50 }],
    ['absurd tax', { quantity: 1, unitPrice: 100, taxPercent: 900 }],
  ])('stays non-negative and finite for %s', (_label, input) => {
    const line = computePosLine(input);
    expect(Number.isFinite(line.totalPrice)).toBe(true);
    expect(line.totalPrice).toBeGreaterThanOrEqual(0);
  });

  it('totals an empty cart to zero', () => {
    expect(computePosTotals([])).toMatchObject({
      subtotal: 0,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: 0,
    });
  });

  it('does not divide by zero when a free cart carries a discount', () => {
    const totals = computePosTotals([{ quantity: 1, unitPrice: 0 }], 50);
    expect(totals.grandTotal).toBe(0);
    expect(Number.isFinite(totals.discountTotal)).toBe(true);
  });
});
