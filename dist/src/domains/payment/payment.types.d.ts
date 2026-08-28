export declare class CreatePaymentDto {
    orderId: string;
    method: string;
    provider: string;
    amount: number;
    currency?: string;
}
export declare class RazorpayConfigResponse {
    keyId: string;
    keySecretConfigured: boolean;
    webhookSecretConfigured: boolean;
}
export declare class UpdateRazorpayConfigDto {
    keyId?: string;
    keySecret?: string;
    webhookSecret?: string;
}
export declare class PaymentQueryDto {
    orderId?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class PaymentTransactionResponse {
    id: string;
    type: string;
    status: string;
    amount: number;
    providerRefId?: string;
    createdAt: Date;
}
export declare class PaymentResponse {
    id: string;
    orderId: string;
    paymentNumber: string;
    method: string;
    provider: string;
    status: string;
    amount: number;
    currency: string;
    providerOrderId?: string;
    transactionId?: string;
    transactions?: PaymentTransactionResponse[];
    createdAt: Date;
}
export declare class PaymentListResponse {
    data: PaymentResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class VerifyPaymentDto {
    razorpayPaymentId: string;
    razorpaySignature: string;
}
