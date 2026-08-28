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
exports.SessionSettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const session_settings_service_1 = require("./services/session-settings.service");
const session_settings_types_1 = require("./services/session-settings.types");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const permissions_guard_1 = require("./guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let SessionSettingsController = class SessionSettingsController {
    sessionSettingsService;
    constructor(sessionSettingsService) {
        this.sessionSettingsService = sessionSettingsService;
    }
    async getSettings() {
        return response_builder_1.ResponseBuilder.success(await this.sessionSettingsService.getSettings());
    }
    async updateSettings(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.sessionSettingsService.updateSettings(dto, user.sub), 'Session settings updated');
    }
};
exports.SessionSettingsController = SessionSettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_guard_1.Permissions)('settings:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get login token expiry settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionSettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)(),
    (0, permissions_guard_1.Permissions)('settings:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update login token expiry settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [session_settings_types_1.UpdateSessionExpirySettingsDto, Object]),
    __metadata("design:returntype", Promise)
], SessionSettingsController.prototype, "updateSettings", null);
exports.SessionSettingsController = SessionSettingsController = __decorate([
    (0, swagger_1.ApiTags)('Session Settings'),
    (0, common_1.Controller)('admin/session-settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [session_settings_service_1.SessionSettingsService])
], SessionSettingsController);
//# sourceMappingURL=session-settings.controller.js.map