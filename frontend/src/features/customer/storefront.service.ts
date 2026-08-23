import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import type { ProductResponse } from '@/features/catalog/products/product.types';

export interface PublicSettingsDto {
  storeName?: string;
  storeLogo?: string;
  supportEmail?: string;
  supportPhone?: string;
  currency?: string;
  [key: string]: unknown;
}

export interface HomepageDataDto {
  sections?: Array<Record<string, unknown>>;
  banners?: Array<Record<string, unknown>>;
  featuredCategories?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface BannerDto {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position?: string;
  [key: string]: unknown;
}

export interface CmsPageDto {
  id: string;
  title: string;
  slug: string;
  content: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
  [key: string]: unknown;
}

export const customerStorefrontService = {
  getPublicSettings: async (): Promise<PublicSettingsDto> => {
    try {
      const res = await apiClient.get<StandardResponse<PublicSettingsDto>>('/storefront-settings');
      return res.data.data!;
    } catch {
      const res = await apiClient.get<StandardResponse<PublicSettingsDto>>('/settings/public');
      return res.data.data!;
    }
  },

  getHomepage: async (): Promise<HomepageDataDto> => {
    const res = await apiClient.get<StandardResponse<HomepageDataDto>>('/homepage');
    return res.data.data!;
  },

  getFooter: async (): Promise<Record<string, unknown>> => {
    const res = await apiClient.get<StandardResponse<Record<string, unknown>>>('/footer');
    return res.data.data!;
  },

  getSocialLinks: async (): Promise<Array<{ platform: string; url: string; title?: string }>> => {
    const res = await apiClient.get<StandardResponse<Array<{ platform: string; url: string; title?: string }>>>('/social');
    return res.data.data!;
  },

  getFeatures: async (): Promise<Record<string, boolean>> => {
    const res = await apiClient.get<StandardResponse<Record<string, boolean>>>('/features');
    return res.data.data!;
  },

  subscribeNewsletter: async (email: string, source = 'storefront'): Promise<{ subscribed: boolean; message?: string }> => {
    const res = await apiClient.post<StandardResponse<{ subscribed: boolean; message?: string }>>('/newsletter/subscribe', {
      email,
      source,
    });
    return res.data.data!;
  },

  getProductBySlug: async (slug: string): Promise<ProductResponse> => {
    const res = await apiClient.get<StandardResponse<ProductResponse>>(`/products/slug/${slug}`);
    return res.data.data!;
  },

  getBanners: async (params: Record<string, string | number | boolean> = {}): Promise<BannerDto[]> => {
    const res = await apiClient.get<StandardResponse<BannerDto[]>>('/cms/banners', { params });
    return res.data.data!;
  },

  getCmsPage: async (slug: string): Promise<CmsPageDto> => {
    const res = await apiClient.get<StandardResponse<CmsPageDto>>(`/cms/pages/${slug}`);
    return res.data.data!;
  },

  getActiveOffers: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get<StandardResponse<Array<Record<string, unknown>>>>('/offers/active');
    return res.data.data!;
  },

  getActiveCoupons: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get<StandardResponse<Array<Record<string, unknown>>>>('/coupons/active');
    return res.data.data!;
  },

  getPaymentMethods: async (): Promise<Array<Record<string, unknown>>> => {
    const res = await apiClient.get<StandardResponse<Array<Record<string, unknown>>>>('/payment-methods');
    return res.data.data!;
  },
};
