import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class ShippingRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findMethods(): Promise<{
        id: string;
        name: string;
        description: string | null;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        estimatedDays: string;
    }[]>;
    findMethodById(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        estimatedDays: string;
    } | null>;
    findMethodByCode(code: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        estimatedDays: string;
    } | null>;
    createMethod(data: Prisma.ShippingMethodCreateInput): Promise<{
        id: string;
        name: string;
        description: string | null;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        estimatedDays: string;
    }>;
    findZones(methodId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        countries: string[];
        states: string[];
        pincodes: string[];
        rateType: string;
        rate: Prisma.Decimal;
        freeAbove: Prisma.Decimal | null;
        maxWeight: Prisma.Decimal | null;
        methodId: string;
    }[]>;
    createZone(data: Prisma.ShippingZoneCreateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        countries: string[];
        states: string[];
        pincodes: string[];
        rateType: string;
        rate: Prisma.Decimal;
        freeAbove: Prisma.Decimal | null;
        maxWeight: Prisma.Decimal | null;
        methodId: string;
    }>;
    findMatchingZone(methodId: string, country: string, state: string, pincode?: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        countries: string[];
        states: string[];
        pincodes: string[];
        rateType: string;
        rate: Prisma.Decimal;
        freeAbove: Prisma.Decimal | null;
        maxWeight: Prisma.Decimal | null;
        methodId: string;
    } | undefined>;
}
