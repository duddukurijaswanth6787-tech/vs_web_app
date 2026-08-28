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
exports.CartRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CartRepository = class CartRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findActiveByCustomerId(customerId) {
        return this.prisma.shoppingCart.findFirst({
            where: { customerId, status: 'ACTIVE' },
            include: {
                items: {
                    where: { savedForLater: false },
                    include: {
                        product: {
                            select: {
                                name: true,
                                basePrice: true,
                                salePrice: true,
                                media: {
                                    select: { url: true, isPrimary: true },
                                    where: { deletedAt: null },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }
    async findActiveByGuestId(guestId) {
        return this.prisma.shoppingCart.findFirst({
            where: { guestId, status: 'ACTIVE' },
            include: {
                items: {
                    where: { savedForLater: false },
                    include: {
                        product: {
                            select: {
                                name: true,
                                basePrice: true,
                                salePrice: true,
                                media: {
                                    select: { url: true, isPrimary: true },
                                    where: { deletedAt: null },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }
    async create(data) {
        return this.prisma.shoppingCart.create({ data });
    }
    async findItem(cartId, productId, variantId) {
        const where = { cartId, productId };
        if (variantId)
            where.variantId = variantId;
        else
            where.variantId = null;
        return this.prisma.shoppingCartItem.findFirst({ where });
    }
    async findItemById(itemId) {
        return this.prisma.shoppingCartItem.findUnique({ where: { id: itemId } });
    }
    async addItem(data) {
        return this.prisma.shoppingCartItem.create({
            data,
            include: {
                product: {
                    select: {
                        name: true,
                        basePrice: true,
                        salePrice: true,
                        media: {
                            select: { url: true, isPrimary: true },
                            where: { deletedAt: null },
                        },
                    },
                },
            },
        });
    }
    async updateItemQuantity(itemId, quantity, unitPrice, totalPrice) {
        return this.prisma.shoppingCartItem.update({
            where: { id: itemId },
            data: { quantity, unitPrice, totalPrice },
            include: {
                product: {
                    select: {
                        name: true,
                        basePrice: true,
                        salePrice: true,
                        media: {
                            select: { url: true, isPrimary: true },
                            where: { deletedAt: null },
                        },
                    },
                },
            },
        });
    }
    async removeItem(itemId) {
        return this.prisma.shoppingCartItem.delete({ where: { id: itemId } });
    }
    async getItems(cartId) {
        return this.prisma.shoppingCartItem.findMany({
            where: { cartId },
            include: {
                product: {
                    select: {
                        name: true,
                        basePrice: true,
                        salePrice: true,
                        media: {
                            select: { url: true, isPrimary: true },
                            where: { deletedAt: null },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async clearCart(cartId) {
        return this.prisma.shoppingCartItem.deleteMany({
            where: { cartId, savedForLater: false },
        });
    }
    async clearSavedForLater(cartId) {
        return this.prisma.shoppingCartItem.deleteMany({
            where: { cartId, savedForLater: true },
        });
    }
    async updateCartStatus(cartId, status) {
        return this.prisma.shoppingCart.update({
            where: { id: cartId },
            data: { status },
        });
    }
    async updateItemSavedForLater(itemId, savedForLater) {
        return this.prisma.shoppingCartItem.update({
            where: { id: itemId },
            data: { savedForLater },
            include: {
                product: {
                    select: {
                        name: true,
                        basePrice: true,
                        salePrice: true,
                        media: {
                            select: { url: true, isPrimary: true },
                            where: { deletedAt: null },
                        },
                    },
                },
            },
        });
    }
};
exports.CartRepository = CartRepository;
exports.CartRepository = CartRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CartRepository);
//# sourceMappingURL=cart.repository.js.map