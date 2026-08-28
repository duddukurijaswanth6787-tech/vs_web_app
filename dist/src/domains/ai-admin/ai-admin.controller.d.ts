import { AiAdminService } from './ai-admin.service';
import { CreatePromptTemplateDto, UpdatePromptTemplateDto, PromptTemplateQueryDto } from './ai-admin.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class AiAdminController {
    private readonly aiAdminService;
    constructor(aiAdminService: AiAdminService);
    findTemplates(query: PromptTemplateQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./ai-admin.types").PromptTemplateResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findTemplateById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./ai-admin.types").PromptTemplateResponse>>;
    createTemplate(dto: CreatePromptTemplateDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./ai-admin.types").PromptTemplateResponse>>;
    updateTemplate(id: string, dto: UpdatePromptTemplateDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./ai-admin.types").PromptTemplateResponse>>;
    getUsageLogs(query: {
        page?: number;
        limit?: number;
    }): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./ai-admin.types").AiUsageLogResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
}
