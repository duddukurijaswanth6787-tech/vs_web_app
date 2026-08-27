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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiPromptController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../domains/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../domains/auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const ai_prompt_service_1 = require("./ai-prompt.service");
const ai_prompt_types_1 = require("./ai-prompt.types");
let AiPromptController = class AiPromptController {
    service;
    constructor(service) {
        this.service = service;
    }
    async list() {
        return response_builder_1.ResponseBuilder.success(await this.service.listWithMeta());
    }
    async get(type) {
        return response_builder_1.ResponseBuilder.success(await this.service.get(type));
    }
    async history(type) {
        return response_builder_1.ResponseBuilder.success(await this.service.history(type));
    }
    async update(user, type, dto) {
        return response_builder_1.ResponseBuilder.success(await this.service.update(user.sub, type, dto), 'Prompt template updated');
    }
    async reset(user, type) {
        return response_builder_1.ResponseBuilder.success(await this.service.reset(user.sub, type), 'Prompt template reset');
    }
};
exports.AiPromptController = AiPromptController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List prompt templates, variables and the accuracy rule' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiPromptController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':type'),
    (0, swagger_1.ApiOperation)({ summary: 'Get one prompt template' }),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiPromptController.prototype, "get", null);
__decorate([
    (0, common_1.Get)(':type/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Previous versions of a prompt template' }),
    __param(0, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiPromptController.prototype, "history", null);
__decorate([
    (0, common_1.Patch)(':type'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a prompt template (creates a new version)' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ai_prompt_types_1.UpdatePromptTemplateDto]),
    __metadata("design:returntype", Promise)
], AiPromptController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':type/reset'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a prompt template to its built-in default' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiPromptController.prototype, "reset", null);
exports.AiPromptController = AiPromptController = __decorate([
    (0, swagger_1.ApiTags)('AI Content (Super Admin)'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('admin/ai/prompts'),
    __metadata("design:paramtypes", [ai_prompt_service_1.AiPromptService])
], AiPromptController);
//# sourceMappingURL=ai-prompt.controller.js.map