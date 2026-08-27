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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const users_types_1 = require("./users.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.findAll(query));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.findById(id));
    }
    async create(dto) {
        return response_builder_1.ResponseBuilder.created(await this.usersService.create(dto), 'User created');
    }
    async update(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.update(id, dto), 'User updated');
    }
    async delete(id) {
        await this.usersService.delete(id);
        return response_builder_1.ResponseBuilder.deleted('User deleted');
    }
    async restore(id) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.restore(id), 'User restored');
    }
    async activate(id) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.activate(id), 'User activated');
    }
    async deactivate(id) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.deactivate(id), 'User deactivated');
    }
    async suspend(id) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.suspend(id), 'User suspended');
    }
    async unlock(id) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.unlock(id), 'User unlocked');
    }
    async assignRole(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.assignRole(id, dto), 'Role assigned');
    }
    async removeRole(id, roleId) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.removeRole(id, roleId), 'Role removed');
    }
    async getRoles(id) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.getRoles(id));
    }
    async getPermissions(id) {
        return response_builder_1.ResponseBuilder.success(await this.usersService.getPermissions(id));
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_guard_1.Permissions)('users:view'),
    (0, swagger_1.ApiOperation)({ summary: 'List users with search, pagination, filter, sort' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [users_types_1.UserQueryDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_guard_1.Permissions)('users:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID with roles and permissions' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_guard_1.Permissions)('users:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [users_types_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_guard_1.Permissions)('users:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user profile' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_types_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete user' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore soft-deleted user' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, permissions_guard_1.Permissions)('users:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate user account' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, permissions_guard_1.Permissions)('users:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate user account' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':id/suspend'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend user account' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "suspend", null);
__decorate([
    (0, common_1.Post)(':id/unlock'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Unlock user account after lockout' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "unlock", null);
__decorate([
    (0, common_1.Post)(':id/roles'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({
        summary: 'Assign role to user (super_admin only — grants access, not day-to-day account management)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_types_1.AssignRoleDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)(':id/roles/:roleId'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove role from user (super_admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "removeRole", null);
__decorate([
    (0, common_1.Get)(':id/roles'),
    (0, permissions_guard_1.Permissions)('users:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user roles' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Get)(':id/permissions'),
    (0, permissions_guard_1.Permissions)('users:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user permissions (computed from roles)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPermissions", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map