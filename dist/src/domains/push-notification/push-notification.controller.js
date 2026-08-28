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
exports.PushNotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const push_notification_service_1 = require("./push-notification.service");
const push_notification_types_1 = require("./push-notification.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let PushNotificationController = class PushNotificationController {
    pushService;
    constructor(pushService) {
        this.pushService = pushService;
    }
    async register(user, dto) {
        return response_builder_1.ResponseBuilder.created(await this.pushService.registerDevice(user.sub, dto), 'Device registered');
    }
    async myDevices(user) {
        return response_builder_1.ResponseBuilder.success(await this.pushService.listMyDevices(user.sub));
    }
    async unregister(user, token) {
        return response_builder_1.ResponseBuilder.success(await this.pushService.unregisterDevice(user.sub, token), 'Device unregistered');
    }
    async send(user, dto) {
        return response_builder_1.ResponseBuilder.success(await this.pushService.send(dto, user.sub), 'Push queued');
    }
    async logs(page, limit) {
        return response_builder_1.ResponseBuilder.success(await this.pushService.listLogs(Number(page) || 1, Number(limit) || 20));
    }
};
exports.PushNotificationController = PushNotificationController;
__decorate([
    (0, common_1.Post)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register device for push notifications' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, push_notification_types_1.RegisterDeviceDto]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "register", null);
__decorate([
    (0, common_1.Get)('devices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List my registered devices' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "myDevices", null);
__decorate([
    (0, common_1.Delete)('devices/:token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Unregister push device' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "unregister", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: send push notification' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, push_notification_types_1.SendPushDto]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "send", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list push logs' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PushNotificationController.prototype, "logs", null);
exports.PushNotificationController = PushNotificationController = __decorate([
    (0, swagger_1.ApiTags)('Push Notifications'),
    (0, common_1.Controller)('push'),
    __metadata("design:paramtypes", [push_notification_service_1.PushNotificationService])
], PushNotificationController);
//# sourceMappingURL=push-notification.controller.js.map