import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Camera as CameraIcon,
  Printer,
  X,
  Info,
} from 'lucide-react-native';
import { posMobileService, PosMobileCartItem, getApiErrorMessage, isAuthenticated } from '../services/api';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { ConnectivityBadge } from '../components/ConnectivityBadge';
import { useOfflineSync, isNetworkFailure } from '../services/offline/useOfflineSync';
import { offlineScanCacheDb, normalizeScanCacheKey } from '../services/offline/offlineDb';
import { CachedScanResult, ScanBarcodeResult } from '../services/offline/offline.types';

const SAMPLE_BARCODES = [
  { label: 'Anarkali XL (890351069409)', code: '890351069409' },
  { label: 'Anarkali M (890365090266)', code: '890365090266' },
  { label: 'Anarkali L (890589337088)', code: '890589337088' },
  { label: 'Anarkali S (890039458248)', code: '890039458248' },
  { label: 'Saree (890100000005)', code: '890100000005' },
  { label: 'Kurti (890100000001)', code: '890100000001' },
];

let globalCart: PosMobileCartItem[] = [];
const cartListeners = new Set<() => void>();

export function setGlobalCart(newCart: PosMobileCartItem[] | ((prev: PosMobileCartItem[]) => PosMobileCartItem[])) {
  if (typeof newCart === 'function') {
    globalCart = newCart(globalCart);
  } else {
    globalCart = newCart;
  }
  cartListeners.forEach((l) => l());
}

export function useGlobalCart() {
  const [cart, setCart] = useState<PosMobileCartItem[]>(globalCart);
  useEffect(() => {
    const listener = () => setCart([...globalCart]);
    cartListeners.add(listener);
    return () => {
      cartListeners.delete(listener);
    };
  }, []);
  return [cart, setGlobalCart] as const;
}

export default function SaleProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scannedCodeParam = params.scannedCode as string;
  const timestampParam = params.timestamp as string;

  const [barcodeInput, setBarcodeInput] = useState('');
  // Product-name suggestions when the input is not all-digits. A digit-only
  // value stays a barcode and hits the scan path on submit.
  const [searchResults, setSearchResults] = useState<ScanBarcodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  // Quick-buy grid: category chips + product tiles. Collapsed by default so
  // the scan-first flow isn't interrupted.
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [quickCatId, setQuickCatId] = useState<string>('');
  const [quickTiles, setQuickTiles] = useState<ScanBarcodeResult[]>([]);
  const [quickLoading, setQuickLoading] = useState(false);
  // Held (parked) bills on this terminal.
  const [heldBills, setHeldBills] = useState<{ sessionId: string; handoffToken: string; grandTotal: number; itemsCount: number; customer?: { fullName?: string } }[]>([]);
  const [holdBusy, setHoldBusy] = useState(false);
  const [cart, setCart] = useGlobalCart();
  const [loading, setLoading] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [lastScannedTimestamp, setLastScannedTimestamp] = useState('');
  const [selectedCartItem, setSelectedCartItem] = useState<PosMobileCartItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated()) {
        router.replace('/login?redirect=/sale');
      }
    }, [router]),
  );

  const offlineSync = useOfflineSync();

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addScannedItemToCart = (data: ScanBarcodeResult | CachedScanResult) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => {
        if (data.variantId && i.variantId) {
          return i.variantId === data.variantId;
        }
        if (data.sku && i.sku) {
          return i.sku.toLowerCase().trim() === data.sku.toLowerCase().trim();
        }
        if (data.barcode && i.barcode) {
          return i.barcode.trim() === data.barcode.trim();
        }
        return false;
      });
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const stock = existing.availableStock ?? 0;
        if (stock > 0 && existing.quantity + 1 > stock) {
          Alert.alert('Stock Limit Reached', `Only ${stock} in stock for ${existing.productName}.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return updated;
      }
      return [
        ...prev,
        {
          productId: data.productId,
          productName: data.productName,
          variantId: data.variantId,
          sku: data.sku,
          barcode: data.barcode,
          variantTitle: data.variantTitle,
          unitPrice: data.price,
          quantity: 1,
          primaryImage: data.primaryImage,
          availableStock: data.availableStock,
          // Carried so the line is taxed at its own rate, not a flat 5%.
          taxPercent: data.taxPercent,
        },
      ];
    });
    setBarcodeInput('');
  };

  const executeBarcodeScan = async (codeToScan: string) => {
    const query = codeToScan.trim();
    if (!query) return;
    const cacheKey = normalizeScanCacheKey(query);

    try {
      setLoading(true);
      const data: ScanBarcodeResult = await posMobileService.scanBarcode(query);
      addScannedItemToCart(data);
      // Cache every successful online scan so it stays sellable offline later.
      offlineScanCacheDb.cacheScanResult({
        key: cacheKey,
        productId: data.productId,
        productName: data.productName,
        variantId: data.variantId,
        sku: data.sku,
        barcode: data.barcode,
        variantTitle: data.variantTitle,
        price: data.price,
        costPrice: data.costPrice,
        availableStock: data.availableStock,
        primaryImage: data.primaryImage,
        cachedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your sign-in session has expired. Tap below to log in again.',
          [
            {
              text: 'Sign In Now',
              onPress: () => router.replace('/login?redirect=/sale'),
            },
          ],
        );
        return;
      }

      if (isNetworkFailure(err)) {
        const cached = await offlineScanCacheDb.getCachedScanResult(cacheKey);
        if (cached) {
          addScannedItemToCart(cached);
        } else {
          Alert.alert(
            'Offline — Not Cached',
            `Backend is unreachable and "${query}" was never scanned before on this device, so it isn't in the offline cache.`,
          );
        }
        return;
      }

      Alert.alert(
        'Barcode Not Found',
        `No variant found for barcode "${query}" (${getApiErrorMessage(err)}).`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scannedCodeParam && timestampParam !== lastScannedTimestamp) {
      setLastScannedTimestamp(timestampParam);
      executeBarcodeScan(scannedCodeParam);
    }
  }, [scannedCodeParam, timestampParam]);

  // Debounced name/SKU search: fires only when the input is not all-digits
  // (a digit-only value is a barcode, waiting for the scan submit).
  useEffect(() => {
    const q = barcodeInput.trim();
    if (q.length < 2 || /^\d+$/.test(q)) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearching(true);
        const rows = await posMobileService.searchProducts(q, false, 8);
        setSearchResults(rows as ScanBarcodeResult[]);
      } catch {
        // Silent -- a keystroke miss shouldn't shout at the cashier.
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [barcodeInput]);

  // Load categories once, for the quick-buy chip strip.
  useEffect(() => {
    (async () => {
      try {
        const res = await posMobileService.listCategories();
        // Response shape: {data: [{id,name,...}]} or an array
        const list = Array.isArray(res) ? res : res?.data ?? [];
        setCategories(list.map((c: any) => ({ id: c.id, name: c.name })));
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  // Re-fetch tiles when the picked category changes.
  useEffect(() => {
    if (!quickCatId) {
      setQuickTiles([]);
      return;
    }
    (async () => {
      try {
        setQuickLoading(true);
        const rows = await posMobileService.listByCategory(quickCatId, false, 24);
        setQuickTiles(rows as ScanBarcodeResult[]);
      } catch {
        setQuickTiles([]);
      } finally {
        setQuickLoading(false);
      }
    })();
  }, [quickCatId]);

  const refreshHeldBills = useCallback(async () => {
    try {
      const rows = await posMobileService.listHeldSessions();
      setHeldBills(rows as any[]);
    } catch {
      setHeldBills([]);
    }
  }, []);

  useEffect(() => { refreshHeldBills(); }, [refreshHeldBills]);

  // Park the current cart; the checkout-session record marks it DRAFT so it
  // shows up in listHeldSessions but doesn't reserve stock.
  const handleHold = async () => {
    if (cart.length === 0) return;
    try {
      setHoldBusy(true);
      await posMobileService.createCheckoutSession({
        items: cart,
        hold: true,
      });
      setCart([]);
      await refreshHeldBills();
    } catch (err) {
      Alert.alert('Could not hold', getApiErrorMessage(err, 'Try again.'));
    } finally {
      setHoldBusy(false);
    }
  };

  // Adopt = restore the held cart into the current session. Same endpoint the
  // handoff flow uses, since a held bill is stored as a checkout session.
  const handleResumeHeld = async (handoffToken: string) => {
    try {
      const session: any = await posMobileService.adoptSession(handoffToken);
      const restored = (session?.items || []).map((i: any) => ({
        productId: i.productId,
        productName: i.productName,
        variantId: i.variantId,
        sku: i.sku,
        barcode: i.barcode,
        variantTitle: i.variantTitle,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        primaryImage: i.primaryImage,
        availableStock: i.availableStock,
        taxPercent: i.taxPercent,
        discountAmount: i.discountAmount,
      }));
      setCart(restored);
      await refreshHeldBills();
    } catch (err) {
      Alert.alert('Could not resume', getApiErrorMessage(err, 'Try again.'));
    }
  };

  const handleDiscardHeld = async (sessionId: string) => {
    try {
      await posMobileService.discardHeldSession(sessionId);
      await refreshHeldBills();
    } catch (err) {
      Alert.alert('Could not discard', getApiErrorMessage(err, 'Try again.'));
    }
  };

  const handleScanSubmit = () => {
    executeBarcodeScan(barcodeInput);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const stock = item.availableStock ?? 0;
      if (delta > 0 && stock > 0 && newQty > stock) {
        Alert.alert('Stock Limit Reached', `Only ${stock} in stock for ${item.productName}.`);
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProceedCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Cart is Empty', 'Please scan or add at least one item to proceed.');
      return;
    }

    router.push({
      pathname: '/checkout-mode',
      params: {
        cartJson: JSON.stringify(cart),
        subtotal: subtotal.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <ConnectivityBadge
            isBackendReachable={offlineSync.isBackendReachable}
            pendingCount={offlineSync.pendingCount}
            needsReviewCount={offlineSync.needsReviewCount}
            isSyncing={offlineSync.isSyncing}
          />
        </View>
        <TouchableOpacity
          style={styles.printerSettingsBtn}
          onPress={() => router.push('/printer-settings')}
        >
          <Printer size={18} color="#0284c7" />
        </TouchableOpacity>
      </View>

      {/* Top Barcode Search Input & Camera Scanner Button */}
      <View style={styles.searchBarContainer}>
        <View style={styles.inputWrapper}>
          <Barcode size={20} color="#0284c7" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            onSubmitEditing={handleScanSubmit}
            placeholder="Scan barcode or type SKU..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={handleScanSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Search size={18} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* Camera Scanner Trigger (Dedicated Screen & Modal fallback) */}
        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={() => router.push({ pathname: '/scanner', params: { returnScreen: '/sale' } })}
        >
          <CameraIcon size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Name/SKU search suggestions -- only shows when the input is not
          all-digits (a digit-only value stays a barcode). */}
      {searchResults.length > 0 && (
        <View style={styles.suggestionsBox}>
          {searchResults.slice(0, 6).map((item) => {
            const oos = (item.availableStock ?? 0) <= 0;
            return (
              <TouchableOpacity
                key={item.variantId || item.productId}
                style={[styles.suggestionRow, oos && { opacity: 0.4 }]}
                disabled={oos}
                onPress={() => {
                  addScannedItemToCart(item);
                  setSearchResults([]);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {item.productName}
                    {item.variantTitle ? ` - ${item.variantTitle}` : ''}
                  </Text>
                  <Text style={styles.suggestionMeta}>
                    {item.sku || item.barcode || '--'} - {oos ? 'Out of stock' : `${item.availableStock ?? 0} in stock`}
                  </Text>
                </View>
                <Text style={styles.suggestionPrice}>Rs.{item.price}</Text>
              </TouchableOpacity>
            );
          })}
          {searching && <Text style={styles.suggestionsMeta}>Searching...</Text>}
        </View>
      )}

      {/* Quick Sample Barcodes Picker Strip */}
      <View style={styles.sampleStrip}>
        <Text style={styles.sampleLabel}>TAP SAMPLE BARCODE:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {SAMPLE_BARCODES.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.sampleChip}
              onPress={() => executeBarcodeScan(item.code)}
            >
              <Text style={styles.sampleChipText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Held (parked) bills */}
      {heldBills.length > 0 && (
        <View style={styles.heldStrip}>
          <Text style={styles.heldLabel}>HELD BILLS ({heldBills.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {heldBills.map((b) => (
              <View key={b.sessionId} style={styles.heldChipRow}>
                <TouchableOpacity onPress={() => handleResumeHeld(b.handoffToken)} style={styles.heldChip}>
                  <Text style={styles.heldChipName} numberOfLines={1}>
                    {b.customer?.fullName || 'Walk-in'} - Rs.{b.grandTotal.toFixed(0)}
                  </Text>
                  <Text style={styles.heldChipMeta}>{b.itemsCount} items</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDiscardHeld(b.sessionId)} style={styles.heldDiscard}>
                  <Text style={styles.heldDiscardText}>x</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick-buy category grid */}
      <View style={styles.quickBuyCard}>
        <View style={styles.quickBuyHeaderRow}>
          <Text style={styles.quickBuyTitle}>Quick Buy</Text>
          <TouchableOpacity onPress={() => setQuickBuyOpen((v) => !v)}>
            <Text style={styles.quickBuyToggle}>{quickBuyOpen ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>
        {quickBuyOpen && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setQuickCatId(c.id)}
                  style={[styles.catChip, quickCatId === c.id && styles.catChipActive]}
                >
                  <Text style={[styles.catChipText, quickCatId === c.id && styles.catChipTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {quickCatId ? (
              quickLoading ? (
                <Text style={styles.quickMeta}>Loading tiles...</Text>
              ) : quickTiles.length === 0 ? (
                <Text style={styles.quickMeta}>No sellable products in this category.</Text>
              ) : (
                <View style={styles.tileGrid}>
                  {quickTiles.map((it) => {
                    const oos = (it.availableStock ?? 0) <= 0;
                    return (
                      <TouchableOpacity
                        key={it.variantId || it.productId}
                        style={[styles.tile, oos && { opacity: 0.4 }]}
                        disabled={oos}
                        onPress={() => addScannedItemToCart(it)}
                      >
                        <Text style={styles.tileName} numberOfLines={2}>{it.productName}</Text>
                        <Text style={styles.tileMeta} numberOfLines={1}>
                          {it.variantTitle || it.sku || '--'}
                        </Text>
                        <View style={styles.tileFoot}>
                          <Text style={styles.tileStock}>{oos ? 'Out' : `${it.availableStock ?? 0}`}</Text>
                          <Text style={styles.tilePrice}>Rs.{Math.round(it.price)}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )
            ) : (
              <Text style={styles.quickMeta}>Pick a category above.</Text>
            )}
          </>
        )}
      </View>

      {/* Cart Items Header */}
      <View style={styles.cartHeader}>
        <View style={styles.cartHeaderTitleRow}>
          <ShoppingBag size={18} color="#0284c7" />
          <Text style={styles.cartTitle}>Cart ({totalItems} Items)</Text>
        </View>
        {cart.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={handleHold} disabled={holdBusy}>
              <Text style={[styles.clearBtnText, { color: '#0284c7' }]}>
                {holdBusy ? 'Holding...' : 'Hold'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCart([])}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Cart Items List */}
      {cart.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Barcode size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySub}>
            Tap the camera icon 📷 above to scan a barcode sticker or select a sample barcode below.
          </Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item, index) => item.variantId || item.sku || `${item.productId}-${index}`}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <View style={styles.cartCard}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedCartItem(item)}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>
                  {item.variantTitle || 'Standard'} {item.sku ? `• ${item.sku}` : ''}
                </Text>
                <Text style={styles.itemPrice}>₹{item.unitPrice}</Text>
                <Text style={{ fontSize: 11, color: '#0284c7', marginTop: 4, fontWeight: '600' }}>
                  ℹ️ Tap for full details
                </Text>
              </TouchableOpacity>

              <View style={styles.qtyContainer}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(index, -1)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Minus size={14} color="#0369a1" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(index, 1)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Plus size={14} color="#0369a1" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(index)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Bottom Sticky Checkout Bar */}
      {cart.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Subtotal ({totalItems} Items)</Text>
              <Text style={styles.summaryTotal}>₹{subtotal}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleProceedCheckout}>
              <Text style={styles.checkoutBtnText}>CHECKOUT</Text>
              <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Product Details Confirmation Modal */}
      <Modal
        visible={!!selectedCartItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCartItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Info size={20} color="#0284c7" style={{ marginRight: 8 }} />
                <Text style={styles.modalHeaderTitle}>Product Details</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedCartItem(null)} style={{ padding: 4 }}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedCartItem && (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {selectedCartItem.primaryImage ? (
                  <View style={styles.modalImageWrapper}>
                    <Image
                      source={{ uri: selectedCartItem.primaryImage }}
                      style={styles.modalProductImage}
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                <Text style={styles.modalProductName}>{selectedCartItem.productName}</Text>
                <Text style={styles.modalProductPrice}>₹{selectedCartItem.unitPrice}</Text>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Variant / Size</Text>
                    <Text style={styles.detailValue}>{selectedCartItem.variantTitle || 'Standard'}</Text>
                  </View>

                  {selectedCartItem.sku ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>SKU Code</Text>
                      <Text style={styles.detailValue}>{selectedCartItem.sku}</Text>
                    </View>
                  ) : null}

                  {selectedCartItem.barcode ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Barcode Number</Text>
                      <Text style={styles.detailValue}>{selectedCartItem.barcode}</Text>
                    </View>
                  ) : null}

                  {selectedCartItem.availableStock !== undefined ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>In-Store Stock</Text>
                      <Text style={[styles.detailValue, { color: '#059669', fontWeight: 'bold' }]}>
                        {selectedCartItem.availableStock} Units Available
                      </Text>
                    </View>
                  ) : null}

                  {selectedCartItem.taxPercent !== undefined ? (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>GST Rate</Text>
                      <Text style={styles.detailValue}>{selectedCartItem.taxPercent}% GST</Text>
                    </View>
                  ) : null}

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantity in Cart</Text>
                    <Text style={styles.detailValue}>{selectedCartItem.quantity} Item(s)</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Item Total</Text>
                    <Text style={[styles.detailValue, { color: '#0284c7', fontWeight: 'bold', fontSize: 15 }]}>
                      ₹{selectedCartItem.unitPrice * selectedCartItem.quantity}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setSelectedCartItem(null)}>
              <Text style={styles.modalDoneBtnText}>OK / Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fallback Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onScan={(code) => executeBarcodeScan(code)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  suggestionsBox: { marginHorizontal: 12, marginBottom: 4, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  suggestionName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  suggestionMeta: { fontSize: 11, color: '#6b7280', marginTop: 2, fontFamily: 'monospace' },
  suggestionPrice: { fontSize: 13, fontWeight: '800', color: '#111827', marginLeft: 8 },
  suggestionsMeta: { fontSize: 11, color: '#9ca3af', padding: 8, textAlign: 'center' },
  heldStrip: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fef3c7', borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  heldLabel: { fontSize: 10, fontWeight: '800', color: '#92400e', letterSpacing: 0.6, marginBottom: 6 },
  heldChipRow: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  heldChip: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fcd34d', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, minWidth: 140 },
  heldChipName: { fontSize: 12, fontWeight: '700', color: '#78350f' },
  heldChipMeta: { fontSize: 10, color: '#a16207' },
  heldDiscard: { width: 24, height: 24, backgroundColor: '#fef3c7', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  heldDiscardText: { fontSize: 14, fontWeight: '700', color: '#92400e' },
  quickBuyCard: { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 10 },
  quickBuyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickBuyTitle: { fontSize: 11, fontWeight: '800', color: '#6b7280', letterSpacing: 0.6, textTransform: 'uppercase' },
  quickBuyToggle: { fontSize: 11, fontWeight: '700', color: '#0284c7' },
  catChip: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 6 },
  catChipActive: { backgroundColor: '#0284c7' },
  catChipText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  catChipTextActive: { color: '#ffffff' },
  quickMeta: { fontSize: 11, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
  tile: { width: '31%', backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 8 },
  tileName: { fontSize: 11, fontWeight: '700', color: '#111827' },
  tileMeta: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  tileFoot: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileStock: { fontSize: 10, color: '#6b7280' },
  tilePrice: { fontSize: 12, fontWeight: '800', color: '#111827' },

  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  printerSettingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchBarContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0369a1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleStrip: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0369a1',
    marginRight: 8,
  },
  sampleChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  sampleChipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cartHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: 'bold',
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
    lineHeight: 18,
  },
  cartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  itemMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 4,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
    width: 24,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 6,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0f2fe',
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 2,
  },
  checkoutBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailsModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalImageWrapper: {
    alignItems: 'center',
    marginVertical: 12,
  },
  modalProductImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
  },
  modalProductPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 4,
    marginBottom: 12,
  },
  detailsGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
  },
  modalDoneBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
