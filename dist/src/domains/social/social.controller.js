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
exports.SocialController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_service_1 = require("../auth/services/jwt.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const social_service_1 = require("./social.service");
const social_types_1 = require("./social.types");
let SocialController = class SocialController {
    socialService;
    jwtService;
    constructor(socialService, jwtService) {
        this.socialService = socialService;
        this.jwtService = jwtService;
    }
    getOptionalUser(req) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                return this.jwtService.verify(token);
            }
        }
        catch {
        }
        return null;
    }
    async getFeed(query, req) {
        const user = this.getOptionalUser(req);
        const feed = await this.socialService.getFeed(query);
        if (user) {
            feed.data = await Promise.all(feed.data.map(async (post) => {
                const enriched = await this.socialService.getPostById(post.id, user.sub);
                return enriched;
            }));
        }
        return response_builder_1.ResponseBuilder.success(feed);
    }
    async getReels(query, req) {
        const user = this.getOptionalUser(req);
        const reels = await this.socialService.getReels(query);
        if (user) {
            reels.data = await Promise.all(reels.data.map(async (post) => {
                const enriched = await this.socialService.getPostById(post.id, user.sub);
                return enriched;
            }));
        }
        return response_builder_1.ResponseBuilder.success(reels);
    }
    async getTrending(query, req) {
        const user = this.getOptionalUser(req);
        const trending = await this.socialService.getTrending(query);
        if (user) {
            trending.data = await Promise.all(trending.data.map(async (post) => {
                const enriched = await this.socialService.getPostById(post.id, user.sub);
                return enriched;
            }));
        }
        return response_builder_1.ResponseBuilder.success(trending);
    }
    async getPostById(id, req) {
        const user = this.getOptionalUser(req);
        const post = await this.socialService.getPostById(id, user?.sub);
        return response_builder_1.ResponseBuilder.success(post);
    }
    async interact(id, dto, user) {
        const result = await this.socialService.interact(id, user.sub, dto.action, dto);
        return response_builder_1.ResponseBuilder.success(result, 'Interaction tracked');
    }
    async addComment(id, dto, user) {
        const comment = await this.socialService.addComment(id, user.sub, dto.content, dto.parentId);
        return response_builder_1.ResponseBuilder.created(comment, 'Comment added');
    }
    async getComments(id, query) {
        const comments = await this.socialService.getComments(id, query);
        return response_builder_1.ResponseBuilder.success(comments);
    }
    async updateComment(id, dto, user) {
        const comment = await this.socialService.updateComment(id, user.sub, dto.content);
        return response_builder_1.ResponseBuilder.success(comment, 'Comment updated');
    }
    async deleteComment(id, user) {
        await this.socialService.deleteComment(id, user.sub, user.roles[0] || 'CUSTOMER');
        return response_builder_1.ResponseBuilder.success(null, 'Comment deleted');
    }
    async reportPost(id, dto, user) {
        const report = await this.socialService.reportPost(id, user.sub, dto.reason, dto.description);
        return response_builder_1.ResponseBuilder.created(report, 'Report submitted');
    }
    async getSaved(query, user) {
        const saved = await this.socialService.getSaved(user.sub, query);
        return response_builder_1.ResponseBuilder.success(saved);
    }
};
exports.SocialController = SocialController;
__decorate([
    (0, common_1.Get)('social/feed'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get main customer social feed (weighted catalog posts)',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [social_types_1.SocialFeedQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)('social/reels'),
    (0, swagger_1.ApiOperation)({ summary: 'Get reels feed (video-only catalog posts)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [social_types_1.SocialReelsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getReels", null);
__decorate([
    (0, common_1.Get)('social/trending'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get trending posts based on engagement weighted score',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [social_types_1.SocialReelsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getTrending", null);
__decorate([
    (0, common_1.Get)('social/posts/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get social post or reel by ID with tagged product details',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getPostById", null);
__decorate([
    (0, common_1.Put)('social/posts/:id/interaction'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Interact with post: LIKE, UNLIKE, SAVE, UNSAVE, SHARE, VIEW, PLAY',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, social_types_1.SocialInteractionDto, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "interact", null);
__decorate([
    (0, common_1.Post)('social/posts/:id/comments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Add a comment or direct reply (nested replies capped to 2 levels)',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, social_types_1.CreateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "addComment", null);
__decorate([
    (0, common_1.Get)('social/posts/:id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'List comments and replies for a social post' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, social_types_1.SocialFeedQueryDto]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getComments", null);
__decorate([
    (0, common_1.Put)('social/comments/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Edit own comment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, social_types_1.CreateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "updateComment", null);
__decorate([
    (0, common_1.Delete)('social/comments/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete own comment (or any comment for admins)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Post)('social/posts/:id/report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit safety report for inappropriate/spam social posts',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, social_types_1.CreateReportDto, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "reportPost", null);
__decorate([
    (0, common_1.Get)('me/saved-posts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List customer saved bookmarks posts' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [social_types_1.SocialReelsQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SocialController.prototype, "getSaved", null);
exports.SocialController = SocialController = __decorate([
    (0, swagger_1.ApiTags)('Social Commerce'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [social_service_1.SocialService,
        jwt_service_1.JwtService])
], SocialController);
//# sourceMappingURL=social.controller.js.map