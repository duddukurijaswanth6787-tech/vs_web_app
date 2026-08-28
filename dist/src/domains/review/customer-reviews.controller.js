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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exceptions_1 = require("../../common/exceptions");
const review_service_1 = require("./review.service");
const review_types_1 = require("./review.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../database/prisma.service");
const response_builder_1 = require("../../common/responses/response.builder");
let CustomerReviewsController = class CustomerReviewsController {
    reviewService;
    prisma;
    constructor(reviewService, prisma) {
        this.reviewService = reviewService;
        this.prisma = prisma;
    }
    async resolveCustomerId(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        return profile?.id ?? null;
    }
    async getProductReviews(productId, query) {
        const reviews = await this.reviewService.findForProduct(productId, query);
        const summary = await this.reviewService.getProductRatingSummary(productId);
        return response_builder_1.ResponseBuilder.success({
            ...reviews,
            summary: {
                averageRating: summary.averageRating,
                totalReviews: summary.totalReviews,
                ratingBreakdown: summary.ratingDistribution,
            },
        });
    }
    async createReview(productId, dto, user) {
        const customerId = await this.resolveCustomerId(user.sub);
        const orderItem = customerId
            ? await this.prisma.orderItem.findFirst({
                where: {
                    productId,
                    order: { customerId, status: 'DELIVERED' },
                },
                select: { orderId: true },
            })
            : null;
        if (!orderItem || !customerId)
            throw new exceptions_1.BusinessException('Product must be purchased before reviewing', 'REVIEW_004');
        return response_builder_1.ResponseBuilder.created(await this.reviewService.create(customerId, { ...dto, productId }), 'Review created');
    }
    async getMyReviews(query, user) {
        const customerId = await this.resolveCustomerId(user.sub);
        if (!customerId)
            return response_builder_1.ResponseBuilder.success({ data: [], meta: {} });
        return response_builder_1.ResponseBuilder.success(await this.reviewService.findAll({ ...query, customerId }));
    }
    async getPendingReviews(user) {
        const customerId = await this.resolveCustomerId(user.sub);
        if (!customerId)
            return response_builder_1.ResponseBuilder.success([]);
        return response_builder_1.ResponseBuilder.success(await this.reviewService.findPendingReviews(customerId));
    }
    async updateReview(reviewId, dto, user) {
        const customerId = await this.resolveCustomerId(user.sub);
        return response_builder_1.ResponseBuilder.success(await this.reviewService.update(reviewId, dto, customerId || user.sub), 'Review updated');
    }
    async deleteReview(reviewId, user) {
        const customerId = await this.resolveCustomerId(user.sub);
        await this.reviewService.delete(reviewId, customerId || user.sub);
        return response_builder_1.ResponseBuilder.deleted('Review deleted');
    }
    async markHelpful(reviewId, user) {
        const customerId = await this.resolveCustomerId(user.sub);
        return response_builder_1.ResponseBuilder.success(await this.reviewService.vote(reviewId, customerId || user.sub, true), 'Vote recorded');
    }
    async reportReview(reviewId, dto, user) {
        await this.reviewService.report(reviewId, user.sub, dto.reason);
        return response_builder_1.ResponseBuilder.success(null, 'Review reported');
    }
};
exports.CustomerReviewsController = CustomerReviewsController;
__decorate([
    (0, common_1.Get)('products/:productId/reviews'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product reviews with sorting and filtering' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_types_1.ProductReviewQueryDto]),
    __metadata("design:returntype", Promise)
], CustomerReviewsController.prototype, "getProductReviews", null);
__decorate([
    (0, common_1.Post)('products/:productId/reviews'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a product review (purchased products only)',
    }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_types_1.CustomerCreateReviewDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerReviewsController.prototype, "createReview", null);
__decorate([
    (0, common_1.Get)('me/reviews'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current customer reviews' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_types_1.ProductReviewQueryDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerReviewsController.prototype, "getMyReviews", null);
__decorate([
    (0, common_1.Get)('me/pending-reviews'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get delivered products awaiting review' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerReviewsController.prototype, "getPendingReviews", null);
__decorate([
    (0, common_1.Put)('reviews/:reviewId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update own review' }),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_types_1.CustomerUpdateReviewDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerReviewsController.prototype, "updateReview", null);
__decorate([
    (0, common_1.Delete)('reviews/:reviewId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete own review (soft delete)' }),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerReviewsController.prototype, "deleteReview", null);
__decorate([
    (0, common_1.Post)('reviews/:reviewId/helpful'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark review as helpful (toggle)' }),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CustomerReviewsController.prototype, "markHelpful", null);
__decorate([
    (0, common_1.Post)('reviews/:reviewId/report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Report a review' }),
    __param(0, (0, common_1.Param)('reviewId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_types_1.ReportReviewDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerReviewsController.prototype, "reportReview", null);
exports.CustomerReviewsController = CustomerReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Customer Reviews'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [review_service_1.ReviewService,
        prisma_service_1.PrismaService])
], CustomerReviewsController);
//# sourceMappingURL=customer-reviews.controller.js.map