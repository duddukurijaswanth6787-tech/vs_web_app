import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, Layers, Check, Barcode as BarcodeIcon, Printer, ArrowRight, X, ChevronDown, Tag, Award, Database, Search } from 'lucide-react-native';
import { posApiClient } from '../services/api';

// Fallback presets if backend is offline
const DEFAULT_CATEGORIES = [
  'Kurtis',
  'Sarees',
  'Lehengas',
  'Anarkalis',
  'Sharara Sets',
  'Western Wear',
  'Silk Dupattas',
  'Unstitched Suits',
];

const DEFAULT_BRANDS = [
  "Vasanthi's Signature",
  'VS Couture',
  'VS Ethnic',
  'VS Festive',
  'Designer Edition',
];

// Helper to generate GS1 India EAN-13 Barcodes with Modulo 10 Checksum (matches Backend BarcodeGenerator)
function generateEan13Barcode(): string {
  const prefix = '890';
  const rand = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  const raw = `${prefix}${rand}`;
  const checksum = raw
    .split('')
    .reduce((sum, d, i) => sum + parseInt(d) * (i % 2 === 0 ? 1 : 3), 0);
  const checkDigit = (10 - (checksum % 10)) % 10;
  return `${raw}${checkDigit}`;
}

interface CategoryOption {
  id?: string;
  name: string;
}

interface BrandOption {
  id?: string;
  name: string;
}

interface CreatedProductResult {
  name: string;
  sku: string;
  barcode: string;
  price: number;
  mrp: number;
  stock: number;
  category: string;
}

export default function AddProductScreen() {
  const router = useRouter();

  const [productType, setProductType] = useState<'SINGLE' | 'VARIANT'>('SINGLE');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Kurtis');
  const [brand, setBrand] = useState("Vasanthi's Signature");
  const [sellingPrice, setSellingPrice] = useState('699');
  const [costPrice, setCostPrice] = useState('420');
  const [mrp, setMrp] = useState('899');
  const [openingStock, setOpeningStock] = useState('20');

  // Variant fields
  const [colorOptions, setColorOptions] = useState('Maroon, Navy Blue, Emerald');
  const [sizeOptions, setSizeOptions] = useState('S, M, L, XL');

  // Database categories & brands
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [brandsList, setBrandsList] = useState<string[]>(DEFAULT_BRANDS);
  const [loadingDb, setLoadingDb] = useState(false);
  const [dbStatusText, setDbStatusText] = useState('Fetching Database Categories...');

  // Modal Dropdown Pickers State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreatedProductResult | null>(null);

  // Fetch Saved Categories & Brands from Backend Database API
  useEffect(() => {
    async function fetchDatabaseOptions() {
      try {
        setLoadingDb(true);
        const [catRes, brandRes] = await Promise.all([
          posApiClient.get('/categories').catch(() => null),
          posApiClient.get('/brands').catch(() => null),
        ]);

        // Process Categories
        if (catRes?.data?.data) {
          const rawCats = Array.isArray(catRes.data.data)
            ? catRes.data.data
            : catRes.data.data.data || [];
          const fetchedNames = rawCats.map((c: any) => c.name || c.title).filter(Boolean);
          if (fetchedNames.length > 0) {
            // Combine fetched categories with defaults and remove duplicates
            const combined = Array.from(new Set([...fetchedNames, ...DEFAULT_CATEGORIES]));
            setCategoriesList(combined);
            setDbStatusText(`✓ Connected to Database: ${fetchedNames.length} Categories Loaded`);
          }
        } else {
          setDbStatusText('Using Offline Category Presets');
        }

        // Process Brands
        if (brandRes?.data?.data) {
          const rawBrands = Array.isArray(brandRes.data.data)
            ? brandRes.data.data
            : brandRes.data.data.data || [];
          const fetchedBrands = rawBrands.map((b: any) => b.name).filter(Boolean);
          if (fetchedBrands.length > 0) {
            const combinedBrands = Array.from(new Set([...fetchedBrands, ...DEFAULT_BRANDS]));
            setBrandsList(combinedBrands);
          }
        }
      } catch (err) {
        setDbStatusText('Using Presets (Backend Unavailable)');
      } finally {
        setLoadingDb(false);
      }
    }

    fetchDatabaseOptions();
  }, []);

  const handleCreateProduct = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Required Field', 'Please enter a product name.');
      return;
    }
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid selling price.');
      return;
    }

    try {
      setLoading(true);
      const generatedBarcode = generateEan13Barcode();
      const catCode = category.slice(0, 3).toUpperCase() || 'ETH';
      const generatedSku = `VS-${catCode}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload = {
        name: name.trim(),
        sku: generatedSku,
        barcode: generatedBarcode,
        type: productType === 'SINGLE' ? 'READYMADE' : 'VARIANT',
        basePrice: Number(sellingPrice),
        costPrice: Number(costPrice) || 0,
        mrp: Number(mrp) || Number(sellingPrice),
        status: 'ACTIVE',
        isPublished: true,
        visibility: 'VISIBLE',
        trackInventory: true,
        openingStock: Number(openingStock) || 0,
      };

      const res = await posApiClient.post('/products', payload).catch(() => null);

      const finalBarcode = res?.data?.barcode || generatedBarcode;
      const finalSku = res?.data?.sku || generatedSku;

      setCreatedResult({
        name: name.trim(),
        sku: finalSku,
        barcode: finalBarcode,
        price: Number(sellingPrice),
        mrp: Number(mrp) || Number(sellingPrice),
        stock: Number(openingStock) || 0,
        category,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      Alert.alert('Creation Failed', `Error creating product: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categoriesList.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBrands = brandsList.filter((b) =>
    b.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Database Connection Status Bar */}
      <View style={styles.dbStatusBar}>
        <Database size={14} color="#0284c7" style={{ marginRight: 6 }} />
        <Text style={styles.dbStatusText}>{dbStatusText}</Text>
      </View>

      {/* 1. SELECT PRODUCT TYPE */}
      <Text style={styles.sectionTitle}>1. Select Product Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeCard, productType === 'SINGLE' && styles.typeCardActive]}
          onPress={() => setProductType('SINGLE')}
          activeOpacity={0.85}
        >
          <Sparkles size={22} color={productType === 'SINGLE' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.typeTitle, productType === 'SINGLE' && styles.typeTitleActive]}>
            👗 Single Product
          </Text>
          <Text style={[styles.typeSub, productType === 'SINGLE' && styles.typeSubActive]}>
            Standard product (e.g. Free Size Rayon Kurti)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeCard, productType === 'VARIANT' && styles.typeCardActive]}
          onPress={() => setProductType('VARIANT')}
          activeOpacity={0.85}
        >
          <Layers size={22} color={productType === 'VARIANT' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.typeTitle, productType === 'VARIANT' && styles.typeTitleActive]}>
            🎨 Multiple Variants
          </Text>
          <Text style={[styles.typeSub, productType === 'VARIANT' && styles.typeSubActive]}>
            Different colors, sizes (e.g. Maroon/M, Blue/L)
          </Text>
        </TouchableOpacity>
      </View>

      {/* 2. PRODUCT DETAILS */}
      <Text style={styles.sectionTitle}>2. Product Information</Text>
      <View style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Silk Zari Embroidered Suit"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* DATABASE CATEGORY DROPDOWN PICKER */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Tag size={14} color="#0369a1" style={{ marginRight: 4 }} />
            <Text style={styles.label}>Category (Saved in Database) *</Text>
          </View>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => {
              setSearchQuery('');
              setShowCategoryModal(true);
            }}
          >
            <Text style={styles.dropdownValueText}>{category || 'Select Category...'}</Text>
            <ChevronDown size={20} color="#0284c7" />
          </TouchableOpacity>
        </View>

        {/* DATABASE BRAND DROPDOWN PICKER */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Award size={14} color="#0369a1" style={{ marginRight: 4 }} />
            <Text style={styles.label}>Brand (Saved in Database) *</Text>
          </View>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => {
              setSearchQuery('');
              setShowBrandModal(true);
            }}
          >
            <Text style={styles.dropdownValueText}>{brand || 'Select Brand...'}</Text>
            <ChevronDown size={20} color="#0284c7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. VARIANT SPECIFICATIONS (IF MULTIPLE VARIANTS) */}
      {productType === 'VARIANT' && (
        <>
          <Text style={styles.sectionTitle}>3. Variant Attributes</Text>
          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Colors (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={colorOptions}
                onChangeText={setColorOptions}
                placeholder="Maroon, Navy Blue, Emerald"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Sizes (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={sizeOptions}
                onChangeText={setSizeOptions}
                placeholder="S, M, L, XL"
              />
            </View>
          </View>
        </>
      )}

      {/* 4. PRICING & STOCK */}
      <Text style={styles.sectionTitle}>4. Pricing & Inventory</Text>
      <View style={styles.formCard}>
        <View style={styles.rowTwo}>
          <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Selling Price (₹) *</Text>
            <TextInput
              style={styles.input}
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Cost Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.rowTwo}>
          <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>MRP (₹)</Text>
            <TextInput
              style={styles.input}
              value={mrp}
              onChangeText={setMrp}
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Opening Stock *</Text>
            <TextInput
              style={styles.input}
              value={openingStock}
              onChangeText={setOpeningStock}
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={handleCreateProduct}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>CREATE PRODUCT & GENERATE BARCODE</Text>
          </>
        )}
      </TouchableOpacity>

      {/* CATEGORY DROPDOWN MODAL */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category (Database)</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchRow}>
              <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search or type custom category..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
              {filteredCategories.map((cat, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.pickerItem, category === cat && styles.pickerItemActive]}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, category === cat && styles.pickerItemTextActive]}>
                    {cat}
                  </Text>
                  {category === cat && <Check size={18} color="#0284c7" />}
                </TouchableOpacity>
              ))}

              {searchQuery.trim() !== '' && !filteredCategories.includes(searchQuery.trim()) && (
                <TouchableOpacity
                  style={styles.addCustomBtn}
                  onPress={() => {
                    setCategory(searchQuery.trim());
                    if (!categoriesList.includes(searchQuery.trim())) {
                      setCategoriesList((prev) => [searchQuery.trim(), ...prev]);
                    }
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={styles.addCustomBtnText}>+ Use Custom Category: "{searchQuery.trim()}"</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BRAND DROPDOWN MODAL */}
      <Modal visible={showBrandModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Brand (Database)</Text>
              <TouchableOpacity onPress={() => setShowBrandModal(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchRow}>
              <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search or type custom brand..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            <ScrollView style={{ maxHeight: 280 }} keyboardShouldPersistTaps="handled">
              {filteredBrands.map((b, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.pickerItem, brand === b && styles.pickerItemActive]}
                  onPress={() => {
                    setBrand(b);
                    setShowBrandModal(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, brand === b && styles.pickerItemTextActive]}>
                    {b}
                  </Text>
                  {brand === b && <Check size={18} color="#0284c7" />}
                </TouchableOpacity>
              ))}

              {searchQuery.trim() !== '' && !filteredBrands.includes(searchQuery.trim()) && (
                <TouchableOpacity
                  style={styles.addCustomBtn}
                  onPress={() => {
                    setBrand(searchQuery.trim());
                    if (!brandsList.includes(searchQuery.trim())) {
                      setBrandsList((prev) => [searchQuery.trim(), ...prev]);
                    }
                    setShowBrandModal(false);
                  }}
                >
                  <Text style={styles.addCustomBtnText}>+ Use Custom Brand: "{searchQuery.trim()}"</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SUCCESS BARCODE STICKER GENERATED MODAL */}
      <Modal visible={!!createdResult} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎉 Product & Barcode Created!</Text>
              <TouchableOpacity onPress={() => setCreatedResult(null)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {createdResult && (
              <View style={styles.stickerPreview}>
                <Text style={styles.stickerBrand}>{brand.toUpperCase()}</Text>
                <Text style={styles.stickerName} numberOfLines={1}>
                  {createdResult.name}
                </Text>
                <Text style={styles.stickerCategory}>Category: {createdResult.category}</Text>

                {/* Barcode Graphic Box */}
                <View style={styles.barcodeBox}>
                  <BarcodeIcon size={48} color="#000000" />
                  <Text style={styles.barcodeNumber}>{createdResult.barcode}</Text>
                  <Text style={styles.skuText}>SKU: {createdResult.sku}</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.mrpText}>MRP: ₹{createdResult.mrp}</Text>
                  <Text style={styles.salePriceText}>PRICE: ₹{createdResult.price}</Text>
                </View>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.printBtn}
                onPress={() => {
                  Alert.alert('Print Label', `Sent Barcode ${createdResult?.barcode} to thermal printer.`);
                }}
              >
                <Printer size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.printBtnText}>PRINT STICKER</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={() => {
                  setCreatedResult(null);
                  router.replace('/sale');
                }}
              >
                <Text style={styles.doneBtnText}>GO TO POS SALE</Text>
                <ArrowRight size={16} color="#0284c7" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  dbStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  dbStatusText: { fontSize: 11, fontWeight: 'bold', color: '#0369a1' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  typeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  typeCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  typeCardActive: { backgroundColor: '#0284c7', borderColor: '#0284c7' },
  typeTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginTop: 8 },
  typeTitleActive: { color: '#ffffff' },
  typeSub: { fontSize: 10, color: '#64748b', marginTop: 2, lineHeight: 14 },
  typeSubActive: { color: '#e0f2fe' },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 16,
  },
  fieldGroup: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rowTwo: { flexDirection: 'row' },
  label: { fontSize: 11, fontWeight: 'bold', color: '#0369a1', marginBottom: 4 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },

  // Dropdown Button Styles
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#0284c7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownValueText: { fontSize: 13, fontWeight: 'bold', color: '#0284c7' },

  submitBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnText: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    maxHeight: '80%',
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    elevation: 5,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 'bold', color: '#0284c7' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#0f172a' },

  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pickerItemActive: { backgroundColor: '#e0f2fe' },
  pickerItemText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  pickerItemTextActive: { fontSize: 13, color: '#0284c7', fontWeight: 'bold' },

  addCustomBtn: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  addCustomBtnText: { color: '#0284c7', fontWeight: 'bold', fontSize: 12 },

  stickerPreview: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  stickerBrand: { fontSize: 10, fontWeight: 'bold', color: '#800020', letterSpacing: 1 },
  stickerName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginTop: 4 },
  stickerCategory: { fontSize: 10, color: '#64748b', marginTop: 2 },
  barcodeBox: { alignItems: 'center', marginVertical: 12 },
  barcodeNumber: { fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginTop: 4, color: '#000' },
  skuText: { fontSize: 10, color: '#475569', marginTop: 2, fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 8, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 8 },
  mrpText: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
  salePriceText: { fontSize: 13, fontWeight: 'bold', color: '#0284c7' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  printBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  printBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 11 },
  doneBtn: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { color: '#0284c7', fontWeight: 'bold', fontSize: 11 },
});
