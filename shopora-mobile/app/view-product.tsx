import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Barcode, Search, PackagePlus, ShoppingBag, Camera as CameraIcon } from 'lucide-react-native';
import { posMobileService } from '../services/api';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';

const SAMPLE_BARCODES = [
  { label: 'Saree (890100000005)', code: '890100000005' },
  { label: 'Kurti (890100000001)', code: '890100000001' },
  { label: 'SKU KUR-BLU-L-005', code: 'KUR-BLU-L-005' },
  { label: 'Lehenga (890100000002)', code: '890100000002' },
];

export default function ViewProductScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scannedCodeParam = params.scannedCode as string;
  const timestampParam = params.timestamp as string;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [lastScannedTimestamp, setLastScannedTimestamp] = useState('');

  const executeBarcodeScan = async (codeToScan: string) => {
    const query = codeToScan.trim();
    if (!query) return;

    try {
      setLoading(true);
      const data = await posMobileService.scanBarcode(query);
      setProductData(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      Alert.alert('Not Found', `No product found for barcode "${query}" (${errorMessage})`);
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.searchCard}>
        <View style={styles.inputWrapper}>
          <Barcode size={20} color="#0284c7" style={{ marginRight: 8 }} />
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
          onPress={() => router.push({ pathname: '/scanner', params: { returnScreen: '/view-product' } })}
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

      {productData ? (
        <View style={styles.detailsCard}>
          {/* Header Image & Status */}
          <View style={styles.headerRow}>
            {productData.primaryImage ? (
              <Image source={{ uri: productData.primaryImage }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={{ fontSize: 24 }}>👗</Text>
              </View>
            )}

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.badgeRow}>
                <Text style={styles.stockBadge}>
                  {productData.availableStock > 5 ? '✓ IN STOCK' : productData.availableStock > 0 ? '⚠ LOW STOCK' : '✕ OUT OF STOCK'}
                </Text>
              </View>
              <Text style={styles.title}>{productData.productName}</Text>
              <Text style={styles.sub}>{productData.variantTitle || 'Standard Variant'}</Text>
              <Text style={styles.price}>₹{productData.price}</Text>
            </View>
          </View>

          {/* Details Table */}
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>SKU Code</Text>
              <Text style={styles.tableVal}>{productData.sku || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Barcode Number</Text>
              <Text style={styles.tableVal}>{productData.barcode || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Available Stock</Text>
              <Text style={[styles.tableVal, { color: '#16a34a', fontWeight: 'bold' }]}>
                {productData.availableStock} Pcs
              </Text>
            </View>
            {productData.costPrice && (
              <>
                <View style={styles.divider} />
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Cost Price (Manager)</Text>
                  <Text style={styles.tableVal}>₹{productData.costPrice}</Text>
                </View>
              </>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={() => router.push('/sale')}
            >
              <ShoppingBag size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnPrimaryText}>Add to Sale</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={() => router.push('/add-stock')}
            >
              <PackagePlus size={16} color="#0369a1" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnSecondaryText}>Add Stock</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Barcode size={48} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Inspect Product Variant</Text>
          <Text style={styles.emptySub}>
            Tap the camera icon 📷 above to scan a barcode sticker or select a sample barcode below.
          </Text>
        </View>
      )}

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
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stockBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803d',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  sub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 4,
  },
  table: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  tableLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  tableVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 15,
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
});
