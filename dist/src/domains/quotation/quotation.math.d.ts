export interface QuotationLineInput {
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
}
export interface QuotationLineTotals {
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxPercent: number;
    lineSubtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalPrice: number;
}
export interface QuotationTotals {
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    lines: QuotationLineTotals[];
}
export declare function toMoney(value: number): number;
export declare function computeLine(line: QuotationLineInput): QuotationLineTotals;
export declare function computeQuotation(lines: QuotationLineInput[]): QuotationTotals;
export declare function buildQuotationNumber(now?: Date): string;
