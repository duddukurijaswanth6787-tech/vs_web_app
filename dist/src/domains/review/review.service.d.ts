import { LoggerService } from "../../common/logger/logger.service";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notification/notification.service";
import { ReviewRepository } from './review.repository';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto, ReviewResponse } from './review.types';
import { PrismaService } from "../../database/prisma.service";
export declare class ReviewService {
    private readonly reviewRepository;
    private readonly auditService;
    private readonly loggerService;
    private readonly notificationService;
    private readonly prisma;
    constructor(reviewRepository: ReviewRepository, auditService: AuditService, loggerService: LoggerService, notificationService: NotificationService, prisma: PrismaService);
    private toImageResponse;
    private toResponse;
    findAll(query: ReviewQueryDto): Promise<{
        data: ReviewResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<ReviewResponse>;
    create(userId: string, dto: CreateReviewDto): Promise<ReviewResponse>;
    update(id: string, dto: UpdateReviewDto, userId: string): Promise<ReviewResponse>;
    approve(id: string, userId: string): Promise<ReviewResponse>;
    reject(id: string, userId: string): Promise<ReviewResponse>;
    vote(reviewId: string, userId: string, isHelpful: boolean): Promise<ReviewResponse>;
    getProductRatingSummary(productId: string): Promise<{
        averageRating: number;
        totalReviews: number;
        ratingDistribution: Record<number, number>;
    }>;
    delete(id: string, userId: string): Promise<void>;
    report(reviewId: string, userId: string, reason: string): Promise<void>;
    findForProduct(productId: string, query: {
        page?: number;
        limit?: number;
        sort?: string;
        rating?: number;
        verifiedPurchase?: boolean;
        imagesOnly?: boolean;
    }): Promise<{
        data: {
            id: any;
            rating: any;
            title: any;
            comment: any;
            images: any;
            verifiedPurchase: any;
            helpfulCount: any;
            reportCount: any;
            createdAt: any;
            updatedAt: any;
            user: {
                name: string;
                avatar: any;
            } | undefined;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findMyReviews(userId: string, query: {
        page?: number;
        limit?: number;
        sort?: string;
    }): Promise<{
        data: {
            id: any;
            productId: any;
            rating: any;
            title: any;
            comment: any;
            images: any;
            verifiedPurchase: any;
            helpfulCount: any;
            reportCount: any;
            createdAt: any;
            updatedAt: any;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findPendingReviews(customerId: string): Promise<{
        productId: string;
        productTitle: string;
        productSlug: string;
        productImage: string;
        orderId: string;
        orderNumber: string;
        deliveredAt?: Date | null;
    }[]>;
}
