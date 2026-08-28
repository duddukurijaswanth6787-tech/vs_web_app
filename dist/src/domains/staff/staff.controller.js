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
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const staff_service_1 = require("./staff.service");
const staff_types_1 = require("./staff.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let StaffController = class StaffController {
    staffService;
    constructor(staffService) {
        this.staffService = staffService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.findAll(query));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.findById(id));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.staffService.create(dto, user.sub), 'Staff created');
    }
    async update(id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.update(id, dto), 'Staff updated');
    }
    async delete(id) {
        await this.staffService.delete(id);
        return response_builder_1.ResponseBuilder.deleted('Staff deleted');
    }
    async restore(id) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.restore(id), 'Staff restored');
    }
    async activate(id) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.activate(id), 'Staff activated');
    }
    async deactivate(id) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.deactivate(id), 'Staff deactivated');
    }
    async suspend(id) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.suspend(id), 'Staff suspended');
    }
    async lock(id) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.lock(id), 'Staff locked');
    }
    async unlock(id) {
        return response_builder_1.ResponseBuilder.success(await this.staffService.unlock(id), 'Staff unlocked');
    }
};
exports.StaffController = StaffController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_guard_1.Permissions)('staff:view'),
    (0, swagger_1.ApiOperation)({
        summary: 'List all staff with search, pagination, filter, sort',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [staff_types_1.StaffQueryDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_guard_1.Permissions)('staff:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new staff member' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [staff_types_1.CreateStaffDto, Object]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_guard_1.Permissions)('staff:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a staff member' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, staff_types_1.UpdateStaffDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a staff member' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted staff member' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    (0, permissions_guard_1.Permissions)('staff:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate a staff member' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/deactivate'),
    (0, permissions_guard_1.Permissions)('staff:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a staff member' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Post)(':id/suspend'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend a staff member' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "suspend", null);
__decorate([
    (0, common_1.Post)(':id/lock'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Lock a staff member account' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "lock", null);
__decorate([
    (0, common_1.Post)(':id/unlock'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Unlock a staff member account' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "unlock", null);
exports.StaffController = StaffController = __decorate([
    (0, swagger_1.ApiTags)('Staff'),
    (0, common_1.Controller)('staff'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [staff_service_1.StaffService])
], StaffController);
//# sourceMappingURL=staff.controller.js.map