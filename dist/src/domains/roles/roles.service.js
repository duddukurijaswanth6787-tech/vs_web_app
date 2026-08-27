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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const roles_repository_1 = require("./roles.repository");
let RolesService = class RolesService {
    rolesRepository;
    loggerService;
    constructor(rolesRepository, loggerService) {
        this.rolesRepository = rolesRepository;
        this.loggerService = loggerService;
    }
    toResponse(role) {
        return {
            id: role.id,
            name: role.name,
            displayName: role.displayName,
            scope: role.scope,
            hierarchy: role.hierarchy,
            isSystem: role.isSystem,
            isActive: role.isActive,
            permissions: role.rolePermissions?.map((rp) => rp.permission.code) ?? [],
        };
    }
    async findAll() {
        const roles = await this.rolesRepository.findAll();
        return roles.map((r) => this.toResponse(r));
    }
    async findById(id) {
        const role = await this.rolesRepository.findById(id);
        if (!role)
            throw new exceptions_1.BusinessException('Role not found', 'ROLE_001');
        return this.toResponse(role);
    }
    async create(dto) {
        const existing = await this.rolesRepository.findByName(dto.name);
        if (existing)
            throw new exceptions_1.BusinessException('Role name already exists', 'ROLE_002');
        const role = await this.rolesRepository.create(dto);
        this.loggerService.log({ action: 'role_created', roleId: role.id, name: role.name }, 'RolesService');
        return this.toResponse({ ...role, rolePermissions: [] });
    }
    async update(id, dto) {
        const role = await this.rolesRepository.findById(id);
        if (!role)
            throw new exceptions_1.BusinessException('Role not found', 'ROLE_001');
        if (role.isSystem)
            throw new exceptions_1.BusinessException('Cannot modify system roles', 'ROLE_003');
        const updated = await this.rolesRepository.update(id, dto);
        this.loggerService.log({ action: 'role_updated', roleId: id }, 'RolesService');
        return this.toResponse({
            ...updated,
            rolePermissions: role.rolePermissions,
        });
    }
    async delete(id) {
        const role = await this.rolesRepository.findById(id);
        if (!role)
            throw new exceptions_1.BusinessException('Role not found', 'ROLE_001');
        if (role.isSystem)
            throw new exceptions_1.BusinessException('Cannot delete system roles', 'ROLE_003');
        await this.rolesRepository.delete(id);
        this.loggerService.log({ action: 'role_deleted', roleId: id }, 'RolesService');
    }
    async assignPermissions(id, dto) {
        const role = await this.rolesRepository.findById(id);
        if (!role)
            throw new exceptions_1.BusinessException('Role not found', 'ROLE_001');
        await this.rolesRepository.assignPermissions(id, dto.permissionIds);
        this.loggerService.log({
            action: 'permissions_assigned',
            roleId: id,
            count: dto.permissionIds.length,
        }, 'RolesService');
        return this.findById(id);
    }
    async removePermission(id, permissionId) {
        const role = await this.rolesRepository.findById(id);
        if (!role)
            throw new exceptions_1.BusinessException('Role not found', 'ROLE_001');
        await this.rolesRepository.removePermission(id, permissionId);
        this.loggerService.log({ action: 'permission_removed', roleId: id, permissionId }, 'RolesService');
        return this.findById(id);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [roles_repository_1.RolesRepository,
        logger_service_1.LoggerService])
], RolesService);
//# sourceMappingURL=roles.service.js.map