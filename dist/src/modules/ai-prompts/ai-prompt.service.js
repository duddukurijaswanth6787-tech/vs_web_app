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
exports.AiPromptService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../../domains/audit/audit.service");
const ai_prompt_types_1 = require("./ai-prompt.types");
const TEMPLATES_KEY = 'ai.prompt.templates';
const HISTORY_KEY = 'ai.prompt.templates.history';
const MAX_HISTORY = 10;
let AiPromptService = class AiPromptService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async readJson(key, fallback) {
        const row = await this.prisma.appSetting.findUnique({ where: { key } });
        if (!row?.value)
            return fallback;
        try {
            return JSON.parse(row.value);
        }
        catch {
            return fallback;
        }
    }
    async writeJson(key, value, description) {
        await this.prisma.appSetting.upsert({
            where: { key },
            create: {
                key,
                value: JSON.stringify(value),
                type: 'JSON',
                group: 'ai',
                description,
            },
            update: { value: JSON.stringify(value) },
        });
    }
    async list() {
        const stored = await this.readJson(TEMPLATES_KEY, {});
        return ai_prompt_types_1.PROMPT_TYPES.map((type) => ({
            ...ai_prompt_types_1.DEFAULT_TEMPLATES[type],
            ...(stored[type] ?? {}),
            type,
        }));
    }
    async get(type) {
        const found = (await this.list()).find((t) => t.type === type);
        if (!found) {
            throw new exceptions_1.BusinessException(`Unknown prompt type "${type}"`, 'AI_PROMPT_UNKNOWN_TYPE');
        }
        return found;
    }
    async listWithMeta() {
        return {
            templates: await this.list(),
            variables: [...ai_prompt_types_1.PROMPT_VARIABLES],
            accuracyRule: ai_prompt_types_1.ACCURACY_RULE,
        };
    }
    async update(userId, type, dto) {
        const current = await this.get(type);
        const next = {
            ...current,
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.template !== undefined ? { template: dto.template } : {}),
            ...(dto.rules !== undefined ? { rules: dto.rules } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            version: current.version + 1,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
        };
        if (!next.name) {
            throw new exceptions_1.BusinessException('Template name is required', 'AI_PROMPT_NAME_REQUIRED');
        }
        if (!next.template.trim()) {
            throw new exceptions_1.BusinessException('Template content is required', 'AI_PROMPT_TEMPLATE_REQUIRED');
        }
        if (next.status === 'ACTIVE') {
            const unknown = (0, ai_prompt_types_1.unsupportedVariables)(next.template);
            if (unknown.length > 0) {
                throw new exceptions_1.BusinessException(`Unsupported variable: ${unknown.map((v) => `{{${v}}}`).join(', ')}`, 'AI_PROMPT_UNSUPPORTED_VARIABLE');
            }
            if (!next.template.includes('{{product_fields}}')) {
                throw new exceptions_1.BusinessException('An active template must include {{product_fields}}', 'AI_PROMPT_MISSING_PRODUCT_FIELDS');
            }
        }
        const stored = await this.readJson(TEMPLATES_KEY, {});
        const history = await this.readJson(HISTORY_KEY, {});
        const priorVersions = history[current.type] ?? [];
        await this.writeJson(HISTORY_KEY, {
            ...history,
            [current.type]: [current, ...priorVersions].slice(0, MAX_HISTORY),
        }, 'Previous versions of AI prompt templates');
        await this.writeJson(TEMPLATES_KEY, { ...stored, [current.type]: next }, 'AI prompt templates');
        await this.auditService.log({
            action: 'AI_PROMPT_TEMPLATE_UPDATED',
            module: 'ai-prompts',
            resource: 'app_setting',
            resourceId: `${TEMPLATES_KEY}:${current.type}`,
            userId,
            oldValue: current,
            newValue: next,
        });
        return next;
    }
    async history(type) {
        await this.get(type);
        const history = await this.readJson(HISTORY_KEY, {});
        return history[type] ?? [];
    }
    async reset(userId, type) {
        const current = await this.get(type);
        const stored = await this.readJson(TEMPLATES_KEY, {});
        delete stored[current.type];
        await this.writeJson(TEMPLATES_KEY, stored, 'AI prompt templates');
        await this.auditService.log({
            action: 'AI_PROMPT_TEMPLATE_RESET',
            module: 'ai-prompts',
            resource: 'app_setting',
            resourceId: `${TEMPLATES_KEY}:${current.type}`,
            userId,
            oldValue: current,
        });
        return this.get(type);
    }
};
exports.AiPromptService = AiPromptService;
exports.AiPromptService = AiPromptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], AiPromptService);
//# sourceMappingURL=ai-prompt.service.js.map