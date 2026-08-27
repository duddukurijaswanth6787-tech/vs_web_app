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
exports.WishlistRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let WishlistRepository = class WishlistRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByCustomerId(customerId) {
        return this.prisma.wishlist.findFirst({
            where: { customerId },
            include: { _count: { select: { items: true } } },
        });
    }
    async createDefault(customerId) {
        return this.prisma.wishlist.create({
            data: { customerId, name: 'Default' },
            include: { _count: { select: { items: true } } },
        });
    }
    async findItems(wishlistId, params) {
        const { search, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { wishlistId };
        if (search) {
            where.product = {
                name: { contains: search, mode: 'insensitive' },
            };
        }
        const [data, total] = await Promise.all([
            this.prisma.wishlistItem.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            basePrice: true,
                            salePrice: true,
                            media: {
                                where: { isPrimary: true },
                                take: 1,
                                select: { url: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.wishlistItem.count({ where }),
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
    async findItem(wishlistId, productId) {
        return this.prisma.wishlistItem.findUnique({
            where: { wishlistId_productId: { wishlistId, productId } },
        });
    }
    async addItem(data) {
        return this.prisma.wishlistItem.create({ data });
    }
    async removeItem(wishlistId, productId) {
        return this.prisma.wishlistItem.delete({
            where: { wishlistId_productId: { wishlistId, productId } },
        });
    }
    async getItemCount(wishlistId) {
        return this.prisma.wishlistItem.count({ where: { wishlistId } });
    }
};
exports.WishlistRepository = WishlistRepository;
exports.WishlistRepository = WishlistRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WishlistRepository);
//# sourceMappingURL=wishlist.repository.js.map