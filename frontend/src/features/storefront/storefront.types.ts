export interface WebsiteSettings {
  id: string;
  storeName: string;
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
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceStartTime?: string;
  maintenanceEndTime?: string;
  whitelistedIps?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  robots?: string;
  canonicalUrl?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  createdAt: string;
  updatedAt: string;
  bannerAutoplayInterval?: number;
  bannerAutoplayEnabled?: boolean;
}

export interface UpdateWebsiteSettingsDto {
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
  maintenanceMessage?: string;
  maintenanceStartTime?: string;
  maintenanceEndTime?: string;
  whitelistedIps?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  robots?: string;
  canonicalUrl?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
}

export interface HomepageSection {
  key: string;
  title?: string;
  description?: string;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateHomepageSectionsDto {
  sections: { key: string; data: { title?: string; description?: string; enabled?: boolean; displayOrder?: number } }[];
}

export interface HomepageCategory {
  id: string;
  categoryId: string;
  displayOrder: number;
  image?: string;
  category: { id: string; name: string; image?: string };
}

export interface CreateHomepageCategoryDto {
  categoryId: string;
  image?: string;
}

export interface ReorderDto {
  order: string[];
}

export interface FeatureToggle {
  key: string;
  name: string;
  description?: string;
  category: string;
  enabled: boolean;
  updatedAt: string;
}

export interface BulkFeatureToggleDto {
  enable: string[];
  disable: string[];
}

export interface FooterSection {
  id: string;
  title: string;
  displayOrder: number;
  enabled: boolean;
  links: FooterLink[];
}

export interface FooterLink {
  id: string;
  footerSectionId: string;
  title: string;
  url: string;
  openInNewTab: boolean;
  enabled: boolean;
  displayOrder: number;
}

export interface CreateFooterLinkDto {
  footerSectionId: string;
  title: string;
  url: string;
  openInNewTab?: boolean;
  enabled?: boolean;
  displayOrder?: number;
}

export interface UpdateFooterLinkDto {
  title?: string;
  url?: string;
  openInNewTab?: boolean;
  enabled?: boolean;
  displayOrder?: number;
}

export interface SocialLink {
  platform: string;
  title?: string;
  url?: string;
  icon?: string;
  enabled: boolean;
  displayOrder: number;
}

export interface UpdateSocialLinkDto {
  title?: string;
  url?: string;
  icon?: string;
  enabled?: boolean;
  displayOrder?: number;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  status: string;
  source?: string;
  subscribedAt: string;
  unsubscribedAt?: string;
}

export interface NewsletterQueryDto {
  status?: string;
  page?: number;
  limit?: number;
}

export interface NewsletterListResponse {
  data: NewsletterSubscription[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface NewsletterExportItem {
  email: string;
  subscribedAt: string;
  source?: string;
}

export interface StorefrontDashboard {
  storeName: string;
  homepageSectionsEnabled: number;
  homepageSectionsTotal: number;
  featuresEnabled: number;
  featuresTotal: number;
  footerLinks: number;
  socialLinks: number;
  newsletterSubscribers: number;
  maintenanceMode: boolean;
}

// ─── Theme (per-section colours, super admin) ────────────

export interface ThemeSection {
  key: string;
  label: string;
  tokens: { token: string; label: string }[];
}

export interface StorefrontTheme {
  /** Saved colours over the built-in defaults -- every token has a value. */
  colors: Record<string, string>;
  /** The built-in palette, for "reset this one". */
  defaults: Record<string, string>;
  sections: ThemeSection[];
}
