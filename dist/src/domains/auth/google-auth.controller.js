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
exports.GoogleAuthAdminController = exports.UpdateGoogleAuthConfigDto = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const google_auth_service_1 = require("./services/google-auth.service");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const permissions_guard_1 = require("./guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
class UpdateGoogleAuthConfigDto {
    clientId;
}
exports.UpdateGoogleAuthConfigDto = UpdateGoogleAuthConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Google OAuth Web Client ID (ends with .apps.googleusercontent.com)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], UpdateGoogleAuthConfigDto.prototype, "clientId", void 0);
let GoogleAuthAdminController = class GoogleAuthAdminController {
    googleAuthService;
    constructor(googleAuthService) {
        this.googleAuthService = googleAuthService;
    }
    async getConfig() {
        return response_builder_1.ResponseBuilder.success({ clientId: await this.googleAuthService.getEffectiveClientId() });
    }
    async updateConfig(dto) {
        return response_builder_1.ResponseBuilder.success(await this.googleAuthService.updateClientId(dto.clientId), 'Google Client ID saved');
    }
};
exports.GoogleAuthAdminController = GoogleAuthAdminController;
__decorate([
    (0, common_1.Get)('config'),
    (0, permissions_guard_1.Permissions)('settings:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the configured Google OAuth Client ID' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GoogleAuthAdminController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Put)('config'),
    (0, permissions_guard_1.Permissions)('settings:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Set the Google OAuth Client ID' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpdateGoogleAuthConfigDto]),
    __metadata("design:returntype", Promise)
], GoogleAuthAdminController.prototype, "updateConfig", null);
exports.GoogleAuthAdminController = GoogleAuthAdminController = __decorate([
    (0, swagger_1.ApiTags)('Google Auth Settings'),
    (0, common_1.Controller)('admin/google-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [google_auth_service_1.GoogleAuthService])
], GoogleAuthAdminController);
//# sourceMappingURL=google-auth.controller.js.map