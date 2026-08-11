import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export const customerCheckoutService = {
  preview: async (dto: { addressId: string; shippingMethod?: string; couponCode?: string }) => {
    const res = await apiClient.post<StandardResponse<any>>('/checkout/preview', dto);
    return res.data.data!;
  },

  placeOrder: async (dto: {
    addressId: string;
    shippingMethod?: string;
    notes?: string;
    couponCode?: string;
  }) => {
    const res = await apiClient.post<StandardResponse<any>>('/checkout/place-order', dto);
    return res.data.data!;
  },

  validateCoupon: async (code: string, orderAmount: number) => {
    const res = await apiClient.post<StandardResponse<any>>('/coupons/validate', {
      code,
      orderAmount,
    });
    return res.data.data!;
  },
};
