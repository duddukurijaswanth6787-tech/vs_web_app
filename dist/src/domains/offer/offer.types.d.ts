export declare enum OfferType {
    PRODUCT = "PRODUCT",
    CATEGORY = "CATEGORY",
    BRAND = "BRAND",
    FESTIVAL = "FESTIVAL",
    FLASH_SALE = "FLASH_SALE"
}
export declare class CreateOfferDto {
    name: string;
    description?: string;
    type: OfferType;
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    applicableTo?: string;
    applicableIds?: string[];
    priority?: number;
    startDate: string;
    endDate: string;
}
export declare class UpdateOfferDto {
    name?: string;
    description?: string;
    type?: OfferType;
    value?: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    applicableTo?: string;
    applicableIds?: string[];
    priority?: number;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}
export declare class OfferQueryDto {
    search?: string;
    isActive?: boolean;
    type?: OfferType;
    page?: number;
    limit?: number;
}
export declare class OfferResponse {
    id: string;
    name: string;
    description?: string;
    type: string;
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    applicableTo?: string;
    applicableIds?: string[];
    priority: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
}
export declare class OfferListResponse {
    data: OfferResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
