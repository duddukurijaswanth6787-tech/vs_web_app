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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getOmnichannel(period) {
        const data = await this.analyticsService.getOmnichannelOverview(period || 'monthly');
        return response_builder_1.ResponseBuilder.success(data, 'Omnichannel analytics fetched successfully');
    }
    async getOfflinePos(period) {
        const data = await this.analyticsService.getOfflinePosAnalytics(period || 'monthly');
        return response_builder_1.ResponseBuilder.success(data, 'POS analytics fetched successfully');
    }
    async getOnlineSales(period) {
        const data = await this.analyticsService.getOnlineSalesAnalytics(period || 'monthly');
        return response_builder_1.ResponseBuilder.success(data, 'Online sales analytics fetched successfully');
    }
    async getInventoryVelocity() {
        const data = await this.analyticsService.getInventoryVelocityAnalytics();
        return response_builder_1.ResponseBuilder.success(data, 'Inventory velocity analytics fetched successfully');
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('omnichannel'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Omnichannel Overview Analytics (POS vs Online)' }),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOmnichannel", null);
__decorate([
    (0, common_1.Get)('offline-pos'),
    (0, swagger_1.ApiOperation)({ summary: 'Get POS In-Store Counter Analytics' }),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOfflinePos", null);
__decorate([
    (0, common_1.Get)('online-sales'),
    (0, swagger_1.ApiOperation)({ summary: 'Get E-Commerce Online Store Analytics' }),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOnlineSales", null);
__decorate([
    (0, common_1.Get)('inventory-velocity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Fast-Moving vs Slow-Moving Inventory Velocity' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getInventoryVelocity", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin', 'staff'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map