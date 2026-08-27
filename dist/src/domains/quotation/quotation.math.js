"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMoney = toMoney;
exports.computeLine = computeLine;
exports.computeQuotation = computeQuotation;
exports.buildQuotationNumber = buildQuotationNumber;
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
function computeLine(line) {
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
function computeQuotation(lines) {
    const computed = lines.map(computeLine);
    const subtotal = toMoney(computed.reduce((s, l) => s + l.lineSubtotal, 0));
    const discountTotal = toMoney(computed.reduce((s, l) => s + l.discountAmount, 0));
    const taxTotal = toMoney(computed.reduce((s, l) => s + l.taxAmount, 0));
    return {
        subtotal,
        discountTotal,
        taxTotal,
        grandTotal: toMoney(computed.reduce((s, l) => s + l.totalPrice, 0)),
        lines: computed,
    };
}
function buildQuotationNumber(now = new Date()) {
    const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
    const tail = Math.floor(Math.random() * 46656)
        .toString(36)
        .toUpperCase()
        .padStart(3, '0');
    return `QT-${stamp}-${tail}`;
}
//# sourceMappingURL=quotation.math.js.map