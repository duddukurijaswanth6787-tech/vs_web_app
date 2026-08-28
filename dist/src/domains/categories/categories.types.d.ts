export declare class CreateCategoryDto {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    image?: string;
    bannerImage?: string;
    parentId?: string;
    displayOrder?: number;
    isFeatured?: boolean;
    isVisible?: boolean;
    isMenuVisible?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    status?: string;
}
export declare class UpdateCategoryDto {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    image?: string;
    bannerImage?: string;
    displayOrder?: number;
    isFeatured?: boolean;
    isVisible?: boolean;
    isMenuVisible?: boolean;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    status?: string;
}
export declare class MoveCategoryDto {
    newParentId: string;
}
export declare class ReorderItem {
    id: string;
    displayOrder: number;
}
export declare class ReorderCategoriesDto {
    items: ReorderItem[];
}
export declare class CategoryQueryDto {
    search?: string;
    status?: string;
    isFeatured?: boolean;
    isMenuVisible?: boolean;
    isVisible?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class CategoryResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    image?: string;
    bannerImage?: string;
    parentId?: string;
    level: number;
    path: string;
    displayOrder: number;
    isFeatured: boolean;
    isVisible: boolean;
    isMenuVisible: boolean;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class CategoryTreeNode extends CategoryResponse {
    children: CategoryTreeNode[];
}
export declare class CategoryListResponse {
    data: CategoryResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
