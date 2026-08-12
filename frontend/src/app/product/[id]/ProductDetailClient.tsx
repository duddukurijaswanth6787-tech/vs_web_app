'use client';

import React, { useMemo, useState } from 'react';
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
  ChevronDown,
  ChevronRight,
  Maximize2,
  Ruler,
  Zap
} from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ReviewFormModal } from '@/components/storefront/ReviewFormModal';
import {
  useCustomerProduct,
  useCartMutations,
  useWishlistMutations,
  useCustomerProducts,
  useProductReviews,
} from '@/features/customer/hooks';
import { useVariants } from '@/features/catalog/variants/variant.hooks';
import dynamic from 'next/dynamic';

const ImageOverlayModal = dynamic(() => import('./ImageOverlayModal').then(mod => mod.ImageOverlayModal), { ssr: false });
const SizeChartModal = dynamic(() => import('./SizeChartModal').then(mod => mod.SizeChartModal), { ssr: false });
const ProductImageZoom = dynamic(() => import('./ProductImageZoom').then(mod => mod.ProductImageZoom), { ssr: false });
const ShareModal = dynamic(() => import('./ShareModal').then(mod => mod.ShareModal), { ssr: false });
import { useAuth } from '@/hooks/useAuth';
import {
  discountLabel,
  formatInr,
  PLACEHOLDER_IMAGE,
} from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { resolveMediaUrl, isLocalOrPlaceholder, withVariant } from '@/lib/media-url';

export function ProductDetailClient() {
  const params = useParams();
  const idOrSlug = String(params.id || '');
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
  const { data: product, isLoading, error } = useCustomerProduct(idOrSlug);

  // Extract unique colors and sizes from variants
  const { data: variantsData } = useVariants({ productId: looksLikeUuid ? idOrSlug : product?.id, limit: 100 });
  const { data: reviewsData } = useProductReviews(product?.id || '', !!product?.id);
  const reviews = reviewsData?.data || [];
  const reviewSummary = reviewsData?.summary || { averageRating: 0, totalReviews: 0 };
  const { addItem } = useCartMutations();
  const { add: addWishlist } = useWishlistMutations();
  
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'checking' | 'available' | 'invalid'>('idle');
  const [activeTab, setActiveTab] = useState<'overview' | 'care' | 'shipping' | 'reviews'>('overview');
  
  // Wishlist toggle
  const [isSaved, setIsSaved] = useState(false);

  // Dynamic Modal states
  const [showShare, setShowShare] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Load related products from same category
  const { data: relatedData } = useCustomerProducts({
    limit: 5,
    categoryId: product?.categories?.[0]?.categoryId || undefined,
  });
  
  const relatedProducts = useMemo(() => {
    return relatedData?.data?.filter((p) => p.id !== product?.id).slice(0, 4) || [];
  }, [relatedData, product]);

  const images = useMemo<string[]>(() => {
    const list: string[] = product?.images?.map((i) => i.url).filter((u): u is string => Boolean(u)) || [];
    if (product?.primaryImageUrl) list.unshift(product.primaryImageUrl);
    return Array.from(new Set(list.length ? list : [PLACEHOLDER_IMAGE]));
  }, [product]);

  const visibleImages = useMemo<string[]>(() => {
    if (selectedColor) {
      const colorSpecific: string[] = product?.images
        ?.filter((img) => img.color && img.color.toLowerCase() === selectedColor.toLowerCase())
        ?.map((img) => img.url) || [];
      if (colorSpecific.length > 0) {
        return Array.from(new Set(colorSpecific));
      }
    }
    return images;
  }, [product, selectedColor, images]);

  const [activeImage, setActiveImage] = useState(0);
  const [prevSelectedColor, setPrevSelectedColor] = useState(selectedColor);
  if (selectedColor !== prevSelectedColor) {
    setPrevSelectedColor(selectedColor);
    setActiveImage(0);
  }

  // Extract unique colors and sizes from variants
  const availableColors = useMemo(() => {
    if (!variantsData?.data) return [];
    const colors = new Set<string>();
    variantsData.data.forEach(v => {
      v.attributeValues?.forEach(av => {
        if (av.attributeName.toLowerCase() === 'color' && av.value) {
          colors.add(av.value);
        }
      });
    });
    return Array.from(colors);
  }, [variantsData]);

  const availableSizes = useMemo(() => {
    if (!variantsData?.data) return [];
    const sizes = new Set<string>();
    variantsData.data.forEach(v => {
      v.attributeValues?.forEach(av => {
        if (av.attributeName.toLowerCase() === 'size' && av.value) {
          sizes.add(av.value);
        }
      });
    });
    return Array.from(sizes);
  }, [variantsData]);

  // Set default selections once loaded
  if (availableColors.length > 0 && !selectedColor) {
    setSelectedColor(availableColors[0]);
  }
  if (availableSizes.length > 0 && !selectedSize) {
    setSelectedSize(availableSizes[0]);
  }

  // Find matching variant based on selections
  const matchingVariant = useMemo(() => {
    if (!variantsData?.data?.length) return null;
    return variantsData.data.find(v => {
      const colorMatch = v.attributeValues?.some(
        av => av.attributeName.toLowerCase() === 'color' && av.value === selectedColor
      );
      const sizeMatch = v.attributeValues?.some(
        av => av.attributeName.toLowerCase() === 'size' && av.value === selectedSize
      );
      return colorMatch && sizeMatch;
    });
  }, [variantsData, selectedColor, selectedSize]);

  const price = matchingVariant?.salePriceOverride ?? matchingVariant?.priceOverride ?? product?.salePrice ?? product?.basePrice ?? 0;
  const original = matchingVariant?.priceOverride ?? product?.basePrice ?? 0;
  const discount = discountLabel(original, matchingVariant?.salePriceOverride ?? product?.salePrice);

  // Simulated dynamic stock
  const stockText = useMemo(() => {
    if (!selectedSize) return 'Select size to check availability';
    if (selectedSize === 'XL') return 'Only 6 left - selling fast!';
    if (selectedSize === 'S') return 'In Stock';
    if (selectedSize === 'XXL') return 'Low Stock';
    return 'In Stock';
  }, [selectedSize]);

  const handleAddToCart = async () => {
    if (!product) return;
    setErr('');
    setMsg('');
    try {
      await addItem.mutateAsync({ 
        productId: product.id, 
        variantId: matchingVariant?.id, 
        quantity: qty 
      });
      setMsg('Product successfully added to your bag!');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr(getApiErrorMessage(e, 'Could not add to cart'));
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setErr('');
    setMsg('');
    try {
      await addItem.mutateAsync({ 
        productId: product.id, 
        variantId: matchingVariant?.id, 
        quantity: qty 
      });
      router.push('/checkout/address');
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
      await addWishlist.mutateAsync(product.id);
      setIsSaved(true);
      setMsg('Saved to your wishlist!');
      setTimeout(() => setMsg(''), 4000);
    } catch (e) {
      setErr(getApiErrorMessage(e, 'Could not update wishlist'));
    }
  };

  const handleCheckDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinCode.trim() || pinCode.length < 6) {
      setDeliveryStatus('invalid');
      return;
    }
    setDeliveryStatus('checking');
    setTimeout(() => {
      setDeliveryStatus('available');
    }, 800);
  };

  // Full-size image modal state
  const [showFullSize, setShowFullSize] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans antialiased text-neutral-900 pb-20 md:pb-0">
      
      {/* Promotional Top Bar */}
      <div className="hidden md:block bg-neutral-50 border-b border-neutral-100 py-2.5 text-[10px] md:text-[11px] font-bold text-neutral-500 uppercase tracking-widest">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Free Shipping on orders above ₹999</span>
          </div>
          <span className="text-neutral-200 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
            <span>Easy 7-Day Returns</span>
          </div>
          <span className="text-neutral-200 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-neutral-400" />
            <span>COD Available</span>
          </div>
          <span className="text-neutral-200 hidden sm:inline">|</span>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>New Arrivals Every Week</span>
          </div>
        </div>
      </div>

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
            <Link href="/" className="inline-block mt-4 text-xs font-bold text-[#800020] underline">Back to home</Link>
          </div>
        )}

        {product && (
          <>
            {/* Breadcrumb Trail */}
            <nav className="hidden md:flex text-[11px] text-neutral-400 font-bold items-center gap-1.5">
              <Link href="/" className="hover:text-[#800020]">Home</Link>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="hover:text-[#800020]">Women</span>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="hover:text-[#800020]">Ethnic Wear</span>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="hover:text-[#800020]">Kurta Sets</span>
              <ChevronRight className="w-3 h-3 text-neutral-300" />
              <span className="text-neutral-600 truncate max-w-[180px] md:max-w-none">{product.name}</span>
            </nav>

            {/* Product Core Grid Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Images Showcase (Desktop Mocks Layout) */}
              <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
                
                {/* Desktop Vertical Thumbnail Slider */}
                <div className="hidden md:flex flex-col gap-2.5 w-20 shrink-0">
                  <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[460px] scrollbar-none pr-1">
                    {visibleImages.map((src, i) => (
                      <button
                        key={src + i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className={`w-full aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                          i === activeImage ? 'border-[#800020] scale-95 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={withVariant(resolveMediaUrl(src), 'thumb')}
                            alt=""
                            width={120}
                            height={160}
                            unoptimized={isLocalOrPlaceholder(resolveMediaUrl(src))}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </button>
                    ))}
                    {/* Video thumbnail mockup */}
                    <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-100 relative flex items-center justify-center cursor-pointer opacity-80 hover:opacity-100 shrink-0">
                      <Image
                        src={withVariant(resolveMediaUrl(visibleImages[0]), 'thumb')}
                        alt=""
                        width={120}
                        height={160}
                        unoptimized={isLocalOrPlaceholder(resolveMediaUrl(visibleImages[0]))}
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-xs">
                          <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-[#800020] ml-0.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Scroll Down chevron indicator */}
                  <button type="button" className="mx-auto text-neutral-400 hover:text-[#800020] p-1">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Large Image Container */}
                <div className="flex-1 space-y-4">
                  <div className="aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden bg-white border border-neutral-100 shadow-xs relative group">
                    <ProductImageZoom
                      src={withVariant(resolveMediaUrl(visibleImages[activeImage] || PLACEHOLDER_IMAGE), 'large')}
                      alt={product.name}
                      unoptimized={isLocalOrPlaceholder(resolveMediaUrl(visibleImages[activeImage] || PLACEHOLDER_IMAGE))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFullSize(true)}
                      className="absolute bottom-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-xl transition-all shadow-md group-hover:scale-105 z-10"
                      aria-label="View full size"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    
                    {/* Discount pill badge */}
                    {discount && (
                      <span className="absolute top-4 left-4 text-[10px] font-black text-white bg-[#800020] px-3 py-1 rounded-full shadow-md uppercase tracking-widest">
                        {discount} OFF
                      </span>
                    )}

                    {/* Desktop wishlisting icon */}
                    <button
                      type="button"
                      onClick={handleWishlist}
                      className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md text-neutral-600 hover:text-rose-500 active:scale-95 transition-all"
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'text-rose-500 fill-current' : ''}`} />
                    </button>

                    {/* View Full Size Overlay button */}
                    <button
                      type="button"
                      onClick={() => setShowFullSize(true)}
                      className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-xs hover:bg-white text-[10px] font-black text-neutral-800 px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md uppercase tracking-wider transition-all"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      View Full Size
                    </button>

                    {/* Mobile Carousel dot indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:hidden">
                      {visibleImages.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${
                            i === activeImage ? 'w-4 bg-[#800020]' : 'w-1.5 bg-neutral-300/80'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Mobile horizontal scroll thumbnail strip */}
                  <div className="flex gap-2 overflow-x-auto pb-1 md:hidden scrollbar-none">
                    {visibleImages.map((src, i) => (
                      <button
                        key={src + i}
                        type="button"
                        onClick={() => setActiveImage(i)}
                        className={`w-14 aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                          i === activeImage ? 'border-[#800020] scale-95 shadow-sm' : 'border-transparent opacity-70'
                        }`}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={withVariant(resolveMediaUrl(src), 'thumb')}
                            alt=""
                            width={56}
                            height={72}
                            unoptimized={isLocalOrPlaceholder(resolveMediaUrl(src))}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </button>
                    ))}
                    {/* Video play mockup mobile thumbnail */}
                    <div className="w-14 aspect-[3/4] rounded-lg overflow-hidden bg-neutral-900 border border-neutral-100 relative flex items-center justify-center flex-shrink-0 cursor-pointer">
                      <Image
                        src={withVariant(resolveMediaUrl(visibleImages[0]), 'thumb')}
                        alt=""
                        width={56}
                        height={72}
                        unoptimized={isLocalOrPlaceholder(resolveMediaUrl(visibleImages[0]))}
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-[#800020] ml-0.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>



                </div>
              </div>

              {/* Right Column: Information & Actions Panel */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Brand Tag, Title & Ratings */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-lg">
                      {product.brandName || 'VASANTHI DESIGNERS'}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold font-serif text-neutral-900 leading-tight tracking-tight">
                    {product.name}
                  </h2>
                  {reviewSummary.totalReviews > 0 && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-500">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[1,2,3,4,5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(reviewSummary.averageRating) ? 'fill-current' : 'fill-none stroke-current'}`} />)}
                      </div>
                      <span className="font-bold text-neutral-800 ml-1">{reviewSummary.averageRating.toFixed(1)}</span>
                      <span className="text-neutral-300">|</span>
                      <span>{reviewSummary.totalReviews.toLocaleString()} Reviews</span>
                    </div>
                  )}
                </div>

                {/* Pricing Block */}
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-[#800020]">{formatInr(price)}</span>
                  {original > price && (
                    <span className="text-xs font-semibold text-neutral-400 line-through">{formatInr(original)}</span>
                  )}
                  {discount && (
                    <span className="text-[10px] font-black text-rose-800 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {discount} OFF
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                  {product.shortDescription || 'Elegant floral printed rayon Anarkali kurta set with matching bottom and dupatta. Perfect for festive and casual occasions.'}
                </p>

                {/* OFFERS FOR YOU section */}
                <div className="hidden md:block border border-dashed border-neutral-200 bg-white rounded-2xl p-4 space-y-3.5 shadow-2xs">
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Offers For You
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-center justify-between border border-neutral-100 rounded-xl p-3 bg-neutral-50/50">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-800">Flat ₹300 OFF</p>
                        <p className="text-[9px] text-neutral-400 font-semibold">Use code <span className="font-mono font-bold text-[#800020]">VASANTHI300</span> on checkout.</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-emerald-600" /></div>
                    </div>
                    <div className="flex items-center justify-between border border-neutral-100 rounded-xl p-3 bg-neutral-50/50">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-800">10% Instant Bank Discount</p>
                        <p className="text-[9px] text-neutral-400 font-semibold">On SBI Credit Cards. Min purchase ₹2,999.</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-emerald-600" /></div>
                    </div>
                  </div>
                </div>

                {/* SELECT COLOR section */}
                {availableColors.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Select Color</span>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((color) => {
                        const active = color === selectedColor;
                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              active 
                                ? 'bg-[#800020] border-[#800020] text-white shadow-sm' 
                                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SELECT SIZE section */}
                {availableSizes.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Select Size</span>
                      <button
                        type="button"
                        onClick={() => setShowSizeChart(true)}
                        className="text-[10px] font-bold text-[#800020] hover:underline flex items-center gap-1"
                      >
                        <Ruler className="w-3 h-3" /> Size Guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {availableSizes.map((size) => {
                        const active = size === selectedSize;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`w-10 h-10 rounded-full border text-xs font-bold transition-all flex items-center justify-center ${
                              active 
                                ? 'bg-[#800020] border-[#800020] text-white shadow-sm' 
                                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>

                    {/* Stock dot */}
                    <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${stockText.includes('Only') || stockText.includes('Low') ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                      <span className={stockText.includes('Only') || stockText.includes('Low') ? 'text-amber-600' : 'text-emerald-600'}>
                        {stockText}
                      </span>
                    </div>
                  </div>
                )}

                {/* Counter, ADD TO BAG & BUY NOW section */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-0.5">
                  <div className="flex items-center justify-between sm:justify-center gap-3 border border-neutral-200 bg-white rounded-xl px-3 py-3 shadow-2xs shrink-0">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-0.5 hover:bg-neutral-50 rounded">
                      <Minus className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                    <span className="text-sm font-bold w-5 text-center text-neutral-800">{qty}</span>
                    <button type="button" onClick={() => setQty((q) => q + 1)} className="p-0.5 hover:bg-neutral-50 rounded">
                      <Plus className="w-3.5 h-3.5 text-neutral-500" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 flex-1">
                    <button
                      type="button"
                      disabled={addItem.isPending}
                      onClick={handleAddToCart}
                      className="flex-1 bg-[#800020] hover:bg-[#600018] active:scale-98 transition-all disabled:opacity-60 text-white text-xs font-extrabold tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-900/10"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {addItem.isPending ? 'ADDING…' : 'ADD TO BAG'}
                    </button>

                    <button
                      type="button"
                      disabled={addItem.isPending}
                      onClick={handleBuyNow}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-98 transition-all disabled:opacity-60 text-neutral-950 text-xs font-extrabold tracking-wider py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 border border-amber-400/50"
                    >
                      <Zap className="w-4 h-4 fill-neutral-950" />
                      {addItem.isPending ? 'BUYING…' : 'BUY NOW'}
                    </button>
                  </div>
                </div>

                {/* Action buttons (Save & Share) */}
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleWishlist}
                    className="flex-1 border border-neutral-200 bg-white hover:bg-neutral-50 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider text-neutral-700 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'text-rose-500 fill-current' : 'text-neutral-400'}`} />
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
                <div className="border border-neutral-100 bg-white rounded-2xl p-4 shadow-2xs space-y-3">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Delivery & Service Options</span>
                  <form onSubmit={handleCheckDelivery} className="flex gap-2">
                    <input 
                      type="text" 
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit PIN Code"
                      className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-neutral-900 font-mono"
                    />
                    <button 
                      type="submit" 
                      className="bg-neutral-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                      Check
                    </button>
                  </form>
                  
                  {deliveryStatus === 'checking' && (
                    <p className="text-[10px] text-neutral-500 animate-pulse font-semibold">Verifying services at Pin Code {pinCode}...</p>
                  )}
                  {deliveryStatus === 'available' && (
                    <div className="space-y-1.5 text-[11px] border-t border-neutral-50 pt-2.5">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Delivery Available at {pinCode}!</span>
                      </div>
                      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 pl-6 text-[10px] text-neutral-500 font-semibold list-disc">
                        <li>Delivery by Tuesday</li>
                        <li>Free Standard Delivery</li>
                        <li>Cash on Delivery (COD)</li>
                        <li>Easy Returns & Exchange</li>
                      </ul>
                    </div>
                  )}
                  {deliveryStatus === 'invalid' && (
                    <p className="text-[10px] text-red-600 font-bold">Please enter a valid 6-digit pin code.</p>
                  )}
                </div>

                {/* Service Icons Grid (Mock style) */}
                <div className="grid grid-cols-4 gap-2.5 border-t border-neutral-100 pt-5 text-center">
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600"><Truck className="w-4 h-4" /></div>
                    <p className="text-[9px] font-bold text-neutral-800 leading-tight">Delivery</p>
                    <p className="text-[7px] font-medium text-neutral-400 leading-none">2-5 working days</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600"><RefreshCw className="w-4 h-4" /></div>
                    <p className="text-[9px] font-bold text-neutral-800 leading-tight">Easy Returns</p>
                    <p className="text-[7px] font-medium text-neutral-400 leading-none">7 days return policy</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600"><Award className="w-4 h-4" /></div>
                    <p className="text-[9px] font-bold text-neutral-800 leading-tight">COD Available</p>
                    <p className="text-[7px] font-medium text-neutral-400 leading-none">Pay on delivery</p>
                  </div>
                  <div className="space-y-1">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center mx-auto text-neutral-600"><ShieldCheck className="w-4 h-4" /></div>
                    <p className="text-[9px] font-bold text-neutral-800 leading-tight">Secure Payment</p>
                    <p className="text-[7px] font-medium text-neutral-400 leading-none">100% secure payments</p>
                  </div>
                </div>

                {/* OFFERS FOR YOU section (Mobile layout: under Service Icons Grid) */}
                <div className="md:hidden mt-5 border border-dashed border-neutral-200 bg-white rounded-2xl p-4 space-y-3.5 shadow-2xs">
                  <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Offers For You
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-center justify-between border border-neutral-100 rounded-xl p-3 bg-neutral-50/50">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-800">Flat ₹300 OFF</p>
                        <p className="text-[9px] text-neutral-400 font-semibold">Use code <span className="font-mono font-bold text-[#800020]">VASANTHI300</span> on checkout.</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-emerald-600" /></div>
                    </div>
                    <div className="flex items-center justify-between border border-neutral-100 rounded-xl p-3 bg-neutral-50/50">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-800">10% Instant Bank Discount</p>
                        <p className="text-[9px] text-neutral-400 font-semibold">On SBI Credit Cards. Min purchase ₹2,999.</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border border-neutral-300 flex items-center justify-center"><CheckCircle className="w-2.5 h-2.5 text-emerald-600" /></div>
                    </div>
                  </div>
                </div>

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
                    activeTab === 'overview' ? 'border-[#800020] text-[#800020]' : 'border-transparent text-neutral-400'
                  }`}
                >
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('care')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'care' ? 'border-[#800020] text-[#800020]' : 'border-transparent text-neutral-400'
                  }`}
                >
                  Fabric & Care
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shipping')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'shipping' ? 'border-[#800020] text-[#800020]' : 'border-transparent text-neutral-400'
                  }`}
                >
                  Shipping Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 border-b-2 transition-all ${
                    activeTab === 'reviews' ? 'border-[#800020] text-[#800020]' : 'border-transparent text-neutral-400'
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
                    
                    {/* Mobile Bullet Specifications mock list */}
                    <div className="pt-4 space-y-2">
                      <p className="text-xs font-bold text-neutral-800">Key Features:</p>
                      <ul className="space-y-2 text-xs text-neutral-700 font-semibold">
                        <li className="flex items-center gap-2"><span className="text-[#800020] font-bold">✔</span> Floral printed Anarkali kurta with elegant flare</li>
                        <li className="flex items-center gap-2"><span className="text-[#800020] font-bold">✔</span> Matching bottom with comfortable fit</li>
                        <li className="flex items-center gap-2"><span className="text-[#800020] font-bold">✔</span> Lightweight floral dupatta with tassels</li>
                        <li className="flex items-center gap-2"><span className="text-[#800020] font-bold">✔</span> Round neckline with delicate detailing</li>
                        <li className="flex items-center gap-2"><span className="text-[#800020] font-bold">✔</span> Full length sleeves</li>
                      </ul>
                      <p className="text-xs text-neutral-500 font-semibold pt-2">
                        <strong>Ideal For:</strong> Festive wear, casual outings, family gatherings, office wear, and day celebrations.
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
                        className="text-xs font-bold text-[#800020] hover:underline"
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

            {/* Mobile spec cards with chevron arrows (from mobile mock) */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {[
                { title: 'Premium Rayon Fabric', desc: 'Soft, breathable & skin-friendly' },
                { title: 'All Day Comfort', desc: 'Lightweight fabric for all day ease' },
                { title: 'Perfect For Every Occasion', desc: 'Festive, casual & party wear' },
                { title: 'Easy Care', desc: 'Low maintenance & durable fabric' }
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
                  <span className="w-2/3 text-neutral-800 font-semibold">{product.categories?.[0]?.categoryName || 'Ethnic Wear'}</span>
                </div>
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
                  <Link href="/catalog" className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-0.5">
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
                        <h4 className="text-xs font-bold text-neutral-800 line-clamp-1 group-hover:text-[#800020] transition-colors flex-1">
                          {p.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs font-black text-[#800020]">{formatInr(pPrice)}</span>
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
            <div className="border border-rose-100 bg-rose-50/30 rounded-2xl p-4 flex items-center justify-center gap-3 max-w-md mx-auto text-center mt-6 shadow-2xs">
              <Award className="w-6 h-6 text-[#800020] shrink-0" />
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

            {/* Sticky Cart mobile navigation bar at the bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-100 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] px-4 py-3 flex items-center justify-between md:hidden">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Price</span>
                <span className="text-lg font-black text-[#800020] leading-none">{formatInr(price)}</span>
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-2 text-xs font-bold text-neutral-700 focus:outline-none"
                >
                  <option value="">Size</option>
                  {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  type="button"
                  disabled={addItem.isPending}
                  onClick={handleAddToCart}
                  className="bg-[#800020] text-white font-bold text-[11px] px-3 py-2.5 rounded-xl hover:bg-[#600018] flex items-center gap-1 shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Bag
                </button>
                <button
                  type="button"
                  disabled={addItem.isPending}
                  onClick={handleBuyNow}
                  className="bg-amber-500 text-neutral-950 font-bold text-[11px] px-3.5 py-2.5 rounded-xl hover:bg-amber-600 flex items-center gap-1 shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-neutral-950" />
                  Buy Now
                </button>
              </div>
            </div>

          </>
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
