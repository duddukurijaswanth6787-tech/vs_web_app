import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { WishlistRepository } from './wishlist.repository';
import { AddToWishlistDto, WishlistQueryDto, WishlistItemResponse, WishlistResponse } from './wishlist.types';
export declare class WishlistService {
    private readonly wishlistRepository;
    private readonly prisma;
    private readonly auditService;
    constructor(wishlistRepository: WishlistRepository, prisma: PrismaService, auditService: AuditService);
    private getCustomerProfile;
    private getOrCreateWishlist;
    private toWishlistResponse;
    private toItemResponse;
    getWishlist(userId: string): Promise<WishlistResponse>;
    getItems(userId: string, query: WishlistQueryDto): Promise<{
        data: WishlistItemResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    addItem(userId: string, dto: AddToWishlistDto): Promise<WishlistItemResponse>;
    syncWishlist(userId: string, productIds: string[]): Promise<WishlistResponse>;
    removeItem(userId: string, productId: string): Promise<void>;
    moveToCart(userId: string, productId: string): Promise<void>;
    isInWishlist(userId: string, productId: string): Promise<boolean>;
    getCount(userId: string): Promise<number>;
    getItemsByCustomerIdAdmin(customerId: string): Promise<{
        data: WishlistItemResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
}
