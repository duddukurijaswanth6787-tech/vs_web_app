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
exports.RecentlyViewedService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
let RecentlyViewedService = class RecentlyViewedService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProfile(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!profile)
            throw new exceptions_1.BusinessException('Customer profile not found', 'CUSTOMER_001');
        return profile;
    }
    async track(userId, dto) {
        const profile = await this.getProfile(userId);
        const product = await this.prisma.product.findFirst({
            where: { id: dto.productId, deletedAt: null },
        });
        if (!product)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        const item = await this.prisma.recentlyViewedProduct.upsert({
            where: {
                customerId_productId: {
                    customerId: profile.id,
                    productId: dto.productId,
                },
            },
            create: { customerId: profile.id, productId: dto.productId },
            update: { viewedAt: new Date() },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        basePrice: true,
                        salePrice: true,
                    },
                },
            },
        });
        const extras = await this.prisma.recentlyViewedProduct.findMany({
            where: { customerId: profile.id },
            orderBy: { viewedAt: 'desc' },
            skip: 50,
            select: { id: true },
        });
        if (extras.length) {
            await this.prisma.recentlyViewedProduct.deleteMany({
                where: { id: { in: extras.map((e) => e.id) } },
            });
        }
        return item;
    }
    async list(userId, query) {
        const profile = await this.getProfile(userId);
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 50);
        const [data, total] = await Promise.all([
            this.prisma.recentlyViewedProduct.findMany({
                where: { customerId: profile.id },
                orderBy: { viewedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            basePrice: true,
                            salePrice: true,
                            status: true,
                        },
                    },
                },
            }),
            this.prisma.recentlyViewedProduct.count({
                where: { customerId: profile.id },
            }),
        ]);
        return { data, meta: { page, limit, total } };
    }
    async clear(userId) {
        const profile = await this.getProfile(userId);
        await this.prisma.recentlyViewedProduct.deleteMany({
            where: { customerId: profile.id },
        });
        return { cleared: true };
    }
};
exports.RecentlyViewedService = RecentlyViewedService;
exports.RecentlyViewedService = RecentlyViewedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RecentlyViewedService);
//# sourceMappingURL=recently-viewed.service.js.map