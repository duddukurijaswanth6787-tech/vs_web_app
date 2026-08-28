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
exports.PermissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const permissions_service_1 = require("./permissions.service");
const permissions_types_1 = require("./permissions.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let PermissionsController = class PermissionsController {
    permissionsService;
    constructor(permissionsService) {
        this.permissionsService = permissionsService;
    }
    async findAll(module) {
        return response_builder_1.ResponseBuilder.success(await this.permissionsService.findAll(module));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.permissionsService.findById(id));
    }
    async create(dto) {
        return response_builder_1.ResponseBuilder.created(await this.permissionsService.create(dto), 'Permission created');
    }
    async update(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.permissionsService.update(id, dto), 'Permission updated');
    }
    async delete(id) {
        await this.permissionsService.delete(id);
        return response_builder_1.ResponseBuilder.deleted('Permission deactivated');
    }
};
exports.PermissionsController = PermissionsController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'List all permissions' }),
    (0, swagger_1.ApiQuery)({ name: 'module', required: false }),
    __param(0, (0, common_1.Query)('module')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get permission by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new permission' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [permissions_types_1.CreatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a permission' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, permissions_types_1.UpdatePermissionDto]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a permission' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PermissionsController.prototype, "delete", null);
exports.PermissionsController = PermissionsController = __decorate([
    (0, swagger_1.ApiTags)('Permissions'),
    (0, common_1.Controller)('permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService])
], PermissionsController);
//# sourceMappingURL=permissions.controller.js.map