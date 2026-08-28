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
exports.PaymentSettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payment_service_1 = require("./payment.service");
const payment_types_1 = require("./payment.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let PaymentSettingsController = class PaymentSettingsController {
    paymentService;
    constructor(paymentService) {
        this.paymentService = paymentService;
    }
    async getConfig() {
        return response_builder_1.ResponseBuilder.success(await this.paymentService.getConfig());
    }
    async updateConfig(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.paymentService.updateConfig(dto, user.sub), 'Razorpay configuration saved');
    }
};
exports.PaymentSettingsController = PaymentSettingsController;
__decorate([
    (0, common_1.Get)('razorpay'),
    (0, permissions_guard_1.Permissions)('settings:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Razorpay credentials configuration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentSettingsController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('razorpay'),
    (0, permissions_guard_1.Permissions)('settings:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Set Razorpay credentials' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_types_1.UpdateRazorpayConfigDto, Object]),
    __metadata("design:returntype", Promise)
], PaymentSettingsController.prototype, "updateConfig", null);
exports.PaymentSettingsController = PaymentSettingsController = __decorate([
    (0, swagger_1.ApiTags)('Payment Settings'),
    (0, common_1.Controller)('admin/payment-settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [payment_service_1.PaymentService])
], PaymentSettingsController);
//# sourceMappingURL=payment-settings.controller.js.map