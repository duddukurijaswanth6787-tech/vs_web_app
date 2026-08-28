import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";
import { AiSearchRepository } from './ai-search.repository';
import { AiSearchDto, SearchSuggestionResponse, SearchHistoryResponse, TrendingSearchResponse, SearchStatsResponse } from './ai-search.types';
export declare class AiSearchService {
    private readonly repository;
    private readonly auditService;
    private readonly prisma;
    constructor(repository: AiSearchRepository, auditService: AuditService, prisma: PrismaService);
    private tokenize;
    private scoreProduct;
    search(userId: string, dto: AiSearchDto): Promise<{
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
    }>;
    getSuggestions(query?: string): Promise<SearchSuggestionResponse>;
    getHistory(userId: string, page: number, limit: number): Promise<{
        data: SearchHistoryResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getTrendingSearches(limit?: number): Promise<TrendingSearchResponse[]>;
    getStats(): Promise<SearchStatsResponse>;
}
