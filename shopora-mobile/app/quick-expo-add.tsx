import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Printer,
  X,
  Package,
  Clock,
  RefreshCw,
  Plus,
  Minus,
  CheckCircle2,
  Trash2,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { pickImagesFromGallery, capturePhotoFromCamera } from '../services/image-picker';
import {
  authService,
  catalogService,
  inventoryService,
  attributeService,
  buildVariantAttributes,
  getCurrentUser,
  getApiErrorMessage,
} from '../services/api';
import { bluetoothPrinterService } from '../services/bluetooth-printer';

export interface VariantDetail {
  id: string;
  size: string;
  color: string;
  stock: number;
  barcode: string;
  sku: string;
}

export interface QuickProductRecord {
  id: string;
  name: string;
  price: number;
  color: string;
  sizes: string[];
  totalStock: number;
  variants: VariantDetail[];
  barcode: string;
  sku: string;
  images: string[];
  createdAt: string;
  addedBy?: string;
}

const STORAGE_KEY_RECENT_EXPO = 'shopora_recent_expo_products';

const PRESET_COLORS = [
  { name: 'Maroon', hex: '#881337' },
  { name: 'Emerald Green', hex: '#065f46' },
  { name: 'Royal Blue', hex: '#1e3a8a' },
  { name: 'Pastel Pink', hex: '#f472b6' },
  { name: 'Gold', hex: '#d97706' },
  { name: 'Black', hex: '#0f172a' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Mustard Yellow', hex: '#ca8a04' },
];

const PRESET_SIZES = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function QuickExpoAddScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();

  // Form State - empty by default
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [selectedColor, setSelectedColor] = useState('Maroon');
  const [customColor, setCustomColor] = useState('');
  
  // Multi-size selection & per-size quantity breakdown
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['Free Size']);
  const [sizeStocks, setSizeStocks] = useState<Record<string, string>>({
    'Free Size': '1',
  });
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState('');

  // Recent History State
  const [recentProducts, setRecentProducts] = useState<QuickProductRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<QuickProductRecord | null>(null);
  const [createdProductSuccess, setCreatedProductSuccess] = useState<QuickProductRecord | null>(null);
  const [printingKey, setPrintingKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const loadRecentProducts = useCallback(async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY_RECENT_EXPO);
      if (raw) {
        const parsed: QuickProductRecord[] = JSON.parse(raw);
        setRecentProducts(parsed);
      }
    } catch (e) {
      console.error('Failed to load recent expo products:', e);
    }
  }, []);

  useEffect(() => {
    loadRecentProducts();
  }, [loadRecentProducts]);

  const saveToRecent = async (item: QuickProductRecord) => {
    try {
      const updated = [item, ...recentProducts.filter((p) => p.id !== item.id)].slice(0, 30);
      setRecentProducts(updated);
      await SecureStore.setItemAsync(STORAGE_KEY_RECENT_EXPO, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent expo product:', e);
    }
  };

  const handlePickPhotos = async () => {
    try {
      const uris = await pickImagesFromGallery(true);
      if (uris && uris.length > 0) {
        setImages((prev) => [...prev, ...uris].slice(0, 5));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not pick photos');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const uri = await capturePhotoFromCamera();
      if (uri) {
        setImages((prev) => [...prev, uri].slice(0, 5));
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not take photo');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle size selection
  const handleToggleSize = (sz: string) => {
    if (selectedSizes.includes(sz)) {
      if (selectedSizes.length === 1) {
        Alert.alert('At least 1 size required', 'Product must have at least one size.');
        return;
      }
      setSelectedSizes((prev) => prev.filter((s) => s !== sz));
    } else {
      setSelectedSizes((prev) => [...prev, sz]);
      if (!sizeStocks[sz]) {
        setSizeStocks((prev) => ({ ...prev, [sz]: '5' }));
      }
    }
  };

  // Adjust stock quantity for specific size
  const handleAdjustSizeStock = (sz: string, delta: number) => {
    const current = parseInt(sizeStocks[sz] || '0', 10);
    const next = Math.max(1, current + delta);
    setSizeStocks((prev) => ({ ...prev, [sz]: String(next) }));
  };

  // Calculate total stock
  const totalStockCount = selectedSizes.reduce((sum, sz) => {
    const qty = parseInt(sizeStocks[sz] || '0', 10);
    return sum + (isNaN(qty) ? 0 : qty);
  }, 0);

  // Print single barcode label
  const handlePrintSingleVariant = async (
    productName: string,
    variant: VariantDetail,
    priceVal: number,
  ) => {
    const key = variant.id || variant.barcode;
    setPrintingKey(key);
    try {
      await bluetoothPrinterService.printLabel({
        productName,
        variantTitle: `Size: ${variant.size} | ${variant.color}`,
        barcode: variant.barcode,
        sku: variant.sku,
        price: priceVal,
        storeName: "VASANTHI'S SIGNATURE",
        widthMm: 75,
        heightMm: 50,
        quantity: 1,
      });
      Alert.alert('Printed', `Barcode sticker printed for Size ${variant.size}!`);
    } catch (e: any) {
      Alert.alert(
        'Printer not connected',
        `Barcode: ${variant.barcode}\nSKU: ${variant.sku}\nPrice: ₹${priceVal}\n\nConnect Bluetooth printer in Printer settings.`,
      );
    } finally {
      setPrintingKey(null);
    }
  };

  // Print all barcode labels for product
  const handlePrintAllVariants = async (item: QuickProductRecord) => {
    setPrintingKey('ALL');
    try {
      for (const v of item.variants) {
        await bluetoothPrinterService.printLabel({
          productName: item.name,
          variantTitle: `Size: ${v.size} | ${v.color}`,
          barcode: v.barcode,
          sku: v.sku,
          price: item.price,
          storeName: "VASANTHI'S SIGNATURE",
          widthMm: 75,
          heightMm: 50,
          quantity: 1,
        });
      }
      Alert.alert('Printed', `All ${item.variants.length} size labels printed successfully!`);
    } catch (e: any) {
      Alert.alert(
        'Printer not connected',
        `Printed label preview failed. Connect Bluetooth printer in Printer settings.`,
      );
    } finally {
      setPrintingKey(null);
    }
  };
  const handleDeleteProduct = (product: QuickProductRecord) => {
    Alert.alert(
      'Delete Product?',
      `Are you sure you want to permanently delete "${product.name}" from the database? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(product.id);
            try {
              await authService.ensureAuthenticated();
              await catalogService.deleteProduct(product.id);
              const updated = recentProducts.filter((p) => p.id !== product.id);
              setRecentProducts(updated);
              await SecureStore.setItemAsync(STORAGE_KEY_RECENT_EXPO, JSON.stringify(updated));
              setSelectedProduct(null);
              Alert.alert('Deleted', `"${product.name}" has been removed from the database.`);
            } catch (err) {
              Alert.alert('Delete Failed', getApiErrorMessage(err, 'Could not delete product from database'));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleQuickCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a product name');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Required', 'Please enter a valid selling price (₹)');
      return;
    }
    if (selectedSizes.length === 0) {
      Alert.alert('Required', 'Please select at least one size');
      return;
    }

    // Validate size stocks
    for (const sz of selectedSizes) {
      const q = parseInt(sizeStocks[sz] || '0', 10);
      if (isNaN(q) || q <= 0) {
        Alert.alert('Required', `Please enter a valid stock quantity for Size ${sz}`);
        return;
      }
    }

    const activeColor = customColor.trim() || selectedColor;
    setSubmitting(true);
    setProgress('Authenticating & preparing upload…');
    await authService.ensureAuthenticated();
    setProgress('Creating Store/Expo Product…');

    try {
      // 1. Get default brand, categories, and attributes
      const [brands, categories, attributes] = await Promise.all([
        catalogService.listBrands().catch(() => []),
        catalogService.listCategories().catch(() => []),
        attributeService.list().catch(() => []),
      ]);
      const defaultBrandId = brands[0]?.id;
      const defaultCategoryId = categories[0]?.id;

      if (!defaultBrandId) {
        throw new Error('No brand found in system. Please add at least 1 brand in admin.');
      }

      // 2. Create Product with channel STORE_EXPO
      const created = await catalogService.createProduct({
        name: name.trim(),
        brandId: defaultBrandId,
        type: 'READYMADE',
        gender: 'WOMEN',
        basePrice: mrp ? parseFloat(mrp) : numPrice,
        salePrice: numPrice,
        status: 'ACTIVE',
        isPublished: true,
        channel: 'STORE',
        ...(defaultCategoryId ? { categoryIds: [defaultCategoryId] } : {}),
      });

      const productId = created?.id;
      if (!productId) throw new Error('API did not return a product id.');

      // 3. Fast Parallel Upload Images & track media IDs
      const uploadedUrls: string[] = [];
      const uploadedMediaIds: string[] = [];
      if (images.length > 0) {
        setProgress(`Uploading ${images.length} photo(s)...`);
        const uploadPromises = images.map(async (uri, i) => {
          try {
            const url = await catalogService.uploadImage(uri, `expo-${Date.now()}-${i}.jpg`);
            if (url) {
              const mediaRes = await catalogService.addMedia({
                productId,
                url,
                isPrimary: i === 0,
                displayOrder: i,
                color: activeColor,
                title: i === 0 ? 'Front' : 'Detail',
              });
              return { url, mediaId: mediaRes?.id };
            }
          } catch (uploadErr) {
            console.warn('Image upload failed:', uploadErr);
          }
          return null;
        });

        const uploadResults = await Promise.all(uploadPromises);
        uploadResults.forEach((res) => {
          if (res?.url) uploadedUrls.push(res.url);
          if (res?.mediaId) uploadedMediaIds.push(res.mediaId);
        });
      }

      // 4. Create Variants for each selected size with individual stock quantities and attributes
      const createdVariants: VariantDetail[] = [];

      for (let i = 0; i < selectedSizes.length; i++) {
        const sz = selectedSizes[i];
        const stockQty = parseInt(sizeStocks[sz] || '1', 10);

        setProgress(`Creating Variant Size ${sz} (${i + 1}/${selectedSizes.length})...`);

        const variant = await catalogService.createVariant({
          productId,
          title: `${activeColor} / ${sz}`,
          displayOrder: i,
          isDefault: i === 0,
          attributeValues: buildVariantAttributes(attributes, activeColor, sz),
        });
        if (variant?.id) {
          // Stock in for this specific variant
          setProgress(`Stocking ${stockQty} pcs for Size ${sz}...`);
          await inventoryService
            .stockIn(variant.id, stockQty, `Store/Expo addition for Size ${sz}`)
            .catch(() => null);

          createdVariants.push({
            id: variant.id,
            size: sz,
            color: activeColor,
            stock: stockQty,
            barcode: variant.barcode || variant.sku || `BC-${Date.now()}-${i}`,
            sku: variant.sku || `SKU-${Date.now()}-${i}`,
          });
        }
      }

      if (createdVariants.length === 0) {
        throw new Error('Failed to create product variants.');
      }

      // 5. Sync Color Group (binds color attribute option, variant IDs, and uploaded media IDs)
      const colorAttr = attributes.find(
        (a: any) => a.slug === 'color' || a.name?.toLowerCase() === 'color',
      );
      const colorOption = colorAttr?.options?.find(
        (o: any) =>
          o.value?.toLowerCase().trim() === activeColor.toLowerCase().trim() ||
          o.label?.toLowerCase().trim() === activeColor.toLowerCase().trim(),
      );
      if (colorOption?.id) {
        setProgress('Syncing colour group & photos...');
        await catalogService
          .syncColorGroups(productId, {
            colorGroups: [
              {
                colorAttributeOptionId: colorOption.id,
                label: activeColor,
                variantIds: createdVariants.map((v) => v.id),
                mediaIds: uploadedMediaIds,
              },
            ],
          })
          .catch((cgErr) => console.warn('Color group sync warning:', cgErr));
      }

      const newRecord: QuickProductRecord = {
        id: productId,
        name: name.trim(),
        price: numPrice,
        color: activeColor,
        sizes: selectedSizes,
        totalStock: totalStockCount,
        variants: createdVariants,
        barcode: createdVariants[0].barcode,
        sku: createdVariants[0].sku,
        images: uploadedUrls.length > 0 ? uploadedUrls : images,
        createdAt: new Date().toISOString(),
        addedBy: currentUser?.email || 'Store Staff',
      };

      await saveToRecent(newRecord);

      // Reset form inputs for next product
      setName('');
      setPrice('');
      setMrp('');
      setCustomColor('');
      setSelectedSizes(['Free Size']);
      setSizeStocks({ 'Free Size': '1' });
      setImages([]);

      // Open Page 2: Dedicated Product Confirmation & Action Hub
      setCreatedProductSuccess(newRecord);
    } catch (e: any) {
      Alert.alert('Failed to Create Product', getApiErrorMessage(e, 'Could not save quick product'));
    } finally {
      setSubmitting(false);
      setProgress('');
    }
  };

  // If product was just created, display Page 2 (Confirmation & Action Hub)
  if (createdProductSuccess) {
    const item = createdProductSuccess;
    return (
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setCreatedProductSuccess(null)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color="#0f172a" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle}>⚡ Product Created</Text>
            <Text style={styles.topSub}>Saved to Cloud & Catalog</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Success Banner Card */}
          <View style={styles.successBannerCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={36} color="#16a34a" />
            </View>
            <Text style={styles.successBannerTitle}>Product Created Successfully!</Text>
            <Text style={styles.successBannerSub}>
              Product is saved to the database and live on your POS & catalog.
            </Text>
          </View>

          {/* Product Summary Details Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Product Summary</Text>
            {item.images && item.images.length > 0 && (
              <Image
                source={{ uri: item.images[0] }}
                style={styles.successProductImg}
                resizeMode="cover"
              />
            )}
            <Text style={styles.modalProductName}>{item.name}</Text>
            <Text style={styles.modalProductPrice}>₹{item.price.toLocaleString('en-IN')}</Text>

            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Colour:</Text>
              <Text style={styles.modalInfoVal}>{item.color}</Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Total Stock:</Text>
              <Text style={styles.modalInfoVal}>{item.totalStock} Pcs</Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Created At:</Text>
              <Text style={styles.modalInfoVal}>
                {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {/* Size Variants List */}
            <Text style={styles.modalVariantsHeading}>Size Variants & Barcode Labels</Text>
            {item.variants && item.variants.length > 0 ? (
              item.variants.map((v, i) => (
                <View key={i} style={styles.modalVariantCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.miniSizeBadge}>
                        <Text style={styles.miniSizeBadgeText}>{v.size}</Text>
                      </View>
                      <Text style={styles.modalVariantStock}>{v.stock} Pcs</Text>
                    </View>
                    <Text style={styles.modalVariantBarcode}>BC: {v.barcode}</Text>
                    <Text style={styles.modalVariantSku}>SKU: {v.sku}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.modalPrintVariantBtn}
                    onPress={() => handlePrintSingleVariant(item.name, v, item.price)}
                    disabled={printingKey === (v.id || v.barcode)}
                    activeOpacity={0.8}
                  >
                    {printingKey === (v.id || v.barcode) ? (
                      <ActivityIndicator size="small" color="#0284c7" />
                    ) : (
                      <>
                        <Printer size={14} color="#0284c7" />
                        <Text style={styles.modalPrintVariantBtnText}>Print</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            ) : null}
          </View>

          {/* 3 Dedicated Action Buttons */}
          <View style={{ gap: 12, marginTop: 4 }}>
            {/* 1. Print Barcode Labels */}
            <TouchableOpacity
              style={styles.actionPrintBtn}
              onPress={() => handlePrintAllVariants(item)}
              activeOpacity={0.85}
            >
              <Printer size={20} color="#ffffff" />
              <Text style={styles.actionPrintBtnText}>🖨️ Print Barcode Labels</Text>
            </TouchableOpacity>

            {/* 2. Add Next Product */}
            <TouchableOpacity
              style={styles.actionNextBtn}
              onPress={() => setCreatedProductSuccess(null)}
              activeOpacity={0.85}
            >
              <Plus size={20} color="#ffffff" />
              <Text style={styles.actionNextBtnText}>➕ Add Next Product</Text>
            </TouchableOpacity>

            {/* 3. Done / Home */}
            <TouchableOpacity
              style={styles.actionHomeBtn}
              onPress={() => router.back()}
              activeOpacity={0.85}
            >
              <Text style={styles.actionHomeBtnText}>Done & Back to POS</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>⚡ Quick Store / Expo Add</Text>
          <Text style={styles.topSub}>Fast 1-screen multi-size creation & barcode print</Text>
        </View>
        <TouchableOpacity
          style={styles.historyIconBtn}
          onPress={loadRecentProducts}
          activeOpacity={0.7}
        >
          <RefreshCw size={18} color="#0284c7" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. PHOTO PICKER CARD */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>1. Product Photos (1 to 5 Photos)</Text>
          <View style={styles.photoActionsRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
              <Camera size={18} color="#0284c7" />
              <Text style={styles.photoBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhotos} activeOpacity={0.8}>
              <ImageIcon size={18} color="#0284c7" />
              <Text style={styles.photoBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {images.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.photoThumbWrapper}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <TouchableOpacity
                    style={styles.photoRemoveBtn}
                    onPress={() => handleRemoveImage(idx)}
                    activeOpacity={0.8}
                  >
                    <X size={14} color="#ffffff" />
                  </TouchableOpacity>
                  {idx === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>COVER</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera size={28} color="#94a3b8" />
              <Text style={styles.placeholderText}>Tap Camera or Gallery to add quick product photos</Text>
            </View>
          )}
        </View>

        {/* 2. BASIC DETAILS & PRICING */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>2. Product Details & Pricing</Text>

          <Text style={styles.inputLabel}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Pure Silk Banarasi Saree"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
              <TextInput
                style={styles.input}
                placeholder="₹ Selling Price"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>MRP (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="₹ MRP"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={mrp}
                onChangeText={setMrp}
              />
            </View>
          </View>
        </View>

        {/* 3. COLOUR & MULTI-SIZE SELECTION WITH DYNAMIC QUANTITY */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>3. Colour & Size Selection</Text>

          {/* Color Presets */}
          <Text style={styles.inputLabel}>Colour Preset</Text>
          <View style={styles.chipsWrap}>
            {PRESET_COLORS.map((c) => {
              const active = selectedColor === c.name && !customColor;
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.colorChip, active && styles.colorChipActive]}
                  onPress={() => {
                    setSelectedColor(c.name);
                    setCustomColor('');
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.colorDot, { backgroundColor: c.hex }]} />
                  <Text style={[styles.colorChipText, active && styles.colorChipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder="Or type custom colour (e.g. Peacock Blue)"
            placeholderTextColor="#94a3b8"
            value={customColor}
            onChangeText={setCustomColor}
          />

          {/* Multi-Size Selector */}
          <View style={{ marginTop: 14, marginBottom: 6 }}>
            <Text style={styles.inputLabel}>Select Sizes (Multi-Select Allowed) *</Text>
            <Text style={styles.inputSubHint}>Tap to add/remove sizes. Each selected size gets its own barcode.</Text>
          </View>

          <View style={styles.chipsWrap}>
            {PRESET_SIZES.map((sz) => {
              const active = selectedSizes.includes(sz);
              return (
                <TouchableOpacity
                  key={sz}
                  style={[styles.sizeChip, active && styles.sizeChipActive]}
                  onPress={() => handleToggleSize(sz)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sizeChipText, active && styles.sizeChipTextActive]}>
                    {sz}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic Quantity Breakdown per Selected Size */}
          <View style={styles.stockBreakdownSection}>
            <View style={styles.stockSectionHeaderRow}>
              <Text style={styles.stockBreakdownTitle}>📦 Stock Breakdown by Size</Text>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>Total: {totalStockCount} Pcs</Text>
              </View>
            </View>

            {selectedSizes.map((sz) => (
              <View key={sz} style={styles.sizeStockRow}>
                <View style={styles.sizeNameBadge}>
                  <Text style={styles.sizeNameText}>{sz}</Text>
                </View>

                <View style={styles.stockInputWrap}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleAdjustSizeStock(sz, -1)}
                    activeOpacity={0.7}
                  >
                    <Minus size={16} color="#0284c7" />
                  </TouchableOpacity>

                  <TextInput
                    style={styles.sizeQtyTextInput}
                    keyboardType="numeric"
                    value={sizeStocks[sz] || '1'}
                    onChangeText={(val) =>
                      setSizeStocks((prev) => ({ ...prev, [sz]: val }))
                    }
                  />

                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleAdjustSizeStock(sz, 1)}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color="#0284c7" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.pcsText}>Pcs</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CREATE & PRINT BUTTON */}
        <TouchableOpacity
          style={[styles.createBtn, submitting && { opacity: 0.6 }]}
          onPress={handleQuickCreate}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <View style={styles.btnContent}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.createBtnText}>{progress || 'Creating…'}</Text>
            </View>
          ) : (
            <View style={styles.btnContent}>
              <Sparkles size={20} color="#ffffff" />
              <Text style={styles.createBtnText}>
                ⚡ Create ({selectedSizes.length} Sizes, {totalStockCount} Pcs) & Print
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* RECENTLY ADDED SECTION */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={18} color="#0f172a" />
              <Text style={styles.recentSectionTitle}>
                Recently Added on this Device ({recentProducts.length})
              </Text>
            </View>
          </View>

          {recentProducts.length === 0 ? (
            <View style={styles.emptyRecent}>
              <Package size={28} color="#94a3b8" />
              <Text style={styles.emptyRecentText}>No products added yet from this phone.</Text>
            </View>
          ) : (
            recentProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentCard}
                onPress={() => setSelectedProduct(item)}
                activeOpacity={0.85}
              >
                {item.images && item.images.length > 0 ? (
                  <Image source={{ uri: item.images[0] }} style={styles.recentThumb} />
                ) : (
                  <View style={[styles.recentThumb, styles.placeholderThumb]}>
                    <Package size={20} color="#94a3b8" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.recentItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.recentItemMeta} numberOfLines={1}>
                    {item.color} • Sizes: {item.sizes ? item.sizes.join(', ') : 'Free Size'}
                  </Text>
                  <Text style={styles.recentItemStock}>
                    Total Stock: {item.totalStock || item.variants?.reduce((s, v) => s + v.stock, 0) || 0} Pcs
                  </Text>
                  <Text style={styles.recentItemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                </View>

                <TouchableOpacity
                  style={styles.reprintIconBtn}
                  onPress={() => handlePrintAllVariants(item)}
                  disabled={printingKey === 'ALL'}
                  activeOpacity={0.8}
                >
                  {printingKey === 'ALL' ? (
                    <ActivityIndicator size="small" color="#0284c7" />
                  ) : (
                    <>
                      <Printer size={16} color="#0284c7" />
                      <Text style={styles.reprintIconText}>Print</Text>
                    </>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* DETAIL PREVIEW MODAL */}
      <Modal visible={Boolean(selectedProduct)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Product & Barcode Details</Text>
              <TouchableOpacity onPress={() => setSelectedProduct(null)} activeOpacity={0.7}>
                <X size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView style={{ maxHeight: 450 }}>
                {selectedProduct.images && selectedProduct.images.length > 0 && (
                  <Image
                    source={{ uri: selectedProduct.images[0] }}
                    style={styles.modalProductImg}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
                <Text style={styles.modalProductPrice}>₹{selectedProduct.price.toLocaleString('en-IN')}</Text>

                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Colour:</Text>
                  <Text style={styles.modalInfoVal}>{selectedProduct.color}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Created At:</Text>
                  <Text style={styles.modalInfoVal}>
                    {new Date(selectedProduct.createdAt).toLocaleString('en-IN')}
                  </Text>
                </View>
                {selectedProduct.addedBy && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Added By:</Text>
                    <Text style={styles.modalInfoVal}>{selectedProduct.addedBy}</Text>
                  </View>
                )}

                {/* Per-Variant List with individual barcodes & print buttons */}
                <Text style={styles.modalVariantsHeading}>Size Variants & Barcodes</Text>
                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  selectedProduct.variants.map((v, i) => (
                    <View key={i} style={styles.modalVariantCard}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={styles.miniSizeBadge}>
                            <Text style={styles.miniSizeBadgeText}>{v.size}</Text>
                          </View>
                          <Text style={styles.modalVariantStock}>{v.stock} Pcs in Stock</Text>
                        </View>
                        <Text style={styles.modalVariantBarcode}>BC: {v.barcode}</Text>
                        <Text style={styles.modalVariantSku}>SKU: {v.sku}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.modalPrintVariantBtn}
                        onPress={() => handlePrintSingleVariant(selectedProduct.name, v, selectedProduct.price)}
                        disabled={printingKey === (v.id || v.barcode)}
                        activeOpacity={0.8}
                      >
                        {printingKey === (v.id || v.barcode) ? (
                          <ActivityIndicator size="small" color="#0284c7" />
                        ) : (
                          <>
                            <Printer size={14} color="#0284c7" />
                            <Text style={styles.modalPrintVariantBtnText}>Print</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Barcode:</Text>
                    <Text style={[styles.modalInfoVal, { fontFamily: 'monospace', color: '#0284c7' }]}>
                      {selectedProduct.barcode}
                    </Text>
                  </View>
                )}

                {/* Print All Button */}
                <TouchableOpacity
                  style={styles.modalPrintBtn}
                  onPress={() => {
                    handlePrintAllVariants(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  activeOpacity={0.85}
                >
                  <Printer size={18} color="#ffffff" />
                  <Text style={styles.modalPrintBtnText}>🖨️ Print All Size Barcode Labels</Text>
                </TouchableOpacity>

                {/* Delete Product from Database Button */}
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={() => handleDeleteProduct(selectedProduct)}
                  disabled={deletingId === selectedProduct.id}
                  activeOpacity={0.85}
                >
                  {deletingId === selectedProduct.id ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#dc2626" />
                      <Text style={styles.modalDeleteBtnText}>Delete Product from Database</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  topSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  historyIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  photoList: {
    marginTop: 4,
  },
  photoThumbWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  photoThumb: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#0284c7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    gap: 6,
  },
  placeholderText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputSubHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: -2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  colorChipActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  colorChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  colorChipTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sizeChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  sizeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  sizeChipTextActive: {
    color: '#ffffff',
  },
  stockBreakdownSection: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stockSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stockBreakdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  sizeStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sizeNameBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  sizeNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  stockInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeQtyTextInput: {
    width: 60,
    height: 36,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  pcsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  createBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0284c7',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  recentSection: {
    marginTop: 8,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  recentSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptyRecent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyRecentText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  recentThumb: {
    width: 50,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
  },
  placeholderThumb: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  recentItemMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  recentItemStock: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 1,
  },
  recentItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 2,
  },
  reprintIconBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 2,
  },
  reprintIconText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284c7',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalProductImg: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalProductPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 2,
    marginBottom: 10,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  modalInfoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalVariantsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 8,
  },
  modalVariantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  miniSizeBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniSizeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalVariantStock: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  modalVariantBarcode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#475569',
    marginTop: 3,
  },
  modalVariantSku: {
    fontSize: 10,
    color: '#94a3b8',
  },
  modalPrintVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalPrintVariantBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  modalPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
  },
  modalPrintBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 6,
    gap: 8,
  },
  modalDeleteBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
  },
  successBannerCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 6,
    textAlign: 'center',
  },
  successBannerSub: {
    fontSize: 13,
    color: '#166534',
    textAlign: 'center',
    lineHeight: 18,
  },
  successProductImg: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionPrintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionPrintBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 15,
  },
  actionNextBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionHomeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingVertical: 14,
  },
  actionHomeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
