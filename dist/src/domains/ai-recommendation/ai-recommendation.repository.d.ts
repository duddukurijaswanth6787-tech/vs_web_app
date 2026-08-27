import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class AiRecommendationRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByCustomer(customerId: string, type?: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            productId: string;
            isActive: boolean;
            customerId: string;
            reason: string | null;
            score: Prisma.Decimal;
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
    create(data: Prisma.CustomerRecommendationCreateInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        productId: string;
        isActive: boolean;
        customerId: string;
        reason: string | null;
        score: Prisma.Decimal;
    }>;
    createHistory(data: Prisma.RecommendationHistoryCreateInput): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        userId: string;
        score: Prisma.Decimal | null;
        sourceProductId: string | null;
        recommendedProductIds: string[];
        algorithm: string | null;
        clicked: boolean;
        purchased: boolean;
    }>;
    getHistory(userId: string, page: number, limit: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            type: string;
            userId: string;
            score: Prisma.Decimal | null;
            sourceProductId: string | null;
            recommendedProductIds: string[];
            algorithm: string | null;
            clicked: boolean;
            purchased: boolean;
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
}
