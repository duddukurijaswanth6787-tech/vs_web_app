import { AiAnalyticsService } from './ai-analytics.service';
import { AnalyticsQueryDto } from './ai-analytics.types';
export declare class AiAnalyticsController {
    private readonly aiAnalyticsService;
    constructor(aiAnalyticsService: AiAnalyticsService);
    getAnalytics(query: AnalyticsQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getPopularSearches(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        query: any;
        count: any;
    }[]>>;
    getPopularProducts(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        productId: any;
        count: any;
    }[]>>;
}
