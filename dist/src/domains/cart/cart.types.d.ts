export declare class AddToCartDto {
    productId: string;
    variantId?: string;
    quantity?: number;
    guestId?: string;
}
export declare class UpdateQuantityDto {
    quantity: number;
}
export declare class CartItemResponse {
    id: string;
    cartId: string;
    productId: string;
    productName?: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    savedForLater: boolean;
    createdAt: Date;
    imageUrl?: string;
}
export declare class CartResponse {
    id: string;
    customerId?: string;
    guestId?: string;
    status: string;
    items?: CartItemResponse[];
    itemCount: number;
    subtotal: number;
    totalSavings: number;
    createdAt: Date;
}
export declare class CartSummaryResponse {
    itemCount: number;
    subtotal: number;
    totalSavings: number;
    mrpTotal: number;
    saleTotal: number;
    discountTotal: number;
}
export declare class MergeCartDto {
    guestId: string;
}
