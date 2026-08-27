import { WishlistService } from './wishlist.service';
import { AddToWishlistDto, WishlistQueryDto } from './wishlist.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class WishlistController {
    private readonly wishlistService;
    constructor(wishlistService: WishlistService);
    getWishlist(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./wishlist.types").WishlistResponse>>;
    getItems(user: JwtPayload, query: WishlistQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./wishlist.types").WishlistItemResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getCount(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<number>>;
    isInWishlist(user: JwtPayload, productId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<boolean>>;
    syncWishlist(user: JwtPayload, body: {
        productIds?: string[];
    }): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./wishlist.types").WishlistResponse>>;
    addItem(user: JwtPayload, dto: AddToWishlistDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./wishlist.types").WishlistItemResponse>>;
    removeItem(user: JwtPayload, productId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    moveToCart(user: JwtPayload, productId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    getItemsAdmin(customerId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./wishlist.types").WishlistItemResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
}
