import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class CartRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findActiveByCustomerId(customerId: string): Promise<({
        items: ({
            product: {
                name: string;
                basePrice: Prisma.Decimal;
                salePrice: Prisma.Decimal | null;
                media: {
                    url: string;
                    isPrimary: boolean;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            variantId: string | null;
            quantity: number;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            cartId: string;
            savedForLater: boolean;
        })[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        guestId: string | null;
    }) | null>;
    findActiveByGuestId(guestId: string): Promise<({
        items: ({
            product: {
                name: string;
                basePrice: Prisma.Decimal;
                salePrice: Prisma.Decimal | null;
                media: {
                    url: string;
                    isPrimary: boolean;
                }[];
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            variantId: string | null;
            quantity: number;
            unitPrice: Prisma.Decimal;
            totalPrice: Prisma.Decimal;
            cartId: string;
            savedForLater: boolean;
        })[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        guestId: string | null;
    }) | null>;
    create(data: Prisma.ShoppingCartCreateInput): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        guestId: string | null;
    }>;
    findItem(cartId: string, productId: string, variantId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        variantId: string | null;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        cartId: string;
        savedForLater: boolean;
    } | null>;
    findItemById(itemId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        variantId: string | null;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        cartId: string;
        savedForLater: boolean;
    } | null>;
    addItem(data: Prisma.ShoppingCartItemCreateInput): Promise<{
        product: {
            name: string;
            basePrice: Prisma.Decimal;
            salePrice: Prisma.Decimal | null;
            media: {
                url: string;
                isPrimary: boolean;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        variantId: string | null;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        cartId: string;
        savedForLater: boolean;
    }>;
    updateItemQuantity(itemId: string, quantity: number, unitPrice: number, totalPrice: number): Promise<{
        product: {
            name: string;
            basePrice: Prisma.Decimal;
            salePrice: Prisma.Decimal | null;
            media: {
                url: string;
                isPrimary: boolean;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        variantId: string | null;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        cartId: string;
        savedForLater: boolean;
    }>;
    removeItem(itemId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        variantId: string | null;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        cartId: string;
        savedForLater: boolean;
    }>;
    getItems(cartId: string): Promise<({
        product: {
            name: string;
            basePrice: Prisma.Decimal;
            salePrice: Prisma.Decimal | null;
            media: {
                url: string;
                isPrimary: boolean;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        variantId: string | null;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        cartId: string;
        savedForLater: boolean;
    })[]>;
    clearCart(cartId: string): Promise<Prisma.BatchPayload>;
    clearSavedForLater(cartId: string): Promise<Prisma.BatchPayload>;
    updateCartStatus(cartId: string, status: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        guestId: string | null;
    }>;
    updateItemSavedForLater(itemId: string, savedForLater: boolean): Promise<{
        product: {
            name: string;
            basePrice: Prisma.Decimal;
            salePrice: Prisma.Decimal | null;
            media: {
                url: string;
                isPrimary: boolean;
            }[];
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        variantId: string | null;
        quantity: number;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
        cartId: string;
        savedForLater: boolean;
    }>;
}
