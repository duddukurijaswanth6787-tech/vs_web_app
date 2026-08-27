export declare class AnalyticsQueryDto {
    startDate?: string;
    endDate?: string;
    feature?: string;
}
export declare class AiAnalyticsResponse {
    totalConversations: number;
    totalSearches: number;
    totalRecommendations: number;
    popularSearches: any[];
    popularProducts: any[];
    usageByFeature: any[];
}
