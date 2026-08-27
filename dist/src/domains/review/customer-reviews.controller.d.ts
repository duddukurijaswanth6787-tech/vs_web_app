import { ReviewService } from './review.service';
import { CustomerCreateReviewDto, CustomerUpdateReviewDto, ProductReviewQueryDto, ReportReviewDto } from './review.types';
import { PrismaService } from "../../database/prisma.service";
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class CustomerReviewsController {
    private readonly reviewService;
    private readonly prisma;
    constructor(reviewService: ReviewService, prisma: PrismaService);
    private resolveCustomerId;
    getProductReviews(productId: string, query: ProductReviewQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        summary: {
            averageRating: number;
            totalReviews: number;
            ratingBreakdown: Record<number, number>;
        };
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
    }>>;
    createReview(productId: string, dto: CustomerCreateReviewDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
    getMyReviews(query: ProductReviewQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./review.types").ReviewResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }> | import("@common/responses/response.builder").ResponsePayload<{
        data: never[];
        meta: {};
    }>>;
    getPendingReviews(user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        productId: string;
        productTitle: string;
        productSlug: string;
        productImage: string;
        orderId: string;
        orderNumber: string;
        deliveredAt?: Date | null;
    }[]>>;
    updateReview(reviewId: string, dto: CustomerUpdateReviewDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
    deleteReview(reviewId: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    markHelpful(reviewId: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
    reportReview(reviewId: string, dto: ReportReviewDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
}
