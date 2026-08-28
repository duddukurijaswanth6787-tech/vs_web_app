import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LoggerService } from "../../common/logger/logger.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { SocialRepository } from './social.repository';
export declare class SocialService {
    private readonly socialRepository;
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    private readonly storageService;
    constructor(socialRepository: SocialRepository, prisma: PrismaService, auditService: AuditService, logger: LoggerService, storageService: StorageService);
    createDraftPost(userId: string, data: any): Promise<{
        products: {
            id: string;
            displayOrder: number;
            createdAt: Date;
            productId: string;
            variantId: string | null;
            label: string | null;
            postId: string;
            tagX: import("@prisma/client-runtime-utils").Decimal | null;
            tagY: import("@prisma/client-runtime-utils").Decimal | null;
        }[];
    } & {
        id: string;
        isFeatured: boolean;
        status: import(".prisma/client").$Enums.SocialPostStatus;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        visibility: import(".prisma/client").$Enums.SocialPostVisibility;
        publishedAt: Date | null;
        contentType: import(".prisma/client").$Enums.SocialPostContentType;
        caption: string | null;
        hashtags: string[];
        allowComments: boolean;
        isPinned: boolean;
        likeCount: number;
        commentCount: number;
        shareCount: number;
        saveCount: number;
        viewCount: number;
        playCount: number;
        authorId: string;
    }>;
    getPostById(id: string, userId?: string): Promise<{
        viewerState: {
            liked: boolean;
            saved: boolean;
        };
        products: ({
            product: {
                id: string;
                slug: string;
                name: string;
                basePrice: import("@prisma/client-runtime-utils").Decimal;
                salePrice: import("@prisma/client-runtime-utils").Decimal | null;
                media: {
                    url: string;
                }[];
            };
            variant: {
                id: string;
                sku: string;
                title: string;
                priceOverride: import("@prisma/client-runtime-utils").Decimal | null;
                salePriceOverride: import("@prisma/client-runtime-utils").Decimal | null;
            } | null;
        } & {
            id: string;
            displayOrder: number;
            createdAt: Date;
            productId: string;
            variantId: string | null;
            label: string | null;
            postId: string;
            tagX: import("@prisma/client-runtime-utils").Decimal | null;
            tagY: import("@prisma/client-runtime-utils").Decimal | null;
        })[];
        media: {
            url: string;
            id: string;
            displayOrder: number;
            createdAt: Date;
            width: number | null;
            height: number | null;
            mediaType: import(".prisma/client").$Enums.SocialMediaType;
            altText: string | null;
            thumbnailUrl: string | null;
            size: number;
            mimeType: string;
            postId: string;
            duration: import("@prisma/client-runtime-utils").Decimal | null;
            mediumUrl: string | null;
            largeUrl: string | null;
            s3Key: string;
        }[];
        id: string;
        isFeatured: boolean;
        status: import(".prisma/client").$Enums.SocialPostStatus;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        visibility: import(".prisma/client").$Enums.SocialPostVisibility;
        publishedAt: Date | null;
        contentType: import(".prisma/client").$Enums.SocialPostContentType;
        caption: string | null;
        hashtags: string[];
        allowComments: boolean;
        isPinned: boolean;
        likeCount: number;
        commentCount: number;
        shareCount: number;
        saveCount: number;
        viewCount: number;
        playCount: number;
        authorId: string;
    }>;
    updatePost(id: string, userId: string, data: any): Promise<{
        id: string;
        isFeatured: boolean;
        status: import(".prisma/client").$Enums.SocialPostStatus;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        visibility: import(".prisma/client").$Enums.SocialPostVisibility;
        publishedAt: Date | null;
        contentType: import(".prisma/client").$Enums.SocialPostContentType;
        caption: string | null;
        hashtags: string[];
        allowComments: boolean;
        isPinned: boolean;
        likeCount: number;
        commentCount: number;
        shareCount: number;
        saveCount: number;
        viewCount: number;
        playCount: number;
        authorId: string;
    }>;
    updatePostStatus(id: string, userId: string, action: string): Promise<{
        id: string;
        isFeatured: boolean;
        status: import(".prisma/client").$Enums.SocialPostStatus;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        visibility: import(".prisma/client").$Enums.SocialPostVisibility;
        publishedAt: Date | null;
        contentType: import(".prisma/client").$Enums.SocialPostContentType;
        caption: string | null;
        hashtags: string[];
        allowComments: boolean;
        isPinned: boolean;
        likeCount: number;
        commentCount: number;
        shareCount: number;
        saveCount: number;
        viewCount: number;
        playCount: number;
        authorId: string;
    }>;
    deletePost(id: string, userId: string): Promise<void>;
    restorePost(id: string, userId: string): Promise<void>;
    attachMedia(postId: string, userId: string, mediaItems: any[]): Promise<{
        url: string;
        id: string;
        displayOrder: number;
        createdAt: Date;
        width: number | null;
        height: number | null;
        mediaType: import(".prisma/client").$Enums.SocialMediaType;
        altText: string | null;
        thumbnailUrl: string | null;
        size: number;
        mimeType: string;
        postId: string;
        duration: import("@prisma/client-runtime-utils").Decimal | null;
        mediumUrl: string | null;
        largeUrl: string | null;
        s3Key: string;
    }[]>;
    tagProducts(postId: string, userId: string, productTags: any[]): Promise<{
        id: string;
        displayOrder: number;
        createdAt: Date;
        productId: string;
        variantId: string | null;
        label: string | null;
        postId: string;
        tagX: import("@prisma/client-runtime-utils").Decimal | null;
        tagY: import("@prisma/client-runtime-utils").Decimal | null;
    }[]>;
    interact(postId: string, userId: string, action: string, extra: any): Promise<{
        id: string;
        isFeatured: boolean;
        status: import(".prisma/client").$Enums.SocialPostStatus;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        visibility: import(".prisma/client").$Enums.SocialPostVisibility;
        publishedAt: Date | null;
        contentType: import(".prisma/client").$Enums.SocialPostContentType;
        caption: string | null;
        hashtags: string[];
        allowComments: boolean;
        isPinned: boolean;
        likeCount: number;
        commentCount: number;
        shareCount: number;
        saveCount: number;
        viewCount: number;
        playCount: number;
        authorId: string;
    } | {
        id: string;
        createdAt: Date;
        channel: string | null;
        userId: string | null;
        postId: string;
        guestId: string | null;
    } | {
        id: string;
        createdAt: Date;
        userId: string | null;
        postId: string;
        guestId: string | null;
        watchDuration: number | null;
        completionPercentage: import("@prisma/client-runtime-utils").Decimal | null;
        sessionId: string | null;
        viewType: string;
    } | null>;
    getUploadUrl(postId: string, type: 'IMAGE' | 'VIDEO', extension: string): Promise<{
        uploadUrl: string;
        s3Key: string;
        url: string;
    }>;
    addComment(postId: string, userId: string, content: string, parentId?: string): Promise<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    }>;
    updateComment(commentId: string, userId: string, content: string): Promise<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    }>;
    deleteComment(commentId: string, userId: string, userType: string): Promise<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    } | null>;
    getComments(postId: string, query: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            user: {
                id: string;
                firstName: string;
                lastName: string | null;
                avatar: string | null;
            };
            replies: ({
                user: {
                    id: string;
                    firstName: string;
                    lastName: string | null;
                    avatar: string | null;
                };
            } & {
                id: string;
                parentId: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                userId: string;
                postId: string;
            })[];
        } & {
            id: string;
            parentId: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            userId: string;
            postId: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    reportPost(postId: string, reporterId: string, reason: string, description?: string): Promise<{
        id: string;
        description: string | null;
        status: import(".prisma/client").$Enums.SocialReportStatus;
        createdAt: Date;
        updatedAt: Date;
        reason: import(".prisma/client").$Enums.SocialReportReason;
        postId: string;
        resolution: string | null;
        reporterId: string;
        reviewedAt: Date | null;
        reviewedBy: string | null;
    }>;
    resolveReport(reportId: string, userId: string, action: 'DISMISS' | 'MARK_REVIEWED' | 'TAKE_ACTION', resolution?: string): Promise<{
        id: string;
        description: string | null;
        status: import(".prisma/client").$Enums.SocialReportStatus;
        createdAt: Date;
        updatedAt: Date;
        reason: import(".prisma/client").$Enums.SocialReportReason;
        postId: string;
        resolution: string | null;
        reporterId: string;
        reviewedAt: Date | null;
        reviewedBy: string | null;
    }>;
    getFeed(query: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        data: ({
            products: ({
                product: {
                    id: string;
                    slug: string;
                    name: string;
                    basePrice: import("@prisma/client-runtime-utils").Decimal;
                    salePrice: import("@prisma/client-runtime-utils").Decimal | null;
                    media: {
                        url: string;
                    }[];
                };
                variant: {
                    id: string;
                    sku: string;
                    title: string;
                    priceOverride: import("@prisma/client-runtime-utils").Decimal | null;
                    salePriceOverride: import("@prisma/client-runtime-utils").Decimal | null;
                } | null;
            } & {
                id: string;
                displayOrder: number;
                createdAt: Date;
                productId: string;
                variantId: string | null;
                label: string | null;
                postId: string;
                tagX: import("@prisma/client-runtime-utils").Decimal | null;
                tagY: import("@prisma/client-runtime-utils").Decimal | null;
            })[];
            media: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                width: number | null;
                height: number | null;
                mediaType: import(".prisma/client").$Enums.SocialMediaType;
                altText: string | null;
                thumbnailUrl: string | null;
                size: number;
                mimeType: string;
                postId: string;
                duration: import("@prisma/client-runtime-utils").Decimal | null;
                mediumUrl: string | null;
                largeUrl: string | null;
                s3Key: string;
            }[];
        } & {
            id: string;
            isFeatured: boolean;
            status: import(".prisma/client").$Enums.SocialPostStatus;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            visibility: import(".prisma/client").$Enums.SocialPostVisibility;
            publishedAt: Date | null;
            contentType: import(".prisma/client").$Enums.SocialPostContentType;
            caption: string | null;
            hashtags: string[];
            allowComments: boolean;
            isPinned: boolean;
            likeCount: number;
            commentCount: number;
            shareCount: number;
            saveCount: number;
            viewCount: number;
            playCount: number;
            authorId: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getReels(query: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            products: ({
                product: {
                    id: string;
                    slug: string;
                    name: string;
                    basePrice: import("@prisma/client-runtime-utils").Decimal;
                    salePrice: import("@prisma/client-runtime-utils").Decimal | null;
                    media: {
                        url: string;
                    }[];
                };
                variant: {
                    id: string;
                    sku: string;
                    title: string;
                    priceOverride: import("@prisma/client-runtime-utils").Decimal | null;
                    salePriceOverride: import("@prisma/client-runtime-utils").Decimal | null;
                } | null;
            } & {
                id: string;
                displayOrder: number;
                createdAt: Date;
                productId: string;
                variantId: string | null;
                label: string | null;
                postId: string;
                tagX: import("@prisma/client-runtime-utils").Decimal | null;
                tagY: import("@prisma/client-runtime-utils").Decimal | null;
            })[];
            media: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                width: number | null;
                height: number | null;
                mediaType: import(".prisma/client").$Enums.SocialMediaType;
                altText: string | null;
                thumbnailUrl: string | null;
                size: number;
                mimeType: string;
                postId: string;
                duration: import("@prisma/client-runtime-utils").Decimal | null;
                mediumUrl: string | null;
                largeUrl: string | null;
                s3Key: string;
            }[];
        } & {
            id: string;
            isFeatured: boolean;
            status: import(".prisma/client").$Enums.SocialPostStatus;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            visibility: import(".prisma/client").$Enums.SocialPostVisibility;
            publishedAt: Date | null;
            contentType: import(".prisma/client").$Enums.SocialPostContentType;
            caption: string | null;
            hashtags: string[];
            allowComments: boolean;
            isPinned: boolean;
            likeCount: number;
            commentCount: number;
            shareCount: number;
            saveCount: number;
            viewCount: number;
            playCount: number;
            authorId: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getTrending(query: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            products: ({
                product: {
                    id: string;
                    slug: string;
                    name: string;
                    basePrice: import("@prisma/client-runtime-utils").Decimal;
                    salePrice: import("@prisma/client-runtime-utils").Decimal | null;
                    media: {
                        url: string;
                    }[];
                };
                variant: {
                    id: string;
                    sku: string;
                    title: string;
                    priceOverride: import("@prisma/client-runtime-utils").Decimal | null;
                    salePriceOverride: import("@prisma/client-runtime-utils").Decimal | null;
                } | null;
            } & {
                id: string;
                displayOrder: number;
                createdAt: Date;
                productId: string;
                variantId: string | null;
                label: string | null;
                postId: string;
                tagX: import("@prisma/client-runtime-utils").Decimal | null;
                tagY: import("@prisma/client-runtime-utils").Decimal | null;
            })[];
            media: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                width: number | null;
                height: number | null;
                mediaType: import(".prisma/client").$Enums.SocialMediaType;
                altText: string | null;
                thumbnailUrl: string | null;
                size: number;
                mimeType: string;
                postId: string;
                duration: import("@prisma/client-runtime-utils").Decimal | null;
                mediumUrl: string | null;
                largeUrl: string | null;
                s3Key: string;
            }[];
        } & {
            id: string;
            isFeatured: boolean;
            status: import(".prisma/client").$Enums.SocialPostStatus;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            visibility: import(".prisma/client").$Enums.SocialPostVisibility;
            publishedAt: Date | null;
            contentType: import(".prisma/client").$Enums.SocialPostContentType;
            caption: string | null;
            hashtags: string[];
            allowComments: boolean;
            isPinned: boolean;
            likeCount: number;
            commentCount: number;
            shareCount: number;
            saveCount: number;
            viewCount: number;
            playCount: number;
            authorId: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getSaved(userId: string, query: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            products: ({
                product: {
                    id: string;
                    slug: string;
                    name: string;
                    basePrice: import("@prisma/client-runtime-utils").Decimal;
                    salePrice: import("@prisma/client-runtime-utils").Decimal | null;
                    media: {
                        url: string;
                    }[];
                };
            } & {
                id: string;
                displayOrder: number;
                createdAt: Date;
                productId: string;
                variantId: string | null;
                label: string | null;
                postId: string;
                tagX: import("@prisma/client-runtime-utils").Decimal | null;
                tagY: import("@prisma/client-runtime-utils").Decimal | null;
            })[];
            media: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                width: number | null;
                height: number | null;
                mediaType: import(".prisma/client").$Enums.SocialMediaType;
                altText: string | null;
                thumbnailUrl: string | null;
                size: number;
                mimeType: string;
                postId: string;
                duration: import("@prisma/client-runtime-utils").Decimal | null;
                mediumUrl: string | null;
                largeUrl: string | null;
                s3Key: string;
            }[];
        } & {
            id: string;
            isFeatured: boolean;
            status: import(".prisma/client").$Enums.SocialPostStatus;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            visibility: import(".prisma/client").$Enums.SocialPostVisibility;
            publishedAt: Date | null;
            contentType: import(".prisma/client").$Enums.SocialPostContentType;
            caption: string | null;
            hashtags: string[];
            allowComments: boolean;
            isPinned: boolean;
            likeCount: number;
            commentCount: number;
            shareCount: number;
            saveCount: number;
            viewCount: number;
            playCount: number;
            authorId: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getAdminPosts(query: {
        contentType?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            media: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                width: number | null;
                height: number | null;
                mediaType: import(".prisma/client").$Enums.SocialMediaType;
                altText: string | null;
                thumbnailUrl: string | null;
                size: number;
                mimeType: string;
                postId: string;
                duration: import("@prisma/client-runtime-utils").Decimal | null;
                mediumUrl: string | null;
                largeUrl: string | null;
                s3Key: string;
            }[];
        } & {
            id: string;
            isFeatured: boolean;
            status: import(".prisma/client").$Enums.SocialPostStatus;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            visibility: import(".prisma/client").$Enums.SocialPostVisibility;
            publishedAt: Date | null;
            contentType: import(".prisma/client").$Enums.SocialPostContentType;
            caption: string | null;
            hashtags: string[];
            allowComments: boolean;
            isPinned: boolean;
            likeCount: number;
            commentCount: number;
            shareCount: number;
            saveCount: number;
            viewCount: number;
            playCount: number;
            authorId: string;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getAdminReports(query: {
        status?: string;
        reason?: string;
        postId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: ({
            post: {
                id: string;
                contentType: import(".prisma/client").$Enums.SocialPostContentType;
                caption: string | null;
            };
            reporter: {
                id: string;
                email: string;
                firstName: string;
                lastName: string | null;
            };
        } & {
            id: string;
            description: string | null;
            status: import(".prisma/client").$Enums.SocialReportStatus;
            createdAt: Date;
            updatedAt: Date;
            reason: import(".prisma/client").$Enums.SocialReportReason;
            postId: string;
            resolution: string | null;
            reporterId: string;
            reviewedAt: Date | null;
            reviewedBy: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getAnalyticsSummary(): Promise<{
        totalPosts: number;
        totalLikes: number;
        totalComments: number;
        totalSaves: number;
        totalShares: number;
        totalViews: number;
        totalPlays: number;
        topPosts: ({
            media: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                width: number | null;
                height: number | null;
                mediaType: import(".prisma/client").$Enums.SocialMediaType;
                altText: string | null;
                thumbnailUrl: string | null;
                size: number;
                mimeType: string;
                postId: string;
                duration: import("@prisma/client-runtime-utils").Decimal | null;
                mediumUrl: string | null;
                largeUrl: string | null;
                s3Key: string;
            }[];
        } & {
            id: string;
            isFeatured: boolean;
            status: import(".prisma/client").$Enums.SocialPostStatus;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            visibility: import(".prisma/client").$Enums.SocialPostVisibility;
            publishedAt: Date | null;
            contentType: import(".prisma/client").$Enums.SocialPostContentType;
            caption: string | null;
            hashtags: string[];
            allowComments: boolean;
            isPinned: boolean;
            likeCount: number;
            commentCount: number;
            shareCount: number;
            saveCount: number;
            viewCount: number;
            playCount: number;
            authorId: string;
        })[];
    }>;
    getEngagementTimeline(days: number): Promise<{
        date: string;
        likes: number;
        comments: number;
        shares: number;
        plays: number;
    }[]>;
}
