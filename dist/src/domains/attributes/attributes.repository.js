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
exports.AttributesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let AttributesRepository = class AttributesRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllGroups(params) {
        const { search, status, page, limit, sortBy, sortOrder } = params;
        const where = { deletedAt: null };
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.attributeGroup.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.attributeGroup.count({ where }),
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
    async findGroupById(id) {
        return this.prisma.attributeGroup.findUnique({ where: { id } });
    }
    async findGroupBySlug(slug) {
        return this.prisma.attributeGroup.findUnique({ where: { slug } });
    }
    async createGroup(data) {
        return this.prisma.attributeGroup.create({ data });
    }
    async updateGroup(id, data) {
        return this.prisma.attributeGroup.update({ where: { id }, data });
    }
    async softDeleteGroup(id) {
        return this.prisma.attributeGroup.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'ARCHIVED' },
        });
    }
    async restoreGroup(id) {
        return this.prisma.attributeGroup.update({
            where: { id },
            data: { deletedAt: null, status: 'ACTIVE' },
        });
    }
    async findAllAttributes(params) {
        const { groupId, search, status, type, page, limit, sortBy, sortOrder } = params;
        const where = { deletedAt: null };
        if (groupId)
            where.groupId = groupId;
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (type)
            where.type = type;
        const [data, total] = await Promise.all([
            this.prisma.attribute.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    group: true,
                    options: {
                        where: { deletedAt: null },
                        orderBy: { displayOrder: 'asc' },
                    },
                },
            }),
            this.prisma.attribute.count({ where }),
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
    async findAttributeById(id) {
        return this.prisma.attribute.findUnique({
            where: { id },
            include: {
                group: true,
                options: {
                    where: { deletedAt: null },
                    orderBy: { displayOrder: 'asc' },
                },
            },
        });
    }
    async findAttributeBySlug(groupId, slug) {
        return this.prisma.attribute.findFirst({ where: { groupId, slug } });
    }
    async createAttribute(data) {
        return this.prisma.attribute.create({ data });
    }
    async updateAttribute(id, data) {
        return this.prisma.attribute.update({ where: { id }, data });
    }
    async softDeleteAttribute(id) {
        return this.prisma.attribute.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'ARCHIVED' },
        });
    }
    async restoreAttribute(id) {
        return this.prisma.attribute.update({
            where: { id },
            data: { deletedAt: null, status: 'ACTIVE' },
        });
    }
    async findAllOptions(params) {
        const { attributeId, page, limit } = params;
        const where = {
            attributeId,
            deletedAt: null,
        };
        const [data, total] = await Promise.all([
            this.prisma.attributeOption.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { displayOrder: 'asc' },
            }),
            this.prisma.attributeOption.count({ where }),
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
    async findOptionById(id) {
        return this.prisma.attributeOption.findUnique({ where: { id } });
    }
    async createOption(data) {
        return this.prisma.attributeOption.create({ data });
    }
    async updateOption(id, data) {
        return this.prisma.attributeOption.update({ where: { id }, data });
    }
    async softDeleteOption(id) {
        return this.prisma.attributeOption.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'ARCHIVED' },
        });
    }
    async restoreOption(id) {
        return this.prisma.attributeOption.update({
            where: { id },
            data: { deletedAt: null, status: 'ACTIVE' },
        });
    }
    async findAllCategoryMappings(categoryId) {
        const data = await this.prisma.categoryAttribute.findMany({
            where: { categoryId },
            orderBy: { displayOrder: 'asc' },
        });
        return { data };
    }
    async findCategoryMapping(categoryId, attributeId) {
        return this.prisma.categoryAttribute.findUnique({
            where: { categoryId_attributeId: { categoryId, attributeId } },
        });
    }
    async createCategoryMapping(data) {
        return this.prisma.categoryAttribute.create({ data });
    }
    async updateCategoryMapping(categoryId, attributeId, data) {
        return this.prisma.categoryAttribute.update({
            where: { categoryId_attributeId: { categoryId, attributeId } },
            data,
        });
    }
    async deleteCategoryMapping(categoryId, attributeId) {
        return this.prisma.categoryAttribute.delete({
            where: { categoryId_attributeId: { categoryId, attributeId } },
        });
    }
};
exports.AttributesRepository = AttributesRepository;
exports.AttributesRepository = AttributesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AttributesRepository);
//# sourceMappingURL=attributes.repository.js.map