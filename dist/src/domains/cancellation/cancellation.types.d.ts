export declare class CreateCancellationDto {
    orderId: string;
    reason: string;
}
export declare class UpdateCancellationDto {
    status?: string;
    refundStatus?: string;
    adminNotes?: string;
}
export declare class CancellationResponse {
    id: string;
    orderId: string;
    reason: string;
    status: string;
    refundStatus: string;
    adminNotes?: string;
    createdAt: Date;
}
