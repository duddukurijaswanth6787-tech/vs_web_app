import { AiRecommendationService } from './ai-recommendation.service';
import { RecommendationQueryDto, RecommendationHistoryQueryDto } from './ai-recommendation.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class AiRecommendationController {
    private readonly aiRecommendationService;
    constructor(aiRecommendationService: AiRecommendationService);
    getRecommendations(query: RecommendationQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./ai-recommendation.types").RecommendationResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getHistory(query: RecommendationHistoryQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: {
            id: string;
            createdAt: Date;
            type: string;
            userId: string;
            score: import("@prisma/client-runtime-utils").Decimal | null;
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
    }>>;
    generateRecommendations(user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-recommendation.types").RecommendationResponse[]>>;
    adminGenerate(body: {
        customerUserId: string;
    }): Promise<import("@common/responses/response.builder").ResponsePayload<import("./ai-recommendation.types").RecommendationResponse[]>>;
    adminList(customerUserId: string, query: RecommendationQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./ai-recommendation.types").RecommendationResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    trackClick(user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
}
