"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiAdminService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const ai_admin_repository_1 = require("./ai-admin.repository");
let AiAdminService = class AiAdminService {
    aiAdminRepository;
    auditService;
    constructor(aiAdminRepository, auditService) {
        this.aiAdminRepository = aiAdminRepository;
        this.auditService = auditService;
    }
    toResponse(t) {
        return {
            id: t.id,
            name: t.name,
            template: t.template,
            variables: t.variables,
            description: t.description ?? undefined,
            isActive: t.isActive,
            version: t.version,
            createdAt: t.createdAt,
        };
    }
    toUsageLogResponse(l) {
        return {
            id: l.id,
            userId: l.userId ?? undefined,
            feature: l.feature,
            tokensUsed: l.tokensUsed,
            cost: l.cost,
            createdAt: l.createdAt,
        };
    }
    async findTemplates(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.aiAdminRepository.findTemplates({
            search: query.search,
            isActive: query.isActive,
            page,
            limit,
        });
        return {
            data: result.data.map((t) => this.toResponse(t)),
            meta: result.meta,
        };
    }
    async findTemplateById(id) {
        const template = await this.aiAdminRepository.findTemplateById(id);
        if (!template)
            throw new exceptions_1.BusinessException('Template not found', 'AI_TEMPLATE_001');
        return this.toResponse(template);
    }
    async createTemplate(dto, userId) {
        const existing = await this.aiAdminRepository.findTemplateByName(dto.name);
        if (existing)
            throw new exceptions_1.BusinessException('Template name already exists', 'AI_TEMPLATE_002');
        const template = await this.aiAdminRepository.createTemplate({
            name: dto.name,
            template: dto.template,
            variables: dto.variables,
            description: dto.description,
            createdBy: userId,
        });
        return this.toResponse(template);
    }
    async updateTemplate(id, dto, userId) {
        const template = await this.aiAdminRepository.findTemplateById(id);
        if (!template)
            throw new exceptions_1.BusinessException('Template not found', 'AI_TEMPLATE_001');
        const updated = await this.aiAdminRepository.updateTemplate(id, {
            ...dto,
            version: { increment: 1 },
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'PROMPT_UPDATED',
            module: 'ai-admin',
            resource: 'prompt_template',
            resourceId: id,
            userId,
            oldValue: { template: template.template, version: template.version },
            newValue: { template: updated.template, version: updated.version },
        });
        return this.toResponse(updated);
    }
    async getUsageLogs(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.aiAdminRepository.getUsageLogs({ page, limit });
        return {
            data: result.data.map((l) => this.toUsageLogResponse(l)),
            meta: result.meta,
        };
    }
    async logUsage(userId, feature, tokensUsed, cost, metadata) {
        return this.aiAdminRepository.createUsageLog({
            userId,
            feature,
            tokensUsed,
            cost,
            metadata,
        });
    }
};
exports.AiAdminService = AiAdminService;
exports.AiAdminService = AiAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_admin_repository_1.AiAdminRepository,
        audit_service_1.AuditService])
], AiAdminService);
//# sourceMappingURL=ai-admin.service.js.map