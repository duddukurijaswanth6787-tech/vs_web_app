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
exports.AiAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_admin_service_1 = require("./ai-admin.service");
const ai_admin_types_1 = require("./ai-admin.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AiAdminController = class AiAdminController {
    aiAdminService;
    constructor(aiAdminService) {
        this.aiAdminService = aiAdminService;
    }
    async findTemplates(query) {
        return response_builder_1.ResponseBuilder.success(await this.aiAdminService.findTemplates(query));
    }
    async findTemplateById(id) {
        return response_builder_1.ResponseBuilder.success(await this.aiAdminService.findTemplateById(id));
    }
    async createTemplate(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.aiAdminService.createTemplate(dto, user.sub), 'Template created');
    }
    async updateTemplate(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.aiAdminService.updateTemplate(id, dto, user.sub), 'Template updated');
    }
    async getUsageLogs(query) {
        return response_builder_1.ResponseBuilder.success(await this.aiAdminService.getUsageLogs(query));
    }
};
exports.AiAdminController = AiAdminController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'List prompt templates' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_admin_types_1.PromptTemplateQueryDto]),
    __metadata("design:returntype", Promise)
], AiAdminController.prototype, "findTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get template by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiAdminController.prototype, "findTemplateById", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Create prompt template' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_admin_types_1.CreatePromptTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], AiAdminController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update prompt template' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_admin_types_1.UpdatePromptTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], AiAdminController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Get)('usage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI usage logs' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiAdminController.prototype, "getUsageLogs", null);
exports.AiAdminController = AiAdminController = __decorate([
    (0, swagger_1.ApiTags)('AI Admin'),
    (0, common_1.Controller)('ai/admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ai_admin_service_1.AiAdminService])
], AiAdminController);
//# sourceMappingURL=ai-admin.controller.js.map