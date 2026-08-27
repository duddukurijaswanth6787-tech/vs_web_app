export declare class CreateWarehouseDto {
    code: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    isDefault?: boolean;
}
export declare class UpdateWarehouseDto {
    name?: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    isDefault?: boolean;
}
export declare class WarehouseQueryDto {
    search?: string;
    status?: string;
    isDefault?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class CreateLocationDto {
    zone?: string;
    rack?: string;
    shelf?: string;
    bin?: string;
    description?: string;
}
export declare class AssignWarehouseInventoryDto {
    variantId: string;
    availableQuantity?: number;
    minimumStock?: number;
    maximumStock?: number;
    reorderLevel?: number;
}
export declare class UpdateWarehouseInventoryDto {
    availableQuantity?: number;
    minimumStock?: number;
    maximumStock?: number;
    reorderLevel?: number;
}
export declare class TransferStockDto {
    variantId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    reason?: string;
}
export declare class WarehouseResponse {
    id: string;
    code: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    status: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WarehouseLocationResponse {
    id: string;
    warehouseId: string;
    zone?: string;
    rack?: string;
    shelf?: string;
    bin?: string;
    description?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WarehouseInventoryResponse {
    id: string;
    warehouseId: string;
    variantId: string;
    availableQuantity: number;
    reservedQuantity: number;
    damagedQuantity: number;
    minimumStock: number;
    maximumStock: number;
    reorderLevel: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WarehouseListResponse {
    data: WarehouseResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
