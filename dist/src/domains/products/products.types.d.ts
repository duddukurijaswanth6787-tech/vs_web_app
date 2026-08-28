import { ProductType, ProductStatus, ProductVisibility, ProductChannel, GenderType, AgeGroup } from "../../shared/commerce/commerce.enums";
export declare class CreateProductVariantDto {
    sku: string;
    name: string;
    price: number;
    stock: number;
    color?: string;
    size?: string;
}
export declare class CreateProductMediaDto {
    url: string;
    role: string;
    displayOrder?: number;
}
export declare class ProductAttributeEntry {
    attributeId: string;
    value?: string;
}
export declare class CreateProductDto {
    name: string;
    slug?: string;
    brandId: string;
    shortDescription?: string;
    description?: string;
    type?: ProductType;
    status?: ProductStatus;
    visibility?: ProductVisibility;
    channel?: ProductChannel;
    basePrice: number;
    salePrice?: number;
    wholesalePrice?: number;
    costPrice?: number;
    taxPercentage?: number;
    discountType?: string;
    discountValue?: number;
    trackInventory?: boolean;
    allowBackorder?: boolean;
    minimumOrderQuantity?: number;
    maximumOrderQuantity?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isTrending?: boolean;
    isLimitedStock?: boolean;
    isFestivePick?: boolean;
    isExclusive?: boolean;
    isOnlineOnly?: boolean;
    hsnCode?: string;
    sizeChartTemplateId?: string;
    taxInclusive?: boolean;
    isPublished?: boolean;
    displayOrder?: number;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    canonicalUrl?: string;
    searchKeywords?: string;
    gender?: GenderType;
    ageGroup?: AgeGroup;
    occasion?: string;
    season?: string;
    tags?: string[];
    collections?: string[];
    highlights?: string[];
    categoryIds?: string[];
    attributes?: ProductAttributeEntry[];
    variants?: CreateProductVariantDto[];
    media?: CreateProductMediaDto[];
}
export declare class UpdateProductDto {
    name?: string;
    brandId?: string;
    shortDescription?: string;
    description?: string;
    type?: ProductType;
    status?: string;
    visibility?: string;
    channel?: ProductChannel;
    basePrice?: number;
    salePrice?: number;
    wholesalePrice?: number;
    costPrice?: number;
    taxPercentage?: number;
    discountType?: string;
    discountValue?: number;
    trackInventory?: boolean;
    allowBackorder?: boolean;
    minimumOrderQuantity?: number;
    maximumOrderQuantity?: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isTrending?: boolean;
    isLimitedStock?: boolean;
    isFestivePick?: boolean;
    isExclusive?: boolean;
    isOnlineOnly?: boolean;
    hsnCode?: string;
    sizeChartTemplateId?: string;
    taxInclusive?: boolean;
    isPublished?: boolean;
    displayOrder?: number;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    canonicalUrl?: string;
    searchKeywords?: string;
    slug?: string;
    gender?: GenderType;
    ageGroup?: AgeGroup;
    occasion?: string;
    season?: string;
    tags?: string[];
    collections?: string[];
    highlights?: string[];
}
export declare class ProductQueryDto {
    search?: string;
    brandId?: string;
    status?: string;
    visibility?: string;
    channel?: ProductChannel;
    type?: ProductType;
    gender?: GenderType;
    ageGroup?: AgeGroup;
    occasion?: string;
    season?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isPublished?: boolean;
    minPrice?: number;
    maxPrice?: number;
    categoryId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class AssignCategoriesDto {
    categoryIds: string[];
}
export declare class AssignAttributesDto {
    attributes: ProductAttributeEntry[];
}
export declare class AssignTagsDto {
    tags: string[];
}
export declare class AssignCollectionsDto {
    collections: string[];
}
export declare class AssignRelatedProductsDto {
    relatedProductIds: string[];
}
declare class ProductCategoryInfo {
    categoryId: string;
    categoryName: string;
    categorySlug: string;
}
declare class ProductAttributeInfo {
    attributeId: string;
    attributeName: string;
    attributeType: string;
    value?: string;
}
declare class ProductRelatedInfo {
    productId: string;
    productName: string;
}
export declare class ProductResponse {
    id: string;
    sku: string;
    barcode: string;
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    brandId: string;
    brandName?: string;
    type: string;
    status: string;
    visibility: string;
    channel: string;
    basePrice: number;
    salePrice?: number;
    wholesalePrice?: number;
    costPrice?: number;
    taxPercentage?: number;
    discountType?: string;
    discountValue?: number;
    trackInventory: boolean;
    allowBackorder: boolean;
    minimumOrderQuantity: number;
    maximumOrderQuantity: number;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    isFeatured: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
    isTrending: boolean;
    isLimitedStock: boolean;
    isFestivePick: boolean;
    isExclusive: boolean;
    isOnlineOnly: boolean;
    hsnCode?: string;
    sizeChartTemplateId?: string;
    taxInclusive: boolean;
    isPublished: boolean;
    publishedAt?: Date;
    displayOrder: number;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    canonicalUrl?: string;
    searchKeywords?: string;
    gender?: string;
    ageGroup?: string;
    occasion?: string;
    season?: string;
    tags?: string[];
    collections?: string[];
    highlights?: string[];
    categories?: ProductCategoryInfo[];
    attributes?: ProductAttributeInfo[];
    relatedProducts?: ProductRelatedInfo[];
    primaryImageUrl?: string;
    images?: Array<{
        id: string;
        url: string;
        thumbnailUrl?: string;
        altText?: string;
        isPrimary: boolean;
        mediaType: string;
        color?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ProductListResponse {
    data: ProductResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export {};
