export declare class AiSearchDto {
    query: string;
    filters?: Record<string, any>;
    limit?: number;
}
export declare class SearchSuggestionResponse {
    products: any[];
    categories: any[];
    brands: any[];
}
export declare class SearchHistoryResponse {
    id: string;
    query: string;
    resultCount: number;
    clickedProductIds: string[];
    createdAt: Date;
}
export declare class TrendingSearchResponse {
    query: string;
    count: number;
}
export declare class SearchStatsResponse {
    totalSearches: number;
    zeroResultCount: number;
    zeroResultRate: number;
    clickThroughRate: number;
    topQuery?: TrendingSearchResponse;
}
export declare class SearchHistoryQueryDto {
    page?: number;
    limit?: number;
}
