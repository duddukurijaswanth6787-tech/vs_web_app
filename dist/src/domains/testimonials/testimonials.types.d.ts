export declare class CreateTestimonialDto {
    name: string;
    role?: string;
    comment: string;
    rating?: number;
    avatarUrl?: string;
    location?: string;
    isFeatured?: boolean;
    displayOrder?: number;
}
export declare class UpdateTestimonialDto {
    name?: string;
    role?: string;
    comment?: string;
    rating?: number;
    avatarUrl?: string;
    location?: string;
    isFeatured?: boolean;
    displayOrder?: number;
    status?: string;
}
