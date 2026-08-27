export declare enum CouponType {
    FLAT = "FLAT",
    PERCENTAGE = "PERCENTAGE",
    FREE_SHIPPING = "FREE_SHIPPING"
}
export declare class CreateCouponDto {
    code: string;
    name: string;
    description?: string;
    type: CouponType;
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    perCustomerLimit?: number;
    applicableTo?: string;
    applicableIds?: string[];
    startDate: string;
    endDate: string;
}
export declare class UpdateCouponDto {
    code?: string;
    name?: string;
    description?: string;
    type?: CouponType;
    value?: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    perCustomerLimit?: number;
    applicableTo?: string;
    applicableIds?: string[];
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
}
export declare class CouponItemDto {
    productId: string;
    categoryId?: string;
    brandId?: string;
    price: number;
    quantity: number;
}
export declare class ApplyCouponDto {
    code: string;
    orderId: string;
    orderAmount: number;
    items?: CouponItemDto[];
}
export declare class ValidateCouponDto {
    code: string;
    orderAmount: number;
    items?: CouponItemDto[];
}
export declare class CouponQueryDto {
    search?: string;
    isActive?: boolean;
    type?: CouponType;
    page?: number;
    limit?: number;
}
export declare class CouponResponse {
    id: string;
    code: string;
    name: string;
    description?: string;
    type: string;
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    perCustomerLimit: number;
    usedCount: number;
    applicableTo?: string;
    applicableIds?: string[];
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    createdAt: Date;
}
export declare class CouponApplyResponse {
    couponId: string;
    code: string;
    discountAmount: number;
    freeShipping: boolean;
    message: string;
}
export declare class CouponListResponse {
    data: CouponResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
