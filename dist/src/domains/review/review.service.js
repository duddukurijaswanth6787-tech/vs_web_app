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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notification/notification.service");
const review_repository_1 = require("./review.repository");
const prisma_service_1 = require("../../database/prisma.service");
let ReviewService = class ReviewService {
    reviewRepository;
    auditService;
    loggerService;
    notificationService;
    prisma;
    constructor(reviewRepository, auditService, loggerService, notificationService, prisma) {
        this.reviewRepository = reviewRepository;
        this.auditService = auditService;
        this.loggerService = loggerService;
        this.notificationService = notificationService;
        this.prisma = prisma;
    }
    toImageResponse(img) {
        return {
            id: img.id,
            url: img.url,
            altText: img.altText ?? undefined,
            displayOrder: img.displayOrder,
        };
    }
    toResponse(r) {
        return {
            id: r.id,
            productId: r.productId,
            customerId: r.customerId,
            rating: r.rating,
            title: r.title ?? undefined,
            comment: r.comment ?? undefined,
            isVerifiedPurchase: r.isVerifiedPurchase,
            isApproved: r.isApproved,
            helpfulCount: r.helpfulCount,
            unhelpfulCount: r.unhelpfulCount,
            status: r.status,
            images: r.images?.map((img) => this.toImageResponse(img)),
            createdAt: r.createdAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.reviewRepository.findAll({
            productId: query.productId,
            customerId: query.customerId,
            rating: query.rating,
            status: query.status,
            page,
            limit,
        });
        return {
            data: result.data.map((r) => this.toResponse(r)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const review = await this.reviewRepository.findById(id);
        if (!review || review.deletedAt)
            throw new exceptions_1.BusinessException('Review not found', 'REVIEW_001');
        return this.toResponse(review);
    }
    async create(userId, dto) {
        const product = await this.prisma.product.findUnique({
            where: { id: dto.productId },
        });
        if (!product)
            throw new exceptions_1.BusinessException('Product not found', 'PRODUCT_001');
        const existing = await this.prisma.review.findUnique({
            where: {
                productId_customerId: { productId: dto.productId, customerId: userId },
            },
        });
        if (existing && !existing.deletedAt)
            throw new exceptions_1.BusinessException('Review already exists', 'REVIEW_002');
        const review = await this.reviewRepository.create({
            product: { connect: { id: dto.productId } },
            customer: { connect: { id: userId } },
            rating: dto.rating,
            title: dto.title,
            comment: dto.comment,
            createdBy: userId,
        });
        if (dto.images?.length) {
            for (let i = 0; i < dto.images.length; i++) {
                await this.reviewRepository.createImage({
                    review: { connect: { id: review.id } },
                    url: dto.images[i],
                    displayOrder: i,
                });
            }
        }
        await this.auditService.log({
            action: 'REVIEW_CREATED',
            module: 'reviews',
            resource: 'review',
            resourceId: review.id,
            userId,
            newValue: { productId: dto.productId, rating: dto.rating },
        });
        this.loggerService.log({ action: 'review_created', reviewId: review.id }, 'ReviewService');
        await this.notificationService.create({
            userId,
            type: 'REVIEW_SUBMITTED',
            title: 'New Review',
            message: `A ${dto.rating}-star review was submitted for product ${dto.productId}`,
            data: {
                reviewId: review.id,
                productId: dto.productId,
                rating: dto.rating,
            },
        });
        return this.findById(review.id);
    }
    async update(id, dto, userId) {
        const review = await this.reviewRepository.findById(id);
        if (!review || review.deletedAt)
            throw new exceptions_1.BusinessException('Review not found', 'REVIEW_001');
        if (review.customerId !== userId)
            throw new exceptions_1.BusinessException('Not authorized', 'REVIEW_003');
        await this.reviewRepository.update(id, {
            rating: dto.rating,
            title: dto.title,
            comment: dto.comment,
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'REVIEW_UPDATED',
            module: 'reviews',
            resource: 'review',
            resourceId: id,
            userId,
            oldValue: { rating: review.rating },
            newValue: { ...dto },
        });
        this.loggerService.log({ action: 'review_updated', reviewId: id }, 'ReviewService');
        return this.findById(id);
    }
    async approve(id, userId) {
        const review = await this.reviewRepository.findById(id);
        if (!review || review.deletedAt)
            throw new exceptions_1.BusinessException('Review not found', 'REVIEW_001');
        await this.reviewRepository.update(id, {
            isApproved: true,
            status: 'APPROVED',
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'REVIEW_APPROVED',
            module: 'reviews',
            resource: 'review',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'review_approved', reviewId: id }, 'ReviewService');
        return this.findById(id);
    }
    async reject(id, userId) {
        const review = await this.reviewRepository.findById(id);
        if (!review || review.deletedAt)
            throw new exceptions_1.BusinessException('Review not found', 'REVIEW_001');
        await this.reviewRepository.update(id, {
            isApproved: false,
            status: 'REJECTED',
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'REVIEW_REJECTED',
            module: 'reviews',
            resource: 'review',
            resourceId: id,
            userId,
        });
        this.loggerService.log({ action: 'review_rejected', reviewId: id }, 'ReviewService');
        return this.findById(id);
    }
    async vote(reviewId, userId, isHelpful) {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review || review.deletedAt)
            throw new exceptions_1.BusinessException('Review not found', 'REVIEW_001');
        if (review.customerId === userId)
            throw new exceptions_1.BusinessException('Cannot vote on your own review', 'REVIEW_003');
        await this.reviewRepository.vote(reviewId, userId, isHelpful);
        const votes = await this.prisma.reviewVote.findMany({
            where: { reviewId },
        });
        const helpfulCount = votes.filter((v) => v.isHelpful).length;
        const unhelpfulCount = votes.filter((v) => !v.isHelpful).length;
        await this.reviewRepository.update(reviewId, {
            helpfulCount,
            unhelpfulCount,
        });
        return this.findById(reviewId);
    }
    async getProductRatingSummary(productId) {
        return this.reviewRepository.getProductRatingSummary(productId);
    }
    async delete(id, userId) {
        const review = await this.reviewRepository.findById(id);
        if (!review || review.deletedAt)
            throw new exceptions_1.BusinessException('Review not found', 'REVIEW_001');
        if (review.customerId !== userId)
            throw new exceptions_1.BusinessException('Not authorized', 'REVIEW_003');
        await this.reviewRepository.softDelete(id);
        await this.auditService.log({
            action: 'REVIEW_DELETED',
            module: 'reviews',
            resource: 'review',
            resourceId: id,
            userId,
        });
    }
    async report(reviewId, userId, reason) {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review || review.deletedAt)
            throw new exceptions_1.BusinessException('Review not found', 'REVIEW_001');
        if (review.customerId === userId)
            throw new exceptions_1.BusinessException('Cannot report your own review', 'REVIEW_003');
        await this.reviewRepository.report(reviewId, userId, reason);
        await this.reviewRepository.incrementReportCount(reviewId);
        await this.auditService.log({
            action: 'REVIEW_REPORTED',
            module: 'reviews',
            resource: 'review',
            resourceId: reviewId,
            userId,
            newValue: { reason },
        });
    }
    async findForProduct(productId, query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.reviewRepository.findAllForProduct({
            productId,
            page,
            limit,
            sort: query.sort,
            rating: query.rating,
            verifiedPurchase: query.verifiedPurchase,
            imagesOnly: query.imagesOnly,
        });
        return {
            data: result.data.map((r) => ({
                id: r.id,
                rating: r.rating,
                title: r.title ?? undefined,
                comment: r.comment ?? undefined,
                images: r.images?.map((img) => ({
                    id: img.id,
                    url: img.url,
                    altText: img.altText ?? undefined,
                    displayOrder: img.displayOrder,
                })),
                verifiedPurchase: r.isVerifiedPurchase,
                helpfulCount: r.helpfulCount,
                reportCount: r.reportCount,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
                user: r.customer?.user
                    ? {
                        name: `${r.customer.user.firstName}${r.customer.user.lastName ? ' ' + r.customer.user.lastName : ''}`,
                        avatar: r.customer.user.avatar ?? undefined,
                    }
                    : undefined,
            })),
            meta: result.meta,
        };
    }
    async findMyReviews(userId, query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const skip = (page - 1) * limit;
        let orderBy = { createdAt: 'desc' };
        if (query.sort === 'oldest')
            orderBy = { createdAt: 'asc' };
        else if (query.sort === 'highest')
            orderBy = { rating: 'desc' };
        else if (query.sort === 'lowest')
            orderBy = { rating: 'asc' };
        const where = { customerId: userId, deletedAt: null };
        const [data, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    images: { orderBy: { displayOrder: 'asc' } },
                    customer: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true, avatar: true },
                            },
                        },
                    },
                },
            }),
            this.prisma.review.count({ where }),
        ]);
        return {
            data: data.map((r) => ({
                id: r.id,
                productId: r.productId,
                rating: r.rating,
                title: r.title ?? undefined,
                comment: r.comment ?? undefined,
                images: r.images?.map((img) => ({
                    id: img.id,
                    url: img.url,
                    altText: img.altText ?? undefined,
                    displayOrder: img.displayOrder,
                })),
                verifiedPurchase: r.isVerifiedPurchase,
                helpfulCount: r.helpfulCount,
                reportCount: r.reportCount,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            })),
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
    async findPendingReviews(customerId) {
        const deliveredOrders = await this.prisma.order.findMany({
            where: {
                customerId,
                status: 'DELIVERED',
            },
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (!deliveredOrders.length)
            return [];
        const productIds = [];
        deliveredOrders.forEach((o) => {
            o.items.forEach((item) => {
                if (item.productId)
                    productIds.push(item.productId);
            });
        });
        if (!productIds.length)
            return [];
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                slug: true,
                media: { take: 1, select: { url: true } },
            },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        const customerReviews = await this.prisma.review.findMany({
            where: { customerId, deletedAt: null },
            select: { productId: true },
        });
        const reviewedProductIds = new Set(customerReviews.map((r) => r.productId));
        const pendingItems = [];
        const seenProducts = new Set();
        for (const order of deliveredOrders) {
            for (const item of order.items) {
                if (!item.productId)
                    continue;
                if (reviewedProductIds.has(item.productId))
                    continue;
                if (seenProducts.has(item.productId))
                    continue;
                const prod = productMap.get(item.productId);
                if (!prod)
                    continue;
                seenProducts.add(item.productId);
                pendingItems.push({
                    productId: prod.id,
                    productTitle: prod.name,
                    productSlug: prod.slug,
                    productImage: prod.media?.[0]?.url || '',
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    deliveredAt: order.updatedAt,
                });
            }
        }
        return pendingItems;
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [review_repository_1.ReviewRepository,
        audit_service_1.AuditService,
        logger_service_1.LoggerService,
        notification_service_1.NotificationService,
        prisma_service_1.PrismaService])
], ReviewService);
//# sourceMappingURL=review.service.js.map