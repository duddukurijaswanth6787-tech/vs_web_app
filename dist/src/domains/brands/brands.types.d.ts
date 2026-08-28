export declare class CreateBrandDto {
    name: string;
    slug?: string;
    description?: string;
    logo?: string;
    bannerImage?: string;
    website?: string;
    displayOrder?: number;
    isFeatured?: boolean;
    isVisible?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    status?: string;
}
export declare class UpdateBrandDto {
    name?: string;
    slug?: string;
    description?: string;
    logo?: string;
    bannerImage?: string;
    website?: string;
    displayOrder?: number;
    isFeatured?: boolean;
    isVisible?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    status?: string;
}
export declare class BrandQueryDto {
    search?: string;
    status?: string;
    isFeatured?: boolean;
    isVisible?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class BrandResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    bannerImage?: string;
    website?: string;
    displayOrder: number;
    isFeatured: boolean;
    isVisible: boolean;
    status: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class BrandListResponse {
    data: BrandResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
