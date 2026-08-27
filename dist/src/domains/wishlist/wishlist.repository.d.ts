import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class WishlistRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByCustomerId(customerId: string): Promise<({
        _count: {
            items: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
    }) | null>;
    createDefault(customerId: string): Promise<{
        _count: {
            items: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
    }>;
    findItems(wishlistId: string, params: {
        search?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            product: {
                id: string;
                slug: string;
                name: string;
                basePrice: Prisma.Decimal;
                salePrice: Prisma.Decimal | null;
                media: {
                    url: string;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            productId: string;
            variantId: string | null;
            notes: string | null;
            wishlistId: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findItem(wishlistId: string, productId: string): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        variantId: string | null;
        notes: string | null;
        wishlistId: string;
    } | null>;
    addItem(data: {
        wishlistId: string;
        productId: string;
        variantId?: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        variantId: string | null;
        notes: string | null;
        wishlistId: string;
    }>;
    removeItem(wishlistId: string, productId: string): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        variantId: string | null;
        notes: string | null;
        wishlistId: string;
    }>;
    getItemCount(wishlistId: string): Promise<number>;
}
