import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class TaxRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        type?: string;
        isActive?: boolean;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            isActive: boolean;
            applicableTo: string | null;
            applicableIds: string[];
            priority: number;
            rate: Prisma.Decimal;
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
    findById(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        isActive: boolean;
        applicableTo: string | null;
        applicableIds: string[];
        priority: number;
        rate: Prisma.Decimal;
    } | null>;
    findActiveRules(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        isActive: boolean;
        applicableTo: string | null;
        applicableIds: string[];
        priority: number;
        rate: Prisma.Decimal;
    }[]>;
    create(data: Prisma.TaxRuleCreateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        isActive: boolean;
        applicableTo: string | null;
        applicableIds: string[];
        priority: number;
        rate: Prisma.Decimal;
    }>;
    update(id: string, data: Prisma.TaxRuleUpdateInput): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        isActive: boolean;
        applicableTo: string | null;
        applicableIds: string[];
        priority: number;
        rate: Prisma.Decimal;
    }>;
}
