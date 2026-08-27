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
exports.AiAdminRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AiAdminRepository = class AiAdminRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findTemplates(params) {
        const { search, isActive, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (isActive !== undefined)
            where.isActive = isActive;
        const [data, total] = await Promise.all([
            this.prisma.aiPromptTemplate.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.aiPromptTemplate.count({ where }),
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
    async findTemplateById(id) {
        return this.prisma.aiPromptTemplate.findUnique({ where: { id } });
    }
    async findTemplateByName(name) {
        return this.prisma.aiPromptTemplate.findFirst({ where: { name } });
    }
    async createTemplate(data) {
        return this.prisma.aiPromptTemplate.create({ data });
    }
    async updateTemplate(id, data) {
        return this.prisma.aiPromptTemplate.update({ where: { id }, data });
    }
    async getUsageLogs(params) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.aiUsageLog.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.aiUsageLog.count(),
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
    async createUsageLog(data) {
        return this.prisma.aiUsageLog.create({ data });
    }
};
exports.AiAdminRepository = AiAdminRepository;
exports.AiAdminRepository = AiAdminRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiAdminRepository);
//# sourceMappingURL=ai-admin.repository.js.map