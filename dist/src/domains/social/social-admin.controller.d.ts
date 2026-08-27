import type { JwtPayload } from "../auth/services/jwt.service";
import { SocialService } from './social.service';
import { AdminSocialQueryDto, AdminReportsQueryDto, CreateSocialPostDto, UpdateSocialPostDto, UpdatePostStatusDto, PostMediaDto, ProductTagDto, ResolveReportDto } from './social.types';
export declare class SocialAdminController {
    private readonly socialService;
    constructor(socialService: SocialService);
    getPosts(query: AdminSocialQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getAnalyticsSummary(): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getAnalyticsTimeline(days?: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        date: string;
        likes: number;
        comments: number;
        shares: number;
        plays: number;
    }[]>>;
    createPost(dto: CreateSocialPostDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getPostById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    updatePost(id: string, dto: UpdateSocialPostDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    updateStatus(id: string, dto: UpdatePostStatusDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    attachMedia(id: string, dto: PostMediaDto[], user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }[]>>;
    tagProducts(id: string, dto: ProductTagDto[], user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        displayOrder: number;
        createdAt: Date;
        productId: string;
        variantId: string | null;
        label: string | null;
        postId: string;
        tagX: import("@prisma/client-runtime-utils").Decimal | null;
        tagY: import("@prisma/client-runtime-utils").Decimal | null;
    }[]>>;
    getUploadUrl(id: string, body: {
        mediaType: 'IMAGE' | 'VIDEO';
        extension: string;
    }): Promise<import("@common/responses/response.builder").ResponsePayload<{
        uploadUrl: string;
        s3Key: string;
        url: string;
    }>>;
    deletePost(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    restorePost(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    getReports(query: AdminReportsQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    resolveReport(id: string, dto: ResolveReportDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
}
