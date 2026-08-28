export declare class RequestPhoneChangeDto {
    phone: string;
}
export declare class ConfirmPhoneChangeDto {
    phone: string;
    code: string;
}
export declare class UpdateMeDto {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    preferredLanguage?: string;
    preferredCurrency?: string;
    preferredCategories?: string[];
    preferredBrands?: string[];
    preferredSizes?: string[];
    preferredColors?: string[];
    preferredPriceMin?: number;
    preferredPriceMax?: number;
    profileImage?: string;
}
export declare class CreateAddressDto {
    label?: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country?: string;
    postalCode: string;
    landmark?: string;
    latitude?: string;
    longitude?: string;
    isDefaultBilling?: boolean;
    isDefaultShipping?: boolean;
}
export declare class UpdateAddressDto {
    label?: string;
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    landmark?: string;
    latitude?: string;
    longitude?: string;
    isDefaultBilling?: boolean;
    isDefaultShipping?: boolean;
}
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
export declare enum CartAction {
    ADD = "ADD",
    UPDATE = "UPDATE",
    REMOVE = "REMOVE",
    SAVE_FOR_LATER = "SAVE_FOR_LATER",
    MOVE_TO_CART = "MOVE_TO_CART"
}
export declare class CartActionDto {
    action: CartAction;
    productId?: string;
    variantId?: string;
    itemId?: string;
    quantity?: number;
}
export declare class MergeCartDto {
    guestId: string;
}
export declare class MeResponse {
    id: string;
    userId: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: Date;
    preferredLanguage?: string;
    preferredCurrency?: string;
    profileImage?: string;
    wishlistCount: number;
    cartItemCount: number;
    cartSubtotal: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class AddressResponse {
    id: string;
    customerId: string;
    label: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    landmark?: string;
    latitude?: string;
    longitude?: string;
    isDefaultBilling: boolean;
    isDefaultShipping: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class WishlistItemResponse {
    id: string;
    productId: string;
    productName?: string;
    variantId?: string;
    notes?: string;
    createdAt: Date;
}
export declare class WishlistResponse {
    id: string;
    itemCount: number;
    items: WishlistItemResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class CartItemResponse {
    id: string;
    productId: string;
    productName?: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    savedForLater: boolean;
    createdAt: Date;
}
export { CartResponse } from "../cart/cart.types";
