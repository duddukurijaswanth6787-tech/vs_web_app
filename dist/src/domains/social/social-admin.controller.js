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
exports.SocialAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const social_service_1 = require("./social.service");
const social_types_1 = require("./social.types");
let SocialAdminController = class SocialAdminController {
    socialService;
    constructor(socialService) {
        this.socialService = socialService;
    }
    async getPosts(query) {
        const result = await this.socialService.getAdminPosts(query);
        return response_builder_1.ResponseBuilder.success(result);
    }
    async getAnalyticsSummary() {
        return response_builder_1.ResponseBuilder.success(await this.socialService.getAnalyticsSummary());
    }
    async getAnalyticsTimeline(days) {
        const parsed = days ? parseInt(days, 10) : 14;
        const clamped = Math.min(Math.max(parsed || 14, 1), 90);
        return response_builder_1.ResponseBuilder.success(await this.socialService.getEngagementTimeline(clamped));
    }
    async createPost(dto, user) {
        const post = await this.socialService.createDraftPost(user.sub, dto);
        return response_builder_1.ResponseBuilder.created(post, 'Draft social post created');
    }
    async getPostById(id) {
        const post = await this.socialService.getPostById(id);
        return response_builder_1.ResponseBuilder.success(post);
    }
    async updatePost(id, dto, user) {
        const post = await this.socialService.updatePost(id, user.sub, dto);
        return response_builder_1.ResponseBuilder.success(post, 'Post updated');
    }
    async updateStatus(id, dto, user) {
        const post = await this.socialService.updatePostStatus(id, user.sub, dto.action);
        return response_builder_1.ResponseBuilder.success(post, `Post action ${dto.action} applied`);
    }
    async attachMedia(id, dto, user) {
        const media = await this.socialService.attachMedia(id, user.sub, dto);
        return response_builder_1.ResponseBuilder.success(media, 'Media attached');
    }
    async tagProducts(id, dto, user) {
        const tags = await this.socialService.tagProducts(id, user.sub, dto);
        return response_builder_1.ResponseBuilder.success(tags, 'Products tagged');
    }
    async getUploadUrl(id, body) {
        const urlData = await this.socialService.getUploadUrl(id, body.mediaType, body.extension);
        return response_builder_1.ResponseBuilder.success(urlData);
    }
    async deletePost(id, user) {
        await this.socialService.deletePost(id, user.sub);
        return response_builder_1.ResponseBuilder.success(null, 'Post soft-deleted');
    }
    async restorePost(id, user) {
        await this.socialService.restorePost(id, user.sub);
        return response_builder_1.ResponseBuilder.success(null, 'Post restored');
    }
    async getReports(query) {
        const result = await this.socialService.getAdminReports(query);
        return response_builder_1.ResponseBuilder.success(result);
    }
    async resolveReport(id, dto, user) {
        const result = await this.socialService.resolveReport(id, user.sub, dto.action, dto.resolution);
        return response_builder_1.ResponseBuilder.success(result, `Report action ${dto.action} applied`);
    }
};
exports.SocialAdminController = SocialAdminController;
__decorate([
    (0, common_1.Get)('posts'),
    (0, swagger_1.ApiOperation)({ summary: 'List all posts/reels with filters' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [social_types_1.AdminSocialQueryDto]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Get)('analytics/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get social commerce analytics summary' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "getAnalyticsSummary", null);
__decorate([
    (0, common_1.Get)('analytics/timeline'),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily engagement timeline (likes/comments/shares/plays)' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "getAnalyticsTimeline", null);
__decorate([
    (0, common_1.Post)('posts'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new draft post or reel' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [social_types_1.CreateSocialPostDto, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "createPost", null);
__decorate([
    (0, common_1.Get)('posts/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a post' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "getPostById", null);
__decorate([
    (0, common_1.Put)('posts/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update post caption, hashtags, and settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, social_types_1.UpdateSocialPostDto, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "updatePost", null);
__decorate([
    (0, common_1.Put)('posts/:id/status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Transition post status: PUBLISH, UNPUBLISH, FEATURE, ARCHIVE, etc.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, social_types_1.UpdatePostStatusDto, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)('posts/:id/media'),
    (0, swagger_1.ApiOperation)({
        summary: 'Attach media items uploaded to S3 (Capped at 10 items)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "attachMedia", null);
__decorate([
    (0, common_1.Put)('posts/:id/products'),
    (0, swagger_1.ApiOperation)({
        summary: 'Tag catalog products with coordinate tag coordinates',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "tagProducts", null);
__decorate([
    (0, common_1.Post)('posts/:id/upload-url'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get a signed S3 upload URL for post media attachments',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "getUploadUrl", null);
__decorate([
    (0, common_1.Delete)('posts/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete social post' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "deletePost", null);
__decorate([
    (0, common_1.Post)('posts/:id/restore'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore soft-deleted social post' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "restorePost", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, swagger_1.ApiOperation)({ summary: 'List customer safety moderation reports' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [social_types_1.AdminReportsQueryDto]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "getReports", null);
__decorate([
    (0, common_1.Put)('reports/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Resolve safety report: DISMISS, MARK_REVIEWED, TAKE_ACTION',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, social_types_1.ResolveReportDto, Object]),
    __metadata("design:returntype", Promise)
], SocialAdminController.prototype, "resolveReport", null);
exports.SocialAdminController = SocialAdminController = __decorate([
    (0, swagger_1.ApiTags)('Social Commerce (Admin)'),
    (0, common_1.Controller)('admin/social'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [social_service_1.SocialService])
], SocialAdminController);
//# sourceMappingURL=social-admin.controller.js.map