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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Barcode, Search, Plus, Printer, Check, Camera as CameraIcon } from 'lucide-react-native';
import { posMobileService } from '../services/api';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

const SAMPLE_BARCODES = [
  { label: 'Saree (890100000005)', code: '890100000005' },
  { label: 'Kurti (890100000001)', code: '890100000001' },
  { label: 'SKU KUR-BLU-L-005', code: 'KUR-BLU-L-005' },
  { label: 'Lehenga (890100000002)', code: '890100000002' },
];

export default function MobileAddStockScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scannedCodeParam = params.scannedCode as string;
  const timestampParam = params.timestamp as string;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [quantityReceived, setQuantityReceived] = useState('15');
  const [supplier, setSupplier] = useState('ABC Textiles');
  const [printLabels, setPrintLabels] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [lastScannedTimestamp, setLastScannedTimestamp] = useState('');

  const executeBarcodeScan = async (codeToScan: string) => {
    const query = codeToScan.trim();
    if (!query) return;

    try {
      setLoading(true);
      const data = await posMobileService.scanBarcode(query);
      setSelectedVariant(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      Alert.alert('Variant Not Found', `No variant matching barcode "${query}" (${errorMessage})`);
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

  const handleSaveStock = async () => {
    if (!selectedVariant) {
      Alert.alert('No Variant Selected', 'Please scan or search a product variant first.');
      return;
    }

    const qty = Number(quantityReceived);
    if (qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid stock quantity.');
      return;
    }

    try {
      setLoading(true);
      await posMobileService.addStock({
        variantId: selectedVariant.variantId,
        quantity: qty,
        location: 'Main Store',
        supplier,
        notes: 'Mobile App Stock Replenishment',
      });

      Alert.alert(
        'Stock Updated! ✓',
        `Successfully added +${qty} pieces to ${selectedVariant.productName}. ${printLabels ? `${qty} barcode sticker labels sent to printer.` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ],
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      Alert.alert('Error', `Could not update stock: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* 1. FIND PRODUCT */}
      <Text style={styles.sectionTitle}>1. Find Variant to Replenish</Text>

      <View style={styles.searchCard}>
        <View style={styles.inputWrapper}>
          <Barcode size={20} color="#ca8a04" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            value={barcodeInput}
            onChangeText={setBarcodeInput}
            onSubmitEditing={handleScanSubmit}
            placeholder="Scan barcode or type SKU..."
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity style={styles.findBtn} onPress={handleScanSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Search size={18} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* Dedicated Full-Screen Camera Scanner Trigger */}
        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={() => router.push({ pathname: '/scanner', params: { returnScreen: '/add-stock' } })}
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

      {/* VARIANT CARD */}
      {selectedVariant && (
        <View style={styles.variantCard}>
          <Text style={styles.variantTitle}>{selectedVariant.productName}</Text>
          <Text style={styles.variantMeta}>
            {selectedVariant.variantTitle || 'Standard'} • SKU: {selectedVariant.sku}
          </Text>
          <Text style={styles.variantPrice}>Selling Price: ₹{selectedVariant.price}</Text>

          <View style={styles.stockSummaryRow}>
            <View style={styles.stockBox}>
              <Text style={styles.stockBoxLabel}>Current Stock</Text>
              <Text style={styles.stockBoxVal}>{selectedVariant.availableStock} Pcs</Text>
            </View>
            <View style={[styles.stockBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Text style={[styles.stockBoxLabel, { color: '#166534' }]}>Stock After</Text>
              <Text style={[styles.stockBoxVal, { color: '#14532d' }]}>
                {selectedVariant.availableStock + Number(quantityReceived || 0)} Pcs
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 2. REPLENISHMENT DETAILS */}
      <Text style={styles.sectionTitle}>2. Quantity Received & Labels</Text>

      <View style={styles.formCard}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Quantity Received (Pieces) *</Text>
          <TextInput
            style={styles.inputBig}
            value={quantityReceived}
            onChangeText={setQuantityReceived}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Supplier Name</Text>
          <TextInput
            style={styles.input}
            value={supplier}
            onChangeText={setSupplier}
            placeholder="e.g. ABC Textiles"
          />
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setPrintLabels(!printLabels)}
          activeOpacity={0.8}
        >
          <Printer size={20} color="#ca8a04" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.checkboxTitle}>Print Barcode Sticker Labels</Text>
            <Text style={styles.checkboxSub}>
              Generate {quantityReceived || 0} stickers (50mm × 25mm) for received pieces.
            </Text>
          </View>
          <View style={[styles.checkboxCircle, printLabels && styles.checkboxCircleActive]}>
            {printLabels && <Check size={12} color="#ffffff" />}
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSaveStock}
        disabled={!selectedVariant || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Plus size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>SAVE STOCK & GENERATE LABELS</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Fallback Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        visible={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onScan={(code) => executeBarcodeScan(code)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
  },
  searchCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 6,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  inputBig: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  findBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0369a1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleStrip: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  variantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 16,
  },
  variantTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  variantMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  variantPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 6,
  },
  stockSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stockBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  stockBoxLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  stockBoxVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 16,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 4,
  },
  checkboxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  checkboxSub: {
    fontSize: 10,
    color: '#0284c7',
    marginTop: 1,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCircleActive: {
    backgroundColor: '#0284c7',
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
