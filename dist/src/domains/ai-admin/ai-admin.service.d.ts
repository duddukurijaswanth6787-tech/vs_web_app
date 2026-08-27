import { AuditService } from "../audit/audit.service";
import { AiAdminRepository } from './ai-admin.repository';
import { CreatePromptTemplateDto, UpdatePromptTemplateDto, PromptTemplateQueryDto, PromptTemplateResponse, AiUsageLogResponse } from './ai-admin.types';
export declare class AiAdminService {
    private readonly aiAdminRepository;
    private readonly auditService;
    constructor(aiAdminRepository: AiAdminRepository, auditService: AuditService);
    private toResponse;
    private toUsageLogResponse;
    findTemplates(query: PromptTemplateQueryDto): Promise<{
        data: PromptTemplateResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findTemplateById(id: string): Promise<PromptTemplateResponse>;
    createTemplate(dto: CreatePromptTemplateDto, userId: string): Promise<PromptTemplateResponse>;
    updateTemplate(id: string, dto: UpdatePromptTemplateDto, userId: string): Promise<PromptTemplateResponse>;
    getUsageLogs(query: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: AiUsageLogResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    logUsage(userId: string | undefined, feature: string, tokensUsed: number, cost: number, metadata?: any): Promise<{
        id: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        feature: string;
        tokensUsed: number;
        cost: import("@prisma/client-runtime-utils").Decimal;
    }>;
}
