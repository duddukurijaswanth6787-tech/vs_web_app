import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import type {
  WebsiteSettings,
  UpdateWebsiteSettingsDto,
  HomepageSection,
  HomepageCategory,
  CreateHomepageCategoryDto,
  ReorderDto,
  FeatureToggle,
  BulkFeatureToggleDto,
  FooterSection,
  FooterLink,
  CreateFooterLinkDto,
  UpdateFooterLinkDto,
  SocialLink,
  UpdateSocialLinkDto,
  NewsletterListResponse,
  NewsletterExportItem,
  NewsletterQueryDto,
  StorefrontDashboard,
} from './storefront.types';

export const storefrontService = {
  getSettings: async (): Promise<WebsiteSettings> => {
    const r = await apiClient.get<StandardResponse<WebsiteSettings>>('/admin/storefront/settings');
    return r.data.data!;
  },
  updateSettings: async (dto: UpdateWebsiteSettingsDto): Promise<WebsiteSettings> => {
    const r = await apiClient.patch<StandardResponse<WebsiteSettings>>('/admin/storefront/settings', dto);
    return r.data.data!;
  },
  getHomepage: async (): Promise<HomepageSection[]> => {
    const r = await apiClient.get<StandardResponse<HomepageSection[]>>('/admin/storefront/homepage');
    return r.data.data!;
  },
  updateHomepage: async (sections: { key: string; data: Partial<HomepageSection> }[]): Promise<HomepageSection[]> => {
    const r = await apiClient.patch<StandardResponse<HomepageSection[]>>('/admin/storefront/homepage', { sections });
    return r.data.data!;
  },
  reorderHomepage: async (dto: ReorderDto): Promise<HomepageSection[]> => {
    const r = await apiClient.patch<StandardResponse<HomepageSection[]>>('/admin/storefront/homepage/order', dto);
    return r.data.data!;
  },
  getHomepageCategories: async (): Promise<HomepageCategory[]> => {
    const r = await apiClient.get<StandardResponse<HomepageCategory[]>>('/admin/storefront/homepage/categories');
    return r.data.data!;
  },
  addHomepageCategory: async (dto: CreateHomepageCategoryDto): Promise<HomepageCategory> => {
    const r = await apiClient.post<StandardResponse<HomepageCategory>>('/admin/storefront/homepage/categories', dto);
    return r.data.data!;
  },
  removeHomepageCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/storefront/homepage/categories/${id}`);
  },
  reorderHomepageCategories: async (dto: ReorderDto): Promise<HomepageCategory[]> => {
    const r = await apiClient.patch<StandardResponse<HomepageCategory[]>>('/admin/storefront/homepage/categories/order', dto);
    return r.data.data!;
  },
  getFeatures: async (): Promise<FeatureToggle[]> => {
    const r = await apiClient.get<StandardResponse<FeatureToggle[]>>('/admin/storefront/features');
    return r.data.data!;
  },
  updateFeature: async (key: string, enabled: boolean): Promise<FeatureToggle> => {
    const r = await apiClient.patch<StandardResponse<FeatureToggle>>(`/admin/storefront/features/${key}`, { enabled });
    return r.data.data!;
  },
  bulkUpdateFeatures: async (dto: BulkFeatureToggleDto): Promise<FeatureToggle[]> => {
    const r = await apiClient.patch<StandardResponse<FeatureToggle[]>>('/admin/storefront/features', dto);
    return r.data.data!;
  },
  getFooter: async (): Promise<FooterSection[]> => {
    const r = await apiClient.get<StandardResponse<FooterSection[]>>('/admin/storefront/footer');
    return r.data.data!;
  },
  addFooterLink: async (dto: CreateFooterLinkDto): Promise<FooterLink> => {
    const r = await apiClient.post<StandardResponse<FooterLink>>('/admin/storefront/footer/link', dto);
    return r.data.data!;
  },
  updateFooterLink: async (id: string, dto: UpdateFooterLinkDto): Promise<FooterLink> => {
    const r = await apiClient.patch<StandardResponse<FooterLink>>(`/admin/storefront/footer/link/${id}`, dto);
    return r.data.data!;
  },
  deleteFooterLink: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/storefront/footer/link/${id}`);
  },
  getSocialLinks: async (): Promise<SocialLink[]> => {
    const r = await apiClient.get<StandardResponse<SocialLink[]>>('/admin/storefront/social');
    return r.data.data!;
  },
  updateSocialLink: async (platform: string, dto: UpdateSocialLinkDto): Promise<SocialLink> => {
    const r = await apiClient.patch<StandardResponse<SocialLink>>(`/admin/storefront/social/${platform}`, dto);
    return r.data.data!;
  },
  getNewsletters: async (query: NewsletterQueryDto = {}): Promise<NewsletterListResponse> => {
    const params: Record<string, string | number> = {};
    if (query.status) params.status = query.status;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    const r = await apiClient.get<StandardResponse<NewsletterListResponse>>('/admin/storefront/newsletter', { params });
    return r.data.data!;
  },
  removeNewsletter: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/storefront/newsletter/${id}`);
  },
  exportNewsletters: async (): Promise<NewsletterExportItem[]> => {
    const r = await apiClient.get<StandardResponse<NewsletterExportItem[]>>('/admin/storefront/newsletter/export');
    return r.data.data!;
  },
  getDashboard: async (): Promise<StorefrontDashboard> => {
    const [settings, homepage, features, footer, social, newsletter] = await Promise.all([
      storefrontService.getSettings().catch(() => null),
      storefrontService.getHomepage().catch(() => []),
      storefrontService.getFeatures().catch(() => []),
      storefrontService.getFooter().catch(() => []),
      storefrontService.getSocialLinks().catch(() => []),
      storefrontService.getNewsletters({ limit: 1 }).catch(() => ({ data: [], meta: { total: 0 } })),
    ]);
    const secTotal = homepage?.length ?? 0;
    const secEnabled = homepage?.filter(s => s.enabled).length ?? 0;
    return {
      storeName: settings?.storeName ?? 'Not configured',
      homepageSectionsEnabled: secEnabled,
      homepageSectionsTotal: secTotal,
      featuresEnabled: features?.filter(f => f.enabled).length ?? 0,
      featuresTotal: features?.length ?? 0,
      footerLinks: footer?.reduce((acc, s) => acc + s.links.length, 0) ?? 0,
      socialLinks: social?.length ?? 0,
      newsletterSubscribers: (newsletter as any)?.meta?.total ?? 0,
      maintenanceMode: settings?.maintenanceMode ?? false,
    };
  },
};
