export declare enum RecommendationType {
    RECENTLY_VIEWED = "RECENTLY_VIEWED",
    FREQUENTLY_PURCHASED = "FREQUENTLY_PURCHASED",
    RECOMMENDED = "RECOMMENDED",
    RECENTLY_PURCHASED = "RECENTLY_PURCHASED",
    WISHLIST_BASED = "WISHLIST_BASED",
    CART_BASED = "CART_BASED"
}
export declare class RecommendationQueryDto {
    type?: RecommendationType;
    page?: number;
    limit?: number;
}
export declare class RecommendationResponse {
    id: string;
    productId: string;
    score: number;
    reason?: string;
    type: RecommendationType;
    createdAt: Date;
}
export declare class RecommendationHistoryQueryDto {
    page?: number;
    limit?: number;
}
