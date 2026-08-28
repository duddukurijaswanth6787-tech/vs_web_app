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
exports.AwsBillingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const aws_billing_service_1 = require("./aws-billing.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AwsBillingController = class AwsBillingController {
    awsBillingService;
    constructor(awsBillingService) {
        this.awsBillingService = awsBillingService;
    }
    async getBillingSummary() {
        const summary = await this.awsBillingService.getBillingSummary();
        return response_builder_1.ResponseBuilder.success(summary, 'AWS billing summary fetched successfully');
    }
    async getBillingSummaryAlias() {
        const summary = await this.awsBillingService.getBillingSummary();
        return response_builder_1.ResponseBuilder.success(summary, 'AWS billing summary fetched successfully');
    }
    async syncBillingData() {
        const summary = await this.awsBillingService.getBillingSummary();
        return response_builder_1.ResponseBuilder.success(summary, 'AWS billing data synced successfully');
    }
};
exports.AwsBillingController = AwsBillingController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get AWS Billing & Storage Summary' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsBillingController.prototype, "getBillingSummary", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AWS Billing Summary Alias' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsBillingController.prototype, "getBillingSummaryAlias", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync AWS Billing Data' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AwsBillingController.prototype, "syncBillingData", null);
exports.AwsBillingController = AwsBillingController = __decorate([
    (0, swagger_1.ApiTags)('AWS Billing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('aws-billing'),
    __metadata("design:paramtypes", [aws_billing_service_1.AwsBillingService])
], AwsBillingController);
//# sourceMappingURL=aws-billing.controller.js.map