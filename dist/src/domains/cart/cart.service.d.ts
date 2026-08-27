import { AuditService } from "../audit/audit.service";
import { CartRepository } from './cart.repository';
import { PrismaService } from "../../database/prisma.service";
import { AddToCartDto, UpdateQuantityDto, CartResponse, CartSummaryResponse } from './cart.types';
export declare class CartService {
    private readonly cartRepository;
    private readonly auditService;
    private readonly prisma;
    constructor(cartRepository: CartRepository, auditService: AuditService, prisma: PrismaService);
    private toCartItemResponse;
    private toCartResponse;
    private getOrCreateCart;
    private validateProduct;
    getCart(userId?: string, guestId?: string): Promise<CartResponse>;
    getCartByUser(userId: string): Promise<CartResponse>;
    getCartByGuest(guestId: string): Promise<CartResponse>;
    addItem(userId: string | undefined, guestId: string | undefined, dto: AddToCartDto): Promise<CartResponse>;
    updateQuantity(userId: string | undefined, guestId: string | undefined, itemId: string, dto: UpdateQuantityDto): Promise<CartResponse>;
    removeItem(userId: string | undefined, guestId: string | undefined, itemId: string): Promise<CartResponse>;
    clearCart(userId: string | undefined, guestId: string | undefined): Promise<CartResponse>;
    saveForLater(userId: string | undefined, guestId: string | undefined, itemId: string): Promise<CartResponse>;
    moveToCart(userId: string | undefined, guestId: string | undefined, itemId: string): Promise<CartResponse>;
    mergeGuestCart(userId: string, guestId: string): Promise<CartResponse>;
    getCartSummary(userId?: string, guestId?: string): Promise<CartSummaryResponse>;
    getCartByCustomerIdAdmin(customerId: string): Promise<CartResponse>;
}
