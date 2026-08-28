export declare enum ReturnStatus {
    REQUESTED = "REQUESTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED",
    PICKED_UP = "PICKED_UP",
    WAREHOUSE_RECEIVED = "WAREHOUSE_RECEIVED",
    INSPECTION = "INSPECTION",
    REFUND_INITIATED = "REFUND_INITIATED",
    REFUND_COMPLETED = "REFUND_COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum RefundPreference {
    ORIGINAL_PAYMENT = "ORIGINAL_PAYMENT",
    WALLET = "WALLET",
    BANK_TRANSFER = "BANK_TRANSFER",
    STORE_CREDIT = "STORE_CREDIT"
}
export declare class ReturnItemDto {
    orderItemId: string;
    quantity: number;
    reason?: string;
}
export declare class CreateReturnDto {
    orderId: string;
    reason: string;
    refundPreference?: RefundPreference;
    items?: ReturnItemDto[];
}
export declare class UpdateReturnStatusDto {
    status: ReturnStatus;
    adminNotes?: string;
}
export declare class ReturnItemImageResponse {
    id: string;
    url: string;
    displayOrder: number;
}
export declare class ReturnItemResponse {
    id: string;
    orderItemId: string;
    quantity: number;
    reason?: string;
    images?: ReturnItemImageResponse[];
}
export declare class ReturnRequestResponse {
    id: string;
    orderId: string;
    returnNumber: string;
    reason: string;
    status: string;
    refundPreference?: string;
    adminNotes?: string;
    items?: ReturnItemResponse[];
    createdAt: Date;
}
export declare class ReturnQueryDto {
    status?: string;
    orderId?: string;
    page?: number;
    limit?: number;
}
