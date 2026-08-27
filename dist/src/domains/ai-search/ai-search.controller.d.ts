import { AiSearchService } from './ai-search.service';
import { AiSearchDto, SearchHistoryQueryDto } from './ai-search.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class AiSearchController {
    private readonly aiSearchService;
    constructor(aiSearchService: AiSearchService);
    search(dto: AiSearchDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        historyId: string;
        query: string;
        resultCount: number;
        results: {
            id: string;
            name: string;
            slug: string;
            brand: string;
            price: number;
            originalPrice: number;
            image: string;
            score: number;
            isBestSeller: boolean;
            isNewArrival: boolean;
            occasion: string | null;
        }[];
    }>>;
    getSuggestions(q?: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-search.types").SearchSuggestionResponse>>;
    getHistory(query: SearchHistoryQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./ai-search.types").SearchHistoryResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getTrendingSearches(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-search.types").TrendingSearchResponse[]>>;
    getStats(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-search.types").SearchStatsResponse>>;
}
