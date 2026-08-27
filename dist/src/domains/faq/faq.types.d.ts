export declare class CreateFaqDto {
    question: string;
    answer: string;
    slug?: string;
    category?: string;
    displayOrder?: number;
    isActive?: boolean;
}
export declare class UpdateFaqDto {
    question?: string;
    answer?: string;
    category?: string;
    displayOrder?: number;
    isActive?: boolean;
}
export declare class FaqResponse {
    id: string;
    question: string;
    answer: string;
    slug: string;
    category?: string;
    displayOrder: number;
    isActive: boolean;
    helpfulCount: number;
    createdAt: Date;
}
export declare class FaqQueryDto {
    search?: string;
    category?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
