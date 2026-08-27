import type { Request } from 'express';
import { JwtService } from "../auth/services/jwt.service";
import { CartService } from './cart.service';
import { AddToCartDto, UpdateQuantityDto, MergeCartDto } from './cart.types';
export declare class CartController {
    private readonly cartService;
    private readonly jwtService;
    constructor(cartService: CartService, jwtService: JwtService);
    private resolveUser;
    getCart(req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartResponse>>;
    getCartSummary(req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartSummaryResponse>>;
    addItem(req: Request, dto: AddToCartDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartResponse>>;
    updateQuantity(req: Request, itemId: string, dto: UpdateQuantityDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartResponse>>;
    removeItem(req: Request, itemId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartResponse>>;
    clearCart(req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    saveForLater(req: Request, itemId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartResponse>>;
    moveToCart(req: Request, itemId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartResponse>>;
    mergeCart(req: Request, dto: MergeCartDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartResponse>>;
    getCartAdmin(customerId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./cart.types").CartResponse>>;
}
