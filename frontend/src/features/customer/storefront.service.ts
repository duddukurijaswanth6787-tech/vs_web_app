import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import type { ProductResponse } from '@/features/catalog/products/product.types';

export const customerStorefrontService = {
  getPublicSettings: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/settings/public');
    return res.data.data!;
  },

  getHomepage: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/homepage');
    return res.data.data!;
  },

  getFooter: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/footer');
    return res.data.data!;
  },

  getSocialLinks: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/social');
    return res.data.data!;
  },

  getFeatures: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/features');
    return res.data.data!;
  },

  subscribeNewsletter: async (email: string, source = 'storefront') => {
    const res = await apiClient.post<StandardResponse<any>>('/newsletter/subscribe', {
      email,
      source,
    });
    return res.data.data!;
  },

  getProductBySlug: async (slug: string): Promise<ProductResponse> => {
    const res = await apiClient.get<StandardResponse<ProductResponse>>(`/products/slug/${slug}`);
    return res.data.data!;
  },

  getBanners: async (params: Record<string, string | number | boolean> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>('/cms/banners', { params });
    return res.data.data!;
  },

  getCmsPage: async (slug: string) => {
    const res = await apiClient.get<StandardResponse<any>>(`/cms/pages/${slug}`);
    return res.data.data!;
  },

  getActiveOffers: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/offers/active');
    return res.data.data!;
  },

  getActiveCoupons: async () => {
    const res = await apiClient.get<StandardResponse<any>>('/coupons/active');
    return res.data.data!;
  },

  getPaymentMethods: async () => {
    const res = await apiClient.get<StandardResponse<any[]>>('/payment-methods');
    return res.data.data!;
  },
};
