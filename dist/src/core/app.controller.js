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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
const aws_billing_service_1 = require("../domains/aws-billing/aws-billing.service");
const analytics_service_1 = require("../domains/analytics/analytics.service");
const response_builder_1 = require("../common/responses/response.builder");
let AppController = class AppController {
    appService;
    awsBillingService;
    analyticsService;
    constructor(appService, awsBillingService, analyticsService) {
        this.appService = appService;
        this.awsBillingService = awsBillingService;
        this.analyticsService = analyticsService;
    }
    getHello() {
        return this.appService.getHello();
    }
    async getOmnichannelDirect(period) {
        const data = await this.analyticsService.getOmnichannelOverview(period || 'monthly');
        return response_builder_1.ResponseBuilder.success(data, 'Omnichannel analytics fetched successfully');
    }
    async getOfflinePosDirect(period) {
        const data = await this.analyticsService.getOfflinePosAnalytics(period || 'monthly');
        return response_builder_1.ResponseBuilder.success(data, 'POS analytics fetched successfully');
    }
    async getOnlineSalesDirect(period) {
        const data = await this.analyticsService.getOnlineSalesAnalytics(period || 'monthly');
        return response_builder_1.ResponseBuilder.success(data, 'Online sales analytics fetched successfully');
    }
    async getInventoryVelocityDirect() {
        const data = await this.analyticsService.getInventoryVelocityAnalytics();
        return response_builder_1.ResponseBuilder.success(data, 'Inventory velocity analytics fetched successfully');
    }
    async syncAnalyticsDirect() {
        const data = await this.analyticsService.getOmnichannelOverview('monthly');
        return response_builder_1.ResponseBuilder.success(data, 'Analytics synced successfully');
    }
    async getAwsBilling() {
        const summary = await this.awsBillingService.getBillingSummary();
        return response_builder_1.ResponseBuilder.success(summary, 'AWS billing summary fetched successfully');
    }
    async syncAwsBilling() {
        const summary = await this.awsBillingService.getBillingSummary();
        return response_builder_1.ResponseBuilder.success(summary, 'AWS billing data synced successfully');
    }
    async getAdminAwsBilling() {
        const summary = await this.awsBillingService.getBillingSummary();
        return response_builder_1.ResponseBuilder.success(summary, 'AWS billing summary fetched successfully');
    }
    async syncAdminAwsBilling() {
        const summary = await this.awsBillingService.getBillingSummary();
        return response_builder_1.ResponseBuilder.success(summary, 'AWS billing data synced successfully');
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('analytics/omnichannel'),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOmnichannelDirect", null);
__decorate([
    (0, common_1.Get)('analytics/offline-pos'),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOfflinePosDirect", null);
__decorate([
    (0, common_1.Get)('analytics/online-sales'),
    __param(0, (0, common_1.Query)('period')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getOnlineSalesDirect", null);
__decorate([
    (0, common_1.Get)('analytics/inventory-velocity'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getInventoryVelocityDirect", null);
__decorate([
    (0, common_1.Post)('analytics/sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "syncAnalyticsDirect", null);
__decorate([
    (0, common_1.Get)('aws-billing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAwsBilling", null);
__decorate([
    (0, common_1.Post)('aws-billing/sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "syncAwsBilling", null);
__decorate([
    (0, common_1.Get)('admin/aws-billing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminAwsBilling", null);
__decorate([
    (0, common_1.Post)('admin/aws-billing/sync'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "syncAdminAwsBilling", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService,
        aws_billing_service_1.AwsBillingService,
        analytics_service_1.AnalyticsService])
], AppController);
//# sourceMappingURL=app.controller.js.map