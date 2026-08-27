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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let UsersRepository = class UsersRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { page, limit, sortBy, sortOrder, search, status, userType } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ];
        }
        if (status)
            where.accountStatus = status;
        if (userType)
            where.userType = userType;
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    userType: true,
                    accountStatus: true,
                    isEmailVerified: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        };
    }
    async findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: { rolePermissions: { include: { permission: true } } },
                        },
                    },
                },
            },
        });
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async create(data) {
        return this.prisma.user.create({ data });
    }
    async update(id, data) {
        return this.prisma.user.update({ where: { id }, data: data });
    }
    async updateStatus(id, accountStatus) {
        return this.prisma.user.update({
            where: { id },
            data: { accountStatus: accountStatus },
        });
    }
    async updateLockout(id, loginAttempts, lockoutUntil) {
        return this.prisma.user.update({
            where: { id },
            data: { loginAttempts, lockoutUntil },
        });
    }
    async softDelete(id) {
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: new Date(), accountStatus: 'DELETED' },
        });
    }
    async findWithDeleted(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async restore(id) {
        return this.prisma.user.update({
            where: { id },
            data: { deletedAt: null, accountStatus: 'ACTIVE' },
        });
    }
    async resetLockout(id) {
        return this.prisma.user.update({
            where: { id },
            data: { loginAttempts: 0, lockoutUntil: null },
        });
    }
    async findRoleById(roleId) {
        return this.prisma.role.findUnique({ where: { id: roleId } });
    }
    async findRoleByName(name) {
        return this.prisma.role.findUnique({ where: { name } });
    }
    async assignRole(userId, roleId) {
        return this.prisma.userRole.create({ data: { userId, roleId } });
    }
    async removeRole(userId, roleId) {
        return this.prisma.userRole.delete({
            where: { userId_roleId: { userId, roleId } },
        });
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map