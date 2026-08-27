import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto, ReviewQueryDto } from './review.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    findAll(query: ReviewQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./review.types").ReviewResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getProductRatingSummary(productId: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        averageRating: number;
        totalReviews: number;
        ratingDistribution: Record<number, number>;
    }>>;
    findById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
    create(dto: CreateReviewDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
    update(id: string, dto: UpdateReviewDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
    approve(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
    reject(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
    vote(id: string, isHelpful: boolean, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./review.types").ReviewResponse>>;
}
