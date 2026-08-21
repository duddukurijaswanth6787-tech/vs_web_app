export interface RecentlyViewedItem {
  id: string;
  customerId: string;
  productId: string;
  viewedAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    salePrice?: number;
    primaryImageUrl?: string;
  };
}
