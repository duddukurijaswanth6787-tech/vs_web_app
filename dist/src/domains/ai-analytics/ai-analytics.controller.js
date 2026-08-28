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
exports.AiAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_analytics_service_1 = require("./ai-analytics.service");
const ai_analytics_types_1 = require("./ai-analytics.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AiAnalyticsController = class AiAnalyticsController {
    aiAnalyticsService;
    constructor(aiAnalyticsService) {
        this.aiAnalyticsService = aiAnalyticsService;
    }
    async getAnalytics(query) {
        return response_builder_1.ResponseBuilder.success(await this.aiAnalyticsService.getAnalytics(query));
    }
    async getPopularSearches() {
        return response_builder_1.ResponseBuilder.success(await this.aiAnalyticsService.getPopularSearches());
    }
    async getPopularProducts() {
        return response_builder_1.ResponseBuilder.success(await this.aiAnalyticsService.getPopularProducts());
    }
};
exports.AiAnalyticsController = AiAnalyticsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI analytics' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_analytics_types_1.AnalyticsQueryDto]),
    __metadata("design:returntype", Promise)
], AiAnalyticsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('popular-searches'),
    (0, swagger_1.ApiOperation)({ summary: 'Get popular searches' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiAnalyticsController.prototype, "getPopularSearches", null);
__decorate([
    (0, common_1.Get)('popular-products'),
    (0, swagger_1.ApiOperation)({ summary: 'Get popular products' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiAnalyticsController.prototype, "getPopularProducts", null);
exports.AiAnalyticsController = AiAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('AI Analytics'),
    (0, common_1.Controller)('ai/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ai_analytics_service_1.AiAnalyticsService])
], AiAnalyticsController);
//# sourceMappingURL=ai-analytics.controller.js.map