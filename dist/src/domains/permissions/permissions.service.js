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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const permissions_repository_1 = require("./permissions.repository");
let PermissionsService = class PermissionsService {
    permissionsRepository;
    loggerService;
    constructor(permissionsRepository, loggerService) {
        this.permissionsRepository = permissionsRepository;
        this.loggerService = loggerService;
    }
    toResponse(perm) {
        return {
            id: perm.id,
            code: perm.code,
            name: perm.name,
            module: perm.module,
            scope: perm.scope,
            isActive: perm.isActive,
        };
    }
    async findAll(module) {
        const perms = await this.permissionsRepository.findAll(module);
        return perms.map((p) => this.toResponse(p));
    }
    async findById(id) {
        const perm = await this.permissionsRepository.findById(id);
        if (!perm)
            throw new exceptions_1.BusinessException('Permission not found', 'PERM_001');
        return this.toResponse(perm);
    }
    async create(dto) {
        const existing = await this.permissionsRepository.findByCode(dto.code);
        if (existing)
            throw new exceptions_1.BusinessException('Permission code already exists', 'PERM_002');
        const perm = await this.permissionsRepository.create(dto);
        this.loggerService.log({ action: 'permission_created', permissionId: perm.id, code: perm.code }, 'PermissionsService');
        return this.toResponse(perm);
    }
    async update(id, dto) {
        const perm = await this.permissionsRepository.findById(id);
        if (!perm)
            throw new exceptions_1.BusinessException('Permission not found', 'PERM_001');
        const updated = await this.permissionsRepository.update(id, dto);
        this.loggerService.log({ action: 'permission_updated', permissionId: id }, 'PermissionsService');
        return this.toResponse(updated);
    }
    async delete(id) {
        const perm = await this.permissionsRepository.findById(id);
        if (!perm)
            throw new exceptions_1.BusinessException('Permission not found', 'PERM_001');
        await this.permissionsRepository.delete(id);
        this.loggerService.log({ action: 'permission_deleted', permissionId: id }, 'PermissionsService');
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [permissions_repository_1.PermissionsRepository,
        logger_service_1.LoggerService])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map