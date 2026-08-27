import { AuditService } from "../audit/audit.service";
import { SearchRepository } from './search.repository';
import { SearchProductsDto, AutocompleteDto, GlobalSearchDto } from './search.types';
export declare class SearchService {
    private readonly searchRepository;
    private readonly auditService;
    constructor(searchRepository: SearchRepository, auditService: AuditService);
    private buildBaseWhere;
    search(query: SearchProductsDto, userId?: string): Promise<{
        data: {
            id: any;
            name: any;
            slug: any;
            sku: any;
            shortDescription: any;
            brandId: any;
            brandName: any;
            basePrice: number;
            salePrice: number | undefined;
            status: any;
            isFeatured: any;
            isNewArrival: any;
            isBestSeller: any;
            gender: any;
            ageGroup: any;
            tags: any;
            collections: any;
            createdAt: any;
        }[];
        appliedFilters: {
            q: string | undefined;
            brandId: string | undefined;
            categoryId: string | undefined;
            gender: string | undefined;
            ageGroup: string | undefined;
            occasion: string | undefined;
            season: string | undefined;
            type: string | undefined;
            isFeatured: boolean | undefined;
            isNewArrival: boolean | undefined;
            isBestSeller: boolean | undefined;
            inStock: boolean | undefined;
            minPrice: number | undefined;
            maxPrice: number | undefined;
            tags: string[] | undefined;
            collections: string[] | undefined;
            attributeFilters: Record<string, string[]> | undefined;
        };
        availableFilters: {
            brands: {
                value: string;
                label: string;
                count: number;
            }[];
            categories: {
                value: string;
                label: string;
                count: number;
            }[];
            genders: {
                value: string;
                label: string;
                count: number;
            }[];
            ageGroups: {
                value: string;
                label: string;
                count: number;
            }[];
            occasions: {
                value: string;
                label: string;
                count: number;
            }[];
            seasons: {
                value: string;
                label: string;
                count: number;
            }[];
            types: {
                value: string;
                label: string;
                count: number;
            }[];
            tags: {
                value: string;
                label: string;
                count: number;
            }[];
            collections: {
                value: string;
                label: string;
                count: number;
            }[];
            priceRange: {
                min: number;
                max: number;
            };
            attributes: {
                slug: string;
                name: string;
                options: {
                    value: string;
                    label: string;
                    count: number;
                }[];
            }[];
        };
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    globalSearch(dto: GlobalSearchDto): Promise<{
        products: {
            basePrice: number;
            id: string;
            slug: string;
            name: string;
            sku: string;
        }[];
        orders: {
            id: string;
            status: string;
            currency: string;
            orderNumber: string;
            grandTotal: import("@prisma/client-runtime-utils").Decimal;
        }[];
        customers: {
            id: string;
            email: string;
            firstName: string;
            lastName: string | null;
        }[];
        categories: {
            id: string;
            slug: string;
            name: string;
        }[];
        brands: {
            id: string;
            slug: string;
            name: string;
        }[];
        coupons: {
            id: string;
            name: string;
            code: string;
            type: string;
        }[];
    }>;
    autocomplete(dto: AutocompleteDto): Promise<{
        products: {
            id: string;
            name: string;
            slug: string;
            basePrice: number;
        }[];
        suggestions: string[];
    }>;
}
