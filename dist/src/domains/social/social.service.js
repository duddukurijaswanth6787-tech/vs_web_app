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
exports.SocialService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const logger_service_1 = require("../../common/logger/logger.service");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const exceptions_1 = require("../../common/exceptions");
const social_repository_1 = require("./social.repository");
const social_types_1 = require("./social.types");
let SocialService = class SocialService {
    socialRepository;
    prisma;
    auditService;
    logger;
    storageService;
    constructor(socialRepository, prisma, auditService, logger, storageService) {
        this.socialRepository = socialRepository;
        this.prisma = prisma;
        this.auditService = auditService;
        this.logger = logger;
        this.storageService = storageService;
    }
    async createDraftPost(userId, data) {
        const post = await this.socialRepository.createPost({
            authorId: userId,
            contentType: data.contentType,
            caption: data.caption,
            hashtags: data.hashtags,
            visibility: data.visibility,
            allowComments: data.allowComments,
            createdBy: userId,
            productIds: data.productIds,
        });
        await this.auditService.log({
            action: 'SOCIAL_POST_CREATED',
            module: 'social',
            resource: 'social_post',
            resourceId: post.id,
            userId,
            newValue: { contentType: post.contentType, caption: post.caption },
        });
        return post;
    }
    async getPostById(id, userId) {
        const post = await this.socialRepository.findPostById(id);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        let liked = false;
        let saved = false;
        if (userId) {
            [liked, saved] = await Promise.all([
                this.socialRepository.hasUserLiked(id, userId),
                this.socialRepository.hasUserSaved(id, userId),
            ]);
        }
        return {
            ...post,
            viewerState: { liked, saved },
        };
    }
    async updatePost(id, userId, data) {
        const post = await this.socialRepository.findPostById(id);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        const updated = await this.socialRepository.updatePost(id, {
            ...data,
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'SOCIAL_POST_UPDATED',
            module: 'social',
            resource: 'social_post',
            resourceId: id,
            userId,
            newValue: data,
        });
        return updated;
    }
    async updatePostStatus(id, userId, action) {
        const post = await this.socialRepository.findPostById(id);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        const updates = { updatedBy: userId };
        let auditAction = '';
        if (action === 'PUBLISH') {
            if (post.media.length === 0) {
                throw new exceptions_1.BusinessException('Cannot publish a social post with no media files attached', 'SOCIAL_POST_002');
            }
            if (post.contentType === social_types_1.SocialPostContentType.REEL) {
                const hasVideo = post.media.some((m) => m.mediaType === 'VIDEO');
                if (!hasVideo) {
                    throw new exceptions_1.BusinessException('Reels must contain at least one video media item', 'SOCIAL_REEL_001');
                }
            }
            updates.status = social_types_1.SocialPostStatus.PUBLISHED;
            updates.publishedAt = new Date();
            auditAction = 'SOCIAL_POST_PUBLISHED';
        }
        else if (action === 'UNPUBLISH') {
            updates.status = social_types_1.SocialPostStatus.DRAFT;
            auditAction = 'SOCIAL_POST_UNPUBLISHED';
        }
        else if (action === 'HIDE') {
            updates.visibility = social_types_1.SocialPostVisibility.HIDDEN;
            auditAction = 'SOCIAL_POST_HIDDEN';
        }
        else if (action === 'UNHIDE') {
            updates.visibility = social_types_1.SocialPostVisibility.PUBLIC;
            auditAction = 'SOCIAL_POST_RESTORED';
        }
        else if (action === 'ARCHIVE') {
            updates.status = social_types_1.SocialPostStatus.ARCHIVED;
            auditAction = 'SOCIAL_POST_ARCHIVED';
        }
        else if (action === 'RESTORE') {
            updates.status = social_types_1.SocialPostStatus.DRAFT;
            auditAction = 'SOCIAL_POST_RESTORED';
        }
        else if (action === 'FEATURE') {
            updates.isFeatured = true;
            auditAction = 'SOCIAL_POST_FEATURED';
        }
        else if (action === 'UNFEATURE') {
            updates.isFeatured = false;
            auditAction = 'SOCIAL_POST_UNFEATURED';
        }
        else {
            throw new exceptions_1.BusinessException('Invalid status action value', 'SOCIAL_POST_003');
        }
        const updated = await this.socialRepository.updatePost(id, updates);
        await this.auditService.log({
            action: auditAction,
            module: 'social',
            resource: 'social_post',
            resourceId: id,
            userId,
            newValue: updates,
        });
        return updated;
    }
    async deletePost(id, userId) {
        const post = await this.socialRepository.findPostById(id);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        await this.socialRepository.deletePost(id, userId);
        await this.auditService.log({
            action: 'SOCIAL_POST_DELETED',
            module: 'social',
            resource: 'social_post',
            resourceId: id,
            userId,
        });
    }
    async restorePost(id, userId) {
        await this.socialRepository.restorePost(id, userId);
        await this.auditService.log({
            action: 'SOCIAL_POST_RESTORED',
            module: 'social',
            resource: 'social_post',
            resourceId: id,
            userId,
        });
    }
    async attachMedia(postId, userId, mediaItems) {
        const post = await this.socialRepository.findPostById(postId);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        if (mediaItems.length > 10) {
            throw new exceptions_1.BusinessException('Maximum of 10 media files are allowed per post', 'SOCIAL_MEDIA_001');
        }
        for (const item of mediaItems) {
            const allowedPrefix = post.contentType === social_types_1.SocialPostContentType.REEL
                ? `social/reels/${postId}/`
                : `social/posts/${postId}/`;
            if (!item.s3Key.startsWith(allowedPrefix)) {
                throw new exceptions_1.BusinessException(`Invalid S3 media path prefix: key must start with ${allowedPrefix}`, 'SOCIAL_S3_002');
            }
            try {
                const objectExists = await this.storageService.exists(item.s3Key);
                if (!objectExists) {
                    throw new exceptions_1.BusinessException(`Referenced S3 object does not exist: ${item.s3Key}`, 'SOCIAL_S3_003');
                }
            }
            catch (err) {
                if (err instanceof exceptions_1.BusinessException)
                    throw err;
                this.logger.warn(`S3 credentials unavailable or check failed: ${err.message}`, 'SocialService');
            }
        }
        await this.socialRepository.clearPostMedia(postId);
        const media = await this.socialRepository.attachPostMedia(postId, mediaItems);
        await this.auditService.log({
            action: 'SOCIAL_MEDIA_ATTACHED',
            module: 'social',
            resource: 'social_post',
            resourceId: postId,
            userId,
            newValue: { mediaCount: mediaItems.length },
        });
        return media;
    }
    async tagProducts(postId, userId, productTags) {
        const post = await this.socialRepository.findPostById(postId);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        for (const tag of productTags) {
            if (tag.tagX !== undefined && (tag.tagX < 0 || tag.tagX > 100)) {
                throw new exceptions_1.BusinessException('tagX must be between 0 and 100', 'SOCIAL_TAG_001');
            }
            if (tag.tagY !== undefined && (tag.tagY < 0 || tag.tagY > 100)) {
                throw new exceptions_1.BusinessException('tagY must be between 0 and 100', 'SOCIAL_TAG_002');
            }
            const product = await this.prisma.product.findUnique({
                where: { id: tag.productId, deletedAt: null },
            });
            if (!product) {
                throw new exceptions_1.BusinessException(`Product tagged with ID ${tag.productId} does not exist`, 'SOCIAL_TAG_003');
            }
            if (tag.variantId) {
                const variant = await this.prisma.productVariant.findUnique({
                    where: {
                        id: tag.variantId,
                        productId: tag.productId,
                        deletedAt: null,
                    },
                });
                if (!variant) {
                    throw new exceptions_1.BusinessException(`Product variant tagged with ID ${tag.variantId} does not match product`, 'SOCIAL_TAG_004');
                }
            }
        }
        await this.socialRepository.clearPostProducts(postId);
        const tags = await this.socialRepository.attachPostProducts(postId, productTags);
        await this.auditService.log({
            action: 'SOCIAL_PRODUCTS_UPDATED',
            module: 'social',
            resource: 'social_post',
            resourceId: postId,
            userId,
            newValue: { taggedCount: productTags.length },
        });
        return tags;
    }
    async interact(postId, userId, action, extra) {
        const post = await this.socialRepository.findPostById(postId);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        switch (action) {
            case social_types_1.SocialInteractionAction.LIKE:
                return this.socialRepository.toggleLike(postId, userId, true);
            case social_types_1.SocialInteractionAction.UNLIKE:
                return this.socialRepository.toggleLike(postId, userId, false);
            case social_types_1.SocialInteractionAction.SAVE:
                return this.socialRepository.toggleBookmark(postId, userId, true);
            case social_types_1.SocialInteractionAction.UNSAVE:
                return this.socialRepository.toggleBookmark(postId, userId, false);
            case social_types_1.SocialInteractionAction.SHARE:
                return this.socialRepository.trackShare(postId, userId, extra.channel);
            case social_types_1.SocialInteractionAction.VIEW:
                return this.socialRepository.trackView({
                    postId,
                    userId,
                    guestId: extra.guestId,
                    sessionId: extra.sessionId,
                    viewType: 'VIEW',
                });
            case social_types_1.SocialInteractionAction.PLAY:
                return this.socialRepository.trackView({
                    postId,
                    userId,
                    guestId: extra.guestId,
                    sessionId: extra.sessionId,
                    viewType: 'PLAY',
                    watchDuration: extra.watchDuration,
                    completionPercentage: extra.completionPercentage,
                });
            case social_types_1.SocialInteractionAction.COMPLETE:
                return this.socialRepository.trackView({
                    postId,
                    userId,
                    guestId: extra.guestId,
                    sessionId: extra.sessionId,
                    viewType: 'COMPLETE',
                });
            default:
                throw new exceptions_1.BusinessException('Unsupported interaction action name', 'SOCIAL_INT_001');
        }
    }
    async getUploadUrl(postId, type, extension) {
        const post = await this.socialRepository.findPostById(postId);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        const uuid = crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(7);
        let filePath = '';
        if (post.contentType === social_types_1.SocialPostContentType.REEL) {
            filePath =
                type === 'VIDEO'
                    ? `social/reels/${postId}/videos/${uuid}.${extension}`
                    : `social/reels/${postId}/thumbnails/${uuid}.webp`;
        }
        else {
            filePath = `social/posts/${postId}/images/${uuid}.webp`;
        }
        const contentType = type === 'VIDEO' ? 'video/mp4' : 'image/webp';
        const signedUrl = await this.storageService.getSignedUploadUrl(filePath, contentType);
        const secureUrl = signedUrl.split('?')[0];
        this.logger.log(`Presigned upload URL generated for key: ${filePath} (Secure preview: ${secureUrl})`, 'SocialService');
        return {
            uploadUrl: signedUrl,
            s3Key: filePath,
            url: this.storageService.getPublicUrl(filePath),
        };
    }
    async addComment(postId, userId, content, parentId) {
        const post = await this.socialRepository.findPostById(postId);
        if (!post) {
            throw new exceptions_1.BusinessException('Social post not found', 'SOCIAL_POST_001');
        }
        if (!post.allowComments) {
            throw new exceptions_1.BusinessException('Comments are disabled for this social post', 'SOCIAL_COMMENT_001');
        }
        if (parentId) {
            const parent = await this.socialRepository.findCommentById(parentId);
            if (!parent) {
                throw new exceptions_1.BusinessException('Parent comment does not exist', 'SOCIAL_COMMENT_002');
            }
            if (parent.parentId) {
                throw new exceptions_1.BusinessException('Replies are limited to exactly 2 levels deep', 'SOCIAL_COMMENT_003');
            }
        }
        return this.socialRepository.createComment(postId, userId, content, parentId);
    }
    async updateComment(commentId, userId, content) {
        const comment = await this.socialRepository.findCommentById(commentId);
        if (!comment) {
            throw new exceptions_1.BusinessException('Comment not found', 'SOCIAL_COMMENT_004');
        }
        if (comment.userId !== userId) {
            throw new exceptions_1.BusinessException('You are not authorized to edit this comment', 'SOCIAL_COMMENT_005');
        }
        return this.socialRepository.updateComment(commentId, content);
    }
    async deleteComment(commentId, userId, userType) {
        const comment = await this.socialRepository.findCommentById(commentId);
        if (!comment) {
            throw new exceptions_1.BusinessException('Comment not found', 'SOCIAL_COMMENT_004');
        }
        if (userType !== 'ADMIN' &&
            userType !== 'SUPER_ADMIN' &&
            comment.userId !== userId) {
            throw new exceptions_1.BusinessException('You are not authorized to delete this comment', 'SOCIAL_COMMENT_005');
        }
        return this.socialRepository.deleteComment(commentId);
    }
    async getComments(postId, query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        return this.socialRepository.getCommentsForPost(postId, page, limit);
    }
    async reportPost(postId, reporterId, reason, description) {
        const post = await this.socialRepository.findPostById(postId);
        if (!post || post.status !== social_types_1.SocialPostStatus.PUBLISHED) {
            throw new exceptions_1.BusinessException('Active published social post not found', 'SOCIAL_POST_001');
        }
        const existing = await this.socialRepository.findPendingReportByUser(postId, reporterId);
        if (existing) {
            throw new exceptions_1.BusinessException('You have already submitted a pending report for this post', 'SOCIAL_REPORT_001');
        }
        return this.socialRepository.createReport(postId, reporterId, reason, description);
    }
    async resolveReport(reportId, userId, action, resolution) {
        const report = await this.socialRepository.findReportById(reportId);
        if (!report) {
            throw new exceptions_1.BusinessException('Report entry not found', 'SOCIAL_REPORT_002');
        }
        const updates = {
            reviewedBy: userId,
            reviewedAt: new Date(),
            resolution,
        };
        if (action === 'DISMISS') {
            updates.status = social_types_1.SocialReportStatus.DISMISSED;
        }
        else if (action === 'MARK_REVIEWED') {
            updates.status = social_types_1.SocialReportStatus.REVIEWED;
        }
        else if (action === 'TAKE_ACTION') {
            updates.status = social_types_1.SocialReportStatus.ACTION_TAKEN;
            await this.socialRepository.updatePost(report.postId, {
                visibility: social_types_1.SocialPostVisibility.HIDDEN,
                updatedBy: userId,
            });
        }
        const updatedReport = await this.socialRepository.updateReport(reportId, updates);
        await this.auditService.log({
            action: action === 'TAKE_ACTION'
                ? 'SOCIAL_REPORT_ACTION_TAKEN'
                : 'SOCIAL_REPORT_REVIEWED',
            module: 'social',
            resource: 'social_report',
            resourceId: reportId,
            userId,
            newValue: updates,
        });
        return updatedReport;
    }
    async getFeed(query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        return this.socialRepository.getCustomerFeed({
            page,
            limit,
            search: query.search,
        });
    }
    async getReels(query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        return this.socialRepository.getCustomerReels({ page, limit });
    }
    async getTrending(query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        return this.socialRepository.getCustomerTrending({ page, limit });
    }
    async getSaved(userId, query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        return this.socialRepository.getSavedPosts(userId, page, limit);
    }
    async getAdminPosts(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        return this.socialRepository.findAdminPosts({
            contentType: query.contentType,
            status: query.status,
            page,
            limit,
        });
    }
    async getAdminReports(query) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        return this.socialRepository.findAdminReports({
            status: query.status,
            reason: query.reason,
            postId: query.postId,
            page,
            limit,
        });
    }
    async getAnalyticsSummary() {
        const posts = await this.socialRepository.findAdminPosts({
            page: 1,
            limit: 1000,
        });
        let totalLikes = 0;
        let totalComments = 0;
        let totalSaves = 0;
        let totalShares = 0;
        let totalViews = 0;
        let totalPlays = 0;
        posts.data.forEach((p) => {
            totalLikes += p.likeCount || 0;
            totalComments += p.commentCount || 0;
            totalSaves += p.saveCount || 0;
            totalShares += p.shareCount || 0;
            totalViews += p.viewCount || 0;
            totalPlays += p.playCount || 0;
        });
        const topPosts = [...posts.data]
            .sort((a, b) => b.likeCount + b.commentCount - (a.likeCount + a.commentCount))
            .slice(0, 5);
        return {
            totalPosts: posts.meta.total,
            totalLikes,
            totalComments,
            totalSaves,
            totalShares,
            totalViews,
            totalPlays,
            topPosts,
        };
    }
    async getEngagementTimeline(days) {
        const since = new Date();
        since.setDate(since.getDate() - (days - 1));
        since.setHours(0, 0, 0, 0);
        const [likes, comments, shares, views] = await Promise.all([
            this.prisma.socialLike.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true },
            }),
            this.prisma.socialComment.findMany({
                where: { createdAt: { gte: since }, deletedAt: null },
                select: { createdAt: true },
            }),
            this.prisma.socialShare.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true },
            }),
            this.prisma.socialView.findMany({
                where: { createdAt: { gte: since } },
                select: { createdAt: true, viewType: true },
            }),
        ]);
        const dayKey = (d) => d.toISOString().slice(0, 10);
        const buckets = new Map();
        for (let i = 0; i < days; i++) {
            const d = new Date(since);
            d.setDate(since.getDate() + i);
            const key = dayKey(d);
            buckets.set(key, { date: key, likes: 0, comments: 0, shares: 0, plays: 0 });
        }
        for (const row of likes) {
            buckets.get(dayKey(row.createdAt)).likes += 1;
        }
        for (const row of comments) {
            buckets.get(dayKey(row.createdAt)).comments += 1;
        }
        for (const row of shares) {
            buckets.get(dayKey(row.createdAt)).shares += 1;
        }
        for (const row of views) {
            if (row.viewType === 'PLAY' || row.viewType === 'COMPLETE') {
                buckets.get(dayKey(row.createdAt)).plays += 1;
            }
        }
        return Array.from(buckets.values());
    }
};
exports.SocialService = SocialService;
exports.SocialService = SocialService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [social_repository_1.SocialRepository,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        logger_service_1.LoggerService,
        storage_service_1.StorageService])
], SocialService);
//# sourceMappingURL=social.service.js.map