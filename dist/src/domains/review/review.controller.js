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
exports.ReviewController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const review_service_1 = require("./review.service");
const review_types_1 = require("./review.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let ReviewController = class ReviewController {
    reviewService;
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.reviewService.findAll(query));
    }
    async getProductRatingSummary(productId) {
        return response_builder_1.ResponseBuilder.success(await this.reviewService.getProductRatingSummary(productId));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.reviewService.findById(id));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.reviewService.create(user.sub, dto), 'Review created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.reviewService.update(id, dto, user.sub), 'Review updated');
    }
    async approve(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.reviewService.approve(id, user.sub), 'Review approved');
    }
    async reject(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.reviewService.reject(id, user.sub), 'Review rejected');
    }
    async vote(id, isHelpful, user) {
        return response_builder_1.ResponseBuilder.success(await this.reviewService.vote(id, user.sub, isHelpful), 'Vote recorded');
    }
};
exports.ReviewController = ReviewController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List reviews with filtering and pagination' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_types_1.ReviewQueryDto]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('product/:productId/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get product rating summary' }),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "getProductRatingSummary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get review by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a review' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [review_types_1.CreateReviewDto, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, review_types_1.UpdateReviewDto, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reviews:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reviews:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/vote'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Vote on a review' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('isHelpful')),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean, Object]),
    __metadata("design:returntype", Promise)
], ReviewController.prototype, "vote", null);
exports.ReviewController = ReviewController = __decorate([
    (0, swagger_1.ApiTags)('Reviews'),
    (0, common_1.Controller)('reviews'),
    __metadata("design:paramtypes", [review_service_1.ReviewService])
], ReviewController);
//# sourceMappingURL=review.controller.js.map