export declare class CreateMediaDto {
    productId: string;
    variantId?: string;
    colorGroupId?: string;
    mediaType: string;
    title?: string;
    altText?: string;
    url: string;
    thumbnailUrl?: string;
    displayOrder?: number;
    isPrimary?: boolean;
    color?: string;
}
export declare class UpdateMediaDto {
    colorGroupId?: string;
    title?: string;
    altText?: string;
    url?: string;
    thumbnailUrl?: string;
    displayOrder?: number;
    isPrimary?: boolean;
    color?: string;
}
export declare class MediaQueryDto {
    productId?: string;
    variantId?: string;
    mediaType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class ReorderMediaDto {
    items: {
        id: string;
        displayOrder: number;
    }[];
}
export declare class MediaResponse {
    id: string;
    productId: string;
    variantId?: string;
    mediaType: string;
    title?: string;
    altText?: string;
    url: string;
    thumbnailUrl?: string;
    displayOrder: number;
    isPrimary: boolean;
    status: string;
    color?: string;
    colorGroupId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MediaListResponse {
    data: MediaResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
