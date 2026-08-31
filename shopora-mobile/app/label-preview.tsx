import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Printer, Check, ArrowRight, Package, AlertCircle, Copy, Bluetooth } from 'lucide-react-native';
import { barcodeService, getApiErrorMessage, type CreatedVariant, type LabelSize, LABEL_SIZE_OPTIONS } from '../services/api';
import { getLastCreatedProduct, clearLastCreatedProduct } from '../services/product-draft';
import { bluetoothPrinterService } from '../services/bluetooth-printer';

/** Physical label roll dimensions matching LABEL_SIZE_OPTIONS's displayed sizes, for the direct Bluetooth print path. */
const LABEL_SIZE_MM: Record<LabelSize, { widthMm: number; heightMm: number }> = {
  SMALL: { widthMm: 50, heightMm: 25 },
  MEDIUM: { widthMm: 75, heightMm: 40 },
  LARGE: { widthMm: 100, heightMm: 50 },
};

/**
 * Final step of the add-product flow: show the barcode the backend issued for
 * every variant and print the sticker labels.
 *
 * The barcode image comes from GET /pos/barcodes/generate (a PNG stream, so the
 * <Image> renders the URL directly) and the printable label from
 * POST /pos/barcodes/batch-stickers, which returns both HTML and a TSPL payload
 * for a thermal label printer.
 */
export default function LabelPreviewScreen() {
  const router = useRouter();
  const product = getLastCreatedProduct();

  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [labelSize, setLabelSize] = useState<LabelSize>('SMALL');

  if (!product) {
    return (
      <View style={styles.emptyState}>
        <Package size={40} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>No product to label</Text>
        <Text style={styles.emptyText}>
          Create a product first — barcodes are issued when its variants are saved.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/add-product')}>
          <Text style={styles.primaryBtnText}>GO TO ADD PRODUCT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const labelPrice = product.salePrice ?? product.basePrice;

  const quantityFor = (variant: CreatedVariant) => {
    const raw = quantities[variant.variantId];
    if (raw === undefined) return Math.max(1, variant.stock || 1);
    return Math.max(1, parseInt(raw, 10) || 1);
  };

  const handlePrint = async (variant: CreatedVariant) => {
    setPrintingId(variant.variantId);
    try {
      if (bluetoothPrinterService.isConnected()) {
        // Built from local variant data directly via the printer's TSC/TSPL
        // driver -- see services/bluetooth-printer.ts for why this doesn't
        // go through the backend's tspl text field.
        await bluetoothPrinterService.printLabel({
          productName: product.name,
          variantTitle: variant.title,
          sku: variant.sku,
          barcode: variant.barcode,
          price: labelPrice,
          storeName: product.brandName,
          quantity: quantityFor(variant),
          ...LABEL_SIZE_MM[labelSize],
        });
      } else {
        // No printer connected, so the generated label is shared out to
        // whatever can consume it instead (label printer app, AirPrint, email).
        const label = await barcodeService.batchStickers({
          productName: product.name,
          variantTitle: variant.title,
          sku: variant.sku,
          barcode: variant.barcode,
          price: labelPrice,
          quantity: quantityFor(variant),
          labelSize,
        });
        await Share.share({
          title: `Label — ${variant.sku}`,
          message: label.tspl || label.html,
        });
      }
    } catch (err) {
      Alert.alert('Could not print label', getApiErrorMessage(err, 'Label generation failed'));
    } finally {
      setPrintingId(null);
    }
  };

  const handlePrintAll = async () => {
    for (const variant of product.variants) {
      await handlePrint(variant);
    }
  };

  const copyBarcode = async (variant: CreatedVariant) => {
    await Share.share({ message: variant.barcode });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 36 }}>
      <View style={styles.successBanner}>
        <Check size={18} color="#15803d" style={{ marginRight: 8 }} />
        <Text style={styles.successText}>
          {product.name} created with {product.variants.length} variant
          {product.variants.length === 1 ? '' : 's'}.
        </Text>
      </View>

      <View style={styles.noteBox}>
        <AlertCircle size={14} color="#0369a1" style={{ marginRight: 8 }} />
        <Text style={styles.noteText}>
          Each barcode below was issued by the server and is already linked to its variant — scanning
          it in POS Sale will find this product.
        </Text>
      </View>

      <Text style={styles.sizeSectionLabel}>LABEL SIZE</Text>
      <View style={styles.labelSizeRow}>
        {LABEL_SIZE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.labelSizeChip, labelSize === opt.value && styles.labelSizeChipActive]}
            onPress={() => setLabelSize(opt.value)}
          >
            <Text style={[styles.labelSizeChipTitle, labelSize === opt.value && styles.labelSizeChipTitleActive]}>
              {opt.title}
            </Text>
            <Text style={[styles.labelSizeChipDim, labelSize === opt.value && styles.labelSizeChipDimActive]}>
              {opt.dimensions}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.printerStatusRow} onPress={() => router.push('/printer-settings')}>
        <Bluetooth size={14} color={bluetoothPrinterService.isConnected() ? '#15803d' : '#9ca3af'} style={{ marginRight: 8 }} />
        <Text style={styles.printerStatusText}>
          {bluetoothPrinterService.isConnected()
            ? `Printer connected — labels print directly to ${bluetoothPrinterService.connectedDeviceName() || 'device'}`
            : 'No printer connected — labels will be shared instead. Tap to connect one.'}
        </Text>
      </TouchableOpacity>

      {product.variants.map((variant) => (
        <View key={variant.variantId} style={styles.stickerCard}>
          {/* Header: Blue Diamond + VASANTHI DESIGNERS */}
          <View style={styles.stickerHeaderRow}>
            <Text style={styles.headerDiamond}>❖</Text>
            <Text style={styles.stickerBrand}>{(product.brandName || 'VASANTHI DESIGNERS').toUpperCase()}</Text>
          </View>
          <View style={styles.divider} />

          {/* Product Title | Color / Size */}
          <Text style={styles.stickerName} numberOfLines={1}>
            {product.name} | {variant.title}
          </Text>

          {/* Black SKU Pill Badge */}
          <View style={styles.skuBadge}>
            <Text style={styles.skuBadgeText}>{variant.sku}</Text>
          </View>

          {/* Side-by-Side Barcode + QR Code */}
          <View style={styles.codesRow}>
            <View style={styles.barcodeCol}>
              <Image
                source={{ uri: barcodeService.imageUrl(variant.barcode, { scale: 3, height: 14 }) }}
                style={styles.barcodeImage}
                resizeMode="contain"
              />
              <Text style={styles.barcodeNumber}>{variant.barcode}</Text>
              <Text style={styles.skuSubText}>{variant.sku}</Text>
            </View>

            <View style={styles.dashedDivider} />

            <View style={styles.qrCol}>
              <Image
                source={{ uri: barcodeService.imageUrl(variant.barcode, { bcid: 'qrcode', scale: 3 }) }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Divider & Large Bold Price */}
          <View style={styles.divider} />
          <Text style={styles.priceText}>₹{labelPrice}</Text>

          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Opening stock: {variant.stock}</Text>
          </View>

          <View style={styles.printRow}>
            <View style={styles.qtyWrap}>
              <Text style={styles.qtyLabel}>Copies</Text>
              <TextInput
                style={styles.qtyInput}
                value={quantities[variant.variantId] ?? String(Math.max(1, variant.stock || 1))}
                onChangeText={(t) =>
                  setQuantities((prev) => ({ ...prev, [variant.variantId]: t.replace(/[^0-9]/g, '') }))
                }
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity
              style={styles.printBtn}
              onPress={() => handlePrint(variant)}
              disabled={printingId === variant.variantId}
            >
              {printingId === variant.variantId ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Printer size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.printBtnText}>PRINT LABEL</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.copyBtn} onPress={() => copyBarcode(variant)}>
              <Copy size={15} color="#0284c7" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {product.variants.length > 1 && (
        <TouchableOpacity style={styles.secondaryBtn} onPress={handlePrintAll}>
          <Printer size={16} color="#0284c7" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryBtnText}>PRINT ALL {product.variants.length} LABELS</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => {
          clearLastCreatedProduct();
          router.replace('/sale');
        }}
      >
        <Text style={styles.primaryBtnText}>DONE — GO TO POS SALE</Text>
        <ArrowRight size={16} color="#ffffff" style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.ghostBtn}
        onPress={() => {
          clearLastCreatedProduct();
          router.replace('/add-product');
        }}
      >
        <Text style={styles.ghostBtnText}>Add another product</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151', marginTop: 14 },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 8, lineHeight: 19 },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
  },
  successText: { flex: 1, color: '#15803d', fontSize: 13, fontWeight: '600' },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  noteText: { flex: 1, color: '#0369a1', fontSize: 11, lineHeight: 16 },

  sizeSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  labelSizeRow: { flexDirection: 'row', gap: 8 },
  labelSizeChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  labelSizeChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  labelSizeChipTitle: { fontSize: 12, fontWeight: '700', color: '#374151' },
  labelSizeChipTitleActive: { color: '#ffffff' },
  labelSizeChipDim: { fontSize: 10, color: '#9ca3af', marginTop: 1 },
  labelSizeChipDimActive: { color: '#bae6fd' },

  printerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  printerStatusText: { flex: 1, color: '#6b7280', fontSize: 11, lineHeight: 16 },

  stickerCard: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#a3a3a3',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  stickerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerDiamond: { color: '#0284c7', fontSize: 12, fontWeight: 'bold' },
  stickerBrand: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: '#171717', fontFamily: 'serif' },
  divider: { width: '100%', height: 1, backgroundColor: '#e5e5e5', marginVertical: 8 },
  stickerName: { fontSize: 12, fontWeight: '700', color: '#262626', textAlign: 'center' },
  skuBadge: {
    backgroundColor: '#09090b',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginVertical: 8,
  },
  skuBadgeText: { color: '#ffffff', fontFamily: 'monospace', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  codesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginVertical: 6 },
  barcodeCol: { alignItems: 'center' },
  barcodeImage: { width: 140, height: 48, backgroundColor: '#ffffff' },
  barcodeNumber: { fontSize: 10, fontFamily: 'monospace', fontWeight: '600', color: '#404040', marginTop: -2 },
  skuSubText: { fontSize: 9, fontFamily: 'monospace', color: '#737373' },
  dashedDivider: { height: 48, borderWidth: 0.5, borderStyle: 'dashed', borderColor: '#d4d4d4', marginHorizontal: 4 },
  qrCol: { alignItems: 'center', justifyContent: 'center' },
  qrImage: { width: 48, height: 48 },
  priceText: { fontSize: 24, fontWeight: '900', color: '#000000', marginVertical: 2 },
  stockRow: { marginTop: 4 },
  stockLabel: { fontSize: 11, color: '#6b7280' },

  printRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 16, width: '100%' },
  qtyWrap: { width: 74 },
  qtyLabel: { fontSize: 10, color: '#9ca3af', marginBottom: 4, fontWeight: '700' },
  qtyInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 13,
  },
  printBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },
  copyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#e0f2fe',
  },
  secondaryBtnText: { color: '#0284c7', fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13, letterSpacing: 0.4 },

  ghostBtn: { alignItems: 'center', paddingVertical: 16 },
  ghostBtnText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
});
