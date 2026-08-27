export declare class SearchProductsDto {
    q?: string;
    brandId?: string;
    categoryId?: string;
    gender?: string;
    ageGroup?: string;
    occasion?: string;
    season?: string;
    type?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    collections?: string[];
    attributeFilters?: Record<string, string[]>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export declare class AutocompleteDto {
    q: string;
    limit?: number;
}
declare class FilterOption {
    value: string;
    label: string;
    count: number;
}
declare class AvailableFilters {
    brands?: FilterOption[];
    categories?: FilterOption[];
    genders?: FilterOption[];
    ageGroups?: FilterOption[];
    occasions?: FilterOption[];
    seasons?: FilterOption[];
    types?: FilterOption[];
    tags?: FilterOption[];
    collections?: FilterOption[];
    priceRange?: {
        min: number;
        max: number;
    };
    attributes?: {
        slug: string;
        name: string;
        options: FilterOption[];
    }[];
}
declare class SearchResultProduct {
    id: string;
    name: string;
    slug: string;
    sku: string;
    shortDescription?: string;
    brandId: string;
    brandName?: string;
    basePrice: number;
    salePrice?: number;
    status: string;
    isFeatured: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
    gender?: string;
    ageGroup?: string;
    tags?: string[];
    collections?: string[];
    primaryImage?: string;
    createdAt: Date;
}
export declare class SearchResponse {
    data: SearchResultProduct[];
    appliedFilters: Record<string, any>;
    availableFilters: AvailableFilters;
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class AutocompleteResponse {
    products: {
        id: string;
        name: string;
        slug: string;
        basePrice: number;
    }[];
    suggestions: string[];
}
export declare class SearchListResponse {
    data: SearchResultProduct[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export declare class GlobalSearchDto {
    q: string;
    limit?: number;
}
export declare class GlobalSearchResponse {
    products: {
        id: string;
        name: string;
        sku: string;
        slug: string;
        basePrice: number;
    }[];
    orders: {
        id: string;
        orderNumber: string;
        status: string;
        grandTotal: number;
        currency: string;
    }[];
    customers: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    }[];
    categories: {
        id: string;
        name: string;
        slug: string;
    }[];
    brands: {
        id: string;
        name: string;
        slug: string;
    }[];
    coupons: {
        id: string;
        code: string;
        name: string;
        type: string;
    }[];
}
export {};
