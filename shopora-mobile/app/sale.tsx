import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Camera as CameraIcon,
} from 'lucide-react-native';
import { posMobileService, PosMobileCartItem } from '../services/api';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

const SAMPLE_BARCODES = [
  { label: 'Saree (890100000005)', code: '890100000005' },
  { label: 'Kurti (890100000001)', code: '890100000001' },
  { label: 'SKU KUR-BLU-L-005', code: 'KUR-BLU-L-005' },
  { label: 'Lehenga (890100000002)', code: '890100000002' },
];

export default function SaleProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scannedCodeParam = params.scannedCode as string;
  const timestampParam = params.timestamp as string;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<PosMobileCartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [lastScannedTimestamp, setLastScannedTimestamp] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const executeBarcodeScan = async (codeToScan: string) => {
    const query = codeToScan.trim();
    if (!query) return;

    try {
      setLoading(true);
      const data = await posMobileService.scanBarcode(query);

      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.variantId === data.variantId || (i.sku && i.sku === data.sku),
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex].quantity += 1;
          return updated;
        }
        return [
          ...prev,
          {
            productId: data.productId,
            productName: data.productName,
            variantId: data.variantId,
            sku: data.sku,
            variantTitle: data.variantTitle,
            unitPrice: data.price,
            quantity: 1,
            primaryImage: data.primaryImage,
            availableStock: data.availableStock,
          },
        ];
      });

      setBarcodeInput('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      Alert.alert(
        'Barcode Not Found',
        `No variant found for barcode "${query}". Make sure the backend server is running (${errorMessage}).`,
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

  const handleScanSubmit = () => {
    executeBarcodeScan(barcodeInput);
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
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

      {/* Cart Items Header */}
      <View style={styles.cartHeader}>
        <View style={styles.cartHeaderTitleRow}>
          <ShoppingBag size={18} color="#0284c7" />
          <Text style={styles.cartTitle}>Cart ({totalItems} Items)</Text>
        </View>
        {cart.length > 0 && (
          <TouchableOpacity onPress={() => setCart([])}>
            <Text style={styles.clearBtnText}>Clear Cart</Text>
          </TouchableOpacity>
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
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={({ item, index }) => (
            <View style={styles.cartCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>
                  {item.variantTitle || 'Standard'} {item.sku ? `• ${item.sku}` : ''}
                </Text>
                <Text style={styles.itemPrice}>₹{item.unitPrice}</Text>
              </View>

              <View style={styles.qtyContainer}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(index, -1)}>
                  <Minus size={14} color="#0369a1" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(index, 1)}>
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
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
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
});
