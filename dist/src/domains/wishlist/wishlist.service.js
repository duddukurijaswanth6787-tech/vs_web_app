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
exports.WishlistService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const wishlist_repository_1 = require("./wishlist.repository");
let WishlistService = class WishlistService {
    wishlistRepository;
    prisma;
    auditService;
    constructor(wishlistRepository, prisma, auditService) {
        this.wishlistRepository = wishlistRepository;
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async getCustomerProfile(userId) {
        let profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user) {
                profile = await this.prisma.customerProfile.create({
                    data: {
                        userId: user.id,
                    },
                });
            }
        }
        if (!profile)
            throw new exceptions_1.BusinessException('Customer profile not found', 'CUSTOMER_001');
        return profile;
    }
    async getOrCreateWishlist(customerId) {
        const existing = await this.wishlistRepository.findByCustomerId(customerId);
        if (existing)
            return existing;
        return this.wishlistRepository.createDefault(customerId);
    }
    toWishlistResponse(w) {
        return {
            id: w.id,
            customerId: w.customerId,
            name: w.name,
            itemCount: w._count?.items ?? 0,
            createdAt: w.createdAt,
        };
    }
    toItemResponse(item) {
        return {
            id: item.id,
            wishlistId: item.wishlistId,
            productId: item.productId,
            productName: item.product?.name,
            variantId: item.variantId ?? undefined,
            notes: item.notes ?? undefined,
            createdAt: item.createdAt,
            product: item.product
                ? {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    basePrice: Number(item.product.basePrice),
                    salePrice: item.product.salePrice != null
                        ? Number(item.product.salePrice)
                        : null,
                    images: (item.product.media || []).map((m) => ({
                        url: m.url,
                    })),
                }
                : undefined,
        };
    }
    async getWishlist(userId) {
        const profile = await this.getCustomerProfile(userId);
        const wishlist = await this.getOrCreateWishlist(profile.id);
        return this.toWishlistResponse(wishlist);
    }
    async getItems(userId, query) {
        const profile = await this.getCustomerProfile(userId);
        const wishlist = await this.getOrCreateWishlist(profile.id);
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.wishlistRepository.findItems(wishlist.id, {
            search: query.search,
            page,
            limit,
        });
        return {
            data: result.data.map((item) => this.toItemResponse(item)),
            meta: result.meta,
        };
    }
    async addItem(userId, dto) {
        const profile = await this.getCustomerProfile(userId);
        const wishlist = await this.getOrCreateWishlist(profile.id);
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
        });
        if (!product || product.deletedAt)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        const existing = await this.wishlistRepository.findItem(wishlist.id, dto.productId);
        if (existing)
            throw new exceptions_1.BusinessException('Product already in wishlist', 'WISHLIST_001');
        const item = await this.wishlistRepository.addItem({
            wishlistId: wishlist.id,
            productId: dto.productId,
            variantId: dto.variantId,
            notes: dto.notes,
        });
        await this.auditService.log({
            action: 'PRODUCT_ADDED_TO_WISHLIST',
            module: 'wishlist',
            resource: 'wishlist_item',
            resourceId: item.id,
            userId,
            newValue: { productId: dto.productId },
        });
        return this.toItemResponse(item);
    }
    async syncWishlist(userId, productIds) {
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return this.getWishlist(userId);
        }
        const profile = await this.getCustomerProfile(userId);
        const wishlist = await this.getOrCreateWishlist(profile.id);
        for (const productId of productIds) {
            if (!productId)
                continue;
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: productId },
                });
                if (!product || product.deletedAt)
                    continue;
                const existing = await this.wishlistRepository.findItem(wishlist.id, productId);
                if (!existing) {
                    await this.wishlistRepository.addItem({
                        wishlistId: wishlist.id,
                        productId,
                    });
                }
            }
            catch {
            }
        }
        return this.getWishlist(userId);
    }
    async removeItem(userId, productId) {
        const profile = await this.getCustomerProfile(userId);
        const wishlist = await this.getOrCreateWishlist(profile.id);
        const existing = await this.wishlistRepository.findItem(wishlist.id, productId);
        if (!existing)
            throw new exceptions_1.BusinessException('Item not in wishlist', 'WISHLIST_002');
        await this.wishlistRepository.removeItem(wishlist.id, productId);
        await this.auditService.log({
            action: 'PRODUCT_REMOVED_FROM_WISHLIST',
            module: 'wishlist',
            resource: 'wishlist_item',
            resourceId: existing.id,
            userId,
            oldValue: { productId },
        });
    }
    async moveToCart(userId, productId) {
        const profile = await this.getCustomerProfile(userId);
        const wishlist = await this.getOrCreateWishlist(profile.id);
        const wishlistItem = await this.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId,
                },
            },
            include: {
                product: true,
            },
        });
        if (!wishlistItem) {
            throw new exceptions_1.BusinessException('Item not in wishlist', 'WISHLIST_002');
        }
        let cart = await this.prisma.shoppingCart.findFirst({
            where: { customerId: profile.id, status: 'ACTIVE' },
        });
        if (!cart) {
            cart = await this.prisma.shoppingCart.create({
                data: { customerId: profile.id, status: 'ACTIVE' },
            });
        }
        const unitPrice = wishlistItem.product.salePrice ?? wishlistItem.product.basePrice;
        const totalPrice = Number(unitPrice);
        await this.prisma.$transaction(async (tx) => {
            const existingCartItem = await tx.shoppingCartItem.findFirst({
                where: {
                    cartId: cart.id,
                    productId,
                    variantId: wishlistItem.variantId,
                },
            });
            if (existingCartItem) {
                const newQty = existingCartItem.quantity + 1;
                await tx.shoppingCartItem.update({
                    where: { id: existingCartItem.id },
                    data: {
                        quantity: newQty,
                        totalPrice: Number(existingCartItem.unitPrice) * newQty,
                    },
                });
            }
            else {
                await tx.shoppingCartItem.create({
                    data: {
                        cartId: cart.id,
                        productId,
                        variantId: wishlistItem.variantId,
                        quantity: 1,
                        unitPrice,
                        totalPrice,
                    },
                });
            }
            await tx.wishlistItem.delete({
                where: { id: wishlistItem.id },
            });
        });
        await this.auditService.log({
            action: 'WISHLIST_ITEM_MOVED_TO_CART',
            module: 'wishlist',
            resource: 'wishlist_item',
            resourceId: wishlistItem.id,
            userId,
            newValue: { productId, cartId: cart.id },
        });
    }
    async isInWishlist(userId, productId) {
        const profile = await this.getCustomerProfile(userId);
        const wishlist = await this.getOrCreateWishlist(profile.id);
        const item = await this.wishlistRepository.findItem(wishlist.id, productId);
        return !!item;
    }
    async getCount(userId) {
        const profile = await this.getCustomerProfile(userId);
        const wishlist = await this.getOrCreateWishlist(profile.id);
        return this.wishlistRepository.getItemCount(wishlist.id);
    }
    async getItemsByCustomerIdAdmin(customerId) {
        const wishlist = await this.getOrCreateWishlist(customerId);
        const result = await this.wishlistRepository.findItems(wishlist.id, {
            page: 1,
            limit: 100,
        });
        return {
            data: result.data.map((item) => this.toItemResponse(item)),
            meta: result.meta,
        };
    }
};
exports.WishlistService = WishlistService;
exports.WishlistService = WishlistService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [wishlist_repository_1.WishlistRepository,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], WishlistService);
//# sourceMappingURL=wishlist.service.js.map