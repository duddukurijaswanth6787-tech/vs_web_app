export declare enum QuotationStatusType {
    DRAFT = "DRAFT",
    SENT = "SENT",
    ACCEPTED = "ACCEPTED",
    CONVERTED = "CONVERTED",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED"
}
export declare class QuotationItemDto {
    productId: string;
    variantId?: string;
    productName: string;
    variantTitle?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxPercent?: number;
}
export declare class CreateQuotationDto {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    items: QuotationItemDto[];
    notes?: string;
    termsText?: string;
    validUntil?: string;
    status?: QuotationStatusType;
}
export declare class UpdateQuotationDto extends CreateQuotationDto {
    items: QuotationItemDto[];
    customerName: string;
}
export declare class ConvertQuotationDto {
    paymentMethod: string;
    amountPaid: number;
    terminalId?: string;
}
