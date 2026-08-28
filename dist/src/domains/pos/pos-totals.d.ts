export interface PosLineInput {
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxPercent?: number;
}
export interface PosLineTotals {
    quantity: number;
    unitPrice: number;
    taxPercent: number;
    lineSubtotal: number;
    discountAmount: number;
    taxableAmount: number;
    taxAmount: number;
    totalPrice: number;
}
export interface PosTotals {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    lines: PosLineTotals[];
}
export declare function toMoney(value: number): number;
export declare function computePosLine(line: PosLineInput): PosLineTotals;
export declare function computePosTotals(lines: PosLineInput[], orderDiscount?: number): PosTotals;
