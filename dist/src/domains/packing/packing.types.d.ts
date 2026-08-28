export declare class CreatePackingJobDto {
    orderId: string;
    assignedTo?: string;
    notes?: string;
}
export declare class VerifyBarcodeDto {
    barcode: string;
}
export declare class PackingQueueQueryDto {
    status?: string;
    page?: number;
    limit?: number;
}
export declare class AssignPackingDto {
    assignedTo: string;
}
