'use client';

import { customerSupportService } from './support.service';
import { CreateSupportTicketDto } from '@/features/support/support.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/features/catalog/products/product.service';
import { customerCartService } from '@/features/customer/cart.service';
import { customerWishlistService } from '@/features/customer/wishlist.service';
import { customerMeService } from '@/features/customer/me.service';
import { customerOrdersService } from '@/features/customer/orders.service';
import { customerCheckoutService } from '@/features/customer/checkout.service';
import { customerStorefrontService } from '@/features/customer/storefront.service';
import { customerReviewsService, CreateReviewPayload } from '@/features/customer/reviews.service';
import { categoryService } from '@/features/catalog/categories/category.service';
import { brandService } from '@/features/catalog/brands/brand.service';
import { ProductQueryDto } from '@/features/catalog/products/product.types';

export const customerKeys = {
  all: ['customer'] as const,
  cart: () => [...customerKeys.all, 'cart'] as const,
  wishlist: () => [...customerKeys.all, 'wishlist'] as const,
  profile: () => [...customerKeys.all, 'profile'] as const,
  orders: () => [...customerKeys.all, 'orders'] as const,
  address: () => [...customerKeys.all, 'address'] as const,
  addresses: ['customer', 'address'] as const,
  notifications: ['customer', 'notifications'] as const,
  categorySlug: (slug: string) => [...customerKeys.all, 'category', slug] as const,
};

export function useHomepage() {
  return useQuery({
    queryKey: ['homepage'],
    queryFn: () => customerStorefrontService.getHomepage(),
    staleTime: 30 * 1000,
  });
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: () => customerStorefrontService.getPublicSettings(),
    // Matches the server-side prefetch in lib/query/prefetch.ts -- a shorter
    // staleTime here would treat the hydrated SSR data as stale immediately
    // and silently re-fetch it on the very first mount.
    staleTime: 5 * 60 * 1000,
  });
}

export function useStorefrontBanners() {
  return useQuery({
    queryKey: ['banners'],
    queryFn: () => customerStorefrontService.getBanners(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCustomerProducts(
  query: ProductQueryDto = {},
  options: { staleTime?: number; enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['customer', 'products', query],
    queryFn: () => productService.findAll(query),
    ...options,
  });
}

export function useCustomerProduct(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: ['customer', 'product', idOrSlug],
    queryFn: () => productService.findById(idOrSlug),
    enabled,
  });
}

export function useFeaturedCategories() {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: async () => {
      try {
        const featured = await categoryService.findFeatured();
        if (Array.isArray(featured) && featured.length > 0) {
          return featured;
        }
      } catch {
        // fallback
      }
      const list = await categoryService.findAll({ isVisible: true, limit: 20 });
      return list.data || [];
    },
    // Matches the server-side prefetch in lib/query/prefetch.ts -- staleTime: 0
    // meant this was refetched on every mount, including every time the header
    // remounts on navigation, even though categories rarely change mid-session.
    staleTime: 30 * 60 * 1000,
  });
}

export function useCategoryBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: customerKeys.categorySlug(slug),
    queryFn: () => categoryService.findBySlug(slug),
    enabled: enabled && !!slug,
  });
}

export function useCategoryProducts(slug: string, query: ProductQueryDto = {}, enabled = true) {
  return useQuery({
    queryKey: ['customer', 'category-products', slug, query],
    queryFn: async () => {
      const cat = await categoryService.findBySlug(slug);
      return productService.findAll({ ...query, categoryId: cat.id });
    },
    enabled: enabled && !!slug,
  });
}

export async function apiGetCategoryProducts(slug: string, query: ProductQueryDto) {
  const cat = await categoryService.findBySlug(slug);
  return productService.findAll({ ...query, categoryId: cat.id });
}

export function useCustomerBrands(query = {}) {
  return useQuery({
    queryKey: ['customer', 'brands'],
    queryFn: () => brandService.findAll(query),
  });
}

export function useBrandBySlug(slug: string) {
  return useQuery({
    queryKey: ['customer', 'brand', slug],
    queryFn: () => brandService.findBySlug(slug),
  });
}

export function useBrandProducts(slug: string, query: ProductQueryDto = {}) {
  return useQuery({
    queryKey: ['customer', 'brand-products', slug, query],
    queryFn: async () => {
      const brand = await brandService.findBySlug(slug);
      return productService.findAll({ ...query, brandId: brand.id });
    },
  });
}

export function useCustomerCart() {
  return useQuery({
    queryKey: customerKeys.cart(),
    queryFn: () => customerCartService.getCart(),
  });
}

export function useCartMutations() {
  const queryClient = useQueryClient();
  const addItem = useMutation({
    mutationFn: (dto: { productId: string; variantId?: string; quantity?: number }) => customerCartService.addItem(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.cart() }),
  });
  const updateQuantity = useMutation({
    mutationFn: (dto: { itemId?: string; id?: string; quantity: number }) =>
      customerCartService.updateQuantity(dto.itemId || dto.id || '', dto.quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.cart() }),
  });
  const removeItem = useMutation({
    mutationFn: (itemId: string) => customerCartService.removeItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.cart() }),
  });
  return { addItem, updateQuantity, removeItem };
}

export function useCustomerWishlist(enabled = true) {
  return useQuery({
    queryKey: customerKeys.wishlist(),
    queryFn: () => customerWishlistService.getItems(),
    enabled,
  });
}

export function useWishlistMutations() {
  const queryClient = useQueryClient();
  const add = useMutation({
    mutationFn: (productId: string) => customerWishlistService.addItem(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.wishlist() }),
  });
  const remove = useMutation({
    mutationFn: (productId: string) => customerWishlistService.removeItem(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customerKeys.wishlist() }),
  });
  const moveToCart = useMutation({
    mutationFn: async (productId: string) => {
      await customerCartService.addItem({ productId, quantity: 1 });
      await customerWishlistService.removeItem(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.wishlist() });
      queryClient.invalidateQueries({ queryKey: customerKeys.cart() });
    },
  });
  return { add, remove, removeItem: remove, moveToCart };
}

export function useCustomerProfile(enabled = true) {
  return useQuery({
    queryKey: customerKeys.profile(),
    queryFn: () => customerMeService.getProfile(),
    enabled,
  });
}

export function useCustomerAddresses(enabled = true) {
  return useQuery({
    queryKey: customerKeys.address(),
    queryFn: () => customerMeService.getAddresses(),
    enabled,
  });
}

export function useCustomerOrders(query: Record<string, string | number> = {}, enabled = true) {
  return useQuery({
    queryKey: customerKeys.orders(),
    queryFn: () => customerOrdersService.list(query),
    enabled,
  });
}

export function useCustomerOrder(orderNumber: string, enabled = true) {
  return useQuery({
    queryKey: [...customerKeys.orders(), orderNumber],
    queryFn: () => customerOrdersService.getByNumber(orderNumber),
    enabled,
  });
}

export function useOrderTracking(orderNumber: string, enabled = true) {
  return useQuery({
    queryKey: [...customerKeys.orders(), orderNumber, 'tracking'],
    queryFn: () => customerOrdersService.tracking(orderNumber).catch(() => null),
    enabled,
  });
}

export function useMyReturns(query: Record<string, string | number> = {}, enabled = true) {
  return useQuery({
    queryKey: ['customer', 'returns', query],
    queryFn: () => customerOrdersService.myReturns(query),
    enabled,
  });
}

export function useMyReturn(returnId: string, enabled = true) {
  return useQuery({
    queryKey: ['customer', 'returns', returnId],
    queryFn: () => customerOrdersService.getReturn(returnId),
    enabled: enabled && !!returnId,
  });
}

export function useCancelReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (returnId: string) => customerOrdersService.cancelReturn(returnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'returns'] });
    },
  });
}

export function useCustomerFaqs() {
  return useQuery({
    queryKey: ['customer', 'faqs'],
    queryFn: async (): Promise<{ data: unknown[] }> => ({ data: [] }),
  });
}

export function useActiveOffers() {
  return useQuery({
    queryKey: ['customer', 'offers'],
    queryFn: () => customerStorefrontService.getActiveOffers(),
  });
}

export function useActiveCoupons() {
  return useQuery({
    queryKey: ['customer', 'coupons'],
    queryFn: () => customerStorefrontService.getActiveCoupons(),
  });
}

export function useCustomerSearch(q: string) {
  return useQuery({
    queryKey: ['customer', 'search', q],
    queryFn: () => productService.findAll({ search: q }).catch(() => ({ data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } })),
    enabled: q.length > 2,
  });
}

export function useCustomerReels() {
  return useQuery({
    queryKey: ['customer', 'reels'],
    queryFn: async (): Promise<{ data: unknown[] }> => ({ data: [] }),
  });
}

export function useCustomerNotifications(enabled = true) {
  return useQuery({
    queryKey: ['customer', 'notifications'],
    queryFn: async (): Promise<{ data: unknown[] }> => ({ data: [] }),
    enabled,
  });
}

export function useCustomerReferral(enabled = true) {
  return useQuery({
    queryKey: ['customer', 'referral'],
    queryFn: async (): Promise<unknown> => null,
    enabled,
  });
}

export function usePackingQueue(enabled = true) {
  return useQuery({
    queryKey: ['customer', 'packing'],
    queryFn: async (): Promise<{ data: unknown[] }> => ({ data: [] }),
    enabled,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['customer', 'payment-methods'],
    queryFn: () => customerStorefrontService.getPaymentMethods(),
  });
}

export function useCmsPage(slug: string) {
  return useQuery({
    queryKey: ['customer', 'cms', slug],
    queryFn: () => customerStorefrontService.getCmsPage(slug),
    enabled: !!slug,
    staleTime: 30 * 1000,
  });
}

export function useCheckoutPreview(addressId?: string, couponCode?: string) {
  return useQuery({
    queryKey: ['customer', 'checkout-preview', addressId, couponCode],
    queryFn: () =>
      customerCheckoutService.preview({
        addressId: addressId || '',
        couponCode: couponCode || undefined,
      }),
    enabled: !!addressId,
  });
}

export function usePlaceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { addressId: string; shippingMethod?: string; notes?: string; couponCode?: string }) => customerCheckoutService.placeOrder(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.cart() });
      queryClient.invalidateQueries({ queryKey: customerKeys.orders() });
    },
  });
}

export function useContactSupport() {
  return useMutation({
    mutationFn: async (_dto: { name: string; email: string; subject: string; message: string }) => { void _dto; return { success: true }; },
  });
}

export function useSupportTickets() {
  return useQuery({
    queryKey: ['customer', 'support', 'tickets'],
    queryFn: () => customerSupportService.getTickets(),
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSupportTicketDto) => customerSupportService.createTicket(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'support', 'tickets'] });
    },
  });
}

export function usePendingReviews(enabled = true) {
  return useQuery({
    queryKey: ['customer', 'pending-reviews'],
    queryFn: () => customerReviewsService.getPendingReviews(),
    enabled,
  });
}

export function useProductReviews(productId: string, enabled = true) {
  return useQuery({
    queryKey: ['product', productId, 'reviews'],
    queryFn: () => customerReviewsService.getProductReviews(productId),
    enabled: enabled && Boolean(productId),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => customerReviewsService.createReview(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'pending-reviews'] });
      queryClient.invalidateQueries({ queryKey: customerKeys.profile() });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId, 'reviews'] });
    },
  });
}

export {
  customerCartService,
  customerWishlistService,
  customerMeService,
  customerOrdersService,
  customerCheckoutService,
  customerStorefrontService,
  customerReviewsService,
};

