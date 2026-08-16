import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface CheckoutPreviewDto {
  subtotal: number;
  discount: number;
  discountTotal?: number;
  shipping: number;
  shippingCharge?: number;
  tax: number;
  taxTotal?: number;
  total: number;
  grandTotal?: number;
  addressId: string;
  shippingMethod?: string;
  appliedCoupon?: string;
  couponCode?: string;
  items: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface OrderPlaceResultDto {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface CouponValidationDto {
  valid: boolean;
  code: string;
  discountType?: string;
  discountAmount?: number;
  message?: string;
}

export const customerCheckoutService = {
  preview: async (dto: { addressId: string; shippingMethod?: string; couponCode?: string }): Promise<CheckoutPreviewDto> => {
    const res = await apiClient.post<StandardResponse<CheckoutPreviewDto>>('/checkout/preview', dto);
    return res.data.data!;
  },

  placeOrder: async (dto: {
    addressId: string;
    shippingMethod?: string;
    notes?: string;
    couponCode?: string;
  }): Promise<OrderPlaceResultDto> => {
    const res = await apiClient.post<StandardResponse<OrderPlaceResultDto>>('/checkout/place-order', dto);
    return res.data.data!;
  },

  validateCoupon: async (
    code: string,
    orderAmount: number,
    items?: Array<{ productId: string; price: number; quantity: number }>,
  ): Promise<CouponValidationDto> => {
    const res = await apiClient.post<StandardResponse<CouponValidationDto>>('/coupons/validate', {
      code,
      orderAmount,
      ...(items && items.length ? { items } : {}),
    });
    return res.data.data!;
  },
};
