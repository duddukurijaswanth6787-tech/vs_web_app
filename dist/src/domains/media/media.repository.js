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
exports.MediaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let MediaRepository = class MediaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { productId, variantId, mediaType, page, limit, sortBy, sortOrder } = params;
        const where = { deletedAt: null };
        if (productId)
            where.productId = productId;
        if (variantId)
            where.variantId = variantId;
        if (mediaType)
            where.mediaType = mediaType;
        const [data, total] = await Promise.all([
            this.prisma.productMedia.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.productMedia.count({ where }),
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
        return this.prisma.productMedia.findUnique({ where: { id } });
    }
    async findPrimary(productId, variantId) {
        const where = {
            productId,
            isPrimary: true,
            deletedAt: null,
        };
        if (variantId)
            where.variantId = variantId;
        return this.prisma.productMedia.findFirst({ where });
    }
    async create(data) {
        return this.prisma.productMedia.create({ data });
    }
    async update(id, data) {
        return this.prisma.productMedia.update({ where: { id }, data });
    }
    async softDelete(id) {
        return this.prisma.productMedia.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'ARCHIVED' },
        });
    }
    async restore(id) {
        return this.prisma.productMedia.update({
            where: { id },
            data: { deletedAt: null, status: 'ACTIVE' },
        });
    }
    async clearPrimary(productId, variantId) {
        const where = { productId, isPrimary: true };
        if (variantId)
            where.variantId = variantId;
        await this.prisma.productMedia.updateMany({
            where,
            data: { isPrimary: false },
        });
    }
    async reorder(items) {
        await this.prisma.$transaction(items.map((item) => this.prisma.productMedia.update({
            where: { id: item.id },
            data: { displayOrder: item.displayOrder },
        })));
    }
};
exports.MediaRepository = MediaRepository;
exports.MediaRepository = MediaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MediaRepository);
//# sourceMappingURL=media.repository.js.map