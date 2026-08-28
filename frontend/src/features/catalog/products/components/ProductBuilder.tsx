'use client';

import React, { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { isLocalOrPlaceholder } from '@/lib/media-url';
import { getApiErrorMessage } from '@/utils/api-error';
import { productSchema, ProductFormValues, ProductResponse, AttributeType, CreateProductDto, UpdateProductDto } from '../product.types';
import { productService } from '../product.service';
import { variantService } from '@/features/catalog/variants/variant.service';
import { inventoryService } from '@/features/inventory/inventory.service';
import { attributeService } from '@/features/catalog/attributes/attribute.service';
import { useAttributes } from '@/features/catalog/attributes/attribute.hooks';
import { useSizeCharts } from '@/features/catalog/size-charts/size-chart.hooks';
import type { AttributeResponse } from '@/features/catalog/attributes/attribute.types';
import { useBrands } from '@/features/catalog/brands/brand.hooks';
import { useCategories } from '@/features/catalog/categories/category.hooks';
import { AiContentAssistant } from '@/features/ai-prompts/AiContentAssistant';
import { attributeVariableKey } from '@/features/ai-prompts/prompt-builder';
import { useCoupons } from '@/features/coupons/coupon.hooks';
import { couponService } from '@/features/coupons/coupon.service';
import type { CouponResponse } from '@/features/coupons/coupon.types';
import { useOffers } from '@/features/offers/offer.hooks';
import { offerService } from '@/features/offers/offer.service';
import type { OfferResponse } from '@/features/offers/offer.types';
import { useBatchStickers } from '@/features/pos/pos.hooks';
import { LabelSize, LABEL_SIZE_OPTIONS } from '@/features/pos/pos.types';
import {
  LiveDesktopProductPreview,
  type ColorVariantGroup,
  type LivePreviewData,
} from './LiveDesktopProductPreview';
import {
  Package,
  DollarSign,
  Palette,
  Ruler,
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Upload,
  FolderTree,
  X,
  AlertTriangle,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Printer,
  QrCode,
  Store,
  Globe,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProductBuilderProps {
  productId?: string;
  initialData?: ProductResponse;
  onSaveSuccess?: (id: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Maroon', hex: '#0284c7' },
  { name: 'Emerald Green', hex: '#0E6251' },
  { name: 'Royal Blue', hex: '#1B4F72' },
  { name: 'Pastel Pink', hex: '#FADBD8' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Black', hex: '#1C2833' },
  { name: 'Crimson Red', hex: '#900C3F' },
  { name: 'Mustard Yellow', hex: '#D4AC0D' },
];

/** Shot types offered per image, stored as the media title. */
const IMAGE_TYPES = ['Front', 'Back', 'Side', 'Detail', 'Fabric', 'Model', 'Size/Fit', 'Lifestyle'];

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'Free Size'];

/** A variant the backend created on save, with the barcode it assigned. */
interface IssuedVariant {
  sku: string;
  barcode?: string;
  title: string;
  stock: number;
  price: number;
}

/** A scope that a product form is allowed to toggle from here without
 *  clobbering a coupon/offer that's already scoped to categories or brands
 *  elsewhere. */
const isProductAttachable = (applicableTo?: string) =>
  !applicableTo || ['GLOBAL', 'PRODUCT', 'PRODUCTS'].includes(applicableTo);

interface PromoPreview {
  finalPrice: number;
  discountAmount: number;
  note?: string;
}

/**
 * Mirrors the real discount formulas in coupon.service.ts / offer.service.ts
 * (percentage / flat / free-shipping, capped by maxDiscountAmount) so this
 * preview never shows the admin a number checkout wouldn't actually give a
 * customer.
 */
function computePromoPreview(
  type: string,
  value: number,
  minOrderAmount: number | undefined,
  maxDiscountAmount: number | undefined,
  price: number,
): PromoPreview {
  if (type === 'FREE_SHIPPING') {
    return { finalPrice: price, discountAmount: 0, note: 'Free shipping — the item price itself is unchanged.' };
  }
  let discount = type === 'FLAT' ? value : (price * value) / 100;
  if (maxDiscountAmount) discount = Math.min(discount, maxDiscountAmount);
  discount = Math.max(0, Math.min(discount, price));
  const note =
    minOrderAmount && price < minOrderAmount
      ? `Only applies once the customer's cart totals at least ₹${minOrderAmount.toLocaleString('en-IN')}.`
      : undefined;
  return { finalPrice: Math.max(0, price - discount), discountAmount: discount, note };
}

/**
 * Merges/removes a product's id from a coupon's or offer's applicableIds so
 * it becomes (or stops being) restricted to specific products. Returns null
 * when nothing actually needs to change on the server.
 */
function diffProductAttachment(
  current: { applicableTo?: string; applicableIds?: string[] },
  productId: string,
  shouldAttach: boolean,
): { applicableTo?: string; applicableIds: string[] } | null {
  const ids = current.applicableIds ?? [];
  const isAttached = ids.includes(productId);
  if (isAttached === shouldAttach) return null;

  const nextIds = shouldAttach
    ? [...ids, productId]
    : ids.filter((id) => id !== productId);

  return {
    applicableTo: nextIds.length > 0 ? 'PRODUCTS' : undefined,
    applicableIds: nextIds,
  };
}

const findAttributeBySlug = (attributes: AttributeResponse[], slug: string) =>
  attributes.find((a) => a.slug === slug || a.name.toLowerCase() === slug);

const findOption = (attribute: AttributeResponse | undefined, value: string) =>
  attribute?.options?.find(
    (o) => o.value.toLowerCase().trim() === value.toLowerCase().trim(),
  );

/** The AttributeOption id a color group must be keyed by, when one exists. */
const findColorOptionId = (attributes: AttributeResponse[], colorName: string) =>
  findOption(findAttributeBySlug(attributes, 'color'), colorName)?.id;

/**
 * Tag a variant with its Color and Size. A color or size that is not in the
 * attribute registry is sent as free text, and a missing attribute is skipped —
 * an untagged variant still carries its own SKU, barcode and stock.
 */
const buildVariantAttributeValues = (
  attributes: AttributeResponse[],
  color: string,
  size: string,
) => {
  const entries: { attributeId: string; attributeOptionId?: string; value?: string }[] = [];

  const push = (slug: string, value: string) => {
    const attribute = findAttributeBySlug(attributes, slug);
    if (!attribute) return;
    const option = findOption(attribute, value);
    entries.push(
      option
        ? { attributeId: attribute.id, attributeOptionId: option.id }
        : { attributeId: attribute.id, value },
    );
  };

  if (color) push('color', color);
  if (size) push('size', size);
  return entries;
};

export default function ProductBuilder({
  productId,
  initialData,
  onSaveSuccess,
}: ProductBuilderProps) {
  const [activeTab, setActiveTab] = useState<
    'basic' | 'organisation' | 'pricing' | 'colors' | 'sizes' | 'attributes' | 'seo'
  >('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [issuedVariants, setIssuedVariants] = useState<IssuedVariant[]>([]);
  const [labelSize, setLabelSize] = useState<LabelSize>('SMALL');
  const [labelQtyBySku, setLabelQtyBySku] = useState<Record<string, number>>({});
  const [printingSku, setPrintingSku] = useState<string | null>(null);
  const batchStickersMutation = useBatchStickers();

  // Load Brands
  const { data: brandsData } = useBrands({ limit: 100 });
  const brands = useMemo(() => (Array.isArray(brandsData) ? brandsData : (brandsData as { data?: Array<{ id: string; name: string }> })?.data || []), [brandsData]);

  // Coupons & offers this product can be attached to — created and managed
  // entirely on the Coupons & Offers pages; this form only picks from what
  // already exists there.
  const { data: couponsData } = useCoupons({ limit: 100 });
  const coupons: CouponResponse[] = useMemo(() => couponsData?.data ?? [], [couponsData]);
  const { data: offersData } = useOffers({ limit: 100 });
  const offers: OfferResponse[] = useMemo(() => offersData?.data ?? [], [offersData]);

  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [promoSelectionInitialized, setPromoSelectionInitialized] = useState(false);

  // Pre-check whichever coupons/offers already list this product once both
  // the lists and the product being edited have loaded. Runs once — after
  // that, the admin's own toggles are the source of truth for this session.
  useEffect(() => {
    if (promoSelectionInitialized) return;
    if (!initialData?.id) return;
    if (!couponsData || !offersData) return;
    setSelectedCouponIds(coupons.filter((c) => c.applicableIds?.includes(initialData.id)).map((c) => c.id));
    setSelectedOfferIds(offers.filter((o) => o.applicableIds?.includes(initialData.id)).map((o) => o.id));
    setPromoSelectionInitialized(true);
  }, [promoSelectionInitialized, initialData?.id, couponsData, offersData, coupons, offers]);

  // Load the full category tree so a primary category and its sub-category can
  // both be picked. useFeaturedCategories only returned the featured subset.
  // CategoryQueryDto caps `limit` at 100 (@Max(100)) — requesting more fails
  // validation outright, so this can never legitimately be higher.
  const { data: categoriesData } = useCategories({ limit: 100 });
  const categories = useMemo(
    () => (Array.isArray(categoriesData) ? categoriesData : categoriesData?.data || []),
    [categoriesData],
  );
  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories],
  );

  // Dynamic attribute registry. Colour and Size drive the variant matrix, so
  // they are configured on the Colours/Sizes tabs and hidden from this list.
  const { data: attributeData } = useAttributes({ limit: 100 });
  const productAttributes = useMemo(() => {
    const rows = attributeData?.data ?? [];
    return rows.filter((a) => a.slug !== 'color' && a.slug !== 'size');
  }, [attributeData]);

  // Form Setup
  const methods = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: {
      name: initialData?.name || '',
      brandId: initialData?.brandId || '',
      basePrice: initialData?.basePrice || 0,
      salePrice: initialData?.salePrice || undefined,
      costPrice: initialData?.costPrice || undefined,
      taxPercentage: initialData?.taxPercentage || 5,
      taxInclusive: initialData?.taxInclusive ?? true,
      shortDescription: initialData?.shortDescription || '',
      description: initialData?.description || '',
      type: initialData?.type || 'READYMADE',
      gender: initialData?.gender || 'WOMEN',
      ageGroup: initialData?.ageGroup || 'ADULTS',
      season: initialData?.season || '',
      status: initialData?.status || 'ACTIVE',
      isNewArrival: initialData?.isNewArrival ?? false,
      isBestSeller: initialData?.isBestSeller ?? false,
      isFeatured: initialData?.isFeatured ?? false,
      isTrending: initialData?.isTrending ?? false,
      isLimitedStock: initialData?.isLimitedStock ?? false,
      isFestivePick: initialData?.isFestivePick ?? false,
      isExclusive: initialData?.isExclusive ?? false,
      isOnlineOnly: initialData?.isOnlineOnly ?? false,
      channel: (initialData?.channel as 'STORE' | 'ONLINE' | 'BOTH') || 'BOTH',
      hsnCode: initialData?.hsnCode || '',
      seoKeywords: initialData?.seoKeywords || '',
      isPublished: initialData?.isPublished ?? true,
    },
  });

  // brandId is a required UUID in the zod schema, so react-hook-form's
  // handleSubmit silently refuses to call the submit handler at all while it's
  // empty — no error is shown for it anywhere in this form, so the Save
  // button would otherwise appear to just do nothing. The Brand field's own
  // placeholder already promises "or default Vasanthi's Signature" if left
  // unset, so make that actually happen: auto-select the seeded default brand
  // once it loads, but only for a brand-new product with nothing chosen yet —
  // never overwrite an existing product's real brand.
  useEffect(() => {
    if (initialData?.brandId) return;
    if (methods.getValues('brandId')) return;
    const defaultBrand = brands.find((b: { id: string; name: string }) => b.name === "Vasanthi's Signature");
    if (defaultBrand) {
      methods.setValue('brandId', defaultBrand.id, { shouldValidate: true });
    }
  }, [brands, initialData?.brandId, methods]);

  // ── Category & organisation state ────────────────────────────────────────
  const [primaryCategoryId, setPrimaryCategoryId] = useState(
    initialData?.categories?.[0]?.categoryId ?? '',
  );
  const [subCategoryId, setSubCategoryId] = useState(
    initialData?.categories?.[1]?.categoryId ?? '',
  );
  const [collections, setCollections] = useState<string[]>(initialData?.collections ?? []);
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);
  const [occasion, setOccasion] = useState(initialData?.occasion ?? '');
  const [tagInput, setTagInput] = useState('');
  const [collectionInput, setCollectionInput] = useState('');

  // attributeId -> chosen value, for the dynamic attribute registry.
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const entry of initialData?.attributes ?? []) {
      if (entry.value) initial[entry.attributeId] = entry.value;
    }
    return initial;
  });

  const setAttributeValue = (attributeId: string, value: string) =>
    setAttributeValues((prev) => ({ ...prev, [attributeId]: value }));


  // Reusable size charts — measurements are entered once per garment shape and
  // attached here, rather than retyped on every product.
  const { data: sizeChartData } = useSizeCharts({ limit: 100, status: 'ACTIVE' });
  const sizeCharts = useMemo(() => sizeChartData?.data ?? [], [sizeChartData]);
  const [sizeChartTemplateId, setSizeChartTemplateId] = useState(
    initialData?.sizeChartTemplateId ?? '',
  );
  const selectedSizeChart = useMemo(
    () => sizeCharts.find((chart) => chart.id === sizeChartTemplateId),
    [sizeCharts, sizeChartTemplateId],
  );

  // Sub-categories are the children of whichever primary category is selected.
  const subCategories = useMemo(
    () => categories.filter((c) => c.parentId === primaryCategoryId),
    [categories, primaryCategoryId],
  );

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value)) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, value]);
    setTagInput('');
  };

  const addCollection = () => {
    const value = collectionInput.trim();
    if (!value || collections.includes(value)) {
      setCollectionInput('');
      return;
    }
    setCollections((prev) => [...prev, value]);
    setCollectionInput('');
  };

  // Color Groups State (with Images & Sizes per Color)
  const [colorGroups, setColorGroups] = useState<ColorVariantGroup[]>(() => {
    if (!initialData) return [];

    // 1. Direct colorGroups on initialData if saved
    const rawGroups = (initialData as unknown as Record<string, unknown>)?.colorGroups;
    if (Array.isArray(rawGroups) && rawGroups.length > 0) {
      return rawGroups as ColorVariantGroup[];
    }

    // 2. Derive from initialData.images and initialData.variants when editing
    const images = initialData.images || [];
    const variants = (initialData as unknown as { variants?: Array<{ id: string; title?: string; sku?: string; availableQuantity?: number; attributeValues?: Array<{ value?: string; attributeName?: string; attribute?: { slug?: string } }> }> })?.variants || [];
    const primaryUrl = initialData.primaryImageUrl;

    const colorMap = new Map<string, { swatch?: string; images: string[] }>();

    images.forEach((img) => {
      const cName = img.color || 'Color 1';
      const swatch = (img as unknown as { swatchUrl?: string }).swatchUrl || img.url;
      if (!colorMap.has(cName)) {
        colorMap.set(cName, { swatch, images: [] });
      }
      if (img.url) {
        colorMap.get(cName)!.images.push(img.url);
      }
    });

    // Check variants for color attribute or title ("Color / Size")
    variants.forEach((v) => {
      let colorName = '';
      if (v.attributeValues) {
        const colorAttr = v.attributeValues.find(
          (av) => av.attributeName?.toLowerCase() === 'color' || av.attribute?.slug === 'color'
        );
        if (colorAttr?.value) colorName = colorAttr.value;
      }
      if (!colorName && v.title && v.title.includes('/')) {
        colorName = v.title.split('/')[0].trim();
      }
      if (colorName && !colorMap.has(colorName)) {
        colorMap.set(colorName, { swatch: primaryUrl, images: primaryUrl ? [primaryUrl] : [] });
      }
    });

    if (colorMap.size === 0) {
      const defaultImgs = images.map((i) => i.url).filter(Boolean);
      if (primaryUrl && !defaultImgs.includes(primaryUrl)) {
        defaultImgs.unshift(primaryUrl);
      }
      colorMap.set('Color 1', { swatch: primaryUrl || defaultImgs[0], images: defaultImgs });
    }

    const groups: ColorVariantGroup[] = [];
    let idx = 1;
    colorMap.forEach((data, cName) => {
      const groupSizes = STANDARD_SIZES.map((sz) => {
        const matchingVar = variants.find((v) => {
          const vTitle = (v.title || '').toLowerCase();
          return vTitle.includes(cName.toLowerCase()) && vTitle.includes(sz.toLowerCase());
        });
        return {
          size: sz,
          stock: matchingVar?.availableQuantity ?? 10,
          available: true,
          sku: matchingVar?.sku || `${cName.substring(0, 3).toUpperCase()}-${sz}`,
        };
      });

      groups.push({
        id: `col-${idx}-${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        name: cName,
        hex: idx === 1 ? '#e8c4b8' : '#1e3a8a',
        swatchImage: data.swatch,
        images: data.images.length > 0 ? data.images : (primaryUrl ? [primaryUrl] : []),
        sizes: groupSizes,
      });
      idx++;
    });

    return groups;
  });

  const [activeColorTab, setActiveColorTab] = useState<string>(colorGroups[0]?.id || '');

  // Add New Color Group
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#0284c7');
  const [newColorSwatch, setNewColorSwatch] = useState<string | undefined>(undefined);
  const [newColorImages, setNewColorImages] = useState<string[]>([]);

  const addColorGroup = (name?: string, hex?: string, swatch?: string, initialImgs?: string[]) => {
    const defaultName = `Color ${colorGroups.length + 1}`;
    const cName = name || newColorName.trim() || defaultName;
    const cHex = hex || newColorHex;
    const cSwatch = swatch !== undefined ? swatch : newColorSwatch;
    const cImages = initialImgs && initialImgs.length > 0 ? initialImgs : newColorImages;

    const newId = `col-${colorGroups.length + 1}-${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const newGroup: ColorVariantGroup = {
      id: newId,
      name: cName,
      hex: cHex,
      swatchImage: cSwatch,
      images: cImages,
      sizes: STANDARD_SIZES.map((sz) => ({
        size: sz,
        stock: 10,
        available: true,
        sku: buildSmartVariantSku(cName, sz),
      })),
    };

    setColorGroups((prev) => [...prev, newGroup]);
    setActiveColorTab(newId);
    setNewColorName('');
    setNewColorSwatch(undefined);
    setNewColorImages([]);
  };

  const removeColorGroup = (id: string) => {
    setColorGroups((prev) => prev.filter((c) => c.id !== id));
    if (activeColorTab === id && colorGroups.length > 1) {
      setActiveColorTab(colorGroups.find((c) => c.id !== id)?.id || '');
    }
  };

  // Add Image URL to active color group
  const [imageUrlInput, setImageUrlInput] = useState('');
  const addImageToColorGroup = (colorGroupId: string) => {
    if (!imageUrlInput.trim()) return;
    setColorGroups((prev) =>
      prev.map((group) => {
        if (group.id === colorGroupId) {
          return {
            ...group,
            images: [...group.images, imageUrlInput.trim()],
          };
        }
        return group;
      })
    );
    setImageUrlInput('');
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLocalImageUpload = (colorGroupId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const resultUrl = e.target?.result as string;
        if (resultUrl) {
          setColorGroups((prev) =>
            prev.map((group) => {
              if (group.id === colorGroupId) {
                return {
                  ...group,
                  images: [...group.images, resultUrl],
                };
              }
              return group;
            })
          );
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSwatchImageUpload = (colorGroupId: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const swatchUrl = e.target?.result as string;
      if (swatchUrl) {
        setColorGroups((prev) =>
          prev.map((group) => {
            if (group.id === colorGroupId) {
              return {
                ...group,
                swatchImage: swatchUrl,
              };
            }
            return group;
          })
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const removeSwatchImage = (colorGroupId: string) => {
    setColorGroups((prev) =>
      prev.map((group) => {
        if (group.id === colorGroupId) {
          const copy = { ...group };
          delete copy.swatchImage;
          return copy;
        }
        return group;
      })
    );
  };

  /**
   * Shot type per image, keyed by URL. Kept beside the gallery rather than in
   * ColorVariantGroup so the shared preview type stays a plain string[]; it is
   * sent as the media title on save.
   */
  const [imageLabels, setImageLabels] = useState<Record<string, string>>({});

  // Everything the AI Content Assistant may put in a prompt, in the order a
  // person would describe the garment. Empty entries are dropped downstream by
  // collectFields -- nothing here needs to check for blanks.
  const aiWatch = useWatch({ control: methods.control });
  const aiCandidates = useMemo(() => {
    const values = (aiWatch ?? {}) as Record<string, unknown>;
    const nameOf = (id: string) => categories.find((c) => c.id === id)?.name;
    // Fashion attributes (fabric, pattern, fit, sleeve, neck, material) are
    // configured under Catalog -> Attributes, not columns, so they are read
    // from the attribute map by their own names.
    const attributeFields = productAttributes.map((a) => ({
      label: a.name,
      key: attributeVariableKey(a.slug, a.name),
      value: attributeValues[a.id],
    }));

    return [
      { label: 'Product Name', key: 'product_name', value: values.name },
      { label: 'Category', key: 'category', value: nameOf(primaryCategoryId) },
      { label: 'Subcategory', key: 'subcategory', value: nameOf(subCategoryId) },
      {
        label: 'Brand',
        key: 'brand',
        value: brands.find((b: { id: string; name: string }) => b.id === values.brandId)?.name,
      },
      { label: 'Colour', key: 'color', value: colorGroups.map((g) => g.name) },
      ...attributeFields,
      { label: 'Occasion', key: 'occasion', value: occasion },
      { label: 'Season', key: 'season', value: values.season },
      { label: 'Collection', key: 'collection', value: values.collections },
      { label: 'Tags', key: 'tags', value: tags },
      { label: 'Existing Short Description', key: 'short_description', value: values.shortDescription },
      { label: 'Existing Description', key: 'description', value: values.description },
    ];
  }, [aiWatch, categories, primaryCategoryId, subCategoryId, brands, colorGroups, productAttributes, attributeValues, occasion, tags]);

  const aiReferenceImages = useMemo(
    () => colorGroups.flatMap((g) => [g.swatchImage, ...g.images].filter(Boolean) as string[]),
    [colorGroups],
  );

  /** Move an image within its color group — position 0 is that color's primary. */
  const moveImage = (colorGroupId: string, imgIdx: number, direction: -1 | 1) => {
    setColorGroups((prev) =>
      prev.map((group) => {
        if (group.id !== colorGroupId) return group;
        const target = imgIdx + direction;
        if (target < 0 || target >= group.images.length) return group;
        const images = [...group.images];
        [images[imgIdx], images[target]] = [images[target], images[imgIdx]];
        return { ...group, images };
      }),
    );
  };

  /** Promote an image to position 0 and make its color group primary. */
  const setPrimaryImage = (colorGroupId: string, imgIdx: number) => {
    setColorGroups((prev) => {
      const groupIdx = prev.findIndex((g) => g.id === colorGroupId);
      if (groupIdx === -1) return prev;

      const updated = prev.map((group) => {
        if (group.id !== colorGroupId) return group;
        const images = [...group.images];
        const [picked] = images.splice(imgIdx, 1);
        return { ...group, images: [picked, ...images] };
      });

      const [primaryGroup] = updated.splice(groupIdx, 1);
      return [primaryGroup, ...updated];
    });
  };

  const removeImageFromColorGroup = (colorGroupId: string, imgIdx: number) => {
    setColorGroups((prev) =>
      prev.map((group) => {
        if (group.id === colorGroupId) {
          return {
            ...group,
            images: group.images.filter((_, idx) => idx !== imgIdx),
          };
        }
        return group;
      })
    );
  };

  // Add custom size to active color group
  const [newSizeInput, setNewSizeInput] = useState('');

  /** Generates a distinct color abbreviation to avoid SKU collisions (e.g. "Color 1" -> "COL1", "Color 2" -> "COL2", "Navy Blue" -> "NBLU") */
  const getColorCode = (colorName: string) => {
    const clean = (colorName || 'Color 1').trim();
    // Match "Color 1", "Color 2", "Colour 1", etc.
    const numMatch = clean.match(/colou?r\s*(\d+)/i);
    if (numMatch) {
      return `COL${numMatch[1]}`;
    }
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      const firstChar = words[0][0].toUpperCase();
      const secondWord = words[1].toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
      return `${firstChar}${secondWord}`;
    }
    const code = clean.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length <= 4) return code || 'COL';
    return code.substring(0, 4);
  };

  /** Helper to generate a smart, unique, human-readable SKU ID for color + size variants */
  const buildSmartVariantSku = (colorName: string, sizeName: string) => {
    const rawCode = ((watchedValues as any)?.sku || watchedValues?.name || '').toString().trim();
    const parentCode = rawCode ? rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6) : '';
    const colorCode = getColorCode(colorName);
    const cleanSize = sizeName.trim().toUpperCase().replace(/\s+/g, '');
    return parentCode ? `${parentCode}-${colorCode}-${cleanSize}` : `${colorCode}-${cleanSize}`;
  };

  const addSizeToColorGroup = (colorGroupId: string) => {
    if (!newSizeInput.trim()) return;
    setColorGroups((prev) =>
      prev.map((group) => {
        if (group.id === colorGroupId) {
          const exists = group.sizes.some((s) => s.size === newSizeInput.trim().toUpperCase());
          if (exists) return group;
          return {
            ...group,
            sizes: [
              ...group.sizes,
              {
                size: newSizeInput.trim().toUpperCase(),
                stock: 10,
                available: true,
                sku: buildSmartVariantSku(group.name, newSizeInput.trim().toUpperCase()),
              },
            ],
          };
        }
        return group;
      })
    );
    setNewSizeInput('');
  };

  const toggleSizeAvailability = (colorGroupId: string, sizeName: string) => {
    setColorGroups((prev) =>
      prev.map((group) => {
        if (group.id === colorGroupId) {
          return {
            ...group,
            sizes: group.sizes.map((s) => (s.size === sizeName ? { ...s, available: !s.available } : s)),
          };
        }
        return group;
      })
    );
  };

  const updateSizeStock = (colorGroupId: string, sizeName: string, stockVal: number) => {
    setColorGroups((prev) =>
      prev.map((group) => {
        if (group.id === colorGroupId) {
          return {
            ...group,
            sizes: group.sizes.map((s) => (s.size === sizeName ? { ...s, stock: stockVal } : s)),
          };
        }
        return group;
      })
    );
  };

  /** Update any numeric or string field on one size row (min stock, reorder level, sku …). */
  const updateSizeField = (
    colorGroupId: string,
    sizeName: string,
    field: 'minStock' | 'reorderLevel' | 'sku',
    value: number | string,
  ) => {
    setColorGroups((prev) =>
      prev.map((group) =>
        group.id === colorGroupId
          ? {
              ...group,
              sizes: group.sizes.map((s) =>
                s.size === sizeName ? { ...s, [field]: value } : s,
              ),
            }
          : group,
      ),
    );
  };

  /** Stock status shown next to each size, mirroring the inventory screen. */
  const stockStatus = (stock: number, minStock?: number) => {
    if (stock <= 0) return { label: 'OUT', className: 'bg-sky-50 text-sky-700 border-sky-200' };
    if (minStock != null && minStock > 0 && stock <= minStock) {
      return { label: 'LOW', className: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'IN STOCK', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const removeSizeFromColorGroup = (colorGroupId: string, sizeName: string) => {
    setColorGroups((prev) =>
      prev.map((group) => {
        if (group.id === colorGroupId) {
          return {
            ...group,
            sizes: group.sizes.filter((s) => s.size !== sizeName),
          };
        }
        return group;
      })
    );
  };

  const rawWatchedValues = useWatch({ control: methods.control });
  const watchedValues = useMemo(() => rawWatchedValues || {}, [rawWatchedValues]);

  // What a customer actually pays today: Sale Price if set, otherwise MRP.
  const referencePrice = Number(watchedValues?.salePrice) || Number(watchedValues?.basePrice) || 0;

  const promoPreviewRows = useMemo(() => {
    const couponRows = coupons
      .filter((c) => selectedCouponIds.includes(c.id))
      .map((c) => ({
        key: `coupon-${c.id}`,
        label: c.code,
        sub: c.name,
        ...computePromoPreview(c.type, Number(c.value), c.minOrderAmount, c.maxDiscountAmount, referencePrice),
      }));
    const offerRows = offers
      .filter((o) => selectedOfferIds.includes(o.id))
      .map((o) => ({
        key: `offer-${o.id}`,
        label: o.name,
        sub: `${o.value}% off (auto-applied, no code needed)`,
        ...computePromoPreview(o.type, Number(o.value), o.minOrderAmount, o.maxDiscountAmount, referencePrice),
      }));
    return [...couponRows, ...offerRows];
  }, [coupons, offers, selectedCouponIds, selectedOfferIds, referencePrice]);

  // Selected Brand Name for Live Preview
  const selectedBrandObj = brands.find((b: { id: string; name?: string }) => b.id === watchedValues.brandId);
  const selectedBrandName = selectedBrandObj?.name || 'Vasanthi Designers';

  // Construct Live Preview Data Object
  /**
   * Pre-save validation gate. These are cross-field rules the zod schema cannot
   * express (it only sees the form values, not the color groups), and they are
   * what stops a half-configured product from reaching the storefront.
   */
  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (!watchedValues.name || watchedValues.name.trim().length < 3) {
      issues.push('Product name is missing (minimum 3 characters).');
    }
    if (!watchedValues.brandId) issues.push('No brand selected.');
    if (!primaryCategoryId) {
      issues.push('No category selected — the product will not appear anywhere on the storefront.');
    }

    const base = Number(watchedValues.basePrice) || 0;
    const sale = Number(watchedValues.salePrice) || 0;
    if (base <= 0) issues.push('MRP / base price must be greater than 0.');
    if (sale > 0 && sale > base) issues.push('Selling price is higher than the MRP.');

    if (colorGroups.length === 0) {
      issues.push('No colour added — barcodes are issued per colour and size.');
    }

    const seenColors = new Set<string>();
    const seenSkus = new Set<string>();
    for (const group of colorGroups) {
      const key = group.name.trim().toLowerCase();
      if (seenColors.has(key)) issues.push(`Duplicate colour: ${group.name}.`);
      seenColors.add(key);

      const hasImage = Boolean(group.swatchImage) || group.images.length > 0;
      if (!hasImage) issues.push(`${group.name} has no image.`);

      const availableSizes = group.sizes.filter((s) => s.available);
      if (availableSizes.length === 0) {
        issues.push(`${group.name} has no size selected.`);
      }
      for (const sizeRow of availableSizes) {
        if (!sizeRow.stock || sizeRow.stock <= 0) {
          issues.push(`${group.name} / ${sizeRow.size} has no stock configured.`);
        }
        const sku = (sizeRow.sku || '').trim().toLowerCase();
        if (sku) {
          if (seenSkus.has(sku)) issues.push(`Duplicate SKU: ${sizeRow.sku}.`);
          seenSkus.add(sku);
        }
      }
    }

    for (const attribute of productAttributes) {
      if (attribute.isRequired && !(attributeValues[attribute.id] ?? '').trim()) {
        issues.push(`Required attribute missing: ${attribute.name}.`);
      }
    }

    return issues;
  }, [watchedValues, colorGroups, primaryCategoryId, productAttributes, attributeValues]);

  const canPublish = validationIssues.length === 0;

  /** Map validation or API error text to the target builder tab so clicking navigates directly there */
  const getTabForIssue = (issueText: string): 'basic' | 'organisation' | 'pricing' | 'colors' | 'sizes' | 'attributes' | 'seo' => {
    const lower = issueText.toLowerCase();
    if (lower.includes('category') || lower.includes('organisation') || lower.includes('collection') || lower.includes('tag')) {
      return 'organisation';
    }
    if (lower.includes('name') || lower.includes('brand') || lower.includes('description') || lower.includes('gender')) {
      return 'basic';
    }
    if (lower.includes('price') || lower.includes('mrp') || lower.includes('tax') || lower.includes('hsn') || lower.includes('cost')) {
      return 'pricing';
    }
    if (lower.includes('color') || lower.includes('colour') || lower.includes('image') || lower.includes('swatch') || lower.includes('media')) {
      return 'colors';
    }
    if (lower.includes('size') || lower.includes('stock') || lower.includes('sku') || lower.includes('barcode')) {
      return 'sizes';
    }
    if (lower.includes('attribute') || lower.includes('fabric') || lower.includes('material')) {
      return 'attributes';
    }
    return 'seo';
  };

  const livePreviewData: LivePreviewData = useMemo(() => {
    return {
      name: watchedValues.name || 'Women\'s Ethnic Wear',
      brandName: selectedBrandName,
      basePrice: Number(watchedValues.basePrice) || 0,
      salePrice: Number(watchedValues.salePrice) || undefined,
      shortDescription: watchedValues.shortDescription,
      description: watchedValues.description,
      gender: watchedValues.gender,
      isNewArrival: watchedValues.isNewArrival,
      isBestSeller: watchedValues.isBestSeller,
      isFeatured: watchedValues.isFeatured,
      isTrending: watchedValues.isTrending,
      colorGroups: colorGroups,
    };
  }, [watchedValues, selectedBrandName, colorGroups]);

  const deferredPreviewData = useDeferredValue(livePreviewData);

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/data:(.*?);base64/)?.[1] || 'image/png';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };

  const handleSubmitForm = async (values: ProductFormValues) => {
    // Saving a draft is always allowed so partial work is never lost, but a
    // product with outstanding issues must not reach the storefront.
    if (values.isPublished && validationIssues.length > 0) {
      const firstIssue = validationIssues[0];
      const targetTab = getTabForIssue(firstIssue);
      setActiveTab(targetTab);
      setSaveMessage(
        `✕ Cannot publish — ${validationIssues.length} issue${validationIssues.length === 1 ? '' : 's'} to fix: ${firstIssue}`,
      );
      return;
    }

    setIsSubmitting(true);
    setSaveMessage(null);
    setIssuedVariants([]);
    try {
      // Organisation lives outside the react-hook-form schema, so merge it in.
      // CreateProductDto accepts categoryIds, tags, collections and occasion
      // directly, and the API rejects unknown properties outright.
      const categoryIds = [primaryCategoryId, subCategoryId].filter(Boolean);
      const payload = {
        ...values,
        ...(categoryIds.length > 0 ? { categoryIds } : {}),
        ...(tags.length > 0 ? { tags } : {}),
        ...(collections.length > 0 ? { collections } : {}),
        ...(occasion ? { occasion } : {}),
        ...(sizeChartTemplateId ? { sizeChartTemplateId } : {}),
      };

      let created: ProductResponse;
      if (productId) {
        // Strip categoryIds from update payload because PATCH /products/:id rejects categoryIds
        const { categoryIds: catIds, ...updatePayload } = payload as Record<string, unknown>;
        created = await productService.update(productId, updatePayload as UpdateProductDto);
        if (catIds && Array.isArray(catIds) && catIds.length > 0) {
          await productService.assignCategories(productId, { categoryIds: catIds as string[] }).catch(() => null);
        }
      } else {
        created = await productService.create(payload as CreateProductDto);
      }

      // Dynamic attributes (fabric, pattern, neck, sleeve …). Sent as one call;
      // blank values are dropped so an unset attribute is not stored as "".
      const attributeEntries = Object.entries(attributeValues)
        .filter(([, value]) => value.trim() !== '')
        .map(([attributeId, value]) => ({ attributeId, value: value.trim() }));

      if (attributeEntries.length > 0) {
        await productService
          .assignAttributes(created.id, { attributes: attributeEntries })
          .catch(() => null);
      }

      // Flatten every staged image across all color groups into one gallery,
      // upload real files, and attach them as product media. Media ids are kept
      // per color group so they can be bound to that group further down.
      let displayOrder = 0;
      let primarySet = false;
      const mediaIdsByGroup: Record<string, string[]> = {};
      for (const group of colorGroups) {
        mediaIdsByGroup[group.id] = [];
        const groupImages = Array.from(new Set([group.swatchImage, ...group.images].filter(Boolean) as string[]));
        for (const img of groupImages) {
          let url = img;
          if (img.startsWith('data:')) {
            const blob = dataUrlToBlob(img);
            const uploaded = await productService.uploadImage(blob, `${group.name}-${displayOrder}.png`);
            url = uploaded.url;
          }
          const media = await productService.addMedia({
            productId: created.id,
            url,
            isPrimary: !primarySet,
            displayOrder: displayOrder++,
            color: group.name,
            ...(imageLabels[img] ? { title: imageLabels[img] } : {}),
          });
          if (media?.id) mediaIdsByGroup[group.id].push(String(media.id));
          primarySet = true;
        }
      }

      // Persist the color/size matrix as real variants. The backend assigns the
      // SKU and barcode on POST /variants, so nothing here is sellable or
      // scannable until this runs.
      const [attributeList, existingVariants] = await Promise.all([
        attributeService
          .findAllAttributes({ limit: 100 })
          .catch(() => ({ data: [] as AttributeResponse[] })),
        variantService
          // ProductVariantQueryDto caps `limit` at 100 (@Max(100)) — 200 was
          // silently rejected by this call's own .catch(), which meant
          // existingVariants was always empty and re-saving an existing
          // product created duplicate variants instead of skipping them.
          .findAll({ productId: created.id, limit: 100 })
          .catch(() => null),
      ]);
      const attributes = attributeList?.data ?? [];

      // Saving twice must not duplicate variants, so skip pairs already stored.
      const existingTitles = new Set(
        (existingVariants?.data ?? [])
          .map((v) => String(v.title ?? '').toLowerCase().trim())
          .filter(Boolean),
      );

      const issued: IssuedVariant[] = [];
      const variantIdsByGroup: Record<string, string[]> = {};
      let variantOrder = 0;

      for (const group of colorGroups) {
        variantIdsByGroup[group.id] = [];
        for (const sizeRow of group.sizes) {
          if (!sizeRow.available) continue;
          const title = `${group.name} / ${sizeRow.size}`;
          if (existingTitles.has(title.toLowerCase())) continue;

          const variant = await variantService.create({
            productId: created.id,
            title,
            sku: sizeRow.sku || undefined,
            priceOverride: sizeRow.price ? Number(sizeRow.price) : undefined,
            costPrice: values.costPrice ? Number(values.costPrice) : undefined,
            displayOrder: variantOrder,
            isDefault: variantOrder === 0 && existingTitles.size === 0,
            attributeValues: buildVariantAttributeValues(attributes, group.name, sizeRow.size),
          });
          variantOrder++;

          if (!variant?.id) continue;
          variantIdsByGroup[group.id].push(variant.id);

          // Opening stock for the new variant.
          if (sizeRow.stock > 0) {
            await inventoryService
              .create({
                variantId: variant.id,
                availableQuantity: sizeRow.stock,
                ...(sizeRow.minStock ? { minimumStock: sizeRow.minStock } : {}),
                ...(sizeRow.reorderLevel ? { reorderLevel: sizeRow.reorderLevel } : {}),
              })
              .catch(() => null);
          }

          issued.push({
            sku: variant.sku,
            barcode: variant.barcode,
            title,
            stock: sizeRow.stock,
            price: sizeRow.price
              ? Number(sizeRow.price)
              : Number(values.salePrice || values.basePrice || 0),
          });
        }
      }

      // Bind the new variants and media to their color group so the storefront
      // can group images and sizes by color.
      const syncPayload = colorGroups.flatMap((group) => {
        const optionId = findColorOptionId(attributes, group.name);
        if (!optionId) return [];
        return [
          {
            colorAttributeOptionId: optionId,
            label: group.name,
            variantIds: variantIdsByGroup[group.id] ?? [],
            mediaIds: mediaIdsByGroup[group.id] ?? [],
          },
        ];
      });

      if (syncPayload.length > 0) {
        await productService.syncColorGroups(created.id, { colorGroups: syncPayload }).catch(() => null);
      }

      // Attach/detach this product from whichever coupons and offers were
      // toggled on the Coupons & Offers panel above. Only coupons/offers
      // whose membership actually changed are written.
      for (const coupon of coupons) {
        const diff = diffProductAttachment(coupon, created.id, selectedCouponIds.includes(coupon.id));
        if (diff) await couponService.update(coupon.id, diff).catch(() => null);
      }
      for (const offer of offers) {
        const diff = diffProductAttachment(offer, created.id, selectedOfferIds.includes(offer.id));
        if (diff) await offerService.update(offer.id, diff).catch(() => null);
      }

      setIssuedVariants(issued);
      setLabelQtyBySku(
        Object.fromEntries(issued.map((v) => [v.sku, Math.max(1, v.stock || 1)])),
      );
      setSaveMessage(
        issued.length > 0
          ? `✓ Product saved — ${issued.length} variant${issued.length === 1 ? '' : 's'} created with barcodes.`
          : '✓ Product saved successfully!',
      );
      if (onSaveSuccess) onSaveSuccess(created.id);
      if (issued.length === 0) setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      let rawErr = getApiErrorMessage(err, 'Failed to save product');
      if (rawErr.includes('property') && rawErr.includes('should not exist')) {
        rawErr = rawErr.replace(/property\s+([a-zA-Z0-9_]+)\s+should not exist/gi, 'Property "$1" is read-only on update.');
      }
      setSaveMessage('✕ ' + rawErr);
      setActiveTab(getTabForIssue(rawErr));
    } finally {
      setIsSubmitting(false);
    }
  };

  const productName = methods.getValues('name') || 'Product';

  const handlePrintLabel = async (variant: IssuedVariant) => {
    if (!variant.barcode) return;
    setPrintingSku(variant.sku);
    try {
      const res = await batchStickersMutation.mutateAsync({
        productName,
        variantTitle: variant.title,
        sku: variant.sku,
        barcode: variant.barcode,
        price: variant.price,
        quantity: Math.max(1, labelQtyBySku[variant.sku] || 1),
        labelSize,
      });
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(res.html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (err) {
      setSaveMessage('✕ ' + getApiErrorMessage(err, 'Failed to generate labels'));
    } finally {
      setPrintingSku(null);
    }
  };

  const handlePrintAllLabels = async () => {
    // Sequential — each print opens its own window; concurrent window.open
    // calls get blocked as popups by most browsers.
    for (const variant of issuedVariants) {
      await handlePrintLabel(variant);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmitForm as never)} className="space-y-8">
        
        {/* TOP STATUS BAR & HEADER */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center border border-sky-100 shadow-2xs font-serif text-lg sm:text-xl font-bold shrink-0">
              ❖
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-bold font-serif text-neutral-900">
                  {productId ? 'Edit Catalog Product' : 'Add New E-Commerce Product'}
                </h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium hidden sm:block">
                Configure basic details, pricing, color-wise images & sizes with live customer desktop preview below
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {saveMessage && (
              <button
                type="button"
                onClick={() => setActiveTab(getTabForIssue(saveMessage))}
                className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                  saveMessage.startsWith('✓')
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 shadow-2xs'
                }`}
              >
                <span>{saveMessage}</span>
                {!saveMessage.startsWith('✓') && (
                  <span className="text-[10px] underline font-bold ml-1 text-red-600">(Click to fix)</span>
                )}
              </button>
            )}

            {!canPublish && (
              <button
                type="button"
                onClick={() => {
                  const firstIssue = validationIssues[0];
                  if (firstIssue) {
                    setActiveTab(getTabForIssue(firstIssue));
                  } else {
                    setActiveTab('basic');
                  }
                }}
                className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-amber-100 transition-colors min-h-[38px] cursor-pointer shadow-2xs"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {validationIssues.length} issue{validationIssues.length === 1 ? '' : 's'} (Click to fix)
                </span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto justify-center bg-[#0284c7] hover:bg-[#0B3B78] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100 min-h-[40px]"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : watchedValues?.isPublished
                    ? 'Save & Publish'
                    : 'Save as Draft'}
              </span>
            </button>
          </div>
        </div>

        {/* ISSUED BARCODES — shown after a save that created variants */}
        {issuedVariants.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Barcodes issued ({issuedVariants.length})
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Assigned by the server when each variant was created. These are scannable in POS.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIssuedVariants([])}
                className="text-xs font-semibold text-neutral-400 hover:text-neutral-600"
              >
                Dismiss
              </button>
            </div>

            {/* Label size + print-all */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-neutral-50 border border-neutral-200 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Label Size
                </span>
                <div className="flex gap-1.5">
                  {LABEL_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLabelSize(opt.value)}
                      title={opt.description}
                      className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                        labelSize === opt.value
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handlePrintAllLabels}
                disabled={printingSku !== null}
                className="bg-[#0284c7] hover:bg-[#0B3B78] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 disabled:opacity-60 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All {issuedVariants.length} Labels</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {issuedVariants.map((variant) => (
                <div
                  key={variant.sku}
                  className="border border-neutral-200 rounded-2xl p-4 flex flex-col items-center text-center"
                >
                  <span className="text-xs font-bold text-neutral-700">{variant.title}</span>
                  {variant.barcode ? (
                    <>
                      <div className="flex items-center justify-center gap-2 my-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/pos/barcodes/generate?code=${encodeURIComponent(variant.barcode)}&scale=2&height=12`}
                          alt={`Barcode ${variant.barcode}`}
                          className="h-14 object-contain"
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/pos/barcodes/generate?code=${encodeURIComponent(variant.barcode)}&bcid=qrcode&scale=2`}
                          alt={`QR ${variant.barcode}`}
                          className="h-14 w-14 object-contain"
                        />
                      </div>
                      <span className="text-xs font-mono tracking-widest text-neutral-900">
                        {variant.barcode}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-neutral-400 my-4">No barcode returned</span>
                  )}
                  <span className="text-[10px] text-neutral-400 mt-1">SKU: {variant.sku}</span>
                  <span className="text-[10px] text-neutral-400">Stock: {variant.stock}</span>

                  <div className="flex items-center gap-2 mt-3 w-full">
                    <input
                      type="number"
                      min={1}
                      value={labelQtyBySku[variant.sku] ?? 1}
                      onChange={(e) =>
                        setLabelQtyBySku((prev) => ({
                          ...prev,
                          [variant.sku]: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-16 border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-center"
                      title="Copies to print"
                    />
                    <button
                      type="button"
                      onClick={() => handlePrintLabel(variant)}
                      disabled={!variant.barcode || printingSku === variant.sku}
                      className="flex-1 bg-neutral-900 hover:bg-neutral-700 text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-60 transition-all"
                    >
                      {printingSku === variant.sku ? (
                        <span>Printing…</span>
                      ) : (
                        <>
                          <QrCode className="w-3 h-3" />
                          <span>Print</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION NAVIGATION TABS */}
        <div className="flex border-b border-neutral-200 bg-white rounded-2xl p-1.5 border shadow-2xs gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'basic'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>1. Basic Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('organisation')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'organisation'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>2. Category &amp; Organisation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Pricing &amp; Taxes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'colors'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>4. Color Groups &amp; Media ({colorGroups.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sizes')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'sizes'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span>5. Color-Wise Sizes &amp; Stock</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('attributes')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'attributes'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>6. Attributes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'seo'
                ? 'bg-[#0284c7] text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>7. Badges, SEO &amp; Publish</span>
          </button>
        </div>

        {/* TAB 1: BASIC INFORMATION */}
        {activeTab === 'basic' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#0284c7]" />
              <span>Product Specification & Description</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  Product Name / Title <span className="text-sky-600">*</span>
                </label>
                <input
                  type="text"
                  {...methods.register('name')}
                  placeholder="e.g. Women's Floral Printed Anarkali Kurta Set"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
                {methods.formState.errors.name && (
                  <p className="text-[11px] font-semibold text-sky-600">
                    {methods.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Brand</label>
                <select
                  {...methods.register('brandId')}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                >
                  <option value="">Select Brand (or default Vasanthi's Signature)</option>
                  {brands.map((b: { id: string; name: string }) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {methods.formState.errors.brandId && (
                  <p className="text-[11px] font-semibold text-sky-600">
                    {methods.formState.errors.brandId.message}
                  </p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Product Type</label>
                <select
                  {...methods.register('type')}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                >
                  <option value="READYMADE">Readymade</option>
                  <option value="UNSTITCHED">Unstitched Fabric</option>
                  <option value="CUSTOM">Custom Tailored</option>
                </select>
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Gender Target</label>
                <select
                  {...methods.register('gender')}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                >
                  <option value="WOMEN">Women</option>
                  <option value="GIRLS">Girls</option>
                  <option value="UNISEX">Unisex</option>
                </select>
              </div>

              {/* Season */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Season / Collection</label>
                <input
                  type="text"
                  {...methods.register('season')}
                  placeholder="e.g. Festive 2026, Summer Silk"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              {/* Short Description */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Short Summary</label>
                <input
                  type="text"
                  {...methods.register('shortDescription')}
                  placeholder="Brief 1-sentence product summary displayed under title..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              {/* Full Description */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Full Description</label>
                <textarea
                  rows={4}
                  {...methods.register('description')}
                  placeholder="Detailed specifications, fabric details, care instructions, craftsmanship..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY & ORGANISATION */}
        {activeTab === 'organisation' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#0284c7]" />
              <span>Category &amp; Organisation</span>
            </h3>
            <p className="text-[11px] text-neutral-500 -mt-4">
              A product with no category cannot be browsed on the storefront.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  Primary Category <span className="text-sky-600">*</span>
                </label>
                <select
                  value={primaryCategoryId}
                  onChange={(e) => {
                    setPrimaryCategoryId(e.target.value);
                    setSubCategoryId('');
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                >
                  <option value="">Select a category</option>
                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {rootCategories.length === 0 && (
                  <p className="text-[11px] font-semibold text-amber-600">
                    No categories found. Create them under Catalog → Categories first.
                  </p>
                )}
              </div>

              {/* Sub category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Sub Category</label>
                <select
                  value={subCategoryId}
                  onChange={(e) => setSubCategoryId(e.target.value)}
                  disabled={!primaryCategoryId || subCategories.length === 0}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 disabled:opacity-50"
                >
                  <option value="">
                    {!primaryCategoryId
                      ? 'Select a primary category first'
                      : subCategories.length === 0
                        ? 'No sub-categories'
                        : 'Optional'}
                  </option>
                  {subCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occasion */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Occasion</label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                >
                  <option value="">Not specified</option>
                  {['Festive', 'Wedding', 'Party', 'Casual', 'Office', 'Daily Wear'].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Season / Collection Year</label>
                <input
                  type="text"
                  {...methods.register('season')}
                  placeholder="e.g. Festive 2026"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              {/* Collections */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Collections</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={collectionInput}
                    onChange={(e) => setCollectionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCollection();
                      }
                    }}
                    placeholder="e.g. Festive Collection — press Enter to add"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                  />
                  <button
                    type="button"
                    onClick={addCollection}
                    className="px-4 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {collections.map((collection) => (
                    <span
                      key={collection}
                      className="inline-flex items-center gap-1.5 bg-sky-50 text-[#0284c7] border border-sky-100 rounded-full px-3 py-1.5 text-[11px] font-bold"
                    >
                      {collection}
                      <button
                        type="button"
                        onClick={() => setCollections((prev) => prev.filter((c) => c !== collection))}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Tags</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="e.g. Floral, Rayon, Anarkali — press Enter to add"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-full px-3 py-1.5 text-[11px] font-bold"
                    >
                      {tag}
                      <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRICING & TAXES */}
        {activeTab === 'pricing' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#0284c7]" />
              <span>Pricing, Discount & Taxes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Base Price / MRP */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  MRP / Base Price (₹) <span className="text-sky-600">*</span>
                </label>
                <input
                  type="number"
                  {...methods.register('basePrice')}
                  placeholder="2499"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              {/* Sale Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Offer / Sale Price (₹)</label>
                <input
                  type="number"
                  {...methods.register('salePrice')}
                  placeholder="1799"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              {/* Cost Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Cost Price (Internal ₹)</label>
                <input
                  type="number"
                  {...methods.register('costPrice')}
                  placeholder="800"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              {/* Wholesale / B2B Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">B2B Wholesale Price (₹)</label>
                <input
                  type="number"
                  {...methods.register('wholesalePrice' as any)}
                  placeholder="e.g. 1200"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              {/* Min & Max Order Quantity Limits */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Min Order Qty</label>
                <input
                  type="number"
                  {...methods.register('minimumOrderQuantity' as any)}
                  placeholder="1"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Max Order Qty</label>
                <input
                  type="number"
                  {...methods.register('maximumOrderQuantity' as any)}
                  placeholder="10"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
              </div>

              {/* Parcel Dimensions (DTDC Shipping Calculation) */}
              <div className="md:col-span-3 pt-3 border-t border-neutral-100 space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Parcel Shipping Dimensions (DTDC Courier Fee Calculation)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700 block mb-1">Weight (Kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...methods.register('weight' as any)}
                      placeholder="0.8"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700 block mb-1">Length (cm)</label>
                    <input
                      type="number"
                      {...methods.register('length' as any)}
                      placeholder="35"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700 block mb-1">Width (cm)</label>
                    <input
                      type="number"
                      {...methods.register('width' as any)}
                      placeholder="25"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-neutral-700 block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      {...methods.register('height' as any)}
                      placeholder="8"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* GST & Tax Configuration */}
              <div className="md:col-span-3 pt-3 border-t border-neutral-100 space-y-3">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">GST &amp; Tax Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* GST % */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-800">GST %</label>
                    <select
                      {...methods.register('taxPercentage')}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                    >
                      {[0, 3, 5, 12, 18, 28].map((rate) => (
                        <option key={rate} value={rate}>
                          {rate}%
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* HSN code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-800">HSN Code</label>
                    <input
                      type="text"
                      {...methods.register('hsnCode')}
                      placeholder="e.g. 6204"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                    />
                    <p className="text-[10px] text-neutral-400">Printed on GST invoices.</p>
                  </div>

                  {/* Tax inclusive */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-800">Tax Handling</label>
                    <label className="flex items-center gap-3 cursor-pointer bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3">
                      <input
                        type="checkbox"
                        {...methods.register('taxInclusive')}
                        className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                      />
                      <span className="text-xs font-bold text-neutral-800">Price includes GST</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Calculated Discount Pill Badge */}
              <div className="md:col-span-3 bg-sky-50/80 border border-sky-100 p-4 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#0284c7]">Calculated Customer Discount</h4>
                  <p className="text-[11px] text-neutral-600">
                    MRP: ₹{watchedValues?.basePrice || 0} → Selling Price: ₹{watchedValues?.salePrice || watchedValues?.basePrice || 0}
                  </p>
                </div>
                {Boolean(watchedValues?.basePrice && Number(watchedValues.basePrice) > 0 && watchedValues?.salePrice && Number(watchedValues.salePrice) < Number(watchedValues.basePrice)) ? (
                  <span className="text-xs font-bold text-sky-700 bg-sky-100 px-3.5 py-1.5 rounded-full border border-sky-200">
                    {Math.round(((Number(watchedValues.basePrice) - Number(watchedValues.salePrice)) / Number(watchedValues.basePrice)) * 100)}% OFF
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-neutral-400">No discount applied</span>
                )}
              </div>
            </div>

            {/* COUPONS & OFFERS FOR THIS PRODUCT */}
            <div className="pt-6 border-t border-neutral-100 space-y-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#0284c7]" />
                  <span>Coupons &amp; Offers</span>
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">
                  Attach coupons or offers that already exist on the Coupons &amp; Offers pages to this product. This form can&apos;t create new ones — only pick from what&apos;s already there.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coupons checklist */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-800">Coupons ({coupons.length})</span>
                  <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 max-h-60 overflow-y-auto bg-neutral-50/50">
                    {coupons.length === 0 ? (
                      <p className="p-4 text-xs text-neutral-400">No coupons created yet — add one on the Coupons page first.</p>
                    ) : (
                      coupons.map((c) => {
                        const attachable = isProductAttachable(c.applicableTo);
                        const checked = selectedCouponIds.includes(c.id);
                        return (
                          <label key={c.id} className={`flex items-start gap-3 p-3 ${attachable ? 'cursor-pointer hover:bg-white' : 'opacity-50 cursor-not-allowed'}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!attachable}
                              onChange={() =>
                                setSelectedCouponIds((prev) =>
                                  checked ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                                )
                              }
                              className="h-4 w-4 mt-0.5 rounded border-neutral-300 text-[#0284c7] focus:ring-[#0284c7]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold font-mono text-neutral-900">{c.code}</span>
                                <span className="text-[10px] font-semibold text-neutral-500">
                                  {c.type === 'PERCENTAGE' ? `${c.value}% off` : c.type === 'FLAT' ? `₹${c.value} off` : 'Free shipping'}
                                </span>
                              </div>
                              {!attachable && (
                                <p className="text-[9px] text-amber-600 font-medium mt-0.5">
                                  Already scoped to {String(c.applicableTo).toLowerCase()} elsewhere — can&apos;t attach here.
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Offers checklist */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-neutral-800">Offers ({offers.length})</span>
                  <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-100 max-h-60 overflow-y-auto bg-neutral-50/50">
                    {offers.length === 0 ? (
                      <p className="p-4 text-xs text-neutral-400">No offers created yet — add one on the Offers page first.</p>
                    ) : (
                      offers.map((o) => {
                        const attachable = isProductAttachable(o.applicableTo);
                        const checked = selectedOfferIds.includes(o.id);
                        return (
                          <label key={o.id} className={`flex items-start gap-3 p-3 ${attachable ? 'cursor-pointer hover:bg-white' : 'opacity-50 cursor-not-allowed'}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!attachable}
                              onChange={() =>
                                setSelectedOfferIds((prev) =>
                                  checked ? prev.filter((id) => id !== o.id) : [...prev, o.id],
                                )
                              }
                              className="h-4 w-4 mt-0.5 rounded border-neutral-300 text-[#0284c7] focus:ring-[#0284c7]"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-neutral-900 truncate">{o.name}</span>
                                <span className="text-[10px] font-semibold text-neutral-500 shrink-0">{o.value}% off</span>
                              </div>
                              {!attachable && (
                                <p className="text-[9px] text-amber-600 font-medium mt-0.5">
                                  Already scoped to {String(o.applicableTo).toLowerCase()} elsewhere — can&apos;t attach here.
                                </p>
                              )}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Live preview */}
              {promoPreviewRows.length > 0 && (
                <div className="space-y-2.5 bg-sky-50/80 border border-sky-100 p-4 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-[#0284c7]">Preview — what a customer would actually pay</h4>
                    <p className="text-[10px] text-neutral-600 mt-0.5">
                      Based on today&apos;s Selling Price (₹{referencePrice.toLocaleString('en-IN')}). Only the single best discount applies at checkout — a coupon and an offer never stack.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {promoPreviewRows.map((row) => (
                      <div key={row.key} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-sky-100/80 px-3.5 py-2.5">
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold font-mono text-neutral-900 truncate">{row.label}</p>
                          <p className="text-[9px] text-neutral-400 truncate">{row.sub}</p>
                          {row.note && <p className="text-[9px] text-amber-600 font-medium mt-0.5">{row.note}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-[#0284c7]">₹{row.finalPrice.toLocaleString('en-IN')}</p>
                          {row.discountAmount > 0 && (
                            <p className="text-[9px] text-neutral-400 line-through">₹{referencePrice.toLocaleString('en-IN')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: COLOR GROUPS & COLOR-SPECIFIC MEDIA */}
        {activeTab === 'colors' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[#0284c7]" />
                  <span>Color Groups & Color-Specific Media Gallery</span>
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Add color variants and upload dedicated image lists for each color
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-neutral-700 block">Quick Color Presets:</span>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => addColorGroup(preset.name, preset.hex)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-semibold text-neutral-800 transition-all hover:scale-105"
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-neutral-300" style={{ backgroundColor: preset.hex }} />
                    <span>+ {preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Color & Fabric Texture Swatch */}
            <div className="p-5 bg-sky-50/50 rounded-2xl border border-sky-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Step 1: Create Color Variant & Upload Fabric Texture Photo</span>
                </h4>
                <span className="text-[11px] text-neutral-500 font-medium">Upload texture photo, then proceed to add product images</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                {/* Color Hex & Name Input */}
                <div className="md:col-span-7 flex items-center gap-2.5 bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs">
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="Enter Color Name (e.g. Royal Blue, Emerald Green)"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
                    className="flex-1 text-xs font-semibold text-neutral-900 focus:outline-none bg-transparent"
                  />
                </div>

                {/* Upload Fabric Texture / Swatch Photo */}
                <div className="md:col-span-5">
                  <label className="cursor-pointer text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 p-2.5 rounded-xl flex items-center justify-between transition-all shadow-2xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {newColorSwatch ? (
                        <Image src={newColorSwatch} alt="swatch" width={22} height={22} className="w-5 h-5 rounded-full object-cover border border-neutral-300 shadow-2xs" unoptimized />
                      ) : (
                        <Palette className="w-4 h-4 text-[#0284c7]" />
                      )}
                      <span className="truncate text-xs font-bold text-neutral-800">
                        {newColorSwatch ? '✓ Fabric Texture Photo Uploaded' : 'Upload Fabric Texture Photo'}
                      </span>
                    </div>
                    <Upload className="w-4 h-4 text-[#0284c7] shrink-0" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const swatchUrl = ev.target?.result as string;
                            if (swatchUrl) {
                              setNewColorSwatch(swatchUrl);
                              addColorGroup(undefined, undefined, swatchUrl);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>


              {/* Submit Button */}
              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-neutral-500 font-medium">
                  {newColorName.trim() ? (
                    <span className="text-emerald-700 font-bold">Ready to create color: &quot;{newColorName}&quot;</span>
                  ) : (
                    <span>Type a color name to proceed to product images upload</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addColorGroup()}
                  className="bg-[#0284c7] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#0B3B78] transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Color Variant</span>
                </button>
              </div>
            </div>

            {/* Color Tabs for Media Management */}
            {colorGroups.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {colorGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => setActiveColorTab(group.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                        activeColorTab === group.id
                          ? 'border-[#0284c7] bg-sky-50 text-[#0284c7] shadow-2xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      {group.swatchImage ? (
                        <Image
                          src={group.swatchImage}
                          alt={group.name}
                          width={18}
                          height={18}
                          className="w-4 h-4 rounded-full object-cover border border-neutral-300 shadow-2xs shrink-0"
                          unoptimized={isLocalOrPlaceholder(group.swatchImage)}
                        />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-neutral-300 shrink-0" style={{ backgroundColor: group.hex }} />
                      )}
                      <span>{group.name}</span>
                      <span className="bg-neutral-200 text-neutral-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {group.images.length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Media Manager for Active Color Group */}
                {colorGroups.find((c) => c.id === activeColorTab) && (
                  <div className="p-6 bg-sky-50/40 rounded-2xl border border-sky-100 space-y-4">
                    {(() => {
                      const cur = colorGroups.find((c) => c.id === activeColorTab)!;
                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              {cur.swatchImage ? (
                                <Image
                                  src={cur.swatchImage}
                                  alt={cur.name}
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 rounded-full object-cover border border-neutral-300 shadow-2xs shrink-0"
                                  unoptimized={isLocalOrPlaceholder(cur.swatchImage)}
                                />
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-neutral-300 shrink-0" style={{ backgroundColor: cur.hex }} />
                              )}
                              <h4 className="text-sm font-bold text-neutral-900">
                                Product Images for &quot;{cur.name}&quot; ({cur.images.length} uploaded)
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeColorGroup(cur.id)}
                              className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Color Group</span>
                            </button>
                          </div>

                          {/* Swatch Texture Image Display & Change Option */}
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-neutral-800">Fabric Texture Photo:</span>
                              {cur.swatchImage ? (
                                <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
                                  <Image
                                    src={cur.swatchImage}
                                    alt="Fabric Swatch"
                                    width={36}
                                    height={36}
                                    className="w-9 h-9 rounded-lg object-cover border border-neutral-300 shadow-2xs shrink-0"
                                    unoptimized={isLocalOrPlaceholder(cur.swatchImage)}
                                  />
                                  <div>
                                    <span className="text-xs font-bold text-neutral-900 block">
                                      Custom Texture Uploaded
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700">
                                      ✓ Active Swatch Photo
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeSwatchImage(cur.id)}
                                    className="text-xs font-bold text-sky-600 hover:underline ml-2"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-500 font-medium">Using Solid Color ({cur.hex})</span>
                              )}
                            </div>

                            <label className="cursor-pointer text-xs font-bold text-[#0284c7] bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Custom Swatch Image</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleSwatchImageUpload(cur.id, e.target.files?.[0])}
                              />
                            </label>
                          </div>

                          {/* Hidden Multi-File Input */}
                          <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleLocalImageUpload(cur.id, e.target.files)}
                          />

                          {/* Drag & Drop Upload Zone */}
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleLocalImageUpload(cur.id, e.dataTransfer.files);
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-sky-200 hover:border-[#0284c7] bg-white hover:bg-sky-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
                              <Upload className="w-6 h-6 text-[#0284c7]" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-neutral-800">
                                Upload Product Images for &quot;{cur.name}&quot;
                              </h5>
                              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                                Drag & drop image files here, or <span className="text-[#0284c7] font-bold underline">browse local files</span>
                              </p>
                            </div>
                            <span className="inline-block text-[10px] text-neutral-400 font-semibold bg-neutral-100 px-2.5 py-1 rounded-full">
                              Supports JPG, PNG, WEBP, AVIF (Select Multiple Files)
                            </span>
                          </div>

                          {/* URL Input Fallback */}
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Or paste Image URL (e.g. http://localhost:4000/storage/...)"
                              value={imageUrlInput}
                              onChange={(e) => setImageUrlInput(e.target.value)}
                              className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 font-medium focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => addImageToColorGroup(cur.id)}
                              className="bg-[#0284c7] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#0B3B78] shrink-0"
                            >
                              + Add URL Image
                            </button>
                          </div>

                          {/* Gallery Thumbnails */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                            {cur.images.map((img, idx) => (
                              <div key={idx} className="group relative rounded-xl overflow-hidden aspect-[4/5] border border-neutral-200 bg-white shadow-2xs">
                                <Image
                                  src={img}
                                  alt={`${cur.name} ${idx + 1}`}
                                  fill
                                  sizes="120px"
                                  unoptimized={isLocalOrPlaceholder(img)}
                                  className="object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImageFromColorGroup(cur.id, idx)}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Reorder — position 0 is the primary */}
                                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={() => moveImage(cur.id, idx, -1)}
                                    disabled={idx === 0}
                                    className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-30"
                                    title="Move earlier"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveImage(cur.id, idx, 1)}
                                    disabled={idx === cur.images.length - 1}
                                    className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center disabled:opacity-30"
                                    title="Move later"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>

                                {idx === 0 ? (
                                  <span className="absolute bottom-9 left-2 bg-[#0284c7] text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                                    PRIMARY
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPrimaryImage(cur.id, idx)}
                                    className="absolute bottom-9 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    SET PRIMARY
                                  </button>
                                )}

                                {/* Shot type */}
                                <select
                                  value={imageLabels[img] ?? ''}
                                  onChange={(e) =>
                                    setImageLabels((prev) => ({ ...prev, [img]: e.target.value }))
                                  }
                                  className="absolute bottom-0 inset-x-0 bg-white/95 border-t border-neutral-200 text-[9px] font-bold text-neutral-700 px-1.5 py-1 focus:outline-none"
                                >
                                  <option value="">Type…</option>
                                  {IMAGE_TYPES.map((label) => (
                                    <option key={label} value={label}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COLOR-WISE SIZES & STOCK */}
        {activeTab === 'sizes' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-[#0284c7]" />
                  <span>Color-Wise Sizes, Stock &amp; SKU Management</span>
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Configure size availability, inventory, and unique barcode SKU IDs per color group
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setColorGroups((prev) =>
                    prev.map((g) => ({
                      ...g,
                      sizes: g.sizes.map((s) => ({
                        ...s,
                        sku: buildSmartVariantSku(g.name, s.size),
                      })),
                    }))
                  );
                }}
                className="text-xs font-bold text-[#0284c7] bg-sky-50 border border-sky-200 px-3.5 py-2 rounded-xl hover:bg-sky-100 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Auto-Generate All SKU IDs</span>
              </button>
            </div>

            {/* Size chart template */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800">Size Chart</label>
                  <p className="text-[11px] text-neutral-500">
                    Measurements are defined once per garment shape and reused. Manage them under
                    Catalog &rarr; Size Charts.
                  </p>
                </div>
                <select
                  value={sizeChartTemplateId}
                  onChange={(e) => setSizeChartTemplateId(e.target.value)}
                  className="w-full sm:w-72 bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                >
                  <option value="">No size chart</option>
                  {sizeCharts.map((chart) => (
                    <option key={chart.id} value={chart.id}>
                      {chart.name}
                      {chart.garmentType ? ` — ${chart.garmentType}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSizeChart && selectedSizeChart.rows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="text-left text-neutral-500">
                        <th className="py-1.5 pr-4 font-bold">SIZE</th>
                        {Object.keys(selectedSizeChart.rows[0].measurements).map((key) => (
                          <th key={key} className="py-1.5 pr-4 font-bold whitespace-nowrap">
                            {key.toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSizeChart.rows.map((row) => (
                        <tr key={row.size} className="border-t border-neutral-200">
                          <td className="py-1.5 pr-4 font-bold text-neutral-800">{row.size}</td>
                          {Object.keys(selectedSizeChart.rows[0].measurements).map((key) => (
                            <td key={key} className="py-1.5 pr-4 text-neutral-600">
                              {row.measurements[key] ?? '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-neutral-400 mt-2">
                    All measurements in {selectedSizeChart.unit}.
                  </p>
                </div>
              )}
            </div>

            {/* Size Management per Color */}
            <div className="space-y-6">
              {colorGroups.map((group) => (
                <div key={group.id} className="p-6 bg-neutral-50/80 rounded-2xl border border-neutral-200 space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border border-neutral-300" style={{ backgroundColor: group.hex }} />
                      <h4 className="text-sm font-bold text-neutral-900">
                        Sizes for &quot;{group.name}&quot;
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setColorGroups((prev) =>
                          prev.map((g) => {
                            if (g.id === group.id) {
                              return {
                                ...g,
                                sizes: STANDARD_SIZES.map((sz) => ({
                                  size: sz,
                                  stock: 15,
                                  available: true,
                                  sku: buildSmartVariantSku(g.name, sz),
                                })),
                              };
                            }
                            return g;
                          })
                        );
                      }}
                      className="text-xs font-bold text-[#0284c7] bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition-all"
                    >
                      ⚡ Add Standard Sizes (S, M, L, XL, XXL, 3XL)
                    </button>
                  </div>

                  {/* Sizes List Table */}
                  <div className="space-y-2">
                    {group.sizes.map((sz) => (
                      <div
                        key={sz.size}
                        className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white border border-neutral-200 rounded-xl shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSizeAvailability(group.id, sz.size)}
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${
                              sz.available
                                ? 'bg-[#0284c7] text-white border-[#0284c7]'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through'
                            }`}
                          >
                            {sz.size}
                          </button>
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">
                              Size {sz.size}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-bold text-sky-700 font-mono">SKU:</span>
                              <input
                                type="text"
                                value={sz.sku || ''}
                                onChange={(e) => updateSizeField(group.id, sz.size, 'sku', e.target.value.toUpperCase())}
                                placeholder="SKU-ID"
                                className="bg-sky-50/80 border border-sky-200 rounded px-2 py-0.5 text-[10px] font-mono font-bold text-neutral-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0284c7] uppercase w-32 shadow-2xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-600">Stock:</span>
                            <input
                              type="number"
                              value={sz.stock}
                              onChange={(e) => updateSizeStock(group.id, sz.size, Number(e.target.value))}
                              className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 font-bold focus:outline-none text-center"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-600">Min:</span>
                            <input
                              type="number"
                              value={sz.minStock ?? ''}
                              placeholder="0"
                              onChange={(e) =>
                                updateSizeField(group.id, sz.size, 'minStock', Number(e.target.value))
                              }
                              className="w-16 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 font-bold focus:outline-none text-center"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-neutral-600">Reorder:</span>
                            <input
                              type="number"
                              value={sz.reorderLevel ?? ''}
                              placeholder="0"
                              onChange={(e) =>
                                updateSizeField(group.id, sz.size, 'reorderLevel', Number(e.target.value))
                              }
                              className="w-16 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 font-bold focus:outline-none text-center"
                            />
                          </div>

                          {(() => {
                            const status = stockStatus(sz.stock, sz.minStock);
                            return (
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-lg border ${status.className}`}
                              >
                                {status.label}
                              </span>
                            );
                          })()}

                          <button
                            type="button"
                            onClick={() => removeSizeFromColorGroup(group.id, sz.size)}
                            className="text-neutral-400 hover:text-sky-600 p-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Size Controls */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add custom size (e.g. 4XL, FREE SIZE)"
                      value={activeColorTab === group.id ? newSizeInput : ''}
                      onChange={(e) => {
                        setActiveColorTab(group.id);
                        setNewSizeInput(e.target.value);
                      }}
                      className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-2 text-xs text-neutral-900 font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => addSizeToColorGroup(group.id)}
                      className="bg-neutral-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-neutral-800"
                    >
                      + Add Size
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BADGES & SEO */}
        {/* TAB 6: DYNAMIC ATTRIBUTES */}
        {activeTab === 'attributes' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-[#0284c7]" />
              <span>Product Attributes</span>
            </h3>
            <p className="text-[11px] text-neutral-500 -mt-4">
              These drive the storefront filters. Managed under Catalog &rarr; Attributes — no
              developer needed to add a new one. Colour and size are configured on their own tabs.
            </p>

            {productAttributes.length === 0 ? (
              <p className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                No attributes defined yet. Add them under Catalog &rarr; Attributes.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productAttributes.map((attribute) => {
                  const value = attributeValues[attribute.id] ?? '';
                  const hasOptions = (attribute.options?.length ?? 0) > 0;
                  return (
                    <div key={attribute.id} className="space-y-1.5">
                      <label className="text-xs font-bold text-neutral-800">
                        {attribute.name}
                        {attribute.isRequired && <span className="text-sky-600"> *</span>}
                      </label>

                      {hasOptions ? (
                        <select
                          value={value}
                          onChange={(e) => setAttributeValue(attribute.id, e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                        >
                          <option value="">Not specified</option>
                          {attribute.options?.map((option) => (
                            <option key={option.id} value={option.value}>
                              {option.label || option.value}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={attribute.type === AttributeType.NUMBER ? 'number' : 'text'}
                          value={value}
                          onChange={(e) => setAttributeValue(attribute.id, e.target.value)}
                          placeholder={attribute.description || `e.g. ${attribute.name}`}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <AiContentAssistant
              candidates={aiCandidates}
              referenceImages={aiReferenceImages}
            />
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#0284c7]" />
              <span>Badges, Homepage Display &amp; SEO</span>
            </h3>

            {/* PRE-PUBLISH VALIDATION */}
            {validationIssues.length > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                    Product cannot be published — {validationIssues.length} issue
                    {validationIssues.length === 1 ? '' : 's'} found
                  </h4>
                </div>
                <ul className="space-y-1.5">
                  {validationIssues.map((issue) => (
                    <li key={issue} className="text-[11px] font-semibold text-amber-800 flex gap-2">
                      <span className="text-amber-500">✕</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-amber-700 mt-3">
                  You can still save this as a draft — untick &ldquo;Published&rdquo; below.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">
                  All checks passed — ready to publish.
                </span>
              </div>
            )}

            {/* Badges Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isNewArrival')}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span className="text-xs font-bold text-neutral-800">New Arrival Badge</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isBestSeller')}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span className="text-xs font-bold text-neutral-800">Best Seller Badge</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isFeatured')}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span className="text-xs font-bold text-neutral-800">Featured Banner</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isTrending')}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span className="text-xs font-bold text-neutral-800">Trending Section</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isLimitedStock')}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span className="text-xs font-bold text-neutral-800">Limited Stock</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isFestivePick')}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span className="text-xs font-bold text-neutral-800">Festive Pick</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isExclusive')}
                  className="w-4 h-4 text-[#0284c7] rounded focus:ring-[#0284c7]"
                />
                <span className="text-xs font-bold text-neutral-800">Exclusive</span>
              </label>
            </div>

            {/* Where to Sell -- the last decision before Save, since Save is what
                issues this product's barcode/sticker (see the "ISSUED BARCODES"
                panel above the tabs). Stock is one shared pool either way; this
                only controls where the product is offered. */}
            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-3">
              <div>
                <span className="text-xs font-bold text-neutral-800">Where should this product be sold?</span>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Stock stays the same either way — this only controls where the product is offered for sale.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    {
                      value: 'STORE' as const,
                      label: 'Store Only',
                      desc: 'Sellable at the POS counter. Hidden from the online website.',
                      Icon: Store,
                    },
                    {
                      value: 'ONLINE' as const,
                      label: 'Online Only',
                      desc: 'Shown on the website. Not sellable at the POS counter.',
                      Icon: Globe,
                    },
                    {
                      value: 'BOTH' as const,
                      label: 'Store & Online',
                      desc: 'Sellable at the counter and shown on the website.',
                      Icon: Layers,
                    },
                  ]
                ).map(({ value, label, desc, Icon }) => {
                  const selected = methods.watch('channel') === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => methods.setValue('channel', value, { shouldValidate: true, shouldDirty: true })}
                      className={`text-left p-4 rounded-xl border-2 transition-colors ${
                        selected
                          ? 'border-[#0284c7] bg-[#0284c7]/5'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${selected ? 'text-[#0284c7]' : 'text-neutral-400'}`} />
                      <div className={`text-xs font-bold ${selected ? 'text-[#0284c7]' : 'text-neutral-800'}`}>
                        {label}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 leading-snug">{desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEO Inputs */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">SEO Page Title</label>
                <input
                  type="text"
                  {...methods.register('seoTitle')}
                  placeholder="Buy Designer Anarkali Suit Online | Vasanthi Designers"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Meta Description</label>
                <textarea
                  rows={2}
                  {...methods.register('seoDescription')}
                  placeholder="Shop exclusive luxury ethnic wear with fast shipping..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-900 font-medium focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">SEO Keywords</label>
                <input
                  type="text"
                  {...methods.register('seoKeywords')}
                  placeholder="anarkali, kurta set, women's ethnic wear, floral kurta"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20"
                />
                <p className="text-[10px] text-neutral-400">Comma separated.</p>
              </div>
            </div>
          </div>
        )}

        {/* REAL-TIME LIVE DESKTOP CUSTOMER PREVIEW SECTION (AT BOTTOM) */}
        <div className="pt-6">
          <LiveDesktopProductPreview data={deferredPreviewData} />
        </div>

      </form>
    </FormProvider>
  );
}
