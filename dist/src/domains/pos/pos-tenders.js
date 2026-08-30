"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenderError = void 0;
exports.allocateTenders = allocateTenders;
class TenderError extends Error {
}
exports.TenderError = TenderError;
const toMoney = (value) => Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;
function allocateTenders(tenders, grandTotal) {
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
        throw new TenderError(`Split payment is short by Rs.${toMoney(due - tendered).toFixed(2)}. ` +
            `Bill is Rs.${due.toFixed(2)} but only Rs.${tendered.toFixed(2)} was tendered.`);
    }
    const excess = toMoney(tendered - due);
    if (excess === 0) {
        return { allocations: cleaned, changeDue: 0 };
    }
    const cashTendered = toMoney(cleaned
        .filter((t) => t.method === 'CASH')
        .reduce((sum, t) => sum + t.amount, 0));
    if (excess > cashTendered + 0.005) {
        throw new TenderError(`Rs.${excess.toFixed(2)} over the bill total, but only Rs.${cashTendered.toFixed(2)} ` +
            'was paid in cash. Change can only be given against cash.');
    }
    let remaining = excess;
    const allocations = [...cleaned];
    for (let i = allocations.length - 1; i >= 0 && remaining > 0; i -= 1) {
        if (allocations[i].method !== 'CASH')
            continue;
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
//# sourceMappingURL=pos-tenders.js.map