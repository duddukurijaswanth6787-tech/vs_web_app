import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../domains/audit/audit.service";
import { CacheService } from "../../infrastructure/redis";
import { UpdateWebsiteSettingDto, UpdateHomepageSectionDto, CreateHomepageCategoryDto, ReorderDto, UpdateSocialLinkDto, CreateFooterLinkDto, UpdateFooterLinkDto, UpdateFeatureToggleDto, BulkFeatureToggleDto, NewsletterQueryDto } from './storefront.types';
export declare class StorefrontService {
    private readonly prisma;
    private readonly auditService;
    private readonly cache;
    constructor(prisma: PrismaService, auditService: AuditService, cache: CacheService);
    getSettings(): Promise<{
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        logo: string | null;
        storeName: string;
        storeDescription: string | null;
        favicon: string | null;
        supportEmail: string | null;
        supportPhone: string | null;
        whatsappNumber: string | null;
        supportHours: string | null;
        companyAddress: string | null;
        currency: string;
        timezone: string;
        language: string;
        copyrightText: string | null;
        maintenanceMode: boolean;
        metaTitle: string | null;
        metaDescription: string | null;
        metaKeywords: string | null;
    }>;
    updateSettings(dto: UpdateWebsiteSettingDto, userId: string): Promise<{
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        logo: string | null;
        storeName: string;
        storeDescription: string | null;
        favicon: string | null;
        supportEmail: string | null;
        supportPhone: string | null;
        whatsappNumber: string | null;
        supportHours: string | null;
        companyAddress: string | null;
        currency: string;
        timezone: string;
        language: string;
        copyrightText: string | null;
        maintenanceMode: boolean;
        metaTitle: string | null;
        metaDescription: string | null;
        metaKeywords: string | null;
    }>;
    getHomepage(): Promise<{
        id: string;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        startDate: Date | null;
        endDate: Date | null;
        key: string;
        enabled: boolean;
    }[]>;
    updateHomepage(sections: {
        key: string;
        data: UpdateHomepageSectionDto;
    }[], userId: string): Promise<{
        id: string;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        startDate: Date | null;
        endDate: Date | null;
        key: string;
        enabled: boolean;
    }[]>;
    reorderHomepage(dto: ReorderDto): Promise<{
        id: string;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        startDate: Date | null;
        endDate: Date | null;
        key: string;
        enabled: boolean;
    }[]>;
    getHomepageCategories(): Promise<({
        category: {
            path: string;
            id: string;
            slug: string;
            name: string;
            description: string | null;
            icon: string | null;
            image: string | null;
            bannerImage: string | null;
            parentId: string | null;
            level: number;
            displayOrder: number;
            isFeatured: boolean;
            isVisible: boolean;
            isMenuVisible: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string | null;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        enabled: boolean;
    })[]>;
    addHomepageCategory(dto: CreateHomepageCategoryDto): Promise<{
        category: {
            path: string;
            id: string;
            slug: string;
            name: string;
            description: string | null;
            icon: string | null;
            image: string | null;
            bannerImage: string | null;
            parentId: string | null;
            level: number;
            displayOrder: number;
            isFeatured: boolean;
            isVisible: boolean;
            isMenuVisible: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string | null;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        enabled: boolean;
    }>;
    removeHomepageCategory(id: string): Promise<void>;
    reorderHomepageCategories(dto: ReorderDto): Promise<({
        category: {
            path: string;
            id: string;
            slug: string;
            name: string;
            description: string | null;
            icon: string | null;
            image: string | null;
            bannerImage: string | null;
            parentId: string | null;
            level: number;
            displayOrder: number;
            isFeatured: boolean;
            isVisible: boolean;
            isMenuVisible: boolean;
            seoTitle: string | null;
            seoDescription: string | null;
            seoKeywords: string | null;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        enabled: boolean;
    })[]>;
    getFeatures(): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.FeatureCategory;
        key: string;
        enabled: boolean;
    }[]>;
    updateFeature(key: string, dto: UpdateFeatureToggleDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.FeatureCategory;
        key: string;
        enabled: boolean;
    }>;
    bulkUpdateFeatures(dto: BulkFeatureToggleDto, userId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.FeatureCategory;
        key: string;
        enabled: boolean;
    }[]>;
    getFooter(): Promise<({
        links: {
            url: string;
            id: string;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            enabled: boolean;
            footerSectionId: string;
            openInNewTab: boolean;
        }[];
    } & {
        id: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        key: string;
        enabled: boolean;
    })[]>;
    getFooterAdmin(): Promise<({
        links: {
            url: string;
            id: string;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            enabled: boolean;
            footerSectionId: string;
            openInNewTab: boolean;
        }[];
    } & {
        id: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        key: string;
        enabled: boolean;
    })[]>;
    addFooterLink(dto: CreateFooterLinkDto): Promise<{
        url: string;
        id: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        enabled: boolean;
        footerSectionId: string;
        openInNewTab: boolean;
    }>;
    updateFooterLink(id: string, dto: UpdateFooterLinkDto): Promise<{
        url: string;
        id: string;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        enabled: boolean;
        footerSectionId: string;
        openInNewTab: boolean;
    }>;
    deleteFooterLink(id: string): Promise<void>;
    getSocialLinks(): Promise<{
        url: string;
        id: string;
        icon: string | null;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        enabled: boolean;
        platform: import(".prisma/client").$Enums.SocialPlatform;
    }[]>;
    updateSocialLink(platform: string, dto: UpdateSocialLinkDto): Promise<{
        url: string;
        id: string;
        icon: string | null;
        displayOrder: number;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        enabled: boolean;
        platform: import(".prisma/client").$Enums.SocialPlatform;
    }>;
    getNewsletters(query: NewsletterQueryDto): Promise<{
        data: {
            id: string;
            status: import(".prisma/client").$Enums.NewsletterStatus;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            source: string | null;
            subscribedAt: Date;
            unsubscribedAt: Date | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    removeNewsletter(id: string): Promise<void>;
    exportNewsletters(): Promise<{
        email: string;
        source: string | null;
        subscribedAt: Date;
    }[]>;
    getFeatureToggles(): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.FeatureCategory;
        key: string;
        enabled: boolean;
    }[]>;
    updateFeatureToggle(key: string, enabled: boolean): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.FeatureCategory;
        key: string;
        enabled: boolean;
    }>;
    getPublicFeatureToggles(): Promise<Record<string, boolean>>;
}
