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
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const session_service_1 = require("./session.service");
const session_types_1 = require("./session.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let SessionController = class SessionController {
    sessionService;
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    async findAll(user, query) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.findAll(user.sub, query));
    }
    async findCurrent(user, req) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.findCurrent(user.sub, req.ip, req.headers['user-agent']));
    }
    async getStats() {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.getStats());
    }
    async findById(user, id) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.findById(id, user.sub, user.roles));
    }
    async revokeCurrent(user, req) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.revokeCurrent(user.sub, req.ip, req.headers['user-agent']));
    }
    async revoke(user, id) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.revoke(id, user.sub, user.roles));
    }
    async revokeOthers(user, currentId) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.revokeOthers(user.sub, currentId));
    }
    async revokeAll(user) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.revokeAll(user.sub));
    }
    async revokeExpired() {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.revokeExpired());
    }
    async adminFindAll(userId, query) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.findAll(userId, query));
    }
    async adminRevokeAll(user, targetUserId) {
        return response_builder_1.ResponseBuilder.success(await this.sessionService.revokeAllForUser(user.sub, targetUserId));
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List active sessions for current user' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, session_types_1.SessionQueryDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current session' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "findCurrent", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session monitoring stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session by ID' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)('revoke-current'),
    (0, swagger_1.ApiOperation)({ summary: 'Logout current session' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revokeCurrent", null);
__decorate([
    (0, common_1.Post)(':id/revoke'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a specific session by ID' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revoke", null);
__decorate([
    (0, common_1.Post)('revoke-others'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke all sessions except current' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('currentSessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revokeOthers", null);
__decorate([
    (0, common_1.Post)('revoke-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke all sessions for current user' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revokeAll", null);
__decorate([
    (0, common_1.Post)('revoke-expired'),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke all expired sessions (admin only)' }),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "revokeExpired", null);
__decorate([
    (0, common_1.Get)('admin/users/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list sessions for a specific user' }),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, session_types_1.SessionQueryDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "adminFindAll", null);
__decorate([
    (0, common_1.Post)('admin/users/:userId/revoke-all'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: revoke all sessions for a user' }),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "adminRevokeAll", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('Sessions'),
    (0, common_1.Controller)('sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], SessionController);
//# sourceMappingURL=session.controller.js.map