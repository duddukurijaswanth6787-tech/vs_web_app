import { allocateTenders, TenderError } from './pos-tenders';

describe('allocateTenders', () => {
  it('records each tender separately when they add up exactly', () => {
    const { allocations, changeDue } = allocateTenders(
      [
        { method: 'CASH', amount: 500 },
        { method: 'CARD', amount: 799.5 },
      ],
      1299.5,
    );
    expect(changeDue).toBe(0);
    expect(allocations).toEqual([
      { method: 'CASH', amount: 500 },
      { method: 'CARD', amount: 799.5 },
    ]);
  });

  it('gives change out of cash and records only what was billed', () => {
    const { allocations, changeDue } = allocateTenders(
      [
        { method: 'CARD', amount: 1000 },
        { method: 'CASH', amount: 500 },
      ],
      1299.5,
    );
    expect(changeDue).toBe(200.5);
    // The card settles in full; the cash line drops by the change handed back.
    expect(allocations).toEqual([
      { method: 'CARD', amount: 1000 },
      { method: 'CASH', amount: 299.5 },
    ]);
    const recorded = allocations.reduce((s, a) => s + a.amount, 0);
    expect(Number(recorded.toFixed(2))).toBe(1299.5);
  });

  it('rejects a short payment rather than under-charging', () => {
    expect(() =>
      allocateTenders([{ method: 'UPI', amount: 400 }], 1299.5),
    ).toThrow(TenderError);
  });

  it('refuses to give change when nothing was paid in cash', () => {
    expect(() =>
      allocateTenders(
        [
          { method: 'CARD', amount: 1000 },
          { method: 'UPI', amount: 500 },
        ],
        1299.5,
      ),
    ).toThrow(/only Rs.0.00 was paid in cash/);
  });

  it('ignores zero and negative tender rows', () => {
    const { allocations } = allocateTenders(
      [
        { method: 'CASH', amount: 1299.5 },
        { method: 'CARD', amount: 0 },
        { method: 'UPI', amount: -50 },
      ],
      1299.5,
    );
    expect(allocations).toHaveLength(1);
  });

  it('rejects an empty split', () => {
    expect(() => allocateTenders([], 100)).toThrow(TenderError);
  });
});
