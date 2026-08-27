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
exports.AuditRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AuditRepository = class AuditRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.auditLog.create({ data: data });
    }
    async createMany(data) {
        return this.prisma.auditLog.createMany({ data: data });
    }
    async findAll(params) {
        const { page, limit, sortBy, sortOrder, module, action, userId, staffId, resource, resourceId, status, search, startDate, endDate, } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (module)
            where.module = module;
        if (action)
            where.action = action;
        if (userId)
            where.userId = userId;
        if (staffId)
            where.staffId = staffId;
        if (resource)
            where.resource = resource;
        if (resourceId)
            where.resourceId = resourceId;
        if (status)
            where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        if (search) {
            where.OR = [
                { message: { contains: search, mode: 'insensitive' } },
                { resource: { contains: search, mode: 'insensitive' } },
                { action: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    userId: true,
                    staffId: true,
                    action: true,
                    module: true,
                    resource: true,
                    resourceId: true,
                    ipAddress: true,
                    userAgent: true,
                    status: true,
                    message: true,
                    createdAt: true,
                },
            }),
            this.prisma.auditLog.count({ where }),
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
        return this.prisma.auditLog.findUnique({ where: { id } });
    }
    async getStats() {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [total, today, users, modules] = await Promise.all([
            this.prisma.auditLog.count(),
            this.prisma.auditLog.count({
                where: { createdAt: { gte: startOfToday } },
            }),
            this.prisma.auditLog.groupBy({ by: ['userId'], _count: true }),
            this.prisma.auditLog.groupBy({ by: ['module'], _count: true }),
        ]);
        return {
            total,
            today,
            uniqueUsers: users.filter((u) => u.userId).length,
            modules: modules.map((m) => ({ module: m.module, count: m._count })),
        };
    }
    async findByResource(resource, resourceId, limit = 50) {
        return this.prisma.auditLog.findMany({
            where: { resource, resourceId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
};
exports.AuditRepository = AuditRepository;
exports.AuditRepository = AuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditRepository);
//# sourceMappingURL=audit.repository.js.map