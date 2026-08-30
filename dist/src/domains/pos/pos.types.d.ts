export type LabelSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export declare enum PosPaymentMethodType {
    CASH = "CASH",
    UPI = "UPI",
    CARD = "CARD",
    CREDIT = "CREDIT",
    SPLIT = "SPLIT"
}
export declare class PosCartItemDto {
    productId: string;
    variantId?: string;
    productName: string;
    sku?: string;
    variantTitle?: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxAmount?: number;
}
export declare class PosCustomerInfoDto {
    fullName?: string;
    phone?: string;
    email?: string;
}
export declare class ScanBarcodeDto {
    barcode: string;
    shopId?: string;
}
export declare class CreateCheckoutSessionDto {
    items: PosCartItemDto[];
    customer?: PosCustomerInfoDto;
    shopId?: string;
    deviceId?: string;
    notes?: string;
    discountTotal?: number;
    taxTotal?: number;
    hold?: boolean;
}
export declare class AdoptHandoffTokenDto {
    handoffToken: string;
}
export declare const DEFAULT_TERMINAL_ID = "COUNTER_1";
export declare enum PosRefundMethodType {
    CASH = "CASH",
    UPI = "UPI",
    CARD = "CARD",
    ORIGINAL = "ORIGINAL"
}
export declare class PosReturnItemDto {
    orderItemId: string;
    quantity: number;
}
export declare class CreatePosReturnDto {
    orderNumber: string;
    items: PosReturnItemDto[];
    refundMethod: PosRefundMethodType;
    reason: string;
    terminalId?: string;
    notes?: string;
}
export declare class PosSplitTenderDto {
    method: PosPaymentMethodType;
    amount: number;
}
export declare class CompletePosSaleDto {
    sessionId?: string;
    items?: PosCartItemDto[];
    paymentMethod: PosPaymentMethodType;
    amountPaid: number;
    splitPayments?: PosSplitTenderDto[];
    customer?: PosCustomerInfoDto;
    terminalId?: string;
    shopId?: string;
    notes?: string;
    discountTotal?: number;
    taxTotal?: number;
    clientOrderNumber?: string;
    isOfflineSync?: boolean;
}
export declare class BarcodeScanResultResponse {
    productId: string;
    productName: string;
    variantId?: string;
    sku?: string;
    barcode?: string;
    variantTitle?: string;
    price: number;
    costPrice?: number;
    availableStock: number;
    primaryImage?: string;
    taxPercent?: number;
    mrp?: number;
    hsnCode?: string;
}
export declare class CheckoutSessionResponse {
    id: string;
    sessionId: string;
    handoffToken: string;
    status: string;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    items: PosCartItemDto[];
    customer?: PosCustomerInfoDto;
    expiresAt: Date;
    createdAt: Date;
}
export declare class GenerateBarcodeImageDto {
    code: string;
    bcid?: string;
    scale?: number;
    height?: number;
}
export declare class GenerateBatchStickersDto {
    productName: string;
    variantTitle?: string;
    sku: string;
    barcode: string;
    price: number;
    quantity: number;
    storeName?: string;
    labelSize?: LabelSize;
}
export declare class OpenPosShiftDto {
    terminalId: string;
    openingCash: number;
    notes?: string;
}
export declare class ClosePosShiftDto {
    closingCashCounted: number;
    notes?: string;
}
export declare class PosCashMovementDto {
    direction: 'IN' | 'OUT';
    amount: number;
    reason: string;
}
export declare class PreviewReceiptDto {
    orderNumber: string;
    grandTotal: number;
    items: PosCartItemDto[];
    customer?: PosCustomerInfoDto;
    paymentMethod?: string;
    discountTotal?: number;
    taxTotal?: number;
    cashierName?: string;
    transactionId?: string;
}
