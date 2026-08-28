"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMoney = toMoney;
exports.computePosLine = computePosLine;
exports.computePosTotals = computePosTotals;
function toMoney(value) {
    if (!Number.isFinite(value))
        return 0;
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
function clampPercent(value) {
    if (!Number.isFinite(value ?? NaN))
        return 0;
    return Math.min(100, Math.max(0, value));
}
function computePosLine(line) {
    const quantity = Math.max(0, Math.trunc(line.quantity || 0));
    const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
    const taxPercent = clampPercent(line.taxPercent);
    const lineSubtotal = toMoney(quantity * unitPrice);
    const rawDiscount = Math.max(0, Number(line.discountAmount) || 0);
    const discountAmount = toMoney(Math.min(rawDiscount, lineSubtotal));
    const taxableAmount = toMoney(lineSubtotal - discountAmount);
    const taxAmount = toMoney((taxableAmount * taxPercent) / 100);
    return {
        quantity,
        unitPrice,
        taxPercent,
        lineSubtotal,
        discountAmount,
        taxableAmount,
        taxAmount,
        totalPrice: toMoney(taxableAmount + taxAmount),
    };
}
function computePosTotals(lines, orderDiscount = 0) {
    const gross = lines.reduce((sum, l) => sum +
        Math.max(0, Math.trunc(l.quantity || 0)) *
            Math.max(0, Number(l.unitPrice) || 0), 0);
    const spread = Math.max(0, Math.min(Number(orderDiscount) || 0, gross));
    const computed = lines.map((line) => {
        const lineGross = Math.max(0, Math.trunc(line.quantity || 0)) *
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
        grandTotal: toMoney(computed.reduce((s, l) => s + l.totalPrice, 0)),
        lines: computed,
    };
}
//# sourceMappingURL=pos-totals.js.map