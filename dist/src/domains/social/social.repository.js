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
exports.SocialRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const social_types_1 = require("./social.types");
let SocialRepository = class SocialRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPost(data) {
        return this.prisma.socialPost.create({
            data: {
                authorId: data.authorId,
                contentType: data.contentType,
                caption: data.caption,
                hashtags: data.hashtags || [],
                visibility: (data.visibility || 'PUBLIC'),
                allowComments: data.allowComments ?? true,
                createdBy: data.createdBy,
                products: data.productIds
                    ? {
                        create: data.productIds.map((productId) => ({
                            productId,
                        })),
                    }
                    : undefined,
            },
            include: { products: true },
        });
    }
    async findPostById(id) {
        return this.prisma.socialPost.findFirst({
            where: { id, deletedAt: null },
            include: {
                media: {
                    orderBy: { displayOrder: 'asc' },
                },
                products: {
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                basePrice: true,
                                salePrice: true,
                                media: {
                                    where: { isPrimary: true },
                                    select: { url: true },
                                    take: 1,
                                },
                            },
                        },
                        variant: {
                            select: {
                                id: true,
                                title: true,
                                sku: true,
                                priceOverride: true,
                                salePriceOverride: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async updatePost(id, data) {
        return this.prisma.socialPost.update({
            where: { id },
            data,
        });
    }
    async deletePost(id, userId) {
        return this.prisma.socialPost.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                updatedBy: userId,
            },
        });
    }
    async restorePost(id, userId) {
        return this.prisma.socialPost.update({
            where: { id },
            data: {
                deletedAt: null,
                updatedBy: userId,
            },
        });
    }
    async clearPostMedia(postId) {
        return this.prisma.socialPostMedia.deleteMany({
            where: { postId },
        });
    }
    async attachPostMedia(postId, mediaItems) {
        return this.prisma.$transaction(mediaItems.map((item) => this.prisma.socialPostMedia.create({
            data: {
                postId,
                mediaType: item.mediaType,
                s3Key: item.s3Key,
                url: item.url,
                thumbnailUrl: item.thumbnailUrl,
                mediumUrl: item.mediumUrl,
                largeUrl: item.largeUrl,
                mimeType: item.mimeType,
                size: item.size,
                width: item.width,
                height: item.height,
                duration: item.duration,
                displayOrder: item.displayOrder ?? 0,
                altText: item.altText,
            },
        })));
    }
    async clearPostProducts(postId) {
        return this.prisma.socialPostProduct.deleteMany({
            where: { postId },
        });
    }
    async attachPostProducts(postId, productTags) {
        return this.prisma.$transaction(productTags.map((tag) => this.prisma.socialPostProduct.create({
            data: {
                postId,
                productId: tag.productId,
                variantId: tag.variantId || null,
                displayOrder: tag.displayOrder ?? 0,
                tagX: tag.tagX,
                tagY: tag.tagY,
                label: tag.label,
            },
        })));
    }
    async toggleLike(postId, userId, isLike) {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.socialLike.findUnique({
                where: { postId_userId: { postId, userId } },
            });
            if (isLike) {
                if (!existing) {
                    await tx.socialLike.create({
                        data: { postId, userId },
                    });
                    return tx.socialPost.update({
                        where: { id: postId },
                        data: {
                            likeCount: { increment: 1 },
                        },
                    });
                }
            }
            else {
                if (existing) {
                    await tx.socialLike.delete({
                        where: { postId_userId: { postId, userId } },
                    });
                    return tx.socialPost.update({
                        where: { id: postId },
                        data: {
                            likeCount: { decrement: 1 },
                        },
                    });
                }
            }
            return tx.socialPost.findUnique({ where: { id: postId } });
        });
    }
    async hasUserLiked(postId, userId) {
        const like = await this.prisma.socialLike.findUnique({
            where: { postId_userId: { postId, userId } },
        });
        return !!like;
    }
    async toggleBookmark(postId, userId, isSave) {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.socialBookmark.findUnique({
                where: { postId_userId: { postId, userId } },
            });
            if (isSave) {
                if (!existing) {
                    await tx.socialBookmark.create({
                        data: { postId, userId },
                    });
                    return tx.socialPost.update({
                        where: { id: postId },
                        data: {
                            saveCount: { increment: 1 },
                        },
                    });
                }
            }
            else {
                if (existing) {
                    await tx.socialBookmark.delete({
                        where: { postId_userId: { postId, userId } },
                    });
                    return tx.socialPost.update({
                        where: { id: postId },
                        data: {
                            saveCount: { decrement: 1 },
                        },
                    });
                }
            }
            return tx.socialPost.findUnique({ where: { id: postId } });
        });
    }
    async hasUserSaved(postId, userId) {
        const bookmark = await this.prisma.socialBookmark.findUnique({
            where: { postId_userId: { postId, userId } },
        });
        return !!bookmark;
    }
    async createComment(postId, userId, content, parentId) {
        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.socialComment.create({
                data: {
                    postId,
                    userId,
                    parentId: parentId || null,
                    content,
                },
            });
            await tx.socialPost.update({
                where: { id: postId },
                data: {
                    commentCount: { increment: 1 },
                },
            });
            return comment;
        });
    }
    async findCommentById(id) {
        return this.prisma.socialComment.findUnique({
            where: { id },
        });
    }
    async updateComment(id, content) {
        return this.prisma.socialComment.update({
            where: { id },
            data: { content },
        });
    }
    async deleteComment(id) {
        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.socialComment.findUnique({ where: { id } });
            if (!comment || comment.deletedAt)
                return null;
            const updated = await tx.socialComment.update({
                where: { id },
                data: { deletedAt: new Date() },
            });
            await tx.socialPost.update({
                where: { id: comment.postId },
                data: {
                    commentCount: { decrement: 1 },
                },
            });
            return updated;
        });
    }
    async getCommentsForPost(postId, page, limit) {
        const skip = (page - 1) * limit;
        const [comments, total] = await Promise.all([
            this.prisma.socialComment.findMany({
                where: { postId, parentId: null, deletedAt: null },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                    replies: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: 'asc' },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.socialComment.count({
                where: { postId, parentId: null, deletedAt: null },
            }),
        ]);
        return {
            data: comments,
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
    async trackShare(postId, userId, channel) {
        return this.prisma.$transaction(async (tx) => {
            const share = await tx.socialShare.create({
                data: {
                    postId,
                    userId: userId || null,
                    channel: channel || null,
                },
            });
            await tx.socialPost.update({
                where: { id: postId },
                data: {
                    shareCount: { increment: 1 },
                },
            });
            return share;
        });
    }
    async trackView(params) {
        const { postId, userId, guestId, sessionId, viewType, watchDuration, completionPercentage, } = params;
        const timeWindow = new Date(Date.now() - 15 * 60 * 1000);
        const existing = await this.prisma.socialView.findFirst({
            where: {
                postId,
                viewType,
                createdAt: { gte: timeWindow },
                ...(userId && { userId }),
                ...(!userId && guestId && { guestId }),
                ...(!userId && !guestId && sessionId && { sessionId }),
            },
        });
        if (existing) {
            return null;
        }
        return this.prisma.$transaction(async (tx) => {
            const view = await tx.socialView.create({
                data: {
                    postId,
                    userId: userId || null,
                    guestId: guestId || null,
                    sessionId: sessionId || null,
                    viewType,
                    watchDuration,
                    completionPercentage,
                },
            });
            const updateField = viewType === 'PLAY' || viewType === 'COMPLETE'
                ? 'playCount'
                : 'viewCount';
            await tx.socialPost.update({
                where: { id: postId },
                data: {
                    [updateField]: { increment: 1 },
                },
            });
            return view;
        });
    }
    async findPendingReportByUser(postId, reporterId) {
        return this.prisma.socialReport.findFirst({
            where: {
                postId,
                reporterId,
                status: social_types_1.SocialReportStatus.PENDING,
            },
        });
    }
    async createReport(postId, reporterId, reason, description) {
        return this.prisma.socialReport.create({
            data: {
                postId,
                reporterId,
                reason: reason,
                description,
            },
        });
    }
    async getCustomerFeed(params) {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;
        const where = {
            status: social_types_1.SocialPostStatus.PUBLISHED,
            visibility: social_types_1.SocialPostVisibility.PUBLIC,
            deletedAt: null,
        };
        if (search) {
            where.OR = [
                { caption: { contains: search, mode: 'insensitive' } },
                { hashtags: { has: search.toLowerCase() } },
            ];
        }
        const [posts, total] = await Promise.all([
            this.prisma.socialPost.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { isPinned: 'desc' },
                    { isFeatured: 'desc' },
                    { publishedAt: 'desc' },
                ],
                include: {
                    media: { orderBy: { displayOrder: 'asc' } },
                    products: {
                        orderBy: { displayOrder: 'asc' },
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    basePrice: true,
                                    salePrice: true,
                                    media: {
                                        where: { isPrimary: true },
                                        select: { url: true },
                                        take: 1,
                                    },
                                },
                            },
                            variant: {
                                select: {
                                    id: true,
                                    title: true,
                                    sku: true,
                                    priceOverride: true,
                                    salePriceOverride: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.socialPost.count({ where }),
        ]);
        return {
            data: posts,
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
    async getCustomerReels(params) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {
            contentType: social_types_1.SocialPostContentType.REEL,
            status: social_types_1.SocialPostStatus.PUBLISHED,
            visibility: social_types_1.SocialPostVisibility.PUBLIC,
            deletedAt: null,
        };
        const [posts, total] = await Promise.all([
            this.prisma.socialPost.findMany({
                where,
                skip,
                take: limit,
                orderBy: { publishedAt: 'desc' },
                include: {
                    media: { orderBy: { displayOrder: 'asc' } },
                    products: {
                        orderBy: { displayOrder: 'asc' },
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    basePrice: true,
                                    salePrice: true,
                                    media: {
                                        where: { isPrimary: true },
                                        select: { url: true },
                                        take: 1,
                                    },
                                },
                            },
                            variant: {
                                select: {
                                    id: true,
                                    title: true,
                                    sku: true,
                                    priceOverride: true,
                                    salePriceOverride: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.socialPost.count({ where }),
        ]);
        return {
            data: posts,
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
    async getCustomerTrending(params) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {
            status: social_types_1.SocialPostStatus.PUBLISHED,
            visibility: social_types_1.SocialPostVisibility.PUBLIC,
            deletedAt: null,
        };
        const [posts, total] = await Promise.all([
            this.prisma.socialPost.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { likeCount: 'desc' },
                    { commentCount: 'desc' },
                    { shareCount: 'desc' },
                    { saveCount: 'desc' },
                ],
                include: {
                    media: { orderBy: { displayOrder: 'asc' } },
                    products: {
                        orderBy: { displayOrder: 'asc' },
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    basePrice: true,
                                    salePrice: true,
                                    media: {
                                        where: { isPrimary: true },
                                        select: { url: true },
                                        take: 1,
                                    },
                                },
                            },
                            variant: {
                                select: {
                                    id: true,
                                    title: true,
                                    sku: true,
                                    priceOverride: true,
                                    salePriceOverride: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.socialPost.count({ where }),
        ]);
        return {
            data: posts,
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
    async getSavedPosts(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [bookmarks, total] = await Promise.all([
            this.prisma.socialBookmark.findMany({
                where: {
                    userId,
                    post: {
                        deletedAt: null,
                        visibility: social_types_1.SocialPostVisibility.PUBLIC,
                        status: social_types_1.SocialPostStatus.PUBLISHED,
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    post: {
                        include: {
                            media: { orderBy: { displayOrder: 'asc' } },
                            products: {
                                orderBy: { displayOrder: 'asc' },
                                include: {
                                    product: {
                                        select: {
                                            id: true,
                                            name: true,
                                            slug: true,
                                            basePrice: true,
                                            salePrice: true,
                                            media: {
                                                where: { isPrimary: true },
                                                select: { url: true },
                                                take: 1,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.socialBookmark.count({
                where: {
                    userId,
                    post: {
                        deletedAt: null,
                        visibility: social_types_1.SocialPostVisibility.PUBLIC,
                        status: social_types_1.SocialPostStatus.PUBLISHED,
                    },
                },
            }),
        ]);
        return {
            data: bookmarks.map((b) => b.post),
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
    async findAdminPosts(params) {
        const { contentType, status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (contentType)
            where.contentType = contentType;
        if (status)
            where.status = status;
        const [posts, total] = await Promise.all([
            this.prisma.socialPost.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    media: { orderBy: { displayOrder: 'asc' } },
                },
            }),
            this.prisma.socialPost.count({ where }),
        ]);
        return {
            data: posts,
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
    async findAdminReports(params) {
        const { status, reason, postId, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (reason)
            where.reason = reason;
        if (postId)
            where.postId = postId;
        const [reports, total] = await Promise.all([
            this.prisma.socialReport.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    post: {
                        select: { id: true, contentType: true, caption: true },
                    },
                    reporter: {
                        select: { id: true, email: true, firstName: true, lastName: true },
                    },
                },
            }),
            this.prisma.socialReport.count({ where }),
        ]);
        return {
            data: reports,
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
    async findReportById(id) {
        return this.prisma.socialReport.findUnique({
            where: { id },
        });
    }
    async updateReport(id, data) {
        return this.prisma.socialReport.update({
            where: { id },
            data,
        });
    }
};
exports.SocialRepository = SocialRepository;
exports.SocialRepository = SocialRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SocialRepository);
//# sourceMappingURL=social.repository.js.map