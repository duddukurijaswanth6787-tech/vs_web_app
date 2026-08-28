export declare class CreateBannerDto {
    title: string;
    description?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    placement: string;
    displayOrder?: number;
    isActive?: boolean;
    ctaEnabled?: boolean;
    ctaStyle?: string;
    startDate?: string;
    endDate?: string;
}
export declare class UpdateBannerDto {
    title?: string;
    description?: string;
    imageUrl?: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    placement?: string;
    displayOrder?: number;
    isActive?: boolean;
    ctaEnabled?: boolean;
    ctaStyle?: string;
    startDate?: string;
    endDate?: string;
}
export declare class CreateCmsPageDto {
    title: string;
    slug: string;
    content?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
}
export declare class UpdateCmsPageDto {
    title?: string;
    slug?: string;
    content?: string;
    metaTitle?: string;
    metaDescription?: string;
    status?: string;
}
export declare class CreateCmsSectionDto {
    name: string;
    slug: string;
    type: string;
    content?: any;
    displayOrder?: number;
    isActive?: boolean;
}
export declare class BannerResponse {
    id: string;
    title: string;
    description?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    placement: string;
    displayOrder: number;
    isActive: boolean;
    ctaEnabled: boolean;
    ctaStyle: string;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
}
export declare class CmsPageResponse {
    id: string;
    title: string;
    slug: string;
    content?: string;
    metaTitle?: string;
    metaDescription?: string;
    status: string;
    createdAt: Date;
}
export declare class CmsSectionResponse {
    id: string;
    name: string;
    slug: string;
    type: string;
    content?: any;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
}
export declare class BannerQueryDto {
    placement?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
export declare class CmsPageQueryDto {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
}
export declare class BannerListResponse {
    data: BannerResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class CmsPageListResponse {
    data: CmsPageResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
