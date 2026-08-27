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
exports.OtpGatewayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const otp_gateway_service_1 = require("./otp-gateway.service");
const otp_gateway_types_1 = require("./otp-gateway.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let OtpGatewayController = class OtpGatewayController {
    otpGatewayService;
    constructor(otpGatewayService) {
        this.otpGatewayService = otpGatewayService;
    }
    async getConfig() {
        return response_builder_1.ResponseBuilder.success(await this.otpGatewayService.getConfig());
    }
    async listTemplates() {
        return response_builder_1.ResponseBuilder.success(otp_gateway_types_1.STARTMESSAGING_TEMPLATES);
    }
    async updateConfig(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.otpGatewayService.updateConfig(dto, user.sub), 'OTP gateway config updated');
    }
};
exports.OtpGatewayController = OtpGatewayController;
__decorate([
    (0, common_1.Get)('config'),
    (0, permissions_guard_1.Permissions)('settings:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get OTP gateway configuration' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OtpGatewayController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, permissions_guard_1.Permissions)('settings:view'),
    (0, swagger_1.ApiOperation)({ summary: 'List selectable StartMessaging templates' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OtpGatewayController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, permissions_guard_1.Permissions)('settings:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update OTP gateway configuration' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [otp_gateway_types_1.UpdateOtpGatewayConfigDto, Object]),
    __metadata("design:returntype", Promise)
], OtpGatewayController.prototype, "updateConfig", null);
exports.OtpGatewayController = OtpGatewayController = __decorate([
    (0, swagger_1.ApiTags)('OTP Gateway'),
    (0, common_1.Controller)('admin/otp-gateway'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [otp_gateway_service_1.OtpGatewayService])
], OtpGatewayController);
//# sourceMappingURL=otp-gateway.controller.js.map