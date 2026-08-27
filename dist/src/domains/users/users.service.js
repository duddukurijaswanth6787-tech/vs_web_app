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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const identity_constants_1 = require("../../shared/identity/identity.constants");
const password_service_1 = require("../auth/services/password.service");
const users_repository_1 = require("./users.repository");
let UsersService = class UsersService {
    usersRepository;
    passwordService;
    loggerService;
    constructor(usersRepository, passwordService, loggerService) {
        this.usersRepository = usersRepository;
        this.passwordService = passwordService;
        this.loggerService = loggerService;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 10, 100);
        return this.usersRepository.findAll({
            search: query.search,
            status: query.status,
            userType: query.userType,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
    }
    async findById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        const roles = user.userRoles.map((ur) => ur.role.name);
        const permissions = [
            ...new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.code))),
        ];
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName ?? undefined,
            userType: user.userType,
            accountStatus: user.accountStatus,
            isEmailVerified: user.isEmailVerified,
            lastLoginAt: user.lastLoginAt ?? undefined,
            createdAt: user.createdAt,
            phone: user.phone ?? undefined,
            gender: user.gender ?? undefined,
            roles,
            permissions,
        };
    }
    async create(dto) {
        const existing = await this.usersRepository.findByEmail(dto.email);
        if (existing)
            throw new exceptions_1.BusinessException('Email already exists', 'USER_002');
        const passwordHash = await this.passwordService.hash(dto.password);
        const user = await this.usersRepository.create({
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
        });
        const role = await this.usersRepository.findRoleByName(identity_constants_1.IDENTITY_CONSTANTS.DEFAULT_CUSTOMER_ROLE);
        if (role)
            await this.usersRepository.assignRole(user.id, role.id);
        this.loggerService.log({ action: 'user_created', userId: user.id }, 'UsersService');
        return this.findById(user.id);
    }
    async update(id, dto) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        await this.usersRepository.update(id, dto);
        this.loggerService.log({ action: 'user_updated', userId: id }, 'UsersService');
        return this.findById(id);
    }
    async delete(id) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        await this.usersRepository.softDelete(id);
        this.loggerService.log({ action: 'user_deleted', userId: id }, 'UsersService');
    }
    async restore(id) {
        const user = await this.usersRepository.findWithDeleted(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        await this.usersRepository.restore(id);
        this.loggerService.log({ action: 'user_restored', userId: id }, 'UsersService');
        return this.findById(id);
    }
    async updateSimple(id, status, action) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        await this.usersRepository.updateStatus(id, status);
        this.loggerService.log({ action, userId: id }, 'UsersService');
        return this.findById(id);
    }
    async activate(id) {
        return this.updateSimple(id, 'ACTIVE', 'user_activated');
    }
    async deactivate(id) {
        return this.updateSimple(id, 'INACTIVE', 'user_deactivated');
    }
    async suspend(id) {
        return this.updateSimple(id, 'SUSPENDED', 'user_suspended');
    }
    async unlock(id) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        await this.usersRepository.updateStatus(id, 'ACTIVE');
        await this.usersRepository.resetLockout(id);
        this.loggerService.log({ action: 'user_unlocked', userId: id }, 'UsersService');
        return this.findById(id);
    }
    async assignRole(id, dto) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        const role = await this.usersRepository.findRoleById(dto.roleId);
        if (!role)
            throw new exceptions_1.BusinessException('Role not found', 'ROLE_001');
        await this.usersRepository.assignRole(id, dto.roleId);
        this.loggerService.log({ action: 'role_assigned', userId: id, roleId: dto.roleId }, 'UsersService');
        return this.findById(id);
    }
    async removeRole(id, roleId) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        await this.usersRepository.removeRole(id, roleId);
        this.loggerService.log({ action: 'role_removed', userId: id, roleId }, 'UsersService');
        return this.findById(id);
    }
    async getRoles(id) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        return user.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.name,
            displayName: ur.role.displayName,
        }));
    }
    async getPermissions(id) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new exceptions_1.AuthenticationException('User not found', 'USER_001');
        return [
            ...new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => ({
                code: rp.permission.code,
                name: rp.permission.name,
                module: rp.permission.module,
            })))),
        ];
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository,
        password_service_1.PasswordService,
        logger_service_1.LoggerService])
], UsersService);
//# sourceMappingURL=users.service.js.map