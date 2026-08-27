export declare class UpdateWebsiteSettingDto {
    storeName?: string;
    storeDescription?: string;
    logo?: string;
    favicon?: string;
    supportEmail?: string;
    supportPhone?: string;
    whatsappNumber?: string;
    supportHours?: string;
    companyAddress?: string;
    currency?: string;
    timezone?: string;
    language?: string;
    copyrightText?: string;
    maintenanceMode?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
}
export declare class UpdateHomepageSectionDto {
    title?: string;
    description?: string;
    enabled?: boolean;
    displayOrder?: number;
}
export declare class CreateHomepageCategoryDto {
    categoryId: string;
}
export declare class ReorderDto {
    order: string[];
}
export declare class UpdateSocialLinkDto {
    title?: string;
    url?: string;
    icon?: string;
    enabled?: boolean;
    displayOrder?: number;
}
export declare class CreateFooterLinkDto {
    footerSectionId: string;
    title: string;
    url: string;
    openInNewTab?: boolean;
    enabled?: boolean;
    displayOrder?: number;
}
export declare class UpdateFooterLinkDto {
    title?: string;
    url?: string;
    openInNewTab?: boolean;
    enabled?: boolean;
    displayOrder?: number;
}
export declare class UpdateFeatureToggleDto {
    enabled: boolean;
}
export declare class BulkFeatureToggleDto {
    enable: string[];
    disable: string[];
}
export declare class NewsletterSubscribeDto {
    email: string;
    source?: string;
}
export declare class NewsletterQueryDto {
    page?: number;
    limit?: number;
    status?: string;
}
