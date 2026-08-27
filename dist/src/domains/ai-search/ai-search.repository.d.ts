import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class AiSearchRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createHistory(data: Prisma.SearchHistoryCreateInput): Promise<{
        query: string;
        id: string;
        createdAt: Date;
        userId: string | null;
        filters: Prisma.JsonValue | null;
        resultCount: number;
        clickedProductIds: string[];
    }>;
    getHistory(userId: string, page: number, limit: number): Promise<{
        data: {
            query: string;
            id: string;
            createdAt: Date;
            userId: string | null;
            filters: Prisma.JsonValue | null;
            resultCount: number;
            clickedProductIds: string[];
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
    getTrendingSearches(limit: number): Promise<{
        query: any;
        count: any;
    }[]>;
    updateHistoryClicks(id: string, clickedProductIds: string[]): Promise<{
        query: string;
        id: string;
        createdAt: Date;
        userId: string | null;
        filters: Prisma.JsonValue | null;
        resultCount: number;
        clickedProductIds: string[];
    }>;
}
