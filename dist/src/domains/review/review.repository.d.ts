import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class ReviewRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        productId?: string;
        customerId?: string;
        rating?: number;
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            images: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                altText: string | null;
                reviewId: string;
            }[];
        } & {
            id: string;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            title: string | null;
            customerId: string;
            rating: number;
            comment: string | null;
            isVerifiedPurchase: boolean;
            isApproved: boolean;
            helpfulCount: number;
            unhelpfulCount: number;
            reportCount: number;
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
    findById(id: string): Promise<({
        images: {
            url: string;
            id: string;
            displayOrder: number;
            createdAt: Date;
            altText: string | null;
            reviewId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        title: string | null;
        customerId: string;
        rating: number;
        comment: string | null;
        isVerifiedPurchase: boolean;
        isApproved: boolean;
        helpfulCount: number;
        unhelpfulCount: number;
        reportCount: number;
    }) | null>;
    create(data: Prisma.ReviewCreateInput): Promise<{
        images: {
            url: string;
            id: string;
            displayOrder: number;
            createdAt: Date;
            altText: string | null;
            reviewId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        title: string | null;
        customerId: string;
        rating: number;
        comment: string | null;
        isVerifiedPurchase: boolean;
        isApproved: boolean;
        helpfulCount: number;
        unhelpfulCount: number;
        reportCount: number;
    }>;
    update(id: string, data: Prisma.ReviewUpdateInput): Promise<{
        images: {
            url: string;
            id: string;
            displayOrder: number;
            createdAt: Date;
            altText: string | null;
            reviewId: string;
        }[];
    } & {
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        title: string | null;
        customerId: string;
        rating: number;
        comment: string | null;
        isVerifiedPurchase: boolean;
        isApproved: boolean;
        helpfulCount: number;
        unhelpfulCount: number;
        reportCount: number;
    }>;
    createImage(data: Prisma.ReviewImageCreateInput): Promise<{
        url: string;
        id: string;
        displayOrder: number;
        createdAt: Date;
        altText: string | null;
        reviewId: string;
    }>;
    vote(reviewId: string, userId: string, isHelpful: boolean): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        reviewId: string;
        isHelpful: boolean;
    }>;
    getProductRatingSummary(productId: string): Promise<{
        averageRating: number;
        totalReviews: number;
        ratingDistribution: Record<number, number>;
    }>;
    findAllForProduct(params: {
        productId: string;
        page: number;
        limit: number;
        sort?: string;
        rating?: number;
        verifiedPurchase?: boolean;
        imagesOnly?: boolean;
    }): Promise<{
        data: ({
            customer: {
                user: {
                    firstName: string;
                    lastName: string | null;
                    avatar: string | null;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                phone: string | null;
                gender: string | null;
                userId: string;
                profileImage: string | null;
                dateOfBirth: Date | null;
                preferredLanguage: string;
                preferredCurrency: string;
                preferredCategories: string[];
                preferredBrands: string[];
                preferredSizes: string[];
                preferredColors: string[];
                preferredPriceMin: Prisma.Decimal | null;
                preferredPriceMax: Prisma.Decimal | null;
                companyName: string | null;
                gstin: string | null;
                taxExempt: boolean;
            };
            images: {
                url: string;
                id: string;
                displayOrder: number;
                createdAt: Date;
                altText: string | null;
                reviewId: string;
            }[];
        } & {
            id: string;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            title: string | null;
            customerId: string;
            rating: number;
            comment: string | null;
            isVerifiedPurchase: boolean;
            isApproved: boolean;
            helpfulCount: number;
            unhelpfulCount: number;
            reportCount: number;
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
    softDelete(id: string): Promise<{
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        title: string | null;
        customerId: string;
        rating: number;
        comment: string | null;
        isVerifiedPurchase: boolean;
        isApproved: boolean;
        helpfulCount: number;
        unhelpfulCount: number;
        reportCount: number;
    }>;
    report(reviewId: string, userId: string, reason: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        reason: string;
        reviewId: string;
    }>;
    incrementReportCount(reviewId: string): Promise<{
        id: string;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        title: string | null;
        customerId: string;
        rating: number;
        comment: string | null;
        isVerifiedPurchase: boolean;
        isApproved: boolean;
        helpfulCount: number;
        unhelpfulCount: number;
        reportCount: number;
    }>;
}
