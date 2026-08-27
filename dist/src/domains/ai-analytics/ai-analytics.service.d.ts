import { PrismaService } from "../../database/prisma.service";
import { AnalyticsQueryDto } from './ai-analytics.types';
export declare class AiAnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAnalytics(query: AnalyticsQueryDto): Promise<{
        totalConversations: number;
        totalSearches: number;
        totalRecommendations: number;
        popularSearches: {
            query: any;
            count: any;
        }[];
        popularProducts: {
            productId: any;
            count: any;
        }[];
        usageByFeature: {
            feature: any;
            count: any;
            totalTokens: any;
            totalCost: number;
        }[];
    }>;
    getUsageByFeature(startDate?: string, endDate?: string): Promise<{
        feature: any;
        count: any;
        totalTokens: any;
        totalCost: number;
    }[]>;
    getPopularSearches(limit?: number): Promise<{
        query: any;
        count: any;
    }[]>;
    getPopularProducts(limit?: number): Promise<{
        productId: any;
        count: any;
    }[]>;
}
