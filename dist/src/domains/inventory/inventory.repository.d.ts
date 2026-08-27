import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class InventoryRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        variantId?: string;
        stockStatus?: string;
        lowStock?: boolean;
        outOfStock?: boolean;
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }): Promise<{
        data: ({
            _count: {
                variant: number;
                movements: number;
            };
            variant: {
                length: Prisma.Decimal | null;
                id: string;
                displayOrder: number;
                status: string;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                isDefault: boolean;
                sku: string;
                barcode: string;
                costPrice: Prisma.Decimal | null;
                weight: Prisma.Decimal | null;
                width: Prisma.Decimal | null;
                height: Prisma.Decimal | null;
                productId: string;
                title: string;
                colorGroupId: string | null;
                priceOverride: Prisma.Decimal | null;
                salePriceOverride: Prisma.Decimal | null;
                isActive: boolean;
            };
            movements: {
                id: string;
                createdAt: Date;
                variantId: string;
                quantity: number;
                reason: string | null;
                movementType: string;
                previousQuantity: number;
                newQuantity: number;
                referenceType: string | null;
                referenceId: string | null;
                remarks: string | null;
                performedBy: string | null;
                inventoryId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            trackInventory: boolean;
            allowBackorder: boolean;
            variantId: string;
            availableQuantity: number;
            reservedQuantity: number;
            damagedQuantity: number;
            returnedQuantity: number;
            minimumStock: number;
            maximumStock: number;
            reorderLevel: number;
            stockStatus: string;
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
    findById(id: string): Promise<({
        variant: {
            id: string;
            sku: string;
            productId: string;
            title: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        trackInventory: boolean;
        allowBackorder: boolean;
        variantId: string;
        availableQuantity: number;
        reservedQuantity: number;
        damagedQuantity: number;
        returnedQuantity: number;
        minimumStock: number;
        maximumStock: number;
        reorderLevel: number;
        stockStatus: string;
    }) | null>;
    findByVariantId(variantId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        trackInventory: boolean;
        allowBackorder: boolean;
        variantId: string;
        availableQuantity: number;
        reservedQuantity: number;
        damagedQuantity: number;
        returnedQuantity: number;
        minimumStock: number;
        maximumStock: number;
        reorderLevel: number;
        stockStatus: string;
    } | null>;
    create(data: Prisma.InventoryCreateInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        trackInventory: boolean;
        allowBackorder: boolean;
        variantId: string;
        availableQuantity: number;
        reservedQuantity: number;
        damagedQuantity: number;
        returnedQuantity: number;
        minimumStock: number;
        maximumStock: number;
        reorderLevel: number;
        stockStatus: string;
    }>;
    update(id: string, data: Prisma.InventoryUpdateInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        trackInventory: boolean;
        allowBackorder: boolean;
        variantId: string;
        availableQuantity: number;
        reservedQuantity: number;
        damagedQuantity: number;
        returnedQuantity: number;
        minimumStock: number;
        maximumStock: number;
        reorderLevel: number;
        stockStatus: string;
    }>;
    updateStock(id: string, data: {
        availableQuantity?: number;
        reservedQuantity?: number;
        damagedQuantity?: number;
        returnedQuantity?: number;
        stockStatus?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        trackInventory: boolean;
        allowBackorder: boolean;
        variantId: string;
        availableQuantity: number;
        reservedQuantity: number;
        damagedQuantity: number;
        returnedQuantity: number;
        minimumStock: number;
        maximumStock: number;
        reorderLevel: number;
        stockStatus: string;
    }>;
    createMovement(data: Prisma.InventoryMovementCreateInput): Promise<{
        id: string;
        createdAt: Date;
        variantId: string;
        quantity: number;
        reason: string | null;
        movementType: string;
        previousQuantity: number;
        newQuantity: number;
        referenceType: string | null;
        referenceId: string | null;
        remarks: string | null;
        performedBy: string | null;
        inventoryId: string;
    }>;
    findMovementByReference(inventoryId: string, referenceType: string, referenceId: string): Promise<{
        id: string;
        createdAt: Date;
        variantId: string;
        quantity: number;
        reason: string | null;
        movementType: string;
        previousQuantity: number;
        newQuantity: number;
        referenceType: string | null;
        referenceId: string | null;
        remarks: string | null;
        performedBy: string | null;
        inventoryId: string;
    } | null>;
    findMovements(params: {
        inventoryId?: string;
        variantId?: string;
        movementType?: string;
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }): Promise<{
        data: {
            id: string;
            createdAt: Date;
            variantId: string;
            quantity: number;
            reason: string | null;
            movementType: string;
            previousQuantity: number;
            newQuantity: number;
            referenceType: string | null;
            referenceId: string | null;
            remarks: string | null;
            performedBy: string | null;
            inventoryId: string;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getStockSummary(): Promise<{
        totalItems: number;
        inStock: number;
        lowStock: number;
        outOfStock: number;
        totalAvailable: number;
        totalReserved: number;
    }>;
}
