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
exports.SizeChartRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const withRows = {
    rows: { orderBy: { displayOrder: 'asc' } },
};
let SizeChartRepository = class SizeChartRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { search, garmentType, status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { garmentType: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (garmentType)
            where.garmentType = garmentType;
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.sizeChartTemplate.findMany({
                where,
                include: withRows,
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            this.prisma.sizeChartTemplate.count({ where }),
        ]);
        return { data, total };
    }
    findById(id) {
        return this.prisma.sizeChartTemplate.findFirst({
            where: { id, deletedAt: null },
            include: withRows,
        });
    }
    findBySlug(slug) {
        return this.prisma.sizeChartTemplate.findFirst({
            where: { slug, deletedAt: null },
            include: withRows,
        });
    }
    async findByProductId(productId) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, deletedAt: null },
            select: { sizeChartTemplateId: true },
        });
        if (!product?.sizeChartTemplateId)
            return null;
        return this.findById(product.sizeChartTemplateId);
    }
    slugExists(slug, excludeId) {
        return this.prisma.sizeChartTemplate.findFirst({
            where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
            select: { id: true },
        });
    }
    create(data, rows) {
        return this.prisma.sizeChartTemplate.create({
            data: {
                ...data,
                rows: {
                    create: rows.map((row, index) => ({
                        size: row.size,
                        measurements: row.measurements,
                        displayOrder: row.displayOrder ?? index,
                    })),
                },
            },
            include: withRows,
        });
    }
    async update(id, data, rows) {
        return this.prisma.$transaction(async (tx) => {
            await tx.sizeChartTemplate.update({ where: { id }, data });
            if (rows) {
                await tx.sizeChartRow.deleteMany({ where: { templateId: id } });
                if (rows.length > 0) {
                    await tx.sizeChartRow.createMany({
                        data: rows.map((row, index) => ({
                            templateId: id,
                            size: row.size,
                            measurements: row.measurements,
                            displayOrder: row.displayOrder ?? index,
                        })),
                    });
                }
            }
            return tx.sizeChartTemplate.findUnique({
                where: { id },
                include: withRows,
            });
        });
    }
    softDelete(id) {
        return this.prisma.sizeChartTemplate.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'INACTIVE' },
        });
    }
    countProductsUsing(id) {
        return this.prisma.product.count({
            where: { sizeChartTemplateId: id, deletedAt: null },
        });
    }
};
exports.SizeChartRepository = SizeChartRepository;
exports.SizeChartRepository = SizeChartRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SizeChartRepository);
//# sourceMappingURL=size-chart.repository.js.map