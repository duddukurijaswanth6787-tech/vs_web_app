'use client';

import React, { useState, useMemo, useDeferredValue } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { isLocalOrPlaceholder } from '@/lib/media-url';
import { productSchema, ProductFormValues, ProductResponse, AttributeType } from '../product.types';
import { productService } from '../product.service';
import { variantService } from '@/features/catalog/variants/variant.service';
import { inventoryService } from '@/features/inventory/inventory.service';
import { attributeService } from '@/features/catalog/attributes/attribute.service';
import { useAttributes } from '@/features/catalog/attributes/attribute.hooks';
import type { AttributeResponse } from '@/features/catalog/attributes/attribute.types';
import { useBrands } from '@/features/catalog/brands/brand.hooks';
import { useCategories } from '@/features/catalog/categories/category.hooks';
import {
  LiveDesktopProductPreview,
  ColorVariantGroup,
  LivePreviewData,
} from './LiveDesktopProductPreview';
import {
  Package,
  DollarSign,
  Palette,
  Ruler,
  Tag,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Save,
  Upload,
  FolderTree,
  X,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';

interface ProductBuilderProps {
  productId?: string;
  initialData?: ProductResponse;
  onSaveSuccess?: (id: string) => void;
}

const COLOR_PRESETS = [
  { name: 'Maroon', hex: '#800020' },
  { name: 'Emerald Green', hex: '#0E6251' },
  { name: 'Royal Blue', hex: '#1B4F72' },
  { name: 'Pastel Pink', hex: '#FADBD8' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Black', hex: '#1C2833' },
  { name: 'Crimson Red', hex: '#900C3F' },
  { name: 'Mustard Yellow', hex: '#D4AC0D' },
];

const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

/** A variant the backend created on save, with the barcode it assigned. */
interface IssuedVariant {
  sku: string;
  barcode?: string;
  title: string;
  stock: number;
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

const DEFAULT_SAMPLE_IMAGE =
  'http://localhost:4000/api/v1/storage/products/50890861-0fb4-4b93-91b2-231422e0fa49/images/7027e0e8-0450-4a09-84a0-e76f84c88935.png';

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

  // Load Brands
  const { data: brandsData } = useBrands({ limit: 100 });
  const brands = useMemo(() => (Array.isArray(brandsData) ? brandsData : (brandsData as any)?.data || []), [brandsData]);

  // Load the full category tree so a primary category and its sub-category can
  // both be picked. useFeaturedCategories only returned the featured subset.
  const { data: categoriesData } = useCategories({ limit: 200 });
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
    resolver: zodResolver(productSchema) as any,
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
      isPublished: initialData?.isPublished ?? true,
    },
  });

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
  const [colorGroups, setColorGroups] = useState<ColorVariantGroup[]>(
    (initialData as any)?.colorGroups || []
  );

  const [activeColorTab, setActiveColorTab] = useState<string>(colorGroups[0]?.id || '');

  // Add New Color Group
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#800020');
  const [newColorSwatch, setNewColorSwatch] = useState<string | undefined>(undefined);
  const [newColorImages, setNewColorImages] = useState<string[]>([]);

  const addColorGroup = (name?: string, hex?: string, swatch?: string, initialImgs?: string[]) => {
    const defaultName = `Color ${colorGroups.length + 1}`;
    const cName = name || newColorName.trim() || defaultName;
    const cHex = hex || newColorHex;
    const cSwatch = swatch !== undefined ? swatch : newColorSwatch;
    const cImages = initialImgs && initialImgs.length > 0 ? initialImgs : newColorImages;

    const newId = `col-${Date.now()}`;
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
        sku: `${cName.substring(0, 3).toUpperCase()}-${sz}`,
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
  const [newSizeStock, setNewSizeStock] = useState(10);

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
                stock: newSizeStock,
                available: true,
                sku: `${group.name.substring(0, 3).toUpperCase()}-${newSizeInput.trim().toUpperCase()}`,
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

  /** Update any numeric field on one size row (min stock, reorder level …). */
  const updateSizeField = (
    colorGroupId: string,
    sizeName: string,
    field: 'minStock' | 'reorderLevel',
    value: number,
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
    if (stock <= 0) return { label: 'OUT', className: 'bg-rose-50 text-rose-700 border-rose-200' };
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

  const watchedValues = methods.watch();

  // Selected Brand Name for Live Preview
  const selectedBrandObj = brands.find((b: any) => b.id === watchedValues.brandId);
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
      setActiveTab('seo');
      setSaveMessage(
        `✕ Cannot publish — ${validationIssues.length} issue${validationIssues.length === 1 ? '' : 's'} to fix.`,
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
      };

      const created = productId
        ? await productService.update(productId, payload as any)
        : await productService.create(payload as any);

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
        const groupImages = [group.swatchImage, ...group.images].filter(Boolean) as string[];
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
          });
          if (media?.id) mediaIdsByGroup[group.id].push(media.id);
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
          .findAll({ productId: created.id, limit: 200 })
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

      setIssuedVariants(issued);
      setSaveMessage(
        issued.length > 0
          ? `✓ Product saved — ${issued.length} variant${issued.length === 1 ? '' : 's'} created with barcodes.`
          : '✓ Product saved successfully!',
      );
      if (onSaveSuccess) onSaveSuccess(created.id);
      if (issued.length === 0) setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage('✕ ' + (err?.response?.data?.message || err?.message || 'Failed to save product'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(handleSubmitForm)} className="space-y-8">
        
        {/* TOP STATUS BAR & HEADER */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#800020] flex items-center justify-center border border-rose-100 shadow-2xs font-serif text-xl font-bold">
              ❖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-neutral-900">
                  {productId ? 'Edit Catalog Product' : 'Add New E-Commerce Product'}
                </h2>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                Configure basic details, pricing, color-wise images & sizes with live customer desktop preview below
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-fade-in">
                {saveMessage}
              </span>
            )}

            {!canPublish && (
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {validationIssues.length} issue{validationIssues.length === 1 ? '' : 's'}
                </span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#800020] hover:bg-[#600018] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : methods.watch('isPublished')
                    ? 'Save & Publish'
                    : 'Save as Draft'}
              </span>
            </button>
          </div>
        </div>

        {/* ISSUED BARCODES — shown after a save that created variants */}
        {issuedVariants.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {issuedVariants.map((variant) => (
                <div
                  key={variant.sku}
                  className="border border-neutral-200 rounded-2xl p-4 flex flex-col items-center text-center"
                >
                  <span className="text-xs font-bold text-neutral-700">{variant.title}</span>
                  {variant.barcode ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/pos/barcodes/generate?code=${encodeURIComponent(variant.barcode)}&scale=2&height=12`}
                        alt={`Barcode ${variant.barcode}`}
                        className="h-14 my-2 object-contain"
                      />
                      <span className="text-xs font-mono tracking-widest text-neutral-900">
                        {variant.barcode}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-neutral-400 my-4">No barcode returned</span>
                  )}
                  <span className="text-[10px] text-neutral-400 mt-1">SKU: {variant.sku}</span>
                  <span className="text-[10px] text-neutral-400">Stock: {variant.stock}</span>
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
                ? 'bg-[#800020] text-white shadow-sm'
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
                ? 'bg-[#800020] text-white shadow-sm'
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
                ? 'bg-[#800020] text-white shadow-sm'
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
                ? 'bg-[#800020] text-white shadow-sm'
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
                ? 'bg-[#800020] text-white shadow-sm'
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
                ? 'bg-[#800020] text-white shadow-sm'
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
                ? 'bg-[#800020] text-white shadow-sm'
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
              <Package className="w-5 h-5 text-[#800020]" />
              <span>Product Specification & Description</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  Product Name / Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  {...methods.register('name')}
                  placeholder="e.g. Women's Floral Printed Anarkali Kurta Set"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
                {methods.formState.errors.name && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    {methods.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Brand</label>
                <select
                  {...methods.register('brandId')}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                >
                  <option value="">Select Brand (or default Vasanthi Designers)</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Product Type</label>
                <select
                  {...methods.register('type')}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
              </div>

              {/* Short Description */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Short Summary</label>
                <input
                  type="text"
                  {...methods.register('shortDescription')}
                  placeholder="Brief 1-sentence product summary displayed under title..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
              </div>

              {/* Full Description */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Full Description</label>
                <textarea
                  rows={4}
                  {...methods.register('description')}
                  placeholder="Detailed specifications, fabric details, care instructions, craftsmanship..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORY & ORGANISATION */}
        {activeTab === 'organisation' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-[#800020]" />
              <span>Category &amp; Organisation</span>
            </h3>
            <p className="text-[11px] text-neutral-500 -mt-4">
              A product with no category cannot be browsed on the storefront.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  Primary Category <span className="text-rose-600">*</span>
                </label>
                <select
                  value={primaryCategoryId}
                  onChange={(e) => {
                    setPrimaryCategoryId(e.target.value);
                    setSubCategoryId('');
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20 disabled:opacity-50"
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
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
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
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
                      className="inline-flex items-center gap-1.5 bg-rose-50 text-[#800020] border border-rose-100 rounded-full px-3 py-1.5 text-[11px] font-bold"
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
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
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
              <DollarSign className="w-5 h-5 text-[#800020]" />
              <span>Pricing, Discount & Taxes</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Base Price / MRP */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  MRP / Base Price (₹) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  {...methods.register('basePrice')}
                  placeholder="2499"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
              </div>

              {/* Sale Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Offer / Sale Price (₹)</label>
                <input
                  type="number"
                  {...methods.register('salePrice')}
                  placeholder="1799"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
              </div>

              {/* Cost Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">Cost Price (Internal ₹)</label>
                <input
                  type="number"
                  {...methods.register('costPrice')}
                  placeholder="800"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                />
              </div>

              {/* Calculated Discount Pill Badge */}
              <div className="md:col-span-3 bg-rose-50/80 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#800020]">Calculated Customer Discount</h4>
                  <p className="text-[11px] text-neutral-600">
                    MRP: ₹{methods.watch('basePrice') || 0} → Selling Price: ₹{methods.watch('salePrice') || methods.watch('basePrice') || 0}
                  </p>
                </div>
                {methods.watch('basePrice') > 0 && methods.watch('salePrice') && methods.watch('salePrice')! < methods.watch('basePrice') ? (
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3.5 py-1.5 rounded-full border border-rose-200">
                    {Math.round(((methods.watch('basePrice') - methods.watch('salePrice')!) / methods.watch('basePrice')) * 100)}% OFF
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-neutral-400">No discount applied</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLOR GROUPS & COLOR-SPECIFIC MEDIA */}
        {activeTab === 'colors' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[#800020]" />
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
            <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#800020] uppercase tracking-wider flex items-center gap-1.5">
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
                        <Palette className="w-4 h-4 text-[#800020]" />
                      )}
                      <span className="truncate text-xs font-bold text-neutral-800">
                        {newColorSwatch ? '✓ Fabric Texture Photo Uploaded' : 'Upload Fabric Texture Photo'}
                      </span>
                    </div>
                    <Upload className="w-4 h-4 text-[#800020] shrink-0" />
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
                    <span className="text-emerald-700 font-bold">Ready to create color: "{newColorName}"</span>
                  ) : (
                    <span>Type a color name to proceed to product images upload</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addColorGroup()}
                  className="bg-[#800020] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#600018] transition-all flex items-center gap-1.5 shadow-md"
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
                          ? 'border-[#800020] bg-rose-50 text-[#800020] shadow-2xs'
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
                  <div className="p-6 bg-rose-50/40 rounded-2xl border border-rose-100 space-y-4">
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
                                Product Images for "{cur.name}" ({cur.images.length} uploaded)
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeColorGroup(cur.id)}
                              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
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
                                    className="text-xs font-bold text-rose-600 hover:underline ml-2"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-500 font-medium">Using Solid Color ({cur.hex})</span>
                              )}
                            </div>

                            <label className="cursor-pointer text-xs font-bold text-[#800020] bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all">
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
                            className="border-2 border-dashed border-rose-200 hover:border-[#800020] bg-white hover:bg-rose-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#800020] flex items-center justify-center mx-auto shadow-2xs group-hover:scale-110 transition-transform">
                              <Upload className="w-6 h-6 text-[#800020]" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-neutral-800">
                                Upload Product Images for "{cur.name}"
                              </h5>
                              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                                Drag & drop image files here, or <span className="text-[#800020] font-bold underline">browse local files</span>
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
                              className="bg-[#800020] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#600018] shrink-0"
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
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                {idx === 0 && (
                                  <span className="absolute bottom-2 left-2 bg-[#800020] text-white text-[9px] font-bold px-2 py-0.5 rounded-md">
                                    PRIMARY
                                  </span>
                                )}
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
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-[#800020]" />
                <span>Color-Wise Sizes, Stock & SKU Management</span>
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Configure size availability and inventory per color group
              </p>
            </div>

            {/* Size Management per Color */}
            <div className="space-y-6">
              {colorGroups.map((group) => (
                <div key={group.id} className="p-6 bg-neutral-50/80 rounded-2xl border border-neutral-200 space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border border-neutral-300" style={{ backgroundColor: group.hex }} />
                      <h4 className="text-sm font-bold text-neutral-900">
                        Sizes for "{group.name}"
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
                                  sku: `${g.name.substring(0, 3).toUpperCase()}-${sz}`,
                                })),
                              };
                            }
                            return g;
                          })
                        );
                      }}
                      className="text-xs font-bold text-[#800020] bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl hover:bg-rose-100 transition-all"
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
                                ? 'bg-[#800020] text-white border-[#800020]'
                                : 'bg-neutral-100 text-neutral-400 border-neutral-200 line-through'
                            }`}
                          >
                            {sz.size}
                          </button>
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">
                              Size {sz.size}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              SKU: {sz.sku}
                            </span>
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
                            className="text-neutral-400 hover:text-rose-600 p-1.5"
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
              <ListChecks className="w-5 h-5 text-[#800020]" />
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
                        {attribute.isRequired && <span className="text-rose-600"> *</span>}
                      </label>

                      {hasOptions ? (
                        <select
                          value={value}
                          onChange={(e) => setAttributeValue(attribute.id, e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
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
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#800020]" />
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
                  className="w-4 h-4 text-[#800020] rounded focus:ring-[#800020]"
                />
                <span className="text-xs font-bold text-neutral-800">New Arrival Badge</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isBestSeller')}
                  className="w-4 h-4 text-[#800020] rounded focus:ring-[#800020]"
                />
                <span className="text-xs font-bold text-neutral-800">Best Seller Badge</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isFeatured')}
                  className="w-4 h-4 text-[#800020] rounded focus:ring-[#800020]"
                />
                <span className="text-xs font-bold text-neutral-800">Featured Banner</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...methods.register('isTrending')}
                  className="w-4 h-4 text-[#800020] rounded focus:ring-[#800020]"
                />
                <span className="text-xs font-bold text-neutral-800">Trending Section</span>
              </label>
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
