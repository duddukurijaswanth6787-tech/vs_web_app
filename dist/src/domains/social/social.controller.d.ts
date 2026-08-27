import type { Request } from 'express';
import { JwtService } from "../auth/services/jwt.service";
import type { JwtPayload } from "../auth/services/jwt.service";
import { SocialService } from './social.service';
import { SocialFeedQueryDto, SocialReelsQueryDto, SocialInteractionDto, CreateCommentDto, CreateReportDto } from './social.types';
export declare class SocialController {
    private readonly socialService;
    private readonly jwtService;
    constructor(socialService: SocialService, jwtService: JwtService);
    private getOptionalUser;
    getFeed(query: SocialFeedQueryDto, req: Request): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getReels(query: SocialReelsQueryDto, req: Request): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getTrending(query: SocialReelsQueryDto, req: Request): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getPostById(id: string, req: Request): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    interact(id: string, dto: SocialInteractionDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    } | null>>;
    addComment(id: string, dto: CreateCommentDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    }>>;
    getComments(id: string, query: SocialFeedQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    updateComment(id: string, dto: CreateCommentDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        parentId: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        userId: string;
        postId: string;
    }>>;
    deleteComment(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    reportPost(id: string, dto: CreateReportDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getSaved(query: SocialReelsQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
}
