import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";
import { AiRecommendationRepository } from './ai-recommendation.repository';
import { RecommendationQueryDto, RecommendationResponse, RecommendationHistoryQueryDto } from './ai-recommendation.types';
export declare class AiRecommendationService {
    private readonly repository;
    private readonly auditService;
    private readonly prisma;
    constructor(repository: AiRecommendationRepository, auditService: AuditService, prisma: PrismaService);
    private toResponse;
    private getCustomerProfile;
    getRecommendations(userId: string, query: RecommendationQueryDto): Promise<{
        data: RecommendationResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    generateRecommendations(userId: string): Promise<RecommendationResponse[]>;
    getHistory(userId: string, query: RecommendationHistoryQueryDto): Promise<{
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
    }>;
    trackClick(userId: string): Promise<void>;
}
