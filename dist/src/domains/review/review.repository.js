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
exports.ReviewRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ReviewRepository = class ReviewRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { productId, customerId, rating, status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (productId)
            where.productId = productId;
        if (customerId)
            where.customerId = customerId;
        if (rating)
            where.rating = rating;
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { images: { orderBy: { displayOrder: 'asc' } } },
            }),
            this.prisma.review.count({ where }),
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
        return this.prisma.review.findUnique({
            where: { id },
            include: { images: { orderBy: { displayOrder: 'asc' } } },
        });
    }
    async create(data) {
        return this.prisma.review.create({
            data,
            include: { images: true },
        });
    }
    async update(id, data) {
        return this.prisma.review.update({
            where: { id },
            data,
            include: { images: true },
        });
    }
    async createImage(data) {
        return this.prisma.reviewImage.create({ data });
    }
    async vote(reviewId, userId, isHelpful) {
        return this.prisma.reviewVote.upsert({
            where: { reviewId_userId: { reviewId, userId } },
            update: { isHelpful },
            create: { reviewId, userId, isHelpful },
        });
    }
    async getProductRatingSummary(productId) {
        const reviews = await this.prisma.review.findMany({
            where: { productId, deletedAt: null, status: 'APPROVED' },
            select: { rating: true },
        });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;
        const ratingDistribution = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        };
        reviews.forEach((r) => {
            ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
        });
        return { averageRating, totalReviews, ratingDistribution };
    }
    async findAllForProduct(params) {
        const { productId, page, limit, sort, rating, verifiedPurchase, imagesOnly, } = params;
        const skip = (page - 1) * limit;
        const where = {
            productId,
            deletedAt: null,
            isApproved: true,
        };
        if (rating)
            where.rating = rating;
        if (verifiedPurchase)
            where.isVerifiedPurchase = true;
        if (imagesOnly)
            where.images = { some: {} };
        let orderBy = { createdAt: 'desc' };
        if (sort === 'oldest')
            orderBy = { createdAt: 'asc' };
        else if (sort === 'highest')
            orderBy = { rating: 'desc' };
        else if (sort === 'lowest')
            orderBy = { rating: 'asc' };
        else if (sort === 'helpful')
            orderBy = { helpfulCount: 'desc' };
        const include = {
            images: { orderBy: { displayOrder: 'asc' } },
            customer: {
                include: {
                    user: { select: { firstName: true, lastName: true, avatar: true } },
                },
            },
        };
        const [data, total] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include,
            }),
            this.prisma.review.count({ where }),
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
    async softDelete(id) {
        return this.prisma.review.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async report(reviewId, userId, reason) {
        return this.prisma.reviewReport.upsert({
            where: { reviewId_userId: { reviewId, userId } },
            update: { reason },
            create: { reviewId, userId, reason },
        });
    }
    async incrementReportCount(reviewId) {
        return this.prisma.review.update({
            where: { id: reviewId },
            data: { reportCount: { increment: 1 } },
        });
    }
};
exports.ReviewRepository = ReviewRepository;
exports.ReviewRepository = ReviewRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewRepository);
//# sourceMappingURL=review.repository.js.map