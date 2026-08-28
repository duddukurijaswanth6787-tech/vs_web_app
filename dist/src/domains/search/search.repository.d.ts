import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class SearchRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getRankedProductIds;
    search(params: {
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
        sortBy: string;
        sortOrder: 'asc' | 'desc';
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            brand: {
                id: string;
                slug: string;
                name: string;
                description: string | null;
                bannerImage: string | null;
                displayOrder: number;
                isFeatured: boolean;
                isVisible: boolean;
                seoTitle: string | null;
                seoDescription: string | null;
                seoKeywords: string | null;
                status: string;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                logo: string | null;
                website: string | null;
            };
            _count: {
                sizeChartTemplate: number;
                customerRecommendations: number;
                orderItems: number;
                quotationItems: number;
                attributeValues: number;
                categories: number;
                colorGroups: number;
                media: number;
                relatedTo: number;
                relatedFrom: number;
                variants: number;
                brand: number;
                recentlyViewed: number;
                reviews: number;
                cartItems: number;
                socialPosts: number;
                wishlistItems: number;
            };
            sizeChartTemplate: {
                id: string;
                slug: string;
                name: string;
                description: string | null;
                status: string;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                garmentType: string | null;
                unit: string;
            } | null;
            customerRecommendations: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                type: string;
                productId: string;
                isActive: boolean;
                customerId: string;
                reason: string | null;
                score: Prisma.Decimal;
            }[];
            orderItems: {
                id: string;
                createdAt: Date;
                sku: string;
                productId: string;
                variantId: string | null;
                orderId: string;
                productName: string;
                variantTitle: string | null;
                quantity: number;
                unitPrice: Prisma.Decimal;
                totalPrice: Prisma.Decimal;
                taxAmount: Prisma.Decimal;
                discountAmount: Prisma.Decimal;
            }[];
            quotationItems: {
                id: string;
                createdAt: Date;
                sku: string;
                productId: string;
                variantId: string | null;
                productName: string;
                variantTitle: string | null;
                quantity: number;
                unitPrice: Prisma.Decimal;
                totalPrice: Prisma.Decimal;
                taxAmount: Prisma.Decimal;
                discountAmount: Prisma.Decimal;
                quotationId: string;
                discountPercent: Prisma.Decimal;
                taxPercent: Prisma.Decimal;
            }[];
            attributeValues: {
                productId: string;
                value: string | null;
                attributeId: string;
            }[];
            categories: {
                createdAt: Date;
                productId: string;
                categoryId: string;
            }[];
            colorGroups: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                isActive: boolean;
                label: string | null;
                colorAttributeOptionId: string;
                sortOrder: number;
            }[];
            media: {
                url: string;
                id: string;
                displayOrder: number;
                status: string;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                mediaType: string;
                title: string | null;
                altText: string | null;
                thumbnailUrl: string | null;
                isPrimary: boolean;
                color: string | null;
                variantId: string | null;
                colorGroupId: string | null;
            }[];
            relatedTo: {
                productId: string;
                relatedProductId: string;
            }[];
            relatedFrom: {
                productId: string;
                relatedProductId: string;
            }[];
            variants: {
                length: Prisma.Decimal | null;
                id: string;
                displayOrder: number;
                status: string;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                isDefault: boolean;
                sku: string;
                barcode: string;
                costPrice: Prisma.Decimal | null;
                weight: Prisma.Decimal | null;
                width: Prisma.Decimal | null;
                height: Prisma.Decimal | null;
                productId: string;
                title: string;
                colorGroupId: string | null;
                priceOverride: Prisma.Decimal | null;
                salePriceOverride: Prisma.Decimal | null;
                isActive: boolean;
            }[];
            recentlyViewed: {
                id: string;
                productId: string;
                customerId: string;
                viewedAt: Date;
            }[];
            reviews: {
                id: string;
                status: string;
                createdBy: string | null;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                title: string | null;
                customerId: string;
                rating: number;
                comment: string | null;
                isVerifiedPurchase: boolean;
                isApproved: boolean;
                helpfulCount: number;
                unhelpfulCount: number;
                reportCount: number;
            }[];
            cartItems: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                productId: string;
                variantId: string | null;
                quantity: number;
                unitPrice: Prisma.Decimal;
                totalPrice: Prisma.Decimal;
                cartId: string;
                savedForLater: boolean;
            }[];
            socialPosts: {
                id: string;
                displayOrder: number;
                createdAt: Date;
                productId: string;
                variantId: string | null;
                label: string | null;
                postId: string;
                tagX: Prisma.Decimal | null;
                tagY: Prisma.Decimal | null;
            }[];
            wishlistItems: {
                id: string;
                createdAt: Date;
                productId: string;
                variantId: string | null;
                notes: string | null;
                wishlistId: string;
            }[];
        } & {
            length: Prisma.Decimal | null;
            id: string;
            slug: string;
            name: string;
            description: string | null;
            displayOrder: number;
            isFeatured: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string | null;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            barcode: string;
            shortDescription: string | null;
            brandId: string;
            type: string;
            visibility: string;
            basePrice: Prisma.Decimal;
            salePrice: Prisma.Decimal | null;
            wholesalePrice: Prisma.Decimal | null;
            costPrice: Prisma.Decimal | null;
            taxPercentage: Prisma.Decimal | null;
            discountType: string | null;
            discountValue: Prisma.Decimal | null;
            trackInventory: boolean;
            allowBackorder: boolean;
            minimumOrderQuantity: number;
            maximumOrderQuantity: number;
            weight: Prisma.Decimal | null;
            width: Prisma.Decimal | null;
            height: Prisma.Decimal | null;
            isNewArrival: boolean;
            isBestSeller: boolean;
            isPublished: boolean;
            publishedAt: Date | null;
            canonicalUrl: string | null;
            searchKeywords: string | null;
            gender: string | null;
            ageGroup: string | null;
            occasion: string | null;
            season: string | null;
            tags: string[];
            collections: string[];
            highlights: string[];
            isTrending: boolean;
            taxInclusive: boolean;
            hsnCode: string | null;
            sizeChartTemplateId: string | null;
            isLimitedStock: boolean;
            isFestivePick: boolean;
            isExclusive: boolean;
            isOnlineOnly: boolean;
            channel: string;
            warrantyInfo: string | null;
            careInstructions: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getAvailableFilters(baseWhere: Prisma.ProductWhereInput): Promise<{
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
    }>;
    globalSearch(q: string, limit: number): Promise<{
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
            grandTotal: Prisma.Decimal;
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
    autocomplete(q: string, limit: number): Promise<{
        products: {
            id: string;
            name: string;
            slug: string;
            basePrice: number;
        }[];
        suggestions: string[];
    }>;
}
