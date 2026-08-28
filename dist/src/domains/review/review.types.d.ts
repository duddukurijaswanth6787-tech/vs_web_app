export declare class CreateReviewDto {
    productId: string;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
}
export declare class UpdateReviewDto {
    rating?: number;
    title?: string;
    comment?: string;
}
export declare class ReviewQueryDto {
    productId?: string;
    customerId?: string;
    rating?: number;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class ReviewImageResponse {
    id: string;
    url: string;
    altText?: string;
    displayOrder: number;
}
export declare class ReviewResponse {
    id: string;
    productId: string;
    customerId: string;
    rating: number;
    title?: string;
    comment?: string;
    isVerifiedPurchase: boolean;
    isApproved: boolean;
    helpfulCount: number;
    unhelpfulCount: number;
    status: string;
    images?: ReviewImageResponse[];
    createdAt: Date;
}
export declare class ReviewListResponse {
    data: ReviewResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class ProductRatingSummary {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}
export declare class CustomerCreateReviewDto {
    rating: number;
    title: string;
    comment: string;
    images?: string[];
}
export declare class CustomerUpdateReviewDto {
    rating?: number;
    title?: string;
    comment?: string;
    images?: string[];
}
export declare class ProductReviewQueryDto {
    page?: number;
    limit?: number;
    sort?: string;
    rating?: number;
    verifiedPurchase?: boolean;
    imagesOnly?: boolean;
}
export declare enum ReportReason {
    SPAM = "Spam",
    ABUSE = "Abuse",
    FAKE = "Fake Review",
    OFFENSIVE = "Offensive",
    OTHER = "Other"
}
export declare class ReportReviewDto {
    reason: ReportReason;
}
