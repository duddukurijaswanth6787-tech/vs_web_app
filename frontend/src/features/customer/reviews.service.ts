import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface PendingReviewItem {
  productId: string;
  productTitle: string;
  productSlug: string;
  productImage: string;
  orderId: string;
  orderNumber: string;
  deliveredAt?: string;
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
}

export const customerReviewsService = {
  async getPendingReviews(): Promise<PendingReviewItem[]> {
    const res = await apiClient.get<{ data: PendingReviewItem[] }>('/me/pending-reviews');
    return res.data?.data || [];
  },

  async getProductReviews(productId: string): Promise<{
    data: Array<{
      id: string;
      rating: number;
      title?: string;
      comment?: string;
      verifiedPurchase?: boolean;
      createdAt: string;
      user?: { name: string; avatar?: string };
    }>;
    meta: Record<string, unknown>;
    summary: { averageRating: number; totalReviews: number; ratingBreakdown: Record<string, number> };
  }> {
    const res = await apiClient.get<StandardResponse<{
      data: Array<{
        id: string;
        rating: number;
        title?: string;
        comment?: string;
        verifiedPurchase?: boolean;
        createdAt: string;
        user?: { name: string; avatar?: string };
      }>;
      meta: Record<string, unknown>;
      summary: { averageRating: number; totalReviews: number; ratingBreakdown: Record<string, number> };
    }>>(`/products/${productId}/reviews`);
    return res.data.data!;
  },

  async createReview(payload: CreateReviewPayload) {
    const { productId, ...body } = payload;
    const res = await apiClient.post<{ data: Record<string, unknown> }>(`/products/${productId}/reviews`, body);
    return res.data;
  },

  async markHelpful(reviewId: string) {
    const res = await apiClient.post(`/reviews/${reviewId}/helpful`);
    return res.data;
  },
};
