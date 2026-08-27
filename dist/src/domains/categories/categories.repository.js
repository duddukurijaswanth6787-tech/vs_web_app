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
exports.CategoriesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CategoriesRepository = class CategoriesRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { page, limit, sortBy, sortOrder, search, status, isFeatured, isMenuVisible, isVisible, } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        if (isFeatured !== undefined)
            where.isFeatured = isFeatured;
        if (isMenuVisible !== undefined)
            where.isMenuVisible = isMenuVisible;
        if (isVisible !== undefined)
            where.isVisible = isVisible;
        const [data, total] = await Promise.all([
            this.prisma.category.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.category.count({ where }),
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
        return this.prisma.category.findUnique({ where: { id } });
    }
    async findByIds(ids) {
        return this.prisma.category.findMany({
            where: { id: { in: ids }, deletedAt: null },
        });
    }
    async findBySlug(slug) {
        return this.prisma.category.findUnique({ where: { slug } });
    }
    async findAllActive() {
        return this.prisma.category.findMany({
            where: { deletedAt: null },
            orderBy: [{ level: 'asc' }, { displayOrder: 'asc' }],
        });
    }
    async findChildren(parentId) {
        return this.prisma.category.findMany({
            where: { parentId, deletedAt: null },
            orderBy: { displayOrder: 'asc' },
        });
    }
    async findDescendants(path) {
        return this.prisma.category.findMany({
            where: { path: { startsWith: path }, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.category.create({ data });
    }
    async update(id, data) {
        return this.prisma.category.update({ where: { id }, data });
    }
    async unlinkChildren(parentId, newParentId = null, newLevel = 0) {
        return this.prisma.category.updateMany({
            where: { parentId },
            data: { parentId: newParentId, level: newLevel },
        });
    }
    async softDelete(id) {
        return this.prisma.category.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'ARCHIVED' },
        });
    }
    async restore(id) {
        return this.prisma.category.update({
            where: { id },
            data: { deletedAt: null, status: 'ACTIVE' },
        });
    }
    async countByParentId(parentId) {
        return this.prisma.category.count({ where: { parentId, deletedAt: null } });
    }
};
exports.CategoriesRepository = CategoriesRepository;
exports.CategoriesRepository = CategoriesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesRepository);
//# sourceMappingURL=categories.repository.js.map