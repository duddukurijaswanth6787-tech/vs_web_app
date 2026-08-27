import { PrismaService } from "../../database/prisma.service";
export declare class SocialRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createPost(data: {
        authorId: string;
        contentType: string;
        caption?: string;
        hashtags?: string[];
        visibility?: string;
        allowComments?: boolean;
        createdBy?: string;
        productIds?: string[];
    }): Promise<{
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
    findPostById(id: string): Promise<({
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
    }) | null>;
    updatePost(id: string, data: any): Promise<{
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
    deletePost(id: string, userId: string): Promise<{
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
    restorePost(id: string, userId: string): Promise<{
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
    clearPostMedia(postId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    attachPostMedia(postId: string, mediaItems: any[]): Promise<{
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
    clearPostProducts(postId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    attachPostProducts(postId: string, productTags: any[]): Promise<{
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
    toggleLike(postId: string, userId: string, isLike: boolean): Promise<{
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
    } | null>;
    hasUserLiked(postId: string, userId: string): Promise<boolean>;
    toggleBookmark(postId: string, userId: string, isSave: boolean): Promise<{
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
    } | null>;
    hasUserSaved(postId: string, userId: string): Promise<boolean>;
    createComment(postId: string, userId: string, content: string, parentId?: string): Promise<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    }>;
    findCommentById(id: string): Promise<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    } | null>;
    updateComment(id: string, content: string): Promise<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    }>;
    deleteComment(id: string): Promise<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    } | null>;
    getCommentsForPost(postId: string, page: number, limit: number): Promise<{
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
    trackShare(postId: string, userId?: string, channel?: string): Promise<{
        id: string;
        createdAt: Date;
        channel: string | null;
        userId: string | null;
        postId: string;
        guestId: string | null;
    }>;
    trackView(params: {
        postId: string;
        userId?: string;
        guestId?: string;
        sessionId?: string;
        viewType: string;
        watchDuration?: number;
        completionPercentage?: number;
    }): Promise<{
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
    findPendingReportByUser(postId: string, reporterId: string): Promise<{
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
    } | null>;
    createReport(postId: string, reporterId: string, reason: string, description?: string): Promise<{
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
    getCustomerFeed(params: {
        page: number;
        limit: number;
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
    getCustomerReels(params: {
        page: number;
        limit: number;
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
    getCustomerTrending(params: {
        page: number;
        limit: number;
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
    getSavedPosts(userId: string, page: number, limit: number): Promise<{
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
    findAdminPosts(params: {
        contentType?: string;
        status?: string;
        page: number;
        limit: number;
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
    findAdminReports(params: {
        status?: string;
        reason?: string;
        postId?: string;
        page: number;
        limit: number;
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
    findReportById(id: string): Promise<{
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
    } | null>;
    updateReport(id: string, data: any): Promise<{
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
}
