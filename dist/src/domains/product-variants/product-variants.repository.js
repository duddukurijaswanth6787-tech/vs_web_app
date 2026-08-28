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
exports.ProductVariantsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ProductVariantsRepository = class ProductVariantsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { productId, status, isActive, isDefault, page, limit, sortBy, sortOrder, } = params;
        const where = { deletedAt: null };
        if (productId)
            where.productId = productId;
        if (status)
            where.status = status;
        if (isActive !== undefined)
            where.isActive = isActive;
        if (isDefault !== undefined)
            where.isDefault = isDefault;
        const include = {
            attributeValues: {
                include: {
                    attribute: { select: { id: true, name: true, type: true } },
                    option: { select: { id: true, label: true, value: true } },
                },
            },
        };
        const [data, total] = await Promise.all([
            this.prisma.productVariant.findMany({
                where,
                include,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.productVariant.count({ where }),
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
        return this.prisma.productVariant.findUnique({
            where: { id },
            include: {
                attributeValues: {
                    include: {
                        attribute: { select: { id: true, name: true, type: true } },
                        option: { select: { id: true, label: true, value: true } },
                    },
                },
                inventory: true,
            },
        });
    }
    async findBySku(sku) {
        return this.prisma.productVariant.findUnique({ where: { sku } });
    }
    async findByBarcode(barcode) {
        return this.prisma.productVariant.findUnique({ where: { barcode } });
    }
    async findDefaultByProduct(productId) {
        return this.prisma.productVariant.findFirst({
            where: { productId, isDefault: true, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.productVariant.create({ data });
    }
    async update(id, data) {
        return this.prisma.productVariant.update({ where: { id }, data });
    }
    async softDelete(id) {
        return this.prisma.productVariant.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'ARCHIVED', isActive: false },
        });
    }
    async restore(id) {
        return this.prisma.productVariant.update({
            where: { id },
            data: { deletedAt: null, status: 'ACTIVE', isActive: true },
        });
    }
    async assignAttributeValues(variantId, entries) {
        await this.prisma.variantAttributeValue.createMany({
            data: entries.map((e) => ({
                variantId,
                attributeId: e.attributeId,
                attributeOptionId: e.attributeOptionId,
                value: e.value,
            })),
            skipDuplicates: true,
        });
    }
    async removeAttributeValue(variantId, attributeId) {
        await this.prisma.variantAttributeValue.delete({
            where: { variantId_attributeId: { variantId, attributeId } },
        });
    }
    async clearDefaultForProduct(productId) {
        await this.prisma.productVariant.updateMany({
            where: { productId, isDefault: true },
            data: { isDefault: false },
        });
    }
};
exports.ProductVariantsRepository = ProductVariantsRepository;
exports.ProductVariantsRepository = ProductVariantsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductVariantsRepository);
//# sourceMappingURL=product-variants.repository.js.map