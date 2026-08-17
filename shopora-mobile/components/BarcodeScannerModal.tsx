import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera as CameraIcon, Flashlight, Barcode, Check } from 'lucide-react-native';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const QUICK_TEST_BARCODES = [
  { label: 'Saree (890100000005)', code: '890100000005' },
  { label: 'Kurti (890100000001)', code: '890100000001' },
  { label: 'SKU KUR-BLU-L-005', code: 'KUR-BLU-L-005' },
  { label: 'Lehenga (890100000002)', code: '890100000002' },
];

export function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setManualCode('');
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible, permission?.granted]);

  const handleBarcodeScanned = (result: any) => {
    if (scanned) return;

    // Robust extraction for Expo SDK 57 result object
    const rawData = result?.data || result?.raw || (typeof result === 'string' ? result : null);

    if (rawData) {
      setScanned(true);
      Vibration.vibrate(100); // Haptic feedback on scan
      const cleanedCode = String(rawData).trim();
      onScan(cleanedCode);
      onClose();

      // Reset scan lock after 1.5s
      setTimeout(() => setScanned(false), 1500);
    }
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      onClose();
    }
  };

  const handleQuickSelect = (code: string) => {
    onScan(code);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <CameraIcon size={22} color="#bae6fd" />
            <Text style={styles.headerTitle}>Scan Barcode (Rear Camera)</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Camera Scanner View */}
        {!permission ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.permText}>Opening camera hardware...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerContainer}>
            <Barcode size={48} color="#0284c7" />
            <Text style={styles.permTitle}>Camera Permission Required</Text>
            <Text style={styles.permText}>
              Please grant camera access to scan barcode stickers live with your rear camera.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={requestPermission}>
              <Text style={styles.retryBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraWrapper}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              autofocus="on"
              enableTorch={enableTorch}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                // Every barcode label this store prints (see backend BarcodeService)
                // is Code128 -- restricting detection to just that format means the
                // camera's native decoder isn't wasting each frame testing five
                // other symbologies, which is the main lever for faster scans.
                barcodeTypes: ['code128'],
              }}
            />

            {/* Target Reticle Overlay */}
            <View style={styles.overlayContainer} pointerEvents="none">
              <View style={styles.scanTarget}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <View style={styles.scanLine} />
              </View>
              <Text style={styles.scanHint}>
                {scanned ? '✓ Barcode Detected!' : '📷 Point Rear Camera at Barcode'}
              </Text>
            </View>

            {/* Torch Toggle */}
            <TouchableOpacity
              style={styles.torchBtn}
              onPress={() => setEnableTorch(!enableTorch)}
            >
              <Flashlight size={18} color={enableTorch ? '#fcd34d' : '#ffffff'} />
              <Text style={styles.torchText}>{enableTorch ? 'Flash ON' : 'Flash OFF'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Quick Test Barcode Bar & Manual Entry */}
        <View style={styles.bottomSheet}>
          <Text style={styles.bottomSheetTitle}>Tap Sample Barcode to Test:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {QUICK_TEST_BARCODES.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chipBtn}
                onPress={() => handleQuickSelect(item.code)}
              >
                <Text style={styles.chipText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Manual Input Fallback */}
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Or type SKU code..."
              placeholderTextColor="#9ca3af"
              onSubmitEditing={handleManualSubmit}
            />
            <TouchableOpacity style={styles.manualSubmitBtn} onPress={handleManualSubmit}>
              <Check size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0284c7',
    paddingTop: 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  closeBtn: {
    padding: 6,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f0f9ff',
  },
  permTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
    marginTop: 12,
  },
  permText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  retryBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanTarget: {
    width: 260,
    height: 160,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#0284c7',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#38bdf8',
  },
  scanHint: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 20,
  },
  torchBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  torchText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0f2fe',
  },
  bottomSheetTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369a1',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipBtn: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginRight: 8,
  },
  manualSubmitBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
