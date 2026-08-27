export declare enum RefundStatus {
    REQUESTED = "REQUESTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    COMPLETED = "COMPLETED"
}
export declare class CreateRefundDto {
    paymentId: string;
    orderId: string;
    amount: number;
    reason: string;
    method?: string;
}
export declare class UpdateRefundDto {
    status?: RefundStatus;
    adminNotes?: string;
    transactionId?: string;
}
export declare class RefundQueryDto {
    orderId?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class RefundResponse {
    id: string;
    paymentId: string;
    orderId: string;
    refundNumber: string;
    amount: number;
    reason: string;
    status: string;
    method?: string;
    transactionId?: string;
    adminNotes?: string;
    createdAt: Date;
}
export declare class RefundListResponse {
    data: RefundResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
