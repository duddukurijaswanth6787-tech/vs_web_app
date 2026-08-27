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
exports.AppSettingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_setting_service_1 = require("./app-setting.service");
const app_setting_types_1 = require("./app-setting.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const jwt_auth_guard_2 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AppSettingController = class AppSettingController {
    settingService;
    constructor(settingService) {
        this.settingService = settingService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.settingService.findAll(query));
    }
    async getPublic() {
        return response_builder_1.ResponseBuilder.success(await this.settingService.getPublicSettingsFallback());
    }
    async findByKey(key) {
        if (key === 'public') {
            return response_builder_1.ResponseBuilder.success(await this.settingService.getPublicSettingsFallback());
        }
        return response_builder_1.ResponseBuilder.success(await this.settingService.findByKey(key));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.settingService.create(dto, user.sub), 'Setting created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.settingService.update(id, dto, user.sub), 'Setting updated');
    }
};
exports.AppSettingController = AppSettingController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('settings:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List settings' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [app_setting_types_1.SettingQueryDto]),
    __metadata("design:returntype", Promise)
], AppSettingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('public'),
    (0, jwt_auth_guard_2.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get public store settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppSettingController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Get)(':key'),
    (0, jwt_auth_guard_2.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get setting by key' }),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppSettingController.prototype, "findByKey", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('settings:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a setting' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [app_setting_types_1.CreateSettingDto, Object]),
    __metadata("design:returntype", Promise)
], AppSettingController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('settings:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a setting' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, app_setting_types_1.UpdateSettingDto, Object]),
    __metadata("design:returntype", Promise)
], AppSettingController.prototype, "update", null);
exports.AppSettingController = AppSettingController = __decorate([
    (0, swagger_1.ApiTags)('Settings'),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [app_setting_service_1.AppSettingService])
], AppSettingController);
//# sourceMappingURL=app-setting.controller.js.map