/**
 * Splitting one bill across several tenders.
 *
 * A customer pays part in cash and the rest on a card, or hands over two cards.
 * Each tender is recorded as its own payment row so the close-of-day cash count
 * and the card settlement both come out right -- a single row marked "SPLIT"
 * would leave the cashier hunting a phantom discrepancy in the drawer.
 *
 * Change is only ever given from cash. Overpaying a card and expecting notes
 * back is not something a till may do.
 */

export interface TenderInput {
  method: string;
  amount: number;
}

export interface TenderAllocation {
  method: string;
  /** What is actually recorded against the order, change already removed. */
  amount: number;
}

export interface TenderSplit {
  allocations: TenderAllocation[];
  changeDue: number;
}

export class TenderError extends Error {}

const toMoney = (value: number): number =>
  Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;

export function allocateTenders(
  tenders: TenderInput[],
  grandTotal: number,
): TenderSplit {
  const cleaned = (tenders || [])
    .map((t) => ({
      method: String(t?.method || '').toUpperCase(),
      amount: toMoney(Number(t?.amount) || 0),
    }))
    .filter((t) => t.amount > 0);

  if (cleaned.length === 0) {
    throw new TenderError('A split payment needs at least one tender.');
  }

  const due = toMoney(grandTotal);
  const tendered = toMoney(cleaned.reduce((sum, t) => sum + t.amount, 0));

  if (tendered + 0.005 < due) {
    throw new TenderError(
      `Split payment is short by Rs.${toMoney(due - tendered).toFixed(2)}. ` +
        `Bill is Rs.${due.toFixed(2)} but only Rs.${tendered.toFixed(2)} was tendered.`,
    );
  }

  const excess = toMoney(tendered - due);
  if (excess === 0) {
    return { allocations: cleaned, changeDue: 0 };
  }

  const cashTendered = toMoney(
    cleaned
      .filter((t) => t.method === 'CASH')
      .reduce((sum, t) => sum + t.amount, 0),
  );
  if (excess > cashTendered + 0.005) {
    throw new TenderError(
      `Rs.${excess.toFixed(2)} over the bill total, but only Rs.${cashTendered.toFixed(2)} ` +
        'was paid in cash. Change can only be given against cash.',
    );
  }

  // Take the change out of the cash tenders, last one first, so the recorded
  // payments add up to exactly what was billed.
  let remaining = excess;
  const allocations = [...cleaned];
  for (let i = allocations.length - 1; i >= 0 && remaining > 0; i -= 1) {
    if (allocations[i].method !== 'CASH') continue;
    const taken = Math.min(allocations[i].amount, remaining);
    allocations[i] = {
      ...allocations[i],
      amount: toMoney(allocations[i].amount - taken),
    };
    remaining = toMoney(remaining - taken);
  }

  return {
    allocations: allocations.filter((a) => a.amount > 0),
    changeDue: excess,
  };
}
