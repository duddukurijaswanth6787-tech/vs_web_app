'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  Heart, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Star, 
  Share2, 
  Truck, 
  Award, 
  ShieldCheck, 
  CheckCircle,
  Sparkles,
  RefreshCw,
  Package,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Ruler,
  Zap,
  MapPin,
  Calendar,
  BadgeCheck,
  Scissors,
  Boxes,
  Check,
  Info,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ReviewFormModal } from '@/components/storefront/ReviewFormModal';
import { shippingService } from '@/features/shipping/shipping.service';
import {
  useCustomerProduct,
  useCartMutations,
  useWishlistMutations,
  useCustomerWishlist,
  useCustomerProducts,
  useProductReviews,
  useActiveCoupons,
  useFeatureEnabled,
} from '@/features/customer/hooks';
import { useTrackRecentlyViewed } from '@/features/recently-viewed/recently-viewed.hooks';
import { useVariants } from '@/features/catalog/variants/variant.hooks';
import dynamic from 'next/dynamic';

const ImageOverlayModal = dynamic(() => import('./ImageOverlayModal').then(mod => mod.ImageOverlayModal), { ssr: false });
const SizeChartModal = dynamic(() => import('./SizeChartModal').then(mod => mod.SizeChartModal), { ssr: false });
const ProductImageZoom = dynamic(() => import('./ProductImageZoom').then(mod => mod.ProductImageZoom), { ssr: false });
const ShareModal = dynamic(() => import('./ShareModal').then(mod => mod.ShareModal), { ssr: false });
const NotifyMeModal = dynamic(() => import('./NotifyMeModal').then(mod => mod.NotifyMeModal), { ssr: false });
import { useAuth } from '@/hooks/useAuth';
import {
  discountLabel,
  formatInr,
  PLACEHOLDER_IMAGE,
} from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { resolveMediaUrl, isLocalOrPlaceholder, withVariant } from '@/lib/media-url';

export function ProductDetailClient() {
  const returnsEnabled = useFeatureEnabled('returns');
  const params = useParams();
  const idOrSlug = String(params.id || '');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
  const { data: product, isLoading, error } = useCustomerProduct(idOrSlug);
  const trackMutation = useTrackRecentlyViewed();

  React.useEffect(() => {
    if (product?.id && isAuthenticated) {
      trackMutation.mutate(product.id);
    }
  }, [product?.id, isAuthenticated]);

  // Normalize URL in browser to clean SEO slug, preventing raw database IDs/UUIDs from being exposed in URL
  React.useEffect(() => {
    if (product?.slug && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const expectedPath = `/product/${product.slug}`;
      if (currentPath !== expectedPath && (looksLikeUuid || idOrSlug === product.id)) {
        window.history.replaceState(null, '', expectedPath);
      }
    }
  }, [product?.slug, product?.id, looksLikeUuid, idOrSlug]);

  // Extract unique colors and sizes from variants
  const { data: variantsData } = useVariants({ productId: looksLikeUuid ? idOrSlug : product?.id, limit: 100 });
  const { data: reviewsData } = useProductReviews(product?.id || '', !!product?.id);
  const reviews = reviewsData?.data || [];
  const reviewSummary = reviewsData?.summary || { averageRating: 0, totalReviews: 0 };
  const { addItem } = useCartMutations();
  const { add: addWishlist, remove: removeWishlist } = useWishlistMutations();
  const { data: wishlistData } = useCustomerWishlist(isAuthenticated);
  
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [stockWarning, setStockWarning] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'checking' | 'available' | 'invalid'>('idle');
  const [deliveryData, setDeliveryData] = useState<{
    city?: string;
    state?: string;
    isServiceable: boolean;
    prepaidAvailable: boolean;
    codAvailable: boolean;
    estimatedDateText?: string;
    remarks?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'care' | 'shipping' | 'reviews'>('overview');
  
  // Wishlist toggle
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!wishlistData || !product?.id) return;
    const items = Array.isArray(wishlistData) ? wishlistData : (wishlistData as any)?.data || (wishlistData as any)?.items || [];
    const found = items.some((item: any) => (item.productId || item.product?.id || item.id) === product.id);
    setIsSaved(found);
  }, [wishlistData, product?.id]);

  // Custom Tailoring & Stitching State
  const [customTailoring, setCustomTailoring] = useState(false);
  const [measurements, setMeasurements] = useState({
    bust: '36',
    waist: '30',
    hips: '38',
    length: '44',
    sleeveStyle: '3/4th Sleeves',
    neckline: 'Sweetheart Neck',
    notes: '',
  });

  // Dynamic Modal states
  const [showShare, setShowShare] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showNotifyMe, setShowNotifyMe] = useState(false);

  // Load related products from same category
  const { data: relatedData } = useCustomerProducts({
    limit: 5,
    categoryId: product?.categories?.[0]?.categoryId || undefined,
  });
  
  const relatedProducts = useMemo(() => {
    return relatedData?.data?.filter((p) => p.id !== product?.id).slice(0, 4) || [];
  }, [relatedData, product]);

  const images = useMemo<string[]>(() => {
    const list: string[] =
      product?.images
        ?.filter((i) => i.mediaType !== 'FABRIC' && (i as unknown as { title?: string }).title !== 'FABRIC_SWATCH')
        ?.map((i) => i.url)
        .filter((u): u is string => Boolean(u)) || [];
    if (product?.primaryImageUrl && !list.includes(product.primaryImageUrl)) {
      list.unshift(product.primaryImageUrl);
    }
    return Array.from(new Set(list.length ? list : [PLACEHOLDER_IMAGE]));
  }, [product]);

  // Extract color groups (with image gallery, swatch, and sizes for each color)
  const colorGroups = useMemo(() => {
    const rawGroups = (product as unknown as Record<string, unknown>)?.colorGroups;
    if (Array.isArray(rawGroups) && rawGroups.length > 0) {
      return (rawGroups as Array<{
        id: string;
        name: string;
        hex?: string;
        swatchImage?: string;
        images: string[];
        sizes: Array<{ size: string; stock: number; available: boolean }>;
      }>).map((g) => ({
        ...g,
        images: (g.images || []).filter((imgUrl) => {
          const matchedMedia = product?.images?.find((m) => m.url === imgUrl);
          return matchedMedia?.mediaType !== 'FABRIC' && (matchedMedia as unknown as { title?: string })?.title !== 'FABRIC_SWATCH';
        }),
      }));
    }

    // Fallback: Group product.images by color name
    const colors = new Set<string>();
    if (product?.images) {
      product.images.forEach((img) => {
        if (img.color) colors.add(img.color);
      });
    }
    if (variantsData?.data) {
      variantsData.data.forEach((v) => {
        if (v.title && v.title.includes('/')) {
          const colFromTitle = v.title.split('/')[0].trim();
          if (colFromTitle) colors.add(colFromTitle);
        }
      });
    }

    const availableCols = Array.from(colors).length > 0 ? Array.from(colors) : ['Color 1'];
    return availableCols.map((colorName, idx) => {
      const colorImages = product?.images
        ?.filter(
          (img) =>
            img.mediaType !== 'FABRIC' &&
            (img as unknown as { title?: string }).title !== 'FABRIC_SWATCH' &&
            img.color &&
            img.color.toLowerCase() === colorName.toLowerCase()
        )
        ?.map((img) => img.url) || [];
      const swatchImg = product?.images?.find(
        (img) =>
          (img.mediaType === 'FABRIC' || (img as unknown as { title?: string }).title === 'FABRIC_SWATCH') &&
          img.color &&
          img.color.toLowerCase() === colorName.toLowerCase()
      )?.url;
      const finalImgs = colorImages.length > 0 ? colorImages : images;
      return {
        id: `col-${idx}-${colorName}`,
        name: colorName,
        hex: idx === 0 ? '#e8c4b8' : '#1e3a8a',
        swatchImage: swatchImg || finalImgs[0],
        images: finalImgs,
        sizes: [],
      };
    });
  }, [product, variantsData, images]);

  const availableColors = useMemo(() => {
    return colorGroups.map((g) => g.name);
  }, [colorGroups]);

  const currentColorGroup = useMemo(() => {
    return colorGroups.find((g) => g.name.toLowerCase() === selectedColor.toLowerCase()) || colorGroups[0];
  }, [colorGroups, selectedColor]);

  const availableSizes = useMemo(() => {
    const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'FREE SIZE'];
    const sizes = new Set<string>();

    // 1) Read sizes from currentColorGroup if saved directly
    if (currentColorGroup?.sizes && currentColorGroup.sizes.length > 0) {
      currentColorGroup.sizes.forEach((s) => {
        if (s.available) sizes.add(s.size);
      });
    }

    // 2) Filter variantsData for current selected color
    if (variantsData?.data) {
      const activeColor = selectedColor || currentColorGroup?.name || '';
      variantsData.data.forEach((v) => {
        if (v.status === 'INACTIVE' || (v as unknown as { isAvailable?: boolean }).isAvailable === false) {
          return;
        }

        const vTitle = String(v.title || '').toLowerCase().trim();
        const colorMatch = activeColor
          ? vTitle.startsWith(`${activeColor.toLowerCase().trim()} /`) || vTitle.includes(activeColor.toLowerCase().trim())
          : true;

        if (!colorMatch) return;

        v.attributeValues?.forEach((av) => {
          if (av.attributeName?.toLowerCase() === 'size' && av.value) {
            sizes.add(av.value);
          }
        });
        if (v.title && v.title.includes('/')) {
          const parts = v.title.split('/');
          if (parts[1]) {
            const szFromTitle = parts[1].trim();
            if (szFromTitle) sizes.add(szFromTitle);
          }
        }
      });
    }

    return Array.from(sizes).sort((a, b) => {
      const idxA = SIZE_ORDER.indexOf(a.toUpperCase().trim());
      const idxB = SIZE_ORDER.indexOf(b.toUpperCase().trim());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [variantsData, currentColorGroup, selectedColor]);

  const visibleImages = useMemo<string[]>(() => {
    if (!product) return [PLACEHOLDER_IMAGE];
    if (currentColorGroup?.images && currentColorGroup.images.length > 0) {
      return Array.from(new Set(currentColorGroup.images.filter(Boolean)));
    }
    if (product.images && product.images.length > 0) {
      const colorMatch = currentColorGroup?.name;
      const filtered = product.images
        .filter(
          (img) =>
            img.mediaType !== 'FABRIC' &&
            (img as unknown as { title?: string }).title !== 'FABRIC_SWATCH' &&
            (!colorMatch || !img.color || img.color.toLowerCase().trim() === colorMatch.toLowerCase().trim())
        )
        .map((img) => img.url)
        .filter((u): u is string => Boolean(u));
      if (filtered.length > 0) return Array.from(new Set(filtered));
    }
    return Array.from(new Set(images.filter(Boolean)));
  }, [product, currentColorGroup, images]);

  const [activeImage, setActiveImage] = useState(0);
  const [prevSelectedColor, setPrevSelectedColor] = useState(selectedColor);
  if (selectedColor !== prevSelectedColor) {
    setPrevSelectedColor(selectedColor);
    setActiveImage(0);
  }

  // Set default selections once loaded
  if (availableColors.length > 0 && !selectedColor) {
    setSelectedColor(availableColors[0]);
  }
  if (availableSizes.length > 0 && (!selectedSize || !availableSizes.includes(selectedSize))) {
    setSelectedSize(availableSizes[0]);
  }

  // Find matching variant based on selections
  const matchingVariant = useMemo(() => {
    if (!variantsData?.data?.length) return null;
    const cleanColor = (selectedColor || '').toLowerCase().trim();
    const cleanSize = (selectedSize || '').toLowerCase().trim();

    const found = variantsData.data.find((v) => {
      const colorMatch =
        v.attributeValues?.some(
          (av) =>
            (av.attributeName?.toLowerCase() === 'color' || (av as any).attribute?.slug === 'color') &&
            av.value?.toLowerCase().trim() === cleanColor
        ) ||
        String(v.title || '').toLowerCase().trim().startsWith(`${cleanColor} /`) ||
        availableColors.length <= 1;

      const sizeMatch =
        v.attributeValues?.some(
          (av) =>
            (av.attributeName?.toLowerCase() === 'size' || (av as any).attribute?.slug === 'size') &&
            av.value?.toLowerCase().trim() === cleanSize
        ) ||
        String(v.title || '').toLowerCase().trim().endsWith(`/ ${cleanSize}`) ||
        availableSizes.length <= 1;

      return colorMatch && sizeMatch;
    });

    return found || variantsData.data[0] || null;
  }, [variantsData, selectedColor, selectedSize, availableColors.length, availableSizes.length]);

  const price = matchingVariant?.salePriceOverride ?? matchingVariant?.priceOverride ?? product?.salePrice ?? product?.basePrice ?? 0;
  const original = matchingVariant?.priceOverride ?? product?.basePrice ?? 0;
  const discount = discountLabel(original, matchingVariant?.salePriceOverride ?? product?.salePrice);

  // Real, currently-active coupons from global API and attached product coupons
  const { data: activeCouponsData } = useActiveCoupons();
  const [selectedOfferCode, setSelectedOfferCode] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vs_applied_coupon') || null;
    }
    return null;
  });

  const pdpOffers = useMemo(() => {
    if (!product) return [];
    const pRecord = product as unknown as Record<string, unknown>;
    
    // Only use offers/coupons explicitly assigned or associated with this product
    const explicitOffers = Array.isArray(pRecord?.offers)
      ? (pRecord.offers as unknown[])
      : Array.isArray(pRecord?.coupons)
      ? (pRecord.coupons as unknown[])
      : [];

    // Also check if any active coupon explicitly specifies this product's ID or category
    const targetedCoupons = Array.isArray(activeCouponsData)
      ? activeCouponsData.filter((c: any) => {
          if (!c) return false;
          // If coupon is targeted to specific products
          if (Array.isArray(c.applicableProductIds) && c.applicableProductIds.length > 0) {
            return c.applicableProductIds.includes(product.id);
          }
          if (Array.isArray(c.productIds) && c.productIds.length > 0) {
            return c.productIds.includes(product.id);
          }
          // If coupon is targeted to specific categories
          const productCatIds = product.categories?.map((pc) => pc.categoryId) || [];
          if (Array.isArray(c.applicableCategoryIds) && c.applicableCategoryIds.length > 0) {
            return c.applicableCategoryIds.some((cid: string) => productCatIds.includes(cid));
          }
          if (Array.isArray(c.categoryIds) && c.categoryIds.length > 0) {
            return c.categoryIds.some((cid: string) => productCatIds.includes(cid));
          }
          return false;
        })
      : [];

    const merged = [...explicitOffers, ...targetedCoupons];
    if (merged.length === 0) return [];

    const uniqueByCode = new Map<string, Record<string, unknown>>();

    merged.forEach((item) => {
      if (!item) return;
      const c = item as Record<string, unknown>;
      const code = String(c.code || c.couponCode || c.offerCode || '');
      if (code && !uniqueByCode.has(code)) {
        uniqueByCode.set(code, c);
      }
    });

    return Array.from(uniqueByCode.values()).slice(0, 3).map((c) => {
      const type = String(c.type || c.discountType || '');
      const value = Number(c.value || c.discountValue || 0);
      const label =
        type === 'PERCENTAGE'
          ? `${value}% OFF`
          : type === 'FREE_SHIPPING'
          ? 'Free Shipping'
          : `Flat ₹${value} OFF`;
      const minOrder = c.minOrderAmount ? Number(c.minOrderAmount) : undefined;
      return {
        code: String(c.code || c.couponCode || ''),
        label,
        type,
        value,
        minOrder,
        detail: minOrder ? `Min purchase ₹${minOrder}.` : 'On all orders.',
      };
    });
  }, [activeCouponsData, product]);

  // Read size configuration & real inventory stock
  const currentSizeObj = useMemo(() => {
    if (!currentColorGroup?.sizes?.length) return null;
    return currentColorGroup.sizes.find(
      (s) => s.size.toLowerCase().trim() === (selectedSize || '').toLowerCase().trim()
    );
  }, [currentColorGroup, selectedSize]);

  const maxAllowedQty = useMemo(() => {
    // 1) Read from size in color group if specified
    if (currentSizeObj && typeof currentSizeObj.stock === 'number') {
      return Math.max(0, currentSizeObj.stock);
    }
    // 2) Read from matching variant
    const vStock = (matchingVariant as unknown as { availableQuantity?: number; stock?: number })?.availableQuantity ??
      (matchingVariant as unknown as { availableQuantity?: number; stock?: number })?.stock;
    if (typeof vStock === 'number') {
      return Math.max(0, vStock);
    }
    // 3) Read from product.variants fallback if matching
    const pv = product?.variants?.find((v) => v.id === matchingVariant?.id);
    if (typeof pv?.availableQuantity === 'number') {
      return Math.max(0, pv.availableQuantity);
    }
    // 4) Check max order quantity setting on product
    if (typeof product?.maximumOrderQuantity === 'number' && product.maximumOrderQuantity > 0) {
      return product.maximumOrderQuantity;
    }
    // 5) Default fallback
    return 10;
  }, [currentSizeObj, matchingVariant, product]);

  // Keep qty constrained within [1, maxAllowedQty]
  useEffect(() => {
    if (maxAllowedQty > 0 && qty > maxAllowedQty) {
      setQty(maxAllowedQty);
    }
  }, [maxAllowedQty, qty]);

  // Dynamic stock indicator driven by real stock & admin setting
  const stockText = useMemo(() => {
    if (!selectedSize) return 'Select size to check availability';
    if (maxAllowedQty === 0) return 'Out of Stock';

    const isLimited = Boolean(
      product?.isLimitedStock ||
      product?.tags?.includes('low-stock-alert')
    );

    if (isLimited || (maxAllowedQty > 0 && maxAllowedQty <= 5)) {
      return `Only ${maxAllowedQty} left - selling fast!`;
    }
    if (maxAllowedQty <= 10) {
      return 'Low Stock';
    }
    return 'In Stock';
  }, [selectedSize, maxAllowedQty, product]);

  // Dynamic Storefront Feature Visibility
  const showCustomTailoring = useMemo(() => {
    if (!product) return false;
    return Boolean(
      product.tags?.includes('custom-tailoring') ||
      product.tags?.includes('custom-stitch') ||
      product.type === 'CUSTOM'
    );
  }, [product]);

  const showWholesalePricing = useMemo(() => {
    if (!product) return false;
    return Boolean(
      product.tags?.includes('wholesale-pricing') ||
      product.tags?.includes('b2b') ||
      (product.wholesalePrice && Number(product.wholesalePrice) > 0)
    );
  }, [product]);

  // Wholesale Tier & Pricing Calculation
  const wholesaleTier = useMemo(() => {
    if (!showWholesalePricing) return { name: 'Retail Tier', discountPercent: 0, badge: null };
    if (qty >= 10) return { name: 'Gold Bulk Tier', discountPercent: 25, badge: '25% WHOLESALE SAVINGS' };
    if (qty >= 5) return { name: 'Silver Reseller Tier', discountPercent: 15, badge: '15% RESELLER SAVINGS' };
    return { name: 'Retail Tier', discountPercent: 0, badge: null };
  }, [qty, showWholesalePricing]);

  const effectiveUnitPrice = wholesaleTier.discountPercent > 0
    ? Math.round(price * (1 - wholesaleTier.discountPercent / 100))
    : price;
  const tailoringFeePerItem = (showCustomTailoring && customTailoring) ? 499 : 0;
  const finalUnitPrice = effectiveUnitPrice + tailoringFeePerItem;
  const rawGrandTotal = finalUnitPrice * qty;

  // Selected Offer Calculations
  const selectedOffer = useMemo(() => {
    return pdpOffers.find((o) => o.code.toUpperCase() === (selectedOfferCode || '').toUpperCase());
  }, [pdpOffers, selectedOfferCode]);

  const isOfferEligible = useMemo(() => {
    if (!selectedOffer) return false;
    return !selectedOffer.minOrder || rawGrandTotal >= selectedOffer.minOrder;
  }, [selectedOffer, rawGrandTotal]);

  const offerDiscountAmount = useMemo(() => {
    if (!selectedOffer || !isOfferEligible) return 0;
    if (selectedOffer.type === 'PERCENTAGE') {
      return Math.round((rawGrandTotal * selectedOffer.value) / 100);
    }
    if (selectedOffer.type !== 'FREE_SHIPPING') {
      return Math.min(rawGrandTotal, selectedOffer.value);
    }
    return 0;
  }, [selectedOffer, isOfferEligible, rawGrandTotal]);

  const grandTotal = Math.max(0, rawGrandTotal - offerDiscountAmount);

  const handleToggleOffer = (offer: typeof pdpOffers[0]) => {
    if (selectedOfferCode?.toUpperCase() === offer.code.toUpperCase()) {
      setSelectedOfferCode(null);
      if (typeof window !== 'undefined') localStorage.removeItem('vs_applied_coupon');
      setMsg('Offer removed');
      setTimeout(() => setMsg(''), 3000);
    } else {
      setSelectedOfferCode(offer.code);
      if (typeof window !== 'undefined') localStorage.setItem('vs_applied_coupon', offer.code);
      if (offer.minOrder && rawGrandTotal < offer.minOrder) {
        const diff = offer.minOrder - rawGrandTotal;
        setMsg(`Coupon "${offer.code}" selected! Add ${formatInr(diff)} more (e.g. increase quantity) to unlock discount.`);
      } else {
        setMsg(`Coupon "${offer.code}" applied successfully!`);
      }
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setErr('');
    setMsg('');
    setStockWarning('');

    if (maxAllowedQty === 0) {
      setStockWarning('This item is currently out of stock.');
      setTimeout(() => setStockWarning(''), 3500);
      return;
    }

    if (qty > maxAllowedQty) {
      setQty(maxAllowedQty);
      setStockWarning(`Only ${maxAllowedQty} unit${maxAllowedQty === 1 ? '' : 's'} available in stock.`);
      setTimeout(() => setStockWarning(''), 3500);
      return;
    }

    try {
      await addItem.mutateAsync({ 
        productId: product.id, 
        variantId: matchingVariant?.id, 
        quantity: qty 
      });
      if (customTailoring) {
        try {
          const tailoringStore = JSON.parse(localStorage.getItem('vs_tailoring_specs') || '{}');
          tailoringStore[product.id] = {
            productName: product.name,
            selectedSize,
            selectedColor,
            measurements,
            tailoringFee: 499,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('vs_tailoring_specs', JSON.stringify(tailoringStore));
        } catch {}
        setMsg(`Added to bag with Custom Tailoring (${measurements.bust}" Bust, ${measurements.waist}" Waist, ${measurements.sleeveStyle})!`);
      } else if (wholesaleTier.discountPercent > 0) {
        setMsg(`Added ${qty} items to bag with ${wholesaleTier.discountPercent}% Wholesale Discount!`);
      } else {
        setMsg('Product successfully added to your bag!');
      }
      setTimeout(() => setMsg(''), 5000);
    } catch (e) {
      setErr(getApiErrorMessage(e, 'Could not add to cart'));
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setErr('');
    setMsg('');
    setStockWarning('');

    if (maxAllowedQty === 0) {
      setStockWarning('This item is currently out of stock.');
      setTimeout(() => setStockWarning(''), 3500);
      return;
    }

    if (qty > maxAllowedQty) {
      setQty(maxAllowedQty);
      setStockWarning(`Only ${maxAllowedQty} unit${maxAllowedQty === 1 ? '' : 's'} available in stock.`);
      setTimeout(() => setStockWarning(''), 3500);
      return;
    }

    try {
      if (customTailoring) {
        try {
          const tailoringStore = JSON.parse(localStorage.getItem('vs_tailoring_specs') || '{}');
          tailoringStore[product.id] = {
            productName: product.name,
            selectedSize,
            selectedColor,
            measurements,
            tailoringFee: 499,
            updatedAt: new Date().toISOString(),
          };
          localStorage.setItem('vs_tailoring_specs', JSON.stringify(tailoringStore));
        } catch {}
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'vs_buy_now_item',
          JSON.stringify({
            productId: product.id,
            variantId: matchingVariant?.id,
            quantity: qty,
            createdAt: Date.now(),
          }),
        );
      }
      await addItem.mutateAsync({ 
        productId: product.id, 
        variantId: matchingVariant?.id, 
        quantity: qty 
      });
      if (!isAuthenticated) {
        router.push('/login?redirect=/checkout');
      } else {
        router.push('/checkout');
      }
    } catch (e) {
      setErr(getApiErrorMessage(e, 'Could not proceed to checkout'));
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/product/${idOrSlug}`);
      return;
    }
    if (!product) return;
    try {
      if (isSaved) {
        await removeWishlist.mutateAsync(product.id);
        setIsSaved(false);
        setMsg('Removed from your wishlist');
        setTimeout(() => setMsg(''), 3000);
      } else {
        await addWishlist.mutateAsync(product.id);
        setIsSaved(true);
        setMsg('Saved to your wishlist!');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch (e: any) {
      const errMsg = getApiErrorMessage(e, '');
      if (errMsg.toLowerCase().includes('already in wishlist')) {
        setIsSaved(true);
        setMsg('Product is already in your wishlist!');
        setTimeout(() => setMsg(''), 3000);
      } else {
        setErr(errMsg || 'Could not update wishlist');
        setTimeout(() => setErr(''), 4000);
      }
    }
  };

  const clientPincodeCacheRef = useRef<Map<string, any>>(new Map());

  const checkPincodeServiceability = async (pin: string) => {
    const clean = (pin || '').trim();
    if (!clean || clean.length !== 6 || !/^\d{6}$/.test(clean)) {
      setDeliveryStatus('invalid');
      setDeliveryData(null);
      return;
    }

    if (clientPincodeCacheRef.current.has(clean)) {
      const cached = clientPincodeCacheRef.current.get(clean);
      setDeliveryData(cached);
      setDeliveryStatus('available');
      return;
    }

    setDeliveryStatus('checking');
    try {
      const res = await shippingService.checkPincode(clean);
      if (res && res.isServiceable) {
        const estDate = new Date();
        estDate.setDate(estDate.getDate() + 3);
        const estText = estDate.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        });

        const data = {
          city: res.city,
          state: res.state,
          isServiceable: res.isServiceable,
          prepaidAvailable: res.prepaidAvailable,
          codAvailable: res.codAvailable,
          estimatedDateText: estText,
          remarks: res.remarks || 'Delivery in 3–5 business days',
        };
        clientPincodeCacheRef.current.set(clean, data);
        setDeliveryData(data);
        setDeliveryStatus('available');
        try {
          localStorage.setItem('vs_customer_pincode', clean);
        } catch {}
      } else {
        setDeliveryStatus('invalid');
        setDeliveryData(null);
      }
    } catch {
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + 3);
      const estText = estDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });
      const fallbackData = {
        city: 'Hyderabad',
        state: 'TS',
        isServiceable: true,
        prepaidAvailable: true,
        codAvailable: true,
        estimatedDateText: estText,
        remarks: 'Standard Express Courier Delivery',
      };
      clientPincodeCacheRef.current.set(clean, fallbackData);
      setDeliveryData(fallbackData);
      setDeliveryStatus('available');
    }
  };

  useEffect(() => {
    try {
      const savedPin = localStorage.getItem('vs_customer_pincode');
      if (savedPin && /^\d{6}$/.test(savedPin)) {
        setPinCode(savedPin);
        checkPincodeServiceability(savedPin);
      }
    } catch {}
  }, []);

  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincodeServiceability(pinCode);
  };

  // Full-size image modal state
  const [showFullSize, setShowFullSize] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans antialiased text-neutral-900 pb-28 md:pb-0">
      
      {/* Main Storefront Header */}
      <StorefrontHeader />

      {/* Main Content Area */}
      <main className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-6 flex-1 space-y-8">
        
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Gallery Skeleton */}
            <div className="flex flex-col-reverse md:flex-row gap-4">
              <div className="flex md:flex-col gap-2 md:w-20">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[3/4] w-14 md:w-20 bg-neutral-100 rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="flex-1 aspect-[3/4] bg-neutral-100 rounded-3xl animate-pulse" />
            </div>
            {/* Details Skeleton */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-1/4 bg-neutral-100 rounded-lg animate-pulse" />
                <div className="h-8 w-3/4 bg-neutral-100 rounded-xl animate-pulse animate-pulse-delay-100" />
                <div className="h-4 w-1/3 bg-neutral-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-10 w-1/3 bg-neutral-100 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-neutral-100 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-1/2 bg-neutral-100 rounded-lg animate-pulse" />
                <div className="h-4 w-2/3 bg-neutral-100 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-20 bg-red-50 rounded-3xl p-6 border border-red-100 max-w-md mx-auto">
            <p className="text-sm font-bold text-red-700">{getApiErrorMessage(error, 'Product not found')}</p>
            <Link href="/" className="inline-block mt-4 text-xs font-bold text-[var(--brand-primary)] underline">Back to home</Link>
          </div>
        )}

        {product && (
          <>
            {/* Dynamic Breadcrumb Trail */}
            <nav className="hidden md:flex text-[11px] text-neutral-400 font-bold items-center gap-1.5 flex-wrap">
              <Link href="/" className="hover:text-[var(--brand-primary)]">Home</Link>
              {product.categories && product.categories.length > 0 ? (
                product.categories.map((c: { categoryId?: string; categorySlug?: string; categoryName?: string; category?: { slug?: string; name?: string } }, idx: number) => {
                  const slug = c.categorySlug || c.category?.slug;
                  const name = c.categoryName || c.category?.name || 'Category';
                  return (
                    <React.Fragment key={c.categoryId || idx}>
                      <ChevronRight className="w-3 h-3 text-neutral-300" />
                      {slug ? (
                        <Link href={`/categories/${slug}`} className="hover:text-[var(--brand-primary)]">
                          {name}
                        </Link>
                      ) : (
                        <span className="hover:text-[var(--brand-primary)]">{name}</span>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <>
                  <ChevronRight className="w-3 h-3 text-neutral-300" />
                  <span className="hover:text-[var(--brand-primary)]">{product.brandName || "Vasanthi's Signature"}</span>
                </>
              )}
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="text-neutral-600 font-semibold truncate max-w-[240px] md:max-w-none">{product.name}</span>
            </nav>

            {/* Product Core Grid Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Product Media Showcase (Span 6, Sticky on Desktop) */}
              <div className="lg:col-span-6 xl:col-span-6 lg:sticky lg:top-24 self-start space-y-4">
                <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 items-start">
                  
                  {/* Thumbnails (Vertical on md/lg, horizontal on mobile) */}
                  {visibleImages.length > 1 && (
                    <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto max-h-[540px] lg:max-h-[600px] scrollbar-none shrink-0 py-0.5 w-full md:w-auto">
                      {visibleImages.map((src, i) => (
                        <button
                          key={src + i}
                          type="button"
                          onClick={() => setActiveImage(i)}
                          className={`w-14 h-18 md:w-16 md:h-20 rounded-xl overflow-hidden relative shrink-0 border-2 transition-all duration-200 ${
                            i === activeImage
                              ? 'border-[#0284c7] ring-2 ring-[#0284c7]/20 shadow-sm scale-102'
                              : 'border-neutral-200/90 opacity-70 hover:opacity-100 hover:border-neutral-300'
                          }`}
                        >
                          <Image
                            src={withVariant(resolveMediaUrl(src), 'thumb')}
                            alt=""
                            fill
                            sizes="64px"
                            unoptimized={isLocalOrPlaceholder(resolveMediaUrl(src))}
                            className="object-cover object-top"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main Large Display Image */}
                  <div className="relative flex-1 w-full rounded-2xl md:rounded-3xl overflow-hidden aspect-[3/4] md:aspect-[4/5] max-h-[540px] lg:max-h-[600px] xl:max-h-[640px] bg-neutral-50/50 border border-neutral-200/80 shadow-xs group">
                    <ProductImageZoom
                      src={withVariant(resolveMediaUrl(visibleImages[activeImage] || PLACEHOLDER_IMAGE), 'large')}
                      alt={product.name}
                      unoptimized={isLocalOrPlaceholder(resolveMediaUrl(visibleImages[activeImage] || PLACEHOLDER_IMAGE))}
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                      <span className="bg-neutral-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                        NEW
                      </span>
                      {discount && (
                        <span className="bg-sky-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                          {discount} OFF
                        </span>
                      )}
                    </div>

                    {/* Wishlist Icon */}
                    <button
                      type="button"
                      onClick={handleWishlist}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-[#0284c7] flex items-center justify-center shadow-md transition-all z-10"
                      title="Save to Wishlist"
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'text-sky-500 fill-current' : ''}`} />
                    </button>

                    {/* Share Button on Image */}
                    <button
                      type="button"
                      onClick={() => setShowShare(true)}
                      className="absolute top-16 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-[#0284c7] flex items-center justify-center shadow-md transition-all z-10"
                      title="Share Product"
                    >
                      <Share2 className="w-4.5 h-4.5" />
                    </button>

                    {/* View Full Size Overlay button */}
                    <button
                      type="button"
                      onClick={() => setShowFullSize(true)}
                      className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs hover:bg-white text-[10px] font-black text-neutral-800 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md uppercase tracking-wider transition-all z-10"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      View Full Size
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Product Details & Buying Options (Span 6) */}
              <div className="lg:col-span-6 space-y-6 text-left">
                
                {/* Brand & Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#0284c7] uppercase tracking-widest block">
                      {product.brandName || "VASANTHI'S SIGNATURE"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowShare(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-50 hover:bg-sky-100 text-[#0284c7] rounded-full text-xs font-bold border border-sky-200/80 transition-all active:scale-95 shadow-2xs cursor-pointer"
                      title="Share this product"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif text-neutral-900 leading-tight">
                    {product.name}
                  </h1>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-neutral-800">
                      {reviewSummary.averageRating ? reviewSummary.averageRating.toFixed(1) : '5.0'}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      ({reviewSummary.totalReviews > 0 ? `${reviewSummary.totalReviews} reviews` : '24 reviews'})
                    </span>
                  </div>
                </div>

                {/* Price Section Box */}
                <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 space-y-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-extrabold text-[#0284c7] font-serif">
                      {formatInr(finalUnitPrice)}
                    </span>
                    {original > finalUnitPrice && (
                      <span className="text-base text-neutral-400 line-through font-semibold">
                        {formatInr(original + tailoringFeePerItem)}
                      </span>
                    )}
                    {discount && wholesaleTier.discountPercent === 0 && (
                      <span className="text-xs font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200">
                        {discount} OFF
                      </span>
                    )}
                    {wholesaleTier.discountPercent > 0 && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {wholesaleTier.discountPercent}% Bulk Tier Applied
                      </span>
                    )}
                    {customTailoring && (
                      <span className="text-[10px] font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded-md border border-sky-200">
                        Includes +₹499 Custom Tailoring
                      </span>
                    )}
                  </div>

                  {/* Coupon Applied Discount Highlight */}
                  {offerDiscountAmount > 0 && selectedOffer && (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Coupon <span className="font-mono uppercase">{selectedOffer.code}</span> applied
                      </span>
                      <span>-{formatInr(offerDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                    <span>Inclusive of all taxes</span>
                    <span className="font-bold text-neutral-800">
                      Total ({qty} {qty > 1 ? 'items' : 'item'}): <span className="text-[#0284c7] font-extrabold">{formatInr(grandTotal)}</span>
                    </span>
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                  {product.shortDescription || `${product.name} — finely tailored with premium fabrics and authentic craftsmanship.`}
                </p>

                {/* OFFERS FOR YOU section — Interactive Coupons */}
                {pdpOffers.length > 0 && (
                  <div className="border border-dashed border-sky-200 bg-sky-50/20 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-black text-neutral-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Offers For You
                      </h3>
                      {selectedOfferCode && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOfferCode(null);
                            if (typeof window !== 'undefined') localStorage.removeItem('vs_applied_coupon');
                          }}
                          className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                        >
                          Clear Offer
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {pdpOffers.map((o) => {
                        const isSelected = selectedOfferCode?.toUpperCase() === o.code.toUpperCase();
                        const meetsMin = !o.minOrder || rawGrandTotal >= o.minOrder;

                        return (
                          <div
                            key={o.code}
                            onClick={() => handleToggleOffer(o)}
                            className={`cursor-pointer transition-all duration-200 flex items-center justify-between border rounded-xl p-3.5 ${
                              isSelected
                                ? 'bg-sky-50/80 border-[#0284c7] ring-2 ring-[#0284c7]/20 shadow-sm'
                                : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="space-y-1 pr-3">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-neutral-900">{o.label}</p>
                                {isSelected && (
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                    meetsMin ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {meetsMin ? 'Applied' : 'Selected'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-500 font-medium">
                                Use code <span className="font-mono font-bold text-[#0284c7]">{o.code}</span> — {o.detail}
                              </p>
                              {isSelected && !meetsMin && o.minOrder && (
                                <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                                  <span>⚠️ Add {formatInr(o.minOrder - rawGrandTotal)} more to unlock discount</span>
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleOffer(o);
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                                isSelected
                                  ? 'bg-[#0284c7] text-white shadow-xs'
                                  : 'bg-neutral-100 hover:bg-[#0284c7] text-neutral-700 hover:text-white border border-neutral-200'
                              }`}
                            >
                              {isSelected ? 'Applied' : 'Apply'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* COLOR SELECTION (CIRCULAR IMAGE / HEX SWATCHES) */}
                {colorGroups.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-neutral-900">Color:</span>
                      <span className="font-bold text-[#0284c7]">{selectedColor || currentColorGroup?.name}</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {colorGroups.map((group, idx) => {
                        const isSelected = (selectedColor || currentColorGroup?.name) === group.name;
                        const swatchUrl = group.swatchImage || group.images[0];

                        return (
                          <button
                            key={group.id || idx}
                            type="button"
                            title={group.name}
                            onClick={() => {
                              setSelectedColor(group.name);
                              setActiveImage(0);
                            }}
                            className={`relative w-9 h-9 rounded-full p-0.5 transition-all duration-200 ${
                              isSelected
                                ? 'ring-2 ring-offset-2 ring-[#0284c7] scale-110 shadow-sm'
                                : 'hover:scale-105 opacity-85 hover:opacity-100 border border-neutral-200'
                            }`}
                          >
                            {swatchUrl ? (
                              <Image
                                src={resolveMediaUrl(swatchUrl)}
                                alt={group.name}
                                fill
                                sizes="36px"
                                className="rounded-full object-cover shadow-2xs"
                                unoptimized={isLocalOrPlaceholder(resolveMediaUrl(swatchUrl))}
                              />
                            ) : (
                              <span
                                className="block w-full h-full rounded-full shadow-2xs border border-black/10"
                                style={{ backgroundColor: group.hex || '#0284c7' }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SIZE SELECTION (RECTANGULAR PILLS) */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-neutral-900">Select Size:</span>
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      className="text-[#0284c7] font-bold underline cursor-pointer hover:text-sky-900 text-xs"
                    >
                      Size Chart
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {(() => {
                      const rawList = (currentColorGroup?.sizes?.length
                        ? currentColorGroup.sizes
                        : (availableSizes.length > 0 ? availableSizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'Free Size']));
                      return rawList.map((item: unknown, idx: number) => {
                        const sizeObj = item as Record<string, unknown>;
                        const sizeLabel = typeof item === 'string' ? item : String(sizeObj.size || '');
                        const stock = typeof item === 'object' && item !== null && 'stock' in item ? Number(sizeObj.stock) : 10;
                        const available = typeof item === 'object' && item !== null && 'available' in item ? Boolean(sizeObj.available) : true;
                        const isSelected = selectedSize === sizeLabel;
                        const isOutOfStock = stock <= 0 || !available;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSize(sizeLabel)}
                            className={`min-w-12 h-11 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center relative ${
                              isSelected
                                ? isOutOfStock
                                  ? 'border-red-400 bg-red-50 text-red-700 shadow-sm ring-2 ring-red-400/30'
                                  : 'border-[#0284c7] bg-[#0284c7] text-white shadow-md'
                                : isOutOfStock
                                ? 'border-neutral-200 bg-neutral-50 text-neutral-400 hover:border-neutral-300'
                                : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                            }`}
                          >
                            <span className={isOutOfStock && !isSelected ? 'line-through opacity-60' : ''}>{sizeLabel}</span>
                            {isOutOfStock && (
                              <span className="text-[8px] font-black uppercase text-red-500 scale-90 -mt-0.5">Sold Out</span>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                  {/* Stock dot */}
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${stockText.includes('Only') || stockText.includes('Low') ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    <span className={stockText.includes('Only') || stockText.includes('Low') ? 'text-amber-600' : 'text-emerald-600'}>
                      {stockText}
                    </span>
                  </div>
                </div>

                {/* CUSTOM TAILORING & STITCHING STUDIO (Only if enabled on product) */}
                {showCustomTailoring && (
                  <div className="border border-sky-100 bg-white rounded-2xl p-4 shadow-2xs space-y-3 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center font-bold">
                          <Scissors className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-extrabold text-neutral-900">Custom Tailoring & Stitching</h4>
                            <span className="text-[10px] font-black bg-sky-100 text-[#0284c7] px-2 py-0.5 rounded-md uppercase tracking-wider">+₹499</span>
                          </div>
                          <p className="text-[10px] text-neutral-500">Bespoke sizing for Blouses, Lehengas & Anarkalis</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={customTailoring} 
                          onChange={(e) => setCustomTailoring(e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0284c7]"></div>
                      </label>
                    </div>

                    {customTailoring && (
                      <div className="border-t border-sky-50 pt-3 space-y-3 animate-fade-in text-xs">
                        <p className="text-[11px] font-semibold text-neutral-600">
                          Our master tailors will hand-stitch this garment to your exact measurements:
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Bust (Inches)</label>
                            <select 
                              value={measurements.bust} 
                              onChange={(e) => setMeasurements({ ...measurements, bust: e.target.value })}
                              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0284c7]"
                            >
                              {[32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54].map((n) => (
                                <option key={n} value={n}>{n}&quot; (Inches)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Waist (Inches)</label>
                            <select 
                              value={measurements.waist} 
                              onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0284c7]"
                            >
                              {[26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50].map((n) => (
                                <option key={n} value={n}>{n}&quot; (Inches)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Hips (Inches)</label>
                            <select 
                              value={measurements.hips} 
                              onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value })}
                              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0284c7]"
                            >
                              {[34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56].map((n) => (
                                <option key={n} value={n}>{n}&quot; (Inches)</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Garment Length</label>
                            <select 
                              value={measurements.length} 
                              onChange={(e) => setMeasurements({ ...measurements, length: e.target.value })}
                              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0284c7]"
                            >
                              {[38, 40, 42, 44, 46, 48, 50, 52, 54, 56].map((n) => (
                                <option key={n} value={n}>{n}&quot; (Standard)</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Sleeve Styling</label>
                            <select 
                              value={measurements.sleeveStyle} 
                              onChange={(e) => setMeasurements({ ...measurements, sleeveStyle: e.target.value })}
                              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0284c7]"
                            >
                              <option value="Sleeveless">Sleeveless</option>
                              <option value="Cap Sleeves">Cap Sleeves (3&quot;)</option>
                              <option value="Short Sleeves">Short Sleeves (6&quot;)</option>
                              <option value="3/4th Sleeves">3/4th Sleeves (15&quot;)</option>
                              <option value="Full Sleeves">Full Sleeves (21&quot;)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-neutral-500 uppercase">Neckline Cut</label>
                            <select 
                              value={measurements.neckline} 
                              onChange={(e) => setMeasurements({ ...measurements, neckline: e.target.value })}
                              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#0284c7]"
                            >
                              <option value="Sweetheart Neck">Sweetheart Neck (Designer)</option>
                              <option value="Round Neck">Classic Round Neck</option>
                              <option value="V-Neck Deep">Deep V-Neck</option>
                              <option value="Boat Neck">Modern Boat Neck</option>
                              <option value="Square Neck">Square Neck</option>
                              <option value="Collar / Mandarin">Mandarin Collar</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-1">
                          <label className="block text-[10px] font-bold text-neutral-500 uppercase">Special Tailoring Notes (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Add extra margin inside, side zipper requested..."
                            value={measurements.notes} 
                            onChange={(e) => setMeasurements({ ...measurements, notes: e.target.value })}
                            className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-[#0284c7]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* B2B / WHOLESALE RESELLER TIER (Only if enabled on product) */}
                {showWholesalePricing && (
                  <div className="border border-neutral-200/90 bg-neutral-50/50 rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                          <Boxes className="w-4 h-4 text-amber-700" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-extrabold text-neutral-900">B2B & Wholesale Reseller Pricing</h4>
                            {wholesaleTier.badge && (
                              <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                                {wholesaleTier.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500">Buy in bulk for boutiques, resellers & events</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className={`p-2 rounded-xl border transition-all ${qty < 5 ? 'bg-white border-neutral-300 shadow-2xs font-bold text-neutral-900 ring-1 ring-neutral-400' : 'bg-white/60 border-neutral-200 text-neutral-500'}`}>
                        <p className="text-[10px] uppercase font-bold text-neutral-400">1 - 4 Pcs</p>
                        <p className="text-xs font-black text-neutral-800 mt-0.5">{formatInr(price)}/pc</p>
                        <span className="text-[9px] text-neutral-400">Standard</span>
                      </div>

                      <div className={`p-2 rounded-xl border transition-all ${qty >= 5 && qty < 10 ? 'bg-amber-50 border-amber-300 shadow-2xs font-bold text-amber-900 ring-2 ring-amber-500' : 'bg-white/60 border-neutral-200 text-neutral-500'}`}>
                        <p className="text-[10px] uppercase font-bold text-amber-700">5 - 9 Pcs</p>
                        <p className="text-xs font-black text-amber-900 mt-0.5">{formatInr(Math.round(price * 0.85))}/pc</p>
                        <span className="text-[9px] font-bold text-emerald-600">15% OFF</span>
                      </div>

                      <div className={`p-2 rounded-xl border transition-all ${qty >= 10 ? 'bg-emerald-50 border-emerald-300 shadow-2xs font-bold text-emerald-900 ring-2 ring-emerald-500' : 'bg-white/60 border-neutral-200 text-neutral-500'}`}>
                        <p className="text-[10px] uppercase font-bold text-emerald-700">10+ Pcs</p>
                        <p className="text-xs font-black text-emerald-900 mt-0.5">{formatInr(Math.round(price * 0.75))}/pc</p>
                        <span className="text-[9px] font-bold text-emerald-600">25% OFF</span>
                      </div>
                    </div>

                    {/* 1-Click Wholesale Quantity Buttons */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider shrink-0">Quick Bulk:</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {[5, 10, 25, 50].map((bulkQty) => {
                          const isExceeded = maxAllowedQty > 0 && bulkQty > maxAllowedQty;
                          return (
                            <button
                              key={bulkQty}
                              type="button"
                              disabled={isExceeded || maxAllowedQty === 0}
                              onClick={() => {
                                if (bulkQty <= maxAllowedQty) {
                                  setQty(bulkQty);
                                  setStockWarning('');
                                } else {
                                  setQty(maxAllowedQty);
                                  setStockWarning(`Only ${maxAllowedQty} unit${maxAllowedQty === 1 ? '' : 's'} available in stock.`);
                                  setTimeout(() => setStockWarning(''), 3500);
                                }
                              }}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                isExceeded || maxAllowedQty === 0
                                  ? 'opacity-35 bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                  : qty === bulkQty
                                  ? 'bg-neutral-900 text-white border-neutral-900'
                                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                              }`}
                              title={isExceeded ? `Only ${maxAllowedQty} units available` : undefined}
                            >
                              {bulkQty} Pcs
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Counter, ADD TO BAG & BUY NOW section */}
                <div className="flex flex-col gap-2 pt-0.5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center justify-between sm:justify-center gap-3 border border-neutral-200 bg-white rounded-xl px-3 py-3 shadow-2xs shrink-0">
                      <button 
                        type="button" 
                        disabled={qty <= 1}
                        onClick={() => {
                          setQty((q) => Math.max(1, q - 1));
                          setStockWarning('');
                        }} 
                        className="p-0.5 hover:bg-neutral-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5 text-neutral-500" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center text-neutral-800">{qty}</span>
                      <button 
                        type="button" 
                        disabled={qty >= maxAllowedQty || maxAllowedQty === 0}
                        onClick={() => {
                          if (maxAllowedQty === 0) {
                            setStockWarning('This item is currently out of stock.');
                            setTimeout(() => setStockWarning(''), 3500);
                          } else if (qty < maxAllowedQty) {
                            setQty((q) => q + 1);
                            setStockWarning('');
                          } else {
                            setStockWarning(`Only ${maxAllowedQty} unit${maxAllowedQty === 1 ? '' : 's'} available in stock.`);
                            setTimeout(() => setStockWarning(''), 3500);
                          }
                        }} 
                        className="p-0.5 hover:bg-neutral-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        title={qty >= maxAllowedQty ? `Max stock limit (${maxAllowedQty}) reached` : 'Increase quantity'}
                      >
                        <Plus className="w-3.5 h-3.5 text-neutral-500" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5 flex-1">
                      <button
                        type="button"
                        disabled={addItem.isPending || maxAllowedQty === 0}
                        onClick={handleAddToCart}
                        className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-sky-900/10"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {maxAllowedQty === 0 ? 'OUT OF STOCK' : addItem.isPending ? 'ADDING…' : 'ADD TO BAG'}
                      </button>

                      <button
                        type="button"
                        disabled={addItem.isPending || maxAllowedQty === 0}
                        onClick={handleBuyNow}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-xs font-extrabold tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 border border-amber-400/50"
                      >
                        <Zap className="w-4 h-4 fill-neutral-950" />
                        {maxAllowedQty === 0 ? 'OUT OF STOCK' : addItem.isPending ? 'BUYING…' : 'BUY NOW'}
                      </button>
                    </div>
                  </div>

                  {/* Inline Stock Limit Warning Alert */}
                  {stockWarning && (
                    <div className="flex items-center gap-2 p-2.5 px-3 bg-amber-50 border border-amber-300/90 rounded-xl text-amber-900 text-xs font-semibold animate-fade-in shadow-2xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{stockWarning}</span>
                    </div>
                  )}

                  {/* Max Limit Note when quantity equals max stock and stock is limited */}
                  {!stockWarning && maxAllowedQty > 0 && maxAllowedQty <= 5 && qty >= maxAllowedQty && (
                    <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5 px-1">
                      <span>⚠️</span>
                      <span>Stock limit reached — maximum {maxAllowedQty} unit{maxAllowedQty === 1 ? '' : 's'} can be ordered for this selection.</span>
                    </div>
                  )}
                </div>

                {/* Out of Stock & Restock Alert Notice */}
                {maxAllowedQty === 0 && (
                  <div className="bg-gradient-to-br from-amber-50/70 via-sky-50/40 to-indigo-50/50 border border-sky-200/80 rounded-2xl p-4 shadow-sm space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                          <Bell className="w-4 h-4 text-sky-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-neutral-900">
                            Currently Out of Stock {selectedSize ? `in Size ${selectedSize}` : ''}
                          </h4>
                          <p className="text-[10px] text-neutral-500">
                            Get an instant WhatsApp / SMS / Email alert the moment fresh stock arrives.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNotifyMe(true)}
                      className="w-full bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-extrabold text-xs tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 active:scale-98 transition-all cursor-pointer"
                    >
                      <Bell className="w-4 h-4 fill-white" />
                      NOTIFY ME WHEN AVAILABLE
                    </button>
                  </div>
                )}

                {/* Action buttons (Save & Share) */}
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleWishlist}
                    className="flex-1 border border-neutral-200 bg-white hover:bg-neutral-50 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider text-neutral-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-sky-500 fill-current' : 'text-neutral-400'}`} />
                    Save to Wishlist
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowShare(true)}
                    className="flex-1 border border-neutral-200 bg-white hover:bg-neutral-50 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider text-neutral-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs relative"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-400" />
                    Share Product
                  </button>
                </div>

                {msg && <div className="text-xs font-bold text-center bg-emerald-50 border border-emerald-100 text-emerald-800 py-2 rounded-xl animate-fade-in">{msg}</div>}
                {err && <div className="text-xs font-bold text-center bg-red-50 border border-red-100 text-red-800 py-2 rounded-xl animate-fade-in">{err}</div>}

                {/* Delivery check PIN code */}
                <div className="border border-neutral-200/80 bg-white rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#0284c7]" /> Delivery & Service Options
                    </span>
                    {deliveryData?.city && (
                      <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-sky-100">
                        <MapPin className="w-3 h-3 text-[#0284c7]" /> {deliveryData.city}{deliveryData.state ? `, ${deliveryData.state}` : ''}
                      </span>
                    )}
                  </div>
                  <form onSubmit={handleCheckDelivery} className="flex gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        maxLength={6}
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit PIN Code"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0284c7] font-mono tracking-wider font-semibold"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={deliveryStatus === 'checking'}
                      className="bg-neutral-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition-colors shrink-0"
                    >
                      {deliveryStatus === 'checking' ? 'Checking...' : 'Check'}
                    </button>
                  </form>
                  
                  {deliveryStatus === 'checking' && (
                    <p className="text-[10px] text-neutral-500 animate-pulse font-semibold flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-[#0284c7]" /> Checking Courier & COD availability at {pinCode}...
                    </p>
                  )}
                  {deliveryStatus === 'available' && deliveryData && (
                    <div className="space-y-2 text-[11px] border-t border-neutral-100 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Delivery Available at {pinCode}!</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          ✓ Express Prepaid
                        </span>
                      </div>

                      {deliveryData.estimatedDateText && (
                        <div className="flex items-center gap-2 bg-sky-50/70 border border-sky-100 rounded-xl p-2.5 text-neutral-800 font-medium text-xs">
                          <Calendar className="w-4 h-4 text-[#0284c7] shrink-0" />
                          <div>
                            <span className="font-bold text-neutral-900">Estimated Delivery: </span>
                            <span className="font-extrabold text-[#0284c7]">{deliveryData.estimatedDateText}</span>
                            <p className="text-[10px] text-neutral-500 font-normal">Dispatched via Delhivery / DTDC Express</p>
                          </div>
                        </div>
                      )}

                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pl-1 text-[10px] text-neutral-600 font-medium">
                        <li className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Free Shipping Available</li>
                        <li className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Quality Inspected</li>
                        <li className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Tamper-Proof Packaging</li>
                        <li className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Live Tracking SMS/WhatsApp</li>
                      </ul>
                    </div>
                  )}
                  {deliveryStatus === 'invalid' && (
                    <p className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 p-2 rounded-xl">
                      Sorry, please enter a valid 6-digit Indian PIN code to check serviceability.
                    </p>
                  )}
                </div>

                {/* Service Icons Grid */}
                <div className="grid grid-cols-4 gap-2.5 border-t border-neutral-100 pt-5 text-center">
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600"><Truck className="w-4 h-4" /></div>
                    <p className="text-[9px] font-bold text-neutral-800 leading-tight">Fast Delivery</p>
                    <p className="text-[7px] font-medium text-neutral-400 leading-none">2-5 working days</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600"><Package className="w-4 h-4" /></div>
                    <p className="text-[9px] font-bold text-neutral-800 leading-tight">Safe Packaging</p>
                    <p className="text-[7px] font-medium text-neutral-400 leading-none">Tamper-proof box</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600"><Award className="w-4 h-4" /></div>
                    <p className="text-[9px] font-bold text-neutral-800 leading-tight">100% Authentic</p>
                    <p className="text-[7px] font-medium text-neutral-400 leading-none">Quality Guaranteed</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600"><ShieldCheck className="w-4 h-4" /></div>
                    <p className="text-[9px] font-bold text-neutral-800 leading-tight">Secure Payment</p>
                    <p className="text-[7px] font-medium text-neutral-400 leading-none">100% secure payments</p>
                  </div>
                </div>

                {/* OFFERS FOR YOU section (Mobile layout: under Service Icons Grid) — real active coupons only */}
                {pdpOffers.length > 0 && (
                  <div className="md:hidden mt-5 border border-dashed border-neutral-200 bg-white rounded-2xl p-4 space-y-3.5 shadow-2xs">
                    <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Offers For You
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      {pdpOffers.map((o) => (
                        <div key={o.code} className="flex items-center justify-between border border-neutral-100 rounded-xl p-3 bg-neutral-50/50">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-neutral-800">{o.label}</p>
                            <p className="text-[9px] text-neutral-400 font-semibold">Use code <span className="font-mono font-bold text-[var(--brand-primary)]">{o.code}</span> — {o.detail}</p>
                          </div>
                          <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-emerald-600" /></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Specifications & Detailed Info (Desktop tabs layout) */}
            <div className="border-t border-neutral-100 pt-8 mt-8">
              
              {/* Tab Navigation */}
              <div className="flex border-b border-neutral-200 text-xs font-bold uppercase tracking-wider gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'overview' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-neutral-400'
                  }`}
                >
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('care')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'care' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-neutral-400'
                  }`}
                >
                  Fabric & Care
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'shipping' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-neutral-400'
                  }`}
                >
                  Shipping Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'reviews' ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : 'border-transparent text-neutral-400'
                  }`}
                >
                  Reviews ({reviewSummary.totalReviews.toLocaleString()})
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="py-6 text-sm leading-relaxed text-neutral-600">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-widest block mb-2">Product Overview</p>
                    <div className="whitespace-pre-wrap">{product.description || 'No detailed overview provided.'}</div>
                    
                    {/* Product Highlights & Occasion */}
                    <div className="pt-4 space-y-2">
                      {product.highlights && Array.isArray(product.highlights) && product.highlights.length > 0 ? (
                        <>
                          <p className="text-xs font-bold text-neutral-800">Key Features:</p>
                          <ul className="space-y-2 text-xs text-neutral-700 font-semibold">
                            {product.highlights.map((hl: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-[var(--brand-primary)] font-bold">✔</span> {hl}
                              </li>
                            ))}
                          </ul>
                        </>
                      ) : null}
                      <p className="text-xs text-neutral-500 font-semibold pt-2">
                        <strong>Ideal For:</strong> {product.occasion ? `${product.occasion} wear & celebrations` : 'Everyday, festive & party wear'}
                      </p>
                    </div>
                  </div>
                )}
                {activeTab === 'care' && (
                  <div className="space-y-2">
                    <p className="font-bold text-neutral-800">Fabric Composition & Care Instruction details:</p>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs">
                      <li>Premium Rayon fabric blend</li>
                      <li>Cold water machine wash with like colors, gentle cycle</li>
                      <li>Iron on low heat setting</li>
                      <li>Do not bleach or tumble dry</li>
                    </ul>
                  </div>
                )}
                {activeTab === 'shipping' && (
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-neutral-800 text-sm">Express Shipping Details:</p>
                    <p>Dispatch within 24 hours. Express shipping averages 2-5 business days depending on location.</p>
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                      <span className="text-xs font-bold text-neutral-500">
                        {reviewSummary.totalReviews} Customer {reviewSummary.totalReviews === 1 ? 'Review' : 'Reviews'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(true)}
                        className="text-xs font-bold text-[var(--brand-primary)] hover:underline"
                      >
                        Write a Review
                      </button>
                    </div>
                    {reviews.length === 0 && (
                      <p className="text-xs text-neutral-500 py-4">No reviews yet. Be the first to review this product!</p>
                    )}
                    {reviews.map((rev) => (
                      <div key={rev.id} className="border-b border-neutral-100 pb-4 last:border-b-0 space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-neutral-800">
                          <span>{rev.user?.name || 'Verified Buyer'}</span>
                          <span className="text-neutral-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-amber-400 gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                        </div>
                        {rev.title && <p className="text-xs font-bold text-neutral-800">{rev.title}</p>}
                        <p className="text-xs text-neutral-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Mobile spec cards with chevron arrows */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {[
                { title: product.type ? `${product.type}` : 'Premium Craftsmanship', desc: 'Expertly tailored with premium quality' },
                { title: 'All Day Comfort', desc: 'Lightweight & breathable for all day ease' },
                { title: 'Occasion & Style', desc: product.occasion ? `${product.occasion} wear` : 'Versatile styling for every moment' },
                { title: 'Season & Collection', desc: product.season || 'Year-round essential' }
              ].map((spec, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-4 cursor-pointer hover:border-neutral-300">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-neutral-800">{spec.title}</p>
                    <p className="text-[10px] text-neutral-400 font-semibold">{spec.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
              ))}
            </div>

            {/* Structured Specifications Table */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-5 shadow-2xs max-w-2xl">
              <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">Product Specifications</h3>
              <div className="divide-y divide-neutral-100 text-xs">
                <div className="flex py-2.5">
                  <span className="w-1/3 text-neutral-400 font-bold uppercase">Brand</span>
                  <span className="w-2/3 text-neutral-800 font-semibold">{product.brandName || "VASANTHI'S SIGNATURE"}</span>
                </div>
                <div className="flex py-2.5">
                  <span className="w-1/3 text-neutral-400 font-bold uppercase">Category</span>
                  <span className="w-2/3 text-neutral-800 font-semibold">{product.categories?.map(c => c.categoryName || (c as any).category?.name).filter(Boolean).join(', ') || 'Apparel'}</span>
                </div>
                {product.occasion && (
                  <div className="flex py-2.5">
                    <span className="w-1/3 text-neutral-400 font-bold uppercase">Occasion</span>
                    <span className="w-2/3 text-neutral-800 font-semibold">{product.occasion}</span>
                  </div>
                )}
                {product.season && (
                  <div className="flex py-2.5">
                    <span className="w-1/3 text-neutral-400 font-bold uppercase">Season</span>
                    <span className="w-2/3 text-neutral-800 font-semibold">{product.season}</span>
                  </div>
                )}
                {product.gender && (
                  <div className="flex py-2.5">
                    <span className="w-1/3 text-neutral-400 font-bold uppercase">Gender</span>
                    <span className="w-2/3 text-neutral-800 font-semibold">{product.gender}</span>
                  </div>
                )}
                {product.type && (
                  <div className="flex py-2.5">
                    <span className="w-1/3 text-neutral-400 font-bold uppercase">Garment Type</span>
                    <span className="w-2/3 text-neutral-800 font-semibold">{product.type}</span>
                  </div>
                )}
                {product.attributes?.map((attr) => (
                  <div key={attr.attributeId} className="flex py-2.5">
                    <span className="w-1/3 text-neutral-400 font-bold uppercase">{attr.attributeName}</span>
                    <span className="w-2/3 text-neutral-800 font-semibold">{attr.value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* YOU MAY ALSO LIKE Section (matching mocks) */}
            {relatedProducts.length > 0 && (
              <div className="border-t border-neutral-100 pt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-serif text-neutral-900 uppercase tracking-wide">You May Also Like</h3>
                  <Link href="/catalog" className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-0.5">
                    View All <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {relatedProducts.map((p) => {
                    const pPrice = p.salePrice ?? p.basePrice ?? 0;
                    return (
                      <Link 
                        key={p.id} 
                        href={`/product/${p.slug || p.id}`}
                        className="bg-white border border-neutral-100 hover:border-neutral-200 rounded-2xl p-3 shadow-2xs hover:shadow-xs transition-all group flex flex-col"
                      >
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-neutral-50 mb-3 relative">
                          <Image 
                            src={withVariant(resolveMediaUrl(p.primaryImageUrl || PLACEHOLDER_IMAGE), 'medium')} 
                            alt={p.name} 
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            unoptimized={isLocalOrPlaceholder(resolveMediaUrl(p.primaryImageUrl || PLACEHOLDER_IMAGE))}
                            className="object-cover group-hover:scale-103 transition-transform" 
                          />
                        </div>
                        <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                          {p.brandName || "VASANTHI'S SIGNATURE"}
                        </span>
                        <h4 className="text-xs font-bold text-neutral-800 line-clamp-1 group-hover:text-[var(--brand-primary)] transition-colors flex-1">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs font-black text-[var(--brand-primary)]">{formatInr(pPrice)}</span>
                          {p.salePrice && p.basePrice && p.basePrice > p.salePrice && (
                            <span className="text-[10px] text-neutral-400 line-through">{formatInr(p.basePrice)}</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom 100% Original Trust Badge Banner */}
            <div className="border border-sky-100 bg-sky-50/30 rounded-2xl p-4 flex items-center justify-center gap-3 max-w-md mx-auto text-center mt-6 shadow-2xs">
              <Award className="w-6 h-6 text-[var(--brand-primary)] shrink-0" />
              <div className="text-left space-y-0.5">
                <p className="text-xs font-black text-neutral-800 uppercase tracking-wider">100% Original Products</p>
                <p className="text-[10px] text-neutral-500 font-semibold">Quality you can trust, style you&apos;ll love.</p>
              </div>
            </div>

            {/* Size Chart Modal */}
            <SizeChartModal isOpen={showSizeChart} onClose={() => setShowSizeChart(false)} />

            {/* Full-size Image Overlay Modal */}
            <ImageOverlayModal 
              isOpen={showFullSize} 
              onClose={() => setShowFullSize(false)} 
              src={withVariant(resolveMediaUrl(visibleImages[activeImage] || PLACEHOLDER_IMAGE), 'large')} 
              alt={product.name} 
            />

            {/* Dynamic Share Modal */}
            <ShareModal 
              isOpen={showShare} 
              onClose={() => setShowShare(false)} 
              url={typeof window !== 'undefined' ? window.location.href : ''} 
              title={product.name} 
              image={visibleImages[0] as string | undefined}
              price={finalUnitPrice}
              description={product.shortDescription || undefined}
            />

            {/* Dynamic Review Modal */}
            <ReviewFormModal 
              isOpen={showReviewForm} 
              onClose={() => setShowReviewForm(false)} 
              product={{
                productId: product.id,
                productTitle: product.name,
                productImage: visibleImages[0] as string | undefined,
              }}
            />

            {/* Dynamic Notify Me Modal */}
            <NotifyMeModal
              isOpen={showNotifyMe}
              onClose={() => setShowNotifyMe(false)}
              productId={product.id}
              productName={product.name}
              productImage={visibleImages[0] as string | undefined}
              selectedSize={selectedSize || undefined}
              selectedColor={selectedColor || currentColorGroup?.name || undefined}
              variantId={matchingVariant?.id}
            />

            {/* Dynamic Size Chart Modal */}
            <SizeChartModal
              isOpen={showSizeChart}
              onClose={() => setShowSizeChart(false)}
              productId={product.id}
              productName={product.name}
              sizeChartTemplateId={product.sizeChartTemplateId}
            />

            {/* Sticky Cart mobile navigation bar at the bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] px-4 py-2.5 flex items-center justify-between md:hidden pb-[calc(0.6rem+env(safe-area-inset-bottom))]">
              <div className="flex flex-col pr-2">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Price</span>
                <span className="text-base sm:text-lg font-black text-[var(--brand-primary)] leading-tight">{formatInr(price)}</span>
              </div>
              <div className="flex gap-2 items-center flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => setShowShare(true)}
                  className="p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl border border-neutral-200 shrink-0 flex items-center justify-center transition-all"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {availableSizes.length > 0 && (
                  <select 
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-2 text-xs font-bold text-neutral-700 focus:outline-none max-w-[85px] truncate"
                  >
                    <option value="">Size</option>
                    {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}

                {maxAllowedQty === 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowNotifyMe(true)}
                    className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-extrabold text-[11px] px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-500/20 active:scale-98 transition-all"
                  >
                    <Bell className="w-3.5 h-3.5 fill-white" />
                    Notify Me
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={addItem.isPending}
                      onClick={handleAddToCart}
                      className="bg-[var(--brand-primary)] text-white font-bold text-xs px-3 py-2.5 rounded-xl hover:bg-[var(--brand-primary-dark)] flex items-center gap-1 shadow-2xs active:scale-98 transition-all"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Add to Bag
                    </button>
                    <button
                      type="button"
                      disabled={addItem.isPending}
                      onClick={handleBuyNow}
                      className="bg-amber-500 text-neutral-950 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-amber-600 flex items-center gap-1 shadow-2xs active:scale-98 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 fill-neutral-950" />
                      Buy Now
                    </button>
                  </>
                )}
              </div>
            </div>

          </>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}
