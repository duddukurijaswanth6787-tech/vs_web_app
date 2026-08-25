import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Package,
  IndianRupee,
  Palette,
  Ruler,
  Tag,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
  FolderTree,
  ListChecks,
  Store,
  Globe,
  Layers,
} from 'lucide-react-native';
import {
  catalogService,
  attributeService,
  inventoryService,
  promoService,
  buildVariantAttributes,
  getApiErrorMessage,
  isAuthenticated,
  type BrandOption,
  type CategoryOption,
  type SizeChartOption,
  type ColorGroupDraft,
  type CreatedVariant,
  type AttributeDefinition,
  type CouponOption,
  type OfferOption,
} from '../services/api';
import { setLastCreatedProduct } from '../services/product-draft';

/**
 * Mobile mirror of the admin ProductBuilder
 * (frontend/src/features/catalog/products/components/ProductBuilder.tsx).
 *
 * Same steps, same endpoints, in the same order:
 *   1. POST /products                       (incl. categoryIds, tags, collections, occasion)
 *   2. POST /products/:id/attributes        (dynamic registry values)
 *   3. POST /storage/upload + POST /media   (per staged photo, incl. swatch)
 *   4. POST /variants                       (per colour x size — assigns the barcode)
 *   5. POST /inventory                      (opening stock per variant)
 *   6. POST /products/:id/color-groups/sync (binds each colour's variants + media)
 *   7. PATCH /coupons/:id + PATCH /offers/:id (attaches selected existing promos)
 * then hands off to the label screen to print what step 4 generated.
 *
 * Publishing is gated on the same validation rules as the web builder; saving
 * an unpublished draft is always allowed.
 */

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

const STEPS = [
  { key: 'basic', label: 'Basic', Icon: Package },
  { key: 'organisation', label: 'Category', Icon: FolderTree },
  { key: 'pricing', label: 'Pricing', Icon: IndianRupee },
  { key: 'colors', label: 'Colours', Icon: Palette },
  { key: 'sizes', label: 'Sizes', Icon: Ruler },
  { key: 'attributes', label: 'Details', Icon: ListChecks },
  { key: 'seo', label: 'Review', Icon: Tag },
  { key: 'channel', label: 'Where to Sell', Icon: Store },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

/** The AttributeOption id a colour group must be keyed by for color-groups/sync. */
const findColorOptionId = (attrs: AttributeDefinition[], colorName: string) => {
  const colorAttr = attrs.find((a) => a.slug === 'color' || a.name.toLowerCase() === 'color');
  return colorAttr?.options.find(
    (o) => o.value.toLowerCase().trim() === colorName.toLowerCase().trim(),
  )?.id;
};

/** A coupon/offer already scoped to categories or brands elsewhere can't also
 *  be attached to a specific product from here without clobbering that scope. */
const isProductAttachable = (applicableTo?: string) =>
  !applicableTo || ['GLOBAL', 'PRODUCT', 'PRODUCTS'].includes(applicableTo);

interface PromoPreview {
  finalPrice: number;
  discountAmount: number;
  note?: string;
}

/** Mirrors the real discount formulas in the backend's coupon/offer services
 *  (percentage / flat / free-shipping, capped by maxDiscountAmount) — must
 *  match `computePromoPreview` in ProductBuilder.tsx exactly. */
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

/** Merges/removes a product's id from a coupon's or offer's applicableIds so
 *  it becomes (or stops being) restricted to specific products. Returns null
 *  when nothing actually needs to change on the server. */
function diffProductAttachment(
  current: { applicableTo?: string; applicableIds?: string[] },
  productId: string,
  shouldAttach: boolean,
): { applicableTo?: string; applicableIds: string[] } | null {
  const ids = current.applicableIds ?? [];
  const isAttached = ids.includes(productId);
  if (isAttached === shouldAttach) return null;
  const nextIds = shouldAttach ? [...ids, productId] : ids.filter((id) => id !== productId);
  return { applicableTo: nextIds.length > 0 ? 'PRODUCTS' : undefined, applicableIds: nextIds };
}

export default function AddProductScreen() {
  const router = useRouter();

  const [step, setStep] = useState<StepKey>('basic');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  // ── Step 1: basic ──────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('READYMADE');
  const [gender, setGender] = useState('WOMEN');
  const [season, setSeason] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [collections, setCollections] = useState<string[]>([]);
  const [collectionInput, setCollectionInput] = useState('');

  // attributeId -> chosen value, for the dynamic attribute registry.
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});

  // ── Step 2: pricing ────────────────────────────────────────────────────────
  const [basePrice, setBasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [taxPercentage, setTaxPercentage] = useState('5');
  const [taxInclusive, setTaxInclusive] = useState(true);
  const [hsnCode, setHsnCode] = useState('');

  // ── Step 3/4: colours and their per-size stock ─────────────────────────────
  const [colorGroups, setColorGroups] = useState<ColorGroupDraft[]>([]);
  const [activeColorId, setActiveColorId] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#0284c7');
  /** Shot type per image, keyed by URI; sent as the media title on save. */
  const [imageLabels, setImageLabels] = useState<Record<string, string>>({});
  /** Colour group id currently uploading its swatch photo, or '' when idle. */
  const [swatchUploading, setSwatchUploading] = useState('');

  // ── Step 5: seo / publish ──────────────────────────────────────────────────
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isLimitedStock, setIsLimitedStock] = useState(false);
  const [isFestivePick, setIsFestivePick] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isTrending, setIsTrending] = useState(false);

  // ── Step 6: where to sell ──────────────────────────────────────────────────
  // Stock is one shared pool regardless of channel -- this only controls
  // where the product is offered (POS counter, storefront, or both).
  const [channel, setChannel] = useState<'STORE' | 'ONLINE' | 'BOTH'>('BOTH');

  // ── Reference data ─────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [sizeCharts, setSizeCharts] = useState<SizeChartOption[]>([]);
  const [sizeChartTemplateId, setSizeChartTemplateId] = useState('');
  const [coupons, setCoupons] = useState<CouponOption[]>([]);
  const [offers, setOffers] = useState<OfferOption[]>([]);
  const [selectedCouponIds, setSelectedCouponIds] = useState<string[]>([]);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [refsError, setRefsError] = useState('');

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login?redirect=/add-product');
      return;
    }
    let cancelled = false;

    (async () => {
      setLoadingRefs(true);
      setRefsError('');
      try {
        const [brandRows, categoryRows, attributeRows, sizeChartRows, couponRows, offerRows] = await Promise.all([
          catalogService.listBrands(),
          catalogService.listCategories(),
          attributeService.list().catch(() => [] as AttributeDefinition[]),
          catalogService.listSizeCharts().catch(() => [] as SizeChartOption[]),
          promoService.listCoupons().catch(() => [] as CouponOption[]),
          promoService.listOffers().catch(() => [] as OfferOption[]),
        ]);
        if (cancelled) return;
        setBrands(brandRows);
        setCategories(categoryRows);
        setAttributes(attributeRows);
        setSizeCharts(sizeChartRows);
        setCoupons(couponRows);
        setOffers(offerRows);
        // A product cannot be created without a real brand id, so preselect one.
        if (brandRows.length > 0) {
          setBrandId(brandRows[0].id);
          setBrandName(brandRows[0].name);
        }
      } catch (err) {
        if (!cancelled) setRefsError(getApiErrorMessage(err, 'Could not load brands and categories'));
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ── Colour helpers ─────────────────────────────────────────────────────────

  const addColorGroup = (presetName?: string, presetHex?: string) => {
    const cName = (presetName || newColorName).trim() || `Colour ${colorGroups.length + 1}`;
    if (colorGroups.some((g) => g.name.toLowerCase() === cName.toLowerCase())) {
      Alert.alert('Duplicate colour', `"${cName}" has already been added.`);
      return;
    }
    const group: ColorGroupDraft = {
      id: `col-${Date.now()}`,
      name: cName,
      hex: presetHex || newColorHex,
      images: [],
      sizes: STANDARD_SIZES.map((size) => ({ size, stock: 0, available: false })),
    };
    setColorGroups((prev) => [...prev, group]);
    setActiveColorId(group.id);
    setNewColorName('');
  };

  const removeColorGroup = (id: string) => {
    setColorGroups((prev) => prev.filter((g) => g.id !== id));
    if (activeColorId === id) setActiveColorId('');
  };

  const pickImages = async (groupId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach product images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const uris = result.assets.map((a) => a.uri);
    setColorGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, images: [...g.images, ...uris] } : g)),
    );
  };

  const takePhoto = async (groupId: string) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to photograph the product.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    setColorGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, images: [...g.images, result.assets[0].uri] } : g,
      ),
    );
  };

  /**
   * Fabric swatch photo — distinct from the gallery, used as that colour's
   * tab icon/thumbnail. Uploaded immediately (unlike gallery photos, which
   * are staged locally and only uploaded on submit) so the group can carry
   * a hosted URL straight away.
   */
  const pickSwatchPhoto = async (groupId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to attach a swatch photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;

    setSwatchUploading(groupId);
    try {
      const group = colorGroups.find((g) => g.id === groupId);
      const fileName = `${(group?.name || 'swatch').replace(/\s+/g, '-').toLowerCase()}-swatch.jpg`;
      const url = await catalogService.uploadImage(result.assets[0].uri, fileName);
      if (url) {
        setColorGroups((prev) =>
          prev.map((g) => (g.id === groupId ? { ...g, swatchUrl: url } : g)),
        );
      }
    } catch (err) {
      Alert.alert('Upload failed', getApiErrorMessage(err, 'Could not upload the swatch photo'));
    } finally {
      setSwatchUploading('');
    }
  };

  const removeSwatchPhoto = (groupId: string) => {
    setColorGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, swatchUrl: undefined } : g)),
    );
  };

  /** Move an image within its colour — position 0 is that colour's primary. */
  const moveImage = (groupId: string, index: number, direction: -1 | 1) => {
    setColorGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const target = index + direction;
        if (target < 0 || target >= g.images.length) return g;
        const images = [...g.images];
        [images[index], images[target]] = [images[target], images[index]];
        return { ...g, images };
      }),
    );
  };

  /** Promote an image to position 0, which is what makes it the primary. */
  const setPrimaryImage = (groupId: string, index: number) => {
    setColorGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId || index === 0) return g;
        const images = [...g.images];
        const [picked] = images.splice(index, 1);
        return { ...g, images: [picked, ...images] };
      }),
    );
  };

  const removeImage = (groupId: string, uri: string) => {
    setColorGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, images: g.images.filter((i) => i !== uri) } : g)),
    );
  };

  const toggleSize = (groupId: string, size: string) => {
    setColorGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              sizes: g.sizes.map((s) =>
                s.size === size
                  ? { ...s, available: !s.available, stock: !s.available && s.stock === 0 ? 10 : s.stock }
                  : s,
              ),
            }
          : g,
      ),
    );
  };

  const setSizeThreshold = (
    groupId: string,
    size: string,
    field: 'minStock' | 'reorderLevel',
    raw: string,
  ) => {
    const parsed = Math.max(0, parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0);
    setColorGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, sizes: g.sizes.map((s) => (s.size === size ? { ...s, [field]: parsed } : s)) }
          : g,
      ),
    );
  };

  /** Stock status shown next to each size, mirroring the web builder. */
  const stockStatus = (stock: number, minStock?: number) => {
    if (stock <= 0) return { label: 'OUT', color: '#b91c1c', bg: '#fef2f2' };
    if (minStock != null && minStock > 0 && stock <= minStock) {
      return { label: 'LOW', color: '#b45309', bg: '#fffbeb' };
    }
    return { label: 'IN STOCK', color: '#15803d', bg: '#f0fdf4' };
  };

  const setSizeStock = (groupId: string, size: string, raw: string) => {
    const parsed = Math.max(0, parseInt(raw.replace(/[^0-9]/g, ''), 10) || 0);
    setColorGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, sizes: g.sizes.map((s) => (s.size === size ? { ...s, stock: parsed } : s)) }
          : g,
      ),
    );
  };

  /** User-typed SKU override for one colour/size row; blank keeps backend auto-generation. */
  const setSizeSku = (groupId: string, size: string, raw: string) => {
    setColorGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, sizes: g.sizes.map((s) => (s.size === size ? { ...s, sku: raw } : s)) }
          : g,
      ),
    );
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const productAttributes = useMemo(
    () => attributes.filter((a) => a.slug !== 'color' && a.slug !== 'size'),
    [attributes],
  );

  const subCategories = useMemo(
    () => categories.filter((c) => c.parentId === categoryId),
    [categories, categoryId],
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

  const plannedVariants = useMemo(
    () =>
      colorGroups.flatMap((g) =>
        g.sizes.filter((s) => s.available).map((s) => ({ color: g.name, size: s.size, stock: s.stock })),
      ),
    [colorGroups],
  );

  const totalImages = useMemo(
    () => colorGroups.reduce((sum, g) => sum + g.images.length + (g.swatchUrl ? 1 : 0), 0),
    [colorGroups],
  );

  const activeGroup = colorGroups.find((g) => g.id === activeColorId) ?? colorGroups[0];

  /**
   * Same pre-publish rules as the web builder. Publishing is blocked while any
   * of these fail; saving an unpublished draft is always allowed.
   */
  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (name.trim().length < 3) issues.push('Product name is missing (minimum 3 characters).');
    if (!brandId) issues.push('No brand selected.');
    if (!categoryId) {
      issues.push('No category selected — the product will not appear on the storefront.');
    }

    const base = Number(basePrice) || 0;
    const sale = Number(salePrice) || 0;
    if (base <= 0) issues.push('MRP / base price must be greater than 0.');
    if (sale > 0 && sale > base) issues.push('Selling price is higher than the MRP.');

    if (colorGroups.length === 0) {
      issues.push('No colour added — barcodes are issued per colour and size.');
    }

    for (const group of colorGroups) {
      if (group.images.length === 0 && !group.swatchUrl) issues.push(`${group.name} has no photo.`);
      const available = group.sizes.filter((row) => row.available);
      if (available.length === 0) issues.push(`${group.name} has no size selected.`);
      for (const row of available) {
        if (row.stock <= 0) issues.push(`${group.name} / ${row.size} has no stock.`);
      }
    }

    for (const attribute of productAttributes) {
      if (attribute.isRequired && !(attributeValues[attribute.id] ?? '').trim()) {
        issues.push(`Required detail missing: ${attribute.name}.`);
      }
    }

    return issues;
  }, [
    name,
    brandId,
    categoryId,
    basePrice,
    salePrice,
    colorGroups,
    productAttributes,
    attributeValues,
  ]);

  const canPublish = validationIssues.length === 0;

  // ── Submit: the admin sequence, end to end ─────────────────────────────────

  const handleSubmit = async () => {
    if (isPublished && validationIssues.length > 0) {
      setError(validationIssues.join('\n'));
      Alert.alert(
        `Cannot publish — ${validationIssues.length} issue${validationIssues.length === 1 ? '' : 's'}`,
        `${validationIssues.slice(0, 6).join('\n')}\n\nTurn off "Publish immediately" to save as a draft.`,
      );
      return;
    }

    // A draft still needs enough to create the product row itself.
    if (name.trim().length < 3 || !brandId || Number(basePrice) <= 0) {
      const message = 'A name, brand and base price are required even for a draft.';
      setError(message);
      Alert.alert('Check the form', message);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      // 1. POST /products — categories travel with the create payload.
      const categoryIds = [categoryId, subCategoryId].filter(Boolean);
      setProgress('Creating product…');
      const created = await catalogService.createProduct({
        name: name.trim(),
        brandId,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        type,
        gender,
        ageGroup: 'ADULTS',
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : undefined,
        costPrice: costPrice ? Number(costPrice) : undefined,
        taxPercentage: taxPercentage ? Number(taxPercentage) : undefined,
        taxInclusive,
        seoTitle: seoTitle.trim() || undefined,
        seoDescription: seoDescription.trim() || undefined,
        seoKeywords: seoKeywords.trim() || undefined,
        hsnCode: hsnCode.trim() || undefined,
        status: 'ACTIVE',
        isPublished,
        isNewArrival,
        isLimitedStock,
        isFestivePick,
        isExclusive,
        isFeatured,
        isBestSeller,
        isTrending,
        channel,
        // CreateProductDto takes these directly; the API rejects unknown keys.
        ...(categoryIds.length > 0 ? { categoryIds } : {}),
        ...(tags.length > 0 ? { tags } : {}),
        ...(collections.length > 0 ? { collections } : {}),
        ...(occasion ? { occasion } : {}),
        ...(season.trim() ? { season: season.trim() } : {}),
        ...(sizeChartTemplateId ? { sizeChartTemplateId } : {}),
      });

      const productId: string = created?.id;
      if (!productId) throw new Error('The API did not return a product id.');

      // 2. POST /products/:id/attributes — dynamic registry values.
      const attributeEntries = Object.entries(attributeValues)
        .filter(([, value]) => value.trim() !== '')
        .map(([attributeId, value]) => ({ attributeId, value: value.trim() }));
      if (attributeEntries.length > 0) {
        setProgress('Saving attributes…');
        await catalogService.assignAttributes(productId, attributeEntries).catch(() => null);
      }

      // 3. POST /storage/upload -> POST /media, flattened across colour groups.
      // The swatch photo (already uploaded when picked) rides along as one
      // more media item per colour, ahead of the staged gallery photos.
      let displayOrder = 0;
      let primarySet = false;
      const mediaIdsByGroup: Record<string, string[]> = {};
      for (const group of colorGroups) {
        mediaIdsByGroup[group.id] = [];
        const groupImages = [group.swatchUrl, ...group.images].filter(Boolean) as string[];
        for (const img of groupImages) {
          setProgress(`Uploading image ${displayOrder + 1} of ${totalImages}…`);
          let url = img;
          if (img !== group.swatchUrl) {
            const fileName = `${group.name.replace(/\s+/g, '-').toLowerCase()}-${displayOrder}.jpg`;
            url = await catalogService.uploadImage(img, fileName);
            if (!url) continue;
          }
          const media = await catalogService.addMedia({
            productId,
            url,
            isPrimary: !primarySet,
            displayOrder: displayOrder++,
            color: group.name,
            ...(imageLabels[img] ? { title: imageLabels[img] } : {}),
          });
          if (media?.id) mediaIdsByGroup[group.id].push(media.id);
          primarySet = true;
        }
      }

      // 4 + 5. POST /variants then POST /inventory, per colour x size
      const createdVariants: CreatedVariant[] = [];
      const variantIdsByGroup: Record<string, string[]> = {};
      let variantIndex = 0;
      for (const group of colorGroups) {
        variantIdsByGroup[group.id] = [];
        for (const sizeRow of group.sizes) {
          if (!sizeRow.available) continue;
          variantIndex += 1;
          setProgress(
            `Creating variant ${variantIndex} of ${plannedVariants.length} — ${group.name} / ${sizeRow.size}`,
          );

          const variant = await catalogService.createVariant({
            productId,
            title: `${group.name} / ${sizeRow.size}`,
            sku: sizeRow.sku && sizeRow.sku.trim() ? sizeRow.sku.trim() : undefined,
            displayOrder: variantIndex - 1,
            isDefault: variantIndex === 1,
            costPrice: costPrice ? Number(costPrice) : undefined,
            attributeValues: buildVariantAttributes(attributes, group.name, sizeRow.size),
          });

          if (!variant?.id) continue;
          variantIdsByGroup[group.id].push(variant.id);

          if (sizeRow.stock > 0) {
            setProgress(`Adding stock for ${group.name} / ${sizeRow.size}…`);
            await inventoryService
              .stockIn(variant.id, sizeRow.stock, 'Opening stock from POS mobile', {
                ...(sizeRow.minStock ? { minimumStock: sizeRow.minStock } : {}),
                ...(sizeRow.reorderLevel ? { reorderLevel: sizeRow.reorderLevel } : {}),
              })
              .catch(() => null);
          }

          createdVariants.push({
            variantId: variant.id,
            sku: variant.sku,
            barcode: variant.barcode,
            title: variant.title ?? `${group.name} / ${sizeRow.size}`,
            color: group.name,
            size: sizeRow.size,
            stock: sizeRow.stock,
            price: salePrice ? Number(salePrice) : Number(basePrice),
          });
        }
      }

      if (createdVariants.length === 0) {
        throw new Error('The product was created but no variants were issued, so there is nothing to label.');
      }

      // 6. POST /products/:id/color-groups/sync — bind each colour's variants
      // and media to its colour attribute option, so the storefront can group
      // images and sizes by colour (mirrors the web ProductBuilder).
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
        setProgress('Grouping colours…');
        await catalogService.syncColorGroups(productId, { colorGroups: syncPayload }).catch(() => null);
      }

      // 7. Attach/detach the coupons and offers picked in the Pricing step.
      setProgress('Attaching coupons & offers…');
      for (const coupon of coupons) {
        const diff = diffProductAttachment(coupon, productId, selectedCouponIds.includes(coupon.id));
        if (diff) await promoService.updateCoupon(coupon.id, diff).catch(() => null);
      }
      for (const offer of offers) {
        const diff = diffProductAttachment(offer, productId, selectedOfferIds.includes(offer.id));
        if (diff) await promoService.updateOffer(offer.id, diff).catch(() => null);
      }

      // 8. Hand the issued barcodes to the label screen.
      setLastCreatedProduct({
        productId,
        name: name.trim(),
        brandName,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : undefined,
        variants: createdVariants,
      });

      setProgress('');
      router.push('/label-preview');
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not create the product');
      setError(message);
      Alert.alert('Creation failed', message);
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  // ── Navigation between steps ───────────────────────────────────────────────

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].key);
  };
  const goBack = () => {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key);
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(pickerQuery.toLowerCase()),
  );
  const filteredCategories = categories
    .filter((c) => !c.parentId)
    .filter((c) => c.name.toLowerCase().includes(pickerQuery.toLowerCase()));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Step rail — the admin builder's five tabs */}
      <View style={styles.stepRail}>
        {STEPS.map((s, idx) => {
          const active = s.key === step;
          const done = idx < stepIndex;
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.stepChip, active && styles.stepChipActive]}
              onPress={() => setStep(s.key)}
            >
              <s.Icon size={14} color={active ? '#ffffff' : done ? '#0284c7' : '#9ca3af'} />
              <Text
                style={[
                  styles.stepChipText,
                  active && styles.stepChipTextActive,
                  done && !active && styles.stepChipTextDone,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {refsError !== '' && (
        <View style={styles.warnBar}>
          <AlertCircle size={14} color="#b45309" style={{ marginRight: 6 }} />
          <Text style={styles.warnText}>{refsError}</Text>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── STEP 1: BASIC ── */}
        {step === 'basic' && (
          <View>
            <Text style={styles.sectionTitle}>Product details</Text>

            <Text style={styles.label}>Product name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Banarasi Silk Kurta Set"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Brand *</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => {
                setPickerQuery('');
                setShowBrandModal(true);
              }}
            >
              {loadingRefs ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <Text style={[styles.selectText, !brandName && styles.selectPlaceholder]}>
                  {brandName || 'Select a brand'}
                </Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => {
                setPickerQuery('');
                setShowCategoryModal(true);
              }}
            >
              <Text style={[styles.selectText, !categoryName && styles.selectPlaceholder]}>
                {categoryName || 'Select a category (optional)'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Product type</Text>
            <View style={styles.pillRow}>
              {[
                { value: 'READYMADE', label: 'READYMADE' },
                { value: 'UNSTITCHED', label: 'UNSTITCHED' },
                { value: 'CUSTOM', label: 'Custom Tailored' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.pill, type === t.value && styles.pillActive]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={[styles.pillText, type === t.value && styles.pillTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Gender target</Text>
            <View style={styles.pillRow}>
              {[
                { value: 'WOMEN', label: 'Women' },
                { value: 'GIRLS', label: 'Girls' },
                { value: 'UNISEX', label: 'Unisex' },
              ].map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.pill, gender === g.value && styles.pillActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Text style={[styles.pillText, gender === g.value && styles.pillTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Short description</Text>
            <TextInput
              style={styles.input}
              value={shortDescription}
              onChangeText={setShortDescription}
              placeholder="One line shown on the product card"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Full description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Fabric, work, care instructions…"
              placeholderTextColor="#9ca3af"
              multiline
            />

            <Text style={styles.label}>Season / Collection</Text>
            <TextInput
              style={styles.input}
              value={season}
              onChangeText={setSeason}
              placeholder="e.g. Festive 2026, Summer Silk"
              placeholderTextColor="#9ca3af"
            />
          </View>
        )}

        {/* ── STEP 2: PRICING ── */}
        {/* ── STEP 2: ORGANISATION ── */}
        {step === 'organisation' && (
          <View>
            <Text style={styles.sectionTitle}>Category &amp; organisation</Text>
            <Text style={styles.helpText}>
              A product with no category cannot be browsed on the storefront.
            </Text>

            <Text style={styles.label}>Primary category *</Text>
            <TouchableOpacity
              style={styles.select}
              onPress={() => {
                setPickerQuery('');
                setShowCategoryModal(true);
              }}
            >
              <Text style={[styles.selectText, !categoryName && styles.selectPlaceholder]}>
                {categoryName || 'Select a category'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Sub category</Text>
            <TouchableOpacity
              style={[styles.select, subCategories.length === 0 && styles.selectDisabled]}
              disabled={subCategories.length === 0}
              onPress={() => {
                setPickerQuery('');
                setShowSubCategoryModal(true);
              }}
            >
              <Text style={[styles.selectText, !subCategoryName && styles.selectPlaceholder]}>
                {subCategoryName ||
                  (!categoryId
                    ? 'Select a primary category first'
                    : subCategories.length === 0
                      ? 'No sub-categories'
                      : 'Optional')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Occasion</Text>
            <View style={styles.pillRow}>
              {['Festive', 'Wedding', 'Party', 'Casual', 'Office'].map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[styles.pill, occasion === o && styles.pillActive]}
                  onPress={() => setOccasion(occasion === o ? '' : o)}
                >
                  <Text style={[styles.pillText, occasion === o && styles.pillTextActive]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tags</Text>
            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                placeholder="e.g. Floral, Rayon"
                placeholderTextColor="#9ca3af"
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addTag}>
                <Plus size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagWrap}>
              {tags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.tagChip}
                  onPress={() => setTags((prev) => prev.filter((t) => t !== tag))}
                >
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <X size={12} color="#6b7280" />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Collections</Text>
            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                value={collectionInput}
                onChangeText={setCollectionInput}
                onSubmitEditing={addCollection}
                placeholder="e.g. Festive Collection"
                placeholderTextColor="#9ca3af"
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addBtn} onPress={addCollection}>
                <Plus size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.tagWrap}>
              {collections.map((collection) => (
                <TouchableOpacity
                  key={collection}
                  style={styles.tagChip}
                  onPress={() => setCollections((prev) => prev.filter((c) => c !== collection))}
                >
                  <Text style={styles.tagChipText}>{collection}</Text>
                  <X size={12} color="#6b7280" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 'pricing' && (
          <View>
            <Text style={styles.sectionTitle}>Pricing</Text>

            <Text style={styles.label}>MRP / base price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={basePrice}
              onChangeText={setBasePrice}
              placeholder="1499"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Sale price (₹)</Text>
            <TextInput
              style={styles.input}
              value={salePrice}
              onChangeText={setSalePrice}
              placeholder="Leave blank if not on offer"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Cost price (₹)</Text>
            <TextInput
              style={styles.input}
              value={costPrice}
              onChangeText={setCostPrice}
              placeholder="Internal purchase cost"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />

            <Text style={styles.label}>GST %</Text>
            <View style={styles.pillRow}>
              {['0', '3', '5', '12', '18', '28'].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.pill, taxPercentage === rate && styles.pillActive]}
                  onPress={() => setTaxPercentage(rate)}
                >
                  <Text style={[styles.pillText, taxPercentage === rate && styles.pillTextActive]}>
                    {rate}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>HSN code</Text>
            <TextInput
              style={styles.input}
              value={hsnCode}
              onChangeText={setHsnCode}
              placeholder="e.g. 6204 — printed on GST invoices"
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Price includes tax</Text>
              <Switch
                value={taxInclusive}
                onValueChange={setTaxInclusive}
                trackColor={{ true: '#0284c7', false: '#d1d5db' }}
              />
            </View>

            {basePrice !== '' && salePrice !== '' && Number(salePrice) < Number(basePrice) && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Customer saves ₹{Number(basePrice) - Number(salePrice)} (
                  {Math.round(((Number(basePrice) - Number(salePrice)) / Number(basePrice)) * 100)}% off)
                </Text>
              </View>
            )}

            {/* ── Coupons & Offers ── */}
            <View style={styles.promoSection}>
              <Text style={styles.sectionTitle}>Coupons &amp; Offers</Text>
              <Text style={styles.promoExplainer}>
                Attach coupons or offers that already exist to this product — this screen can't
                create new ones.
              </Text>

              <Text style={styles.label}>Coupons</Text>
              {coupons.length === 0 ? (
                <Text style={styles.emptyHint}>No coupons created yet</Text>
              ) : (
                <ScrollView
                  style={styles.promoList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {coupons.map((c) => {
                    const attachable = isProductAttachable(c.applicableTo);
                    const checked = selectedCouponIds.includes(c.id);
                    const valueLabel =
                      c.type === 'PERCENTAGE'
                        ? `${c.value}% off`
                        : c.type === 'FLAT'
                          ? `₹${c.value} off`
                          : 'Free shipping';
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.promoRow}
                        disabled={!attachable}
                        onPress={() =>
                          setSelectedCouponIds((prev) =>
                            prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                          )
                        }
                      >
                        <View
                          style={[
                            styles.promoCheckbox,
                            checked && styles.promoCheckboxChecked,
                            !attachable && styles.promoCheckboxDisabled,
                          ]}
                        >
                          {checked && <Check size={12} color="#ffffff" />}
                        </View>
                        <View style={[styles.promoRowBody, !attachable && styles.promoRowBodyDisabled]}>
                          <Text style={styles.promoCode}>{c.code}</Text>
                          <Text style={styles.promoMeta}>{valueLabel}</Text>
                          {!attachable && (
                            <Text style={styles.promoWarnNote}>
                              Already scoped to {c.applicableTo?.toLowerCase()} elsewhere — can't attach
                              here.
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <Text style={styles.label}>Offers</Text>
              {offers.length === 0 ? (
                <Text style={styles.emptyHint}>No offers created yet</Text>
              ) : (
                <ScrollView
                  style={styles.promoList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {offers.map((o) => {
                    const attachable = isProductAttachable(o.applicableTo);
                    const checked = selectedOfferIds.includes(o.id);
                    const valueLabel = `${o.value}% off`;
                    return (
                      <TouchableOpacity
                        key={o.id}
                        style={styles.promoRow}
                        disabled={!attachable}
                        onPress={() =>
                          setSelectedOfferIds((prev) =>
                            prev.includes(o.id) ? prev.filter((id) => id !== o.id) : [...prev, o.id],
                          )
                        }
                      >
                        <View
                          style={[
                            styles.promoCheckbox,
                            checked && styles.promoCheckboxChecked,
                            !attachable && styles.promoCheckboxDisabled,
                          ]}
                        >
                          {checked && <Check size={12} color="#ffffff" />}
                        </View>
                        <View style={[styles.promoRowBody, !attachable && styles.promoRowBodyDisabled]}>
                          <Text style={styles.promoCode}>{o.name}</Text>
                          <Text style={styles.promoMeta}>{valueLabel}</Text>
                          {!attachable && (
                            <Text style={styles.promoWarnNote}>
                              Already scoped to {o.applicableTo?.toLowerCase()} elsewhere — can't attach
                              here.
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {(selectedCouponIds.length > 0 || selectedOfferIds.length > 0) &&
                (() => {
                  const referencePrice = Number(salePrice) || Number(basePrice) || 0;
                  const couponPreviews = selectedCouponIds
                    .map((id) => coupons.find((c) => c.id === id))
                    .filter((c): c is CouponOption => Boolean(c))
                    .map((c) => ({
                      label: c.code,
                      ...computePromoPreview(c.type, Number(c.value), c.minOrderAmount, c.maxDiscountAmount, referencePrice),
                    }));
                  const offerPreviews = selectedOfferIds
                    .map((id) => offers.find((o) => o.id === id))
                    .filter((o): o is OfferOption => Boolean(o))
                    .map((o) => ({
                      label: o.name,
                      ...computePromoPreview(o.type, Number(o.value), o.minOrderAmount, o.maxDiscountAmount, referencePrice),
                    }));
                  const previews = [...couponPreviews, ...offerPreviews];
                  return (
                    <View style={styles.promoPreviewBox}>
                      <Text style={styles.promoPreviewTitle}>Preview at ₹{referencePrice}</Text>
                      {previews.map((p, idx) => (
                        <View key={`${p.label}-${idx}`} style={styles.promoPreviewRow}>
                          <View style={styles.promoPreviewRowHead}>
                            <Text style={styles.promoPreviewLabel}>{p.label}</Text>
                            <Text style={styles.promoPreviewPrice}>₹{p.finalPrice.toFixed(2)}</Text>
                          </View>
                          {p.note && <Text style={styles.promoPreviewNote}>{p.note}</Text>}
                        </View>
                      ))}
                      <Text style={styles.promoCaption}>
                        Only the single best discount applies at checkout — a coupon and an offer
                        never stack.
                      </Text>
                    </View>
                  );
                })()}
            </View>
          </View>
        )}

        {/* ── STEP 3: COLOURS ── */}
        {step === 'colors' && (
          <View>
            <Text style={styles.sectionTitle}>Colours &amp; photos</Text>

            <View style={styles.presetWrap}>
              {COLOR_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  style={styles.presetChip}
                  onPress={() => addColorGroup(p.name, p.hex)}
                >
                  <View style={[styles.swatch, { backgroundColor: p.hex }]} />
                  <Text style={styles.presetText}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                value={newColorName}
                onChangeText={setNewColorName}
                placeholder="Custom colour name"
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity style={styles.addBtn} onPress={() => addColorGroup()}>
                <Plus size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {colorGroups.length === 0 && (
              <Text style={styles.emptyHint}>
                Add at least one colour. Each colour × size becomes a variant with its own barcode.
              </Text>
            )}

            {colorGroups.length > 0 && (
              <>
                <View style={styles.colorTabRow}>
                  {colorGroups.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.colorTab, activeGroup?.id === g.id && styles.colorTabActive]}
                      onPress={() => setActiveColorId(g.id)}
                    >
                      <View style={[styles.swatch, { backgroundColor: g.hex }]} />
                      <Text style={styles.colorTabText}>{g.name}</Text>
                      <TouchableOpacity onPress={() => removeColorGroup(g.id)} hitSlop={8}>
                        <Trash2 size={13} color="#b91c1c" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>

                {activeGroup && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>{activeGroup.name} — photos</Text>
                    <View style={styles.inlineRow}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => takePhoto(activeGroup.id)}
                      >
                        <ImageIcon size={15} color="#0284c7" style={{ marginRight: 6 }} />
                        <Text style={styles.secondaryBtnText}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => pickImages(activeGroup.id)}
                      >
                        <Plus size={15} color="#0284c7" style={{ marginRight: 6 }} />
                        <Text style={styles.secondaryBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Swatch photo</Text>
                    <Text style={styles.helpText}>
                      A close-up fabric swatch used as this colour&rsquo;s tab thumbnail — optional.
                    </Text>
                    <View style={styles.inlineRow}>
                      <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={() => pickSwatchPhoto(activeGroup.id)}
                        disabled={swatchUploading === activeGroup.id}
                      >
                        {swatchUploading === activeGroup.id ? (
                          <ActivityIndicator size="small" color="#0284c7" style={{ marginRight: 6 }} />
                        ) : (
                          <ImageIcon size={15} color="#0284c7" style={{ marginRight: 6 }} />
                        )}
                        <Text style={styles.secondaryBtnText}>
                          {activeGroup.swatchUrl ? 'Change swatch' : 'Upload swatch'}
                        </Text>
                      </TouchableOpacity>
                      {activeGroup.swatchUrl && (
                        <View style={styles.swatchPreviewWrap}>
                          <Image source={{ uri: activeGroup.swatchUrl }} style={styles.swatchPreview} />
                          <TouchableOpacity
                            style={styles.thumbRemove}
                            onPress={() => removeSwatchPhoto(activeGroup.id)}
                          >
                            <X size={12} color="#ffffff" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                      {activeGroup.images.map((uri, index) => (
                        <View key={uri} style={styles.thumbWrap}>
                          <Image source={{ uri }} style={styles.thumb} />
                          <TouchableOpacity
                            style={styles.thumbRemove}
                            onPress={() => removeImage(activeGroup.id, uri)}
                          >
                            <X size={12} color="#ffffff" />
                          </TouchableOpacity>

                          {index === 0 ? (
                            <View style={styles.primaryTag}>
                              <Text style={styles.primaryTagText}>PRIMARY</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={styles.setPrimaryBtn}
                              onPress={() => setPrimaryImage(activeGroup.id, index)}
                            >
                              <Text style={styles.setPrimaryText}>SET PRIMARY</Text>
                            </TouchableOpacity>
                          )}

                          <View style={styles.reorderRow}>
                            <TouchableOpacity
                              style={styles.reorderBtn}
                              disabled={index === 0}
                              onPress={() => moveImage(activeGroup.id, index, -1)}
                            >
                              <ArrowLeft size={11} color={index === 0 ? '#d1d5db' : '#374151'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.reorderBtn}
                              disabled={index === activeGroup.images.length - 1}
                              onPress={() => moveImage(activeGroup.id, index, 1)}
                            >
                              <ArrowRight
                                size={11}
                                color={
                                  index === activeGroup.images.length - 1 ? '#d1d5db' : '#374151'
                                }
                              />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.shotTypeBtn}
                            onPress={() => {
                              const current = imageLabels[uri] ?? '';
                              const next =
                                IMAGE_TYPES[(IMAGE_TYPES.indexOf(current) + 1) % (IMAGE_TYPES.length + 1)] ??
                                '';
                              setImageLabels((prev) => ({ ...prev, [uri]: next }));
                            }}
                          >
                            <Text style={styles.shotTypeText}>{imageLabels[uri] || 'Type…'}</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      {activeGroup.images.length === 0 && (
                        <Text style={styles.emptyHint}>No photos yet for this colour.</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── STEP 4: SIZES ── */}
        {step === 'sizes' && (
          <View>
            <Text style={styles.sectionTitle}>Sizes &amp; opening stock</Text>

            <Text style={styles.label}>Size chart</Text>
            <Text style={styles.helpText}>
              Measurements are defined once per garment shape in the admin panel and reused here.
            </Text>
            {sizeCharts.length === 0 ? (
              <Text style={styles.emptyHint}>
                No size charts yet. Create them under Catalog → Size Charts.
              </Text>
            ) : (
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[styles.pill, !sizeChartTemplateId && styles.pillActive]}
                  onPress={() => setSizeChartTemplateId('')}
                >
                  <Text style={[styles.pillText, !sizeChartTemplateId && styles.pillTextActive]}>
                    None
                  </Text>
                </TouchableOpacity>
                {sizeCharts.map((chart) => {
                  const selected = sizeChartTemplateId === chart.id;
                  return (
                    <TouchableOpacity
                      key={chart.id}
                      style={[styles.pill, selected && styles.pillActive]}
                      onPress={() => setSizeChartTemplateId(chart.id)}
                    >
                      <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                        {chart.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {(() => {
              const selectedChart = sizeCharts.find((c) => c.id === sizeChartTemplateId);
              if (!selectedChart || selectedChart.rows.length === 0) return null;
              const measurementKeys = Array.from(
                new Set(selectedChart.rows.flatMap((row) => Object.keys(row.measurements))),
              );
              return (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {selectedChart.name} measurements ({selectedChart.unit})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                    <View>
                      <View style={styles.chartRow}>
                        <Text style={[styles.chartCell, styles.chartSizeCell, styles.chartHeaderCell]}>
                          SIZE
                        </Text>
                        {measurementKeys.map((key) => (
                          <Text key={key} style={[styles.chartCell, styles.chartHeaderCell]}>
                            {key.toUpperCase()}
                          </Text>
                        ))}
                      </View>
                      {selectedChart.rows.map((row) => (
                        <View key={row.size} style={styles.chartRow}>
                          <Text style={[styles.chartCell, styles.chartSizeCell]}>{row.size}</Text>
                          {measurementKeys.map((key) => (
                            <Text key={key} style={styles.chartCell}>
                              {row.measurements[key] != null ? String(row.measurements[key]) : '—'}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              );
            })()}

            {colorGroups.length === 0 ? (
              <Text style={styles.emptyHint}>Add a colour first — sizes hang off each colour.</Text>
            ) : (
              colorGroups.map((group) => (
                <View key={group.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.swatch, { backgroundColor: group.hex }]} />
                    <Text style={styles.cardTitle}>{group.name}</Text>
                  </View>
                  <View style={styles.sizeHeaderRow}>
                    <Text style={styles.sizeHeaderCell}>SIZE</Text>
                    <Text style={styles.sizeHeaderCell}>STOCK</Text>
                    <Text style={styles.sizeHeaderCellSmall}>MIN</Text>
                    <Text style={styles.sizeHeaderCellSmall}>REORDER</Text>
                  </View>
                  {group.sizes.map((row) => (
                    <View key={row.size} style={styles.sizeRow}>
                      <TouchableOpacity
                        style={[styles.sizeToggle, row.available && styles.sizeToggleActive]}
                        onPress={() => toggleSize(group.id, row.size)}
                      >
                        {row.available && <Check size={13} color="#ffffff" />}
                        <Text
                          style={[styles.sizeToggleText, row.available && styles.sizeToggleTextActive]}
                        >
                          {row.size}
                        </Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.stockInput, !row.available && styles.stockInputDisabled]}
                        value={String(row.stock)}
                        onChangeText={(t) => setSizeStock(group.id, row.size, t)}
                        keyboardType="numeric"
                        editable={row.available}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                      />
                      <TextInput
                        style={[styles.thresholdInput, !row.available && styles.stockInputDisabled]}
                        value={row.minStock ? String(row.minStock) : ''}
                        onChangeText={(t) => setSizeThreshold(group.id, row.size, 'minStock', t)}
                        keyboardType="numeric"
                        editable={row.available}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                      />
                      <TextInput
                        style={[styles.thresholdInput, !row.available && styles.stockInputDisabled]}
                        value={row.reorderLevel ? String(row.reorderLevel) : ''}
                        onChangeText={(t) => setSizeThreshold(group.id, row.size, 'reorderLevel', t)}
                        keyboardType="numeric"
                        editable={row.available}
                        placeholder="0"
                        placeholderTextColor="#9ca3af"
                      />
                      {row.available &&
                        (() => {
                          const status = stockStatus(row.stock, row.minStock);
                          return (
                            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                              <Text style={[styles.statusPillText, { color: status.color }]}>
                                {status.label}
                              </Text>
                            </View>
                          );
                        })()}
                    </View>
                  ))}
                  <View style={styles.skuGroup}>
                    {group.sizes
                      .filter((row) => row.available)
                      .map((row) => (
                        <View key={`${row.size}-sku`} style={styles.skuRow}>
                          <Text style={styles.skuLabel}>{row.size} SKU</Text>
                          <TextInput
                            style={styles.skuInput}
                            value={row.sku ?? ''}
                            onChangeText={(t) => setSizeSku(group.id, row.size, t)}
                            placeholder="Auto-generated if blank"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="characters"
                          />
                        </View>
                      ))}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── STEP 6: ATTRIBUTES ── */}
        {step === 'attributes' && (
          <View>
            <Text style={styles.sectionTitle}>Product details</Text>
            <Text style={styles.helpText}>
              Fabric, pattern, neck and the rest — these drive the storefront filters.
            </Text>

            {productAttributes.length === 0 ? (
              <Text style={styles.emptyHint}>
                No attributes defined yet. Add them under Catalog → Attributes in the admin panel.
              </Text>
            ) : (
              productAttributes.map((attribute) => {
                const value = attributeValues[attribute.id] ?? '';
                const hasOptions = attribute.options.length > 0;
                return (
                  <View key={attribute.id}>
                    <Text style={styles.label}>
                      {attribute.name}
                      {attribute.isRequired ? ' *' : ''}
                    </Text>

                    {hasOptions ? (
                      <View style={styles.pillRow}>
                        {attribute.options.map((option) => {
                          const selected = value === option.value;
                          return (
                            <TouchableOpacity
                              key={option.id}
                              style={[styles.pill, selected && styles.pillActive]}
                              onPress={() =>
                                setAttributeValues((prev) => ({
                                  ...prev,
                                  [attribute.id]: selected ? '' : option.value,
                                }))
                              }
                            >
                              <Text style={[styles.pillText, selected && styles.pillTextActive]}>
                                {option.label || option.value}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={(text) =>
                          setAttributeValues((prev) => ({ ...prev, [attribute.id]: text }))
                        }
                        placeholder={`e.g. ${attribute.name}`}
                        placeholderTextColor="#9ca3af"
                      />
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── STEP 5: REVIEW ── */}
        {step === 'seo' && (
          <View>
            <Text style={styles.sectionTitle}>SEO &amp; review</Text>

            <Text style={styles.label}>SEO title</Text>
            <TextInput
              style={styles.input}
              value={seoTitle}
              onChangeText={setSeoTitle}
              placeholder={name || 'Shown in search results'}
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>SEO description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={seoDescription}
              onChangeText={setSeoDescription}
              placeholder="Short summary for search engines"
              placeholderTextColor="#9ca3af"
              multiline
            />

            <Text style={styles.label}>SEO keywords</Text>
            <TextInput
              style={styles.input}
              value={seoKeywords}
              onChangeText={setSeoKeywords}
              placeholder="anarkali, kurta set, ethnic wear"
              placeholderTextColor="#9ca3af"
            />

            <Text style={styles.label}>Badges</Text>
            <View style={styles.pillRow}>
              {([
                ['New Arrival', isNewArrival, setIsNewArrival],
                ['Limited Stock', isLimitedStock, setIsLimitedStock],
                ['Festive Pick', isFestivePick, setIsFestivePick],
                ['Exclusive', isExclusive, setIsExclusive],
                ['Featured', isFeatured, setIsFeatured],
                ['Best Seller', isBestSeller, setIsBestSeller],
                ['Trending', isTrending, setIsTrending],
              ] as [string, boolean, (v: boolean) => void][]).map(([label, value, setValue]) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.pill, value && styles.pillActive]}
                  onPress={() => setValue(!value)}
                >
                  <Text style={[styles.pillText, value && styles.pillTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Publish immediately</Text>
              <Switch
                value={isPublished}
                onValueChange={setIsPublished}
                trackColor={{ true: '#0284c7', false: '#d1d5db' }}
              />
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>What will be created</Text>
              <SummaryRow label="Product" value={name || '—'} />
              <SummaryRow label="Brand" value={brandName || '—'} />
              <SummaryRow label="Category" value={categoryName || 'Not assigned'} />
              <SummaryRow label="Sub category" value={subCategoryName || '—'} />
              <SummaryRow label="Occasion" value={occasion || '—'} />
              <SummaryRow label="Tags" value={tags.length > 0 ? tags.join(', ') : '—'} />
              <SummaryRow
                label="Size chart"
                value={sizeCharts.find((c) => c.id === sizeChartTemplateId)?.name || 'None'}
              />
              <SummaryRow label="Price" value={basePrice ? `₹${basePrice}` : '—'} />
              <SummaryRow label="Photos to upload" value={String(totalImages)} />
              <SummaryRow
                label="Variants (barcodes)"
                value={String(plannedVariants.length)}
                emphasis
              />
              <SummaryRow
                label="Total opening stock"
                value={String(plannedVariants.reduce((sum, v) => sum + v.stock, 0))}
              />
            </View>

          </View>
        )}

        {/* ── STEP 6: WHERE TO SELL ── the last decision before Save, since Save
            is what creates the product and issues its barcodes (hands off to
            /label-preview). Stock is one shared pool either way. */}
        {step === 'channel' && (
          <View>
            <Text style={styles.sectionTitle}>Where should this product be sold?</Text>
            <Text style={styles.helperText}>
              Stock stays the same either way — this only controls where the product is offered for sale.
            </Text>

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
              const selected = channel === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.channelCard, selected && styles.channelCardActive]}
                  onPress={() => setChannel(value)}
                  activeOpacity={0.85}
                >
                  <Icon size={20} color={selected ? '#0284c7' : '#9ca3af'} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.channelCardTitle, selected && styles.channelCardTitleActive]}>
                      {label}
                    </Text>
                    <Text style={styles.channelCardDesc}>{desc}</Text>
                  </View>
                  {selected && <Check size={18} color="#0284c7" />}
                </TouchableOpacity>
              );
            })}

            {validationIssues.length > 0 ? (
              <View style={styles.warnPanel}>
                <View style={styles.warnHeader}>
                  <AlertCircle size={15} color="#b45309" style={{ marginRight: 8 }} />
                  <Text style={styles.warnTitle}>
                    Cannot publish — {validationIssues.length} issue
                    {validationIssues.length === 1 ? '' : 's'}
                  </Text>
                </View>
                {validationIssues.map((issue) => (
                  <Text key={issue} style={styles.warnItem}>
                    ✕ {issue}
                  </Text>
                ))}
                <Text style={styles.warnFooter}>
                  Turn off &ldquo;Publish immediately&rdquo; on the Review step to save as a draft.
                </Text>
              </View>
            ) : (
              <View style={styles.okPanel}>
                <Check size={15} color="#15803d" style={{ marginRight: 8 }} />
                <Text style={styles.okText}>All checks passed — ready to publish.</Text>
              </View>
            )}

            {error !== '' && validationIssues.length === 0 && (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#b91c1c" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator color="#ffffff" style={{ marginRight: 10 }} />
                  <Text style={styles.primaryBtnText}>{progress || 'Working…'}</Text>
                </>
              ) : (
                <>
                  <Check size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>
                    {isPublished ? 'CREATE & GENERATE BARCODES' : 'SAVE AS DRAFT'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Step navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, stepIndex === 0 && styles.navBtnDisabled]}
          onPress={goBack}
          disabled={stepIndex === 0}
        >
          <ArrowLeft size={16} color={stepIndex === 0 ? '#9ca3af' : '#374151'} />
          <Text style={[styles.navBtnText, stepIndex === 0 && styles.navBtnTextDisabled]}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.footerCount}>
          {plannedVariants.length} variant{plannedVariants.length === 1 ? '' : 's'}
        </Text>

        <TouchableOpacity
          style={[styles.navBtn, stepIndex === STEPS.length - 1 && styles.navBtnDisabled]}
          onPress={goNext}
          disabled={stepIndex === STEPS.length - 1}
        >
          <Text
            style={[
              styles.navBtnText,
              stepIndex === STEPS.length - 1 && styles.navBtnTextDisabled,
            ]}
          >
            Next
          </Text>
          <ArrowRight size={16} color={stepIndex === STEPS.length - 1 ? '#9ca3af' : '#374151'} />
        </TouchableOpacity>
      </View>

      {/* Brand picker */}
      <PickerModal
        visible={showBrandModal}
        title="Select brand"
        query={pickerQuery}
        onQueryChange={setPickerQuery}
        rows={filteredBrands}
        selectedId={brandId}
        emptyText="No brands found. Create one in the admin panel first."
        onSelect={(row) => {
          setBrandId(row.id);
          setBrandName(row.name);
          setShowBrandModal(false);
        }}
        onClose={() => setShowBrandModal(false)}
      />

      {/* Category picker */}
      <PickerModal
        visible={showCategoryModal}
        title="Select category"
        query={pickerQuery}
        onQueryChange={setPickerQuery}
        rows={filteredCategories}
        selectedId={categoryId}
        emptyText="No categories found."
        onSelect={(row) => {
          setCategoryId(row.id);
          setCategoryName(row.name);
          setSubCategoryId('');
          setSubCategoryName('');
          setShowCategoryModal(false);
        }}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Sub-category picker */}
      <PickerModal
        visible={showSubCategoryModal}
        title="Select sub category"
        query={pickerQuery}
        onQueryChange={setPickerQuery}
        rows={subCategories.filter((c) =>
          c.name.toLowerCase().includes(pickerQuery.toLowerCase()),
        )}
        selectedId={subCategoryId}
        emptyText="This category has no sub-categories."
        onSelect={(row) => {
          setSubCategoryId(row.id);
          setSubCategoryName(row.name);
          setShowSubCategoryModal(false);
        }}
        onClose={() => setShowSubCategoryModal(false)}
      />
    </View>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, emphasis && styles.summaryValueEmphasis]}>{value}</Text>
    </View>
  );
}

function PickerModal({
  visible,
  title,
  query,
  onQueryChange,
  rows,
  selectedId,
  emptyText,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  query: string;
  onQueryChange: (q: string) => void;
  rows: { id: string; name: string }[];
  selectedId: string;
  emptyText: string;
  onSelect: (row: { id: string; name: string }) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={onQueryChange}
              placeholder="Search…"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
            {rows.map((row) => (
              <TouchableOpacity
                key={row.id}
                style={[styles.pickerItem, selectedId === row.id && styles.pickerItemActive]}
                onPress={() => onSelect(row)}
              >
                <Text style={styles.pickerItemText}>{row.name}</Text>
                {selectedId === row.id && <Check size={18} color="#0284c7" />}
              </TouchableOpacity>
            ))}
            {rows.length === 0 && <Text style={styles.emptyHint}>{emptyText}</Text>}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },

  stepRail: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 6,
  },
  stepChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    gap: 4,
  },
  stepChipActive: { backgroundColor: '#0284c7' },
  stepChipText: { fontSize: 10, fontWeight: '700', color: '#9ca3af' },
  stepChipTextActive: { color: '#ffffff' },
  stepChipTextDone: { color: '#0284c7' },

  warnBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  warnText: { flex: 1, fontSize: 11, color: '#b45309' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1f2937', marginBottom: 6 },
  helperText: { fontSize: 12, color: '#6b7280', marginBottom: 16, lineHeight: 17 },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  channelCardActive: { borderColor: '#0284c7', backgroundColor: '#fdf2f4' },
  channelCardTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  channelCardTitleActive: { color: '#0284c7' },
  channelCardDesc: { fontSize: 11, color: '#6b7280', marginTop: 2, lineHeight: 15 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  textArea: { height: 96, textAlignVertical: 'top' },
  select: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  selectText: { fontSize: 15, color: '#111827' },
  selectPlaceholder: { color: '#9ca3af' },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  pillActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  pillText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  pillTextActive: { color: '#ffffff' },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 14, color: '#374151', fontWeight: '600' },

  infoBox: {
    marginTop: 18,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
  },
  infoText: { color: '#15803d', fontSize: 13, fontWeight: '600' },

  promoSection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  promoExplainer: { fontSize: 12, color: '#64748b', lineHeight: 17, marginBottom: 4 },
  promoList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  promoCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  promoCheckboxChecked: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  promoCheckboxDisabled: { borderColor: '#e5e7eb', backgroundColor: '#f3f4f6' },
  promoRowBody: { flex: 1 },
  promoRowBodyDisabled: { opacity: 0.5 },
  promoCode: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  promoMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  promoWarnNote: { fontSize: 10, color: '#b45309', marginTop: 3, lineHeight: 14 },

  promoPreviewBox: {
    marginTop: 16,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 12,
  },
  promoPreviewTitle: { fontSize: 11, fontWeight: '700', color: '#0284c7', marginBottom: 8 },
  promoPreviewRow: { marginTop: 6 },
  promoPreviewRowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoPreviewLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
  promoPreviewPrice: { fontSize: 12, fontWeight: '700', color: '#15803d' },
  promoPreviewNote: { fontSize: 10, color: '#92400e', marginTop: 2, lineHeight: 14 },
  promoCaption: { fontSize: 10, color: '#64748b', marginTop: 10, lineHeight: 14 },

  presetWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  presetText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  swatch: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#e5e7eb' },

  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  colorTabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  colorTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  colorTabActive: { borderColor: '#0284c7', backgroundColor: '#e0f2fe' },
  colorTabText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#e0f2fe',
  },
  secondaryBtnText: { fontSize: 12, fontWeight: '700', color: '#0284c7' },

  thumbWrap: { marginRight: 10, position: 'relative', width: 84 },
  thumb: { width: 84, height: 104, borderRadius: 10, backgroundColor: '#f1f5f9' },
  primaryTag: {
    position: 'absolute',
    bottom: 34,
    left: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  primaryTagText: { color: '#ffffff', fontSize: 7, fontWeight: '800' },
  setPrimaryBtn: {
    position: 'absolute',
    bottom: 34,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
  },
  setPrimaryText: { color: '#ffffff', fontSize: 7, fontWeight: '800' },
  reorderRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 4 },
  reorderBtn: {
    width: 24,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shotTypeBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingVertical: 3,
    alignItems: 'center',
  },
  shotTypeText: { fontSize: 8, fontWeight: '700', color: '#6b7280' },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sizeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  sizeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: 74,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  sizeToggleActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  sizeToggleText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  sizeToggleTextActive: { color: '#ffffff' },
  stockInput: {
    width: 84,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  stockInputDisabled: { backgroundColor: '#f8fafc', color: '#9ca3af' },
  sizeHint: { fontSize: 11, color: '#9ca3af' },
  thresholdInput: {
    width: 52,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
  },
  statusPill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8 },
  statusPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  sizeHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  sizeHeaderCell: { width: 74, fontSize: 9, fontWeight: '800', color: '#9ca3af' },
  sizeHeaderCellSmall: { width: 52, fontSize: 9, fontWeight: '800', color: '#9ca3af' },

  skuGroup: { marginTop: 10, gap: 6 },
  skuRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  skuLabel: { width: 74, fontSize: 10, fontWeight: '700', color: '#6b7280' },
  skuInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    fontSize: 12,
    color: '#111827',
  },

  chartRow: { flexDirection: 'row' },
  chartCell: {
    width: 70,
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  chartSizeCell: { width: 60, fontWeight: '700', color: '#1f2937' },
  chartHeaderCell: { fontSize: 9, fontWeight: '800', color: '#9ca3af' },

  swatchPreviewWrap: { position: 'relative', width: 44, height: 44 },
  swatchPreview: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  summaryCard: {
    marginTop: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: { fontSize: 13, fontWeight: '700', color: '#1f2937', marginBottom: 10 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: { fontSize: 12, color: '#6b7280' },
  summaryValue: { fontSize: 13, fontWeight: '600', color: '#1f2937', flexShrink: 1, textAlign: 'right' },
  summaryValueEmphasis: { color: '#0284c7', fontWeight: '800' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: { flex: 1, color: '#b91c1c', fontSize: 12 },

  primaryBtn: {
    marginTop: 20,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.75 },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 0.4 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8 },
  navBtnDisabled: { opacity: 0.5 },
  navBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  navBtnTextDisabled: { color: '#9ca3af' },
  footerCount: { fontSize: 11, color: '#9ca3af', fontWeight: '600' },

  emptyHint: { fontSize: 12, color: '#9ca3af', marginTop: 14, lineHeight: 18 },
  helpText: { fontSize: 11, color: '#9ca3af', marginTop: 4, lineHeight: 16 },
  selectDisabled: { backgroundColor: '#f8fafc' },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tagChipText: { fontSize: 11, color: '#374151', fontWeight: '600' },

  warnPanel: {
    marginTop: 20,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 14,
  },
  warnHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  warnTitle: { fontSize: 12, fontWeight: '800', color: '#b45309' },
  warnItem: { fontSize: 11, color: '#b45309', lineHeight: 18 },
  warnFooter: { fontSize: 10, color: '#a16207', marginTop: 8, fontStyle: 'italic' },

  okPanel: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 14,
  },
  okText: { fontSize: 12, fontWeight: '700', color: '#15803d' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerItemActive: { backgroundColor: '#e0f2fe' },
  pickerItemText: { fontSize: 14, color: '#374151' },
});
