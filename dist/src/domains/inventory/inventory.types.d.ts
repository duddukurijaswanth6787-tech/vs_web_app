export declare class CreateInventoryDto {
    variantId: string;
    availableQuantity?: number;
    minimumStock?: number;
    maximumStock?: number;
    reorderLevel?: number;
    allowBackorder?: boolean;
    trackInventory?: boolean;
    reason?: string;
    remarks?: string;
}
export declare class UpdateInventoryDto {
    minimumStock?: number;
    maximumStock?: number;
    reorderLevel?: number;
    allowBackorder?: boolean;
    trackInventory?: boolean;
}
export declare class AdjustStockDto {
    quantity: number;
    reason?: string;
    remarks?: string;
}
export declare class StockMovementDto {
    quantity: number;
    reason?: string;
    remarks?: string;
    referenceType?: string;
    referenceId?: string;
}
export declare class InventoryQueryDto {
    variantId?: string;
    stockStatus?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class MovementQueryDto {
    inventoryId?: string;
    variantId?: string;
    movementType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class InventoryResponse {
    id: string;
    variantId: string;
    availableQuantity: number;
    reservedQuantity: number;
    damagedQuantity: number;
    returnedQuantity: number;
    availableStock: number;
    minimumStock: number;
    maximumStock: number;
    reorderLevel: number;
    stockStatus: string;
    allowBackorder: boolean;
    trackInventory: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class InventoryMovementResponse {
    id: string;
    inventoryId: string;
    variantId: string;
    movementType: string;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    referenceType?: string;
    referenceId?: string;
    reason?: string;
    remarks?: string;
    performedBy?: string;
    createdAt: Date;
}
export declare class InventoryListResponse {
    data: InventoryResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class MovementListResponse {
    data: InventoryMovementResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class StockSummaryResponse {
    totalItems: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalAvailable: number;
    totalReserved: number;
}
