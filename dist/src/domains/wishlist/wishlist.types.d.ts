export declare class AddToWishlistDto {
    productId: string;
    variantId?: string;
    notes?: string;
}
export declare class WishlistQueryDto {
    search?: string;
    page?: number;
    limit?: number;
}
export declare class WishlistItemResponse {
    id: string;
    wishlistId: string;
    productId: string;
    productName?: string;
    variantId?: string;
    notes?: string;
    createdAt: Date;
    product?: {
        id: string;
        name: string;
        slug: string;
        basePrice: number;
        salePrice?: number | null;
        images: {
            url: string;
        }[];
    };
}
export declare class WishlistResponse {
    id: string;
    customerId: string;
    name: string;
    items?: WishlistItemResponse[];
    itemCount: number;
    createdAt: Date;
}
