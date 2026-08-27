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
exports.AiRecommendationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_recommendation_service_1 = require("./ai-recommendation.service");
const ai_recommendation_types_1 = require("./ai-recommendation.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AiRecommendationController = class AiRecommendationController {
    aiRecommendationService;
    constructor(aiRecommendationService) {
        this.aiRecommendationService = aiRecommendationService;
    }
    async getRecommendations(query, user) {
        return response_builder_1.ResponseBuilder.success(await this.aiRecommendationService.getRecommendations(user.sub, query));
    }
    async getHistory(query, user) {
        return response_builder_1.ResponseBuilder.success(await this.aiRecommendationService.getHistory(user.sub, query));
    }
    async generateRecommendations(user) {
        return response_builder_1.ResponseBuilder.created(await this.aiRecommendationService.generateRecommendations(user.sub), 'Recommendations generated');
    }
    async adminGenerate(body) {
        return response_builder_1.ResponseBuilder.created(await this.aiRecommendationService.generateRecommendations(body.customerUserId), 'Recommendations generated for customer');
    }
    async adminList(customerUserId, query) {
        return response_builder_1.ResponseBuilder.success(await this.aiRecommendationService.getRecommendations(customerUserId, query));
    }
    async trackClick(user) {
        await this.aiRecommendationService.trackClick(user.sub);
        return response_builder_1.ResponseBuilder.success(null, 'Click tracked');
    }
};
exports.AiRecommendationController = AiRecommendationController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get recommendations' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommendation_types_1.RecommendationQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AiRecommendationController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get recommendation history' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_recommendation_types_1.RecommendationHistoryQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AiRecommendationController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate recommendations' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiRecommendationController.prototype, "generateRecommendations", null);
__decorate([
    (0, common_1.Post)('admin/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Admin: generate recommendations for a customer user',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiRecommendationController.prototype, "adminGenerate", null);
__decorate([
    (0, common_1.Get)('admin/:customerUserId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list recommendations for a customer user' }),
    __param(0, (0, common_1.Param)('customerUserId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ai_recommendation_types_1.RecommendationQueryDto]),
    __metadata("design:returntype", Promise)
], AiRecommendationController.prototype, "adminList", null);
__decorate([
    (0, common_1.Post)(':id/click'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Track recommendation click' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiRecommendationController.prototype, "trackClick", null);
exports.AiRecommendationController = AiRecommendationController = __decorate([
    (0, swagger_1.ApiTags)('AI Recommendations'),
    (0, common_1.Controller)('ai/recommendations'),
    __metadata("design:paramtypes", [ai_recommendation_service_1.AiRecommendationService])
], AiRecommendationController);
//# sourceMappingURL=ai-recommendation.controller.js.map