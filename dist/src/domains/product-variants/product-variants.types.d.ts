export declare class CreateVariantDto {
    productId: string;
    sku?: string;
    title?: string;
    priceOverride?: number;
    salePriceOverride?: number;
    costPrice?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    displayOrder?: number;
    colorGroupId?: string;
    isDefault?: boolean;
    attributeValues?: VariantAttributeEntry[];
}
export declare class VariantAttributeEntry {
    attributeId: string;
    attributeOptionId?: string;
    value?: string;
}
export declare class UpdateVariantDto {
    colorGroupId?: string;
    title?: string;
    priceOverride?: number;
    salePriceOverride?: number;
    costPrice?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    displayOrder?: number;
    isDefault?: boolean;
    isActive?: boolean;
}
export declare class VariantQueryDto {
    productId?: string;
    status?: string;
    isActive?: boolean;
    isDefault?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class AssignAttributeValuesDto {
    attributeValues: VariantAttributeEntry[];
}
declare class VariantAttributeInfo {
    attributeId: string;
    attributeName: string;
    attributeType: string;
    attributeOptionId?: string;
    optionLabel?: string;
    value?: string;
}
export declare class VariantResponse {
    id: string;
    productId: string;
    sku: string;
    barcode: string;
    title: string;
    priceOverride?: number;
    salePriceOverride?: number;
    costPrice?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    displayOrder: number;
    status: string;
    isDefault: boolean;
    isActive: boolean;
    attributeValues?: VariantAttributeInfo[];
    createdAt: Date;
    updatedAt: Date;
}
export declare class VariantListResponse {
    data: VariantResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export {};
