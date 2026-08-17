import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Flashlight, Image as ImageIcon, Barcode, Check } from 'lucide-react-native';

const QUICK_TEST_BARCODES = [
  { label: 'Saree (890100000005)', code: '890100000005' },
  { label: 'Kurti (890100000001)', code: '890100000001' },
  { label: 'SKU KUR-BLU-L-005', code: 'KUR-BLU-L-005' },
  { label: 'Lehenga (890100000002)', code: '890100000002' },
];

export default function DedicatedScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnScreen = (params.returnScreen as string) || '/sale';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const handleBarcodeScanned = (result: any) => {
    if (scanned) return;
    const rawData = result?.data || result?.raw || (typeof result === 'string' ? result : null);
    if (rawData) {
      setScanned(true);
      Vibration.vibrate(100);
      router.replace({
        pathname: returnScreen as any,
        params: { scannedCode: String(rawData).trim(), timestamp: Date.now().toString() },
      });
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const barcodes = await scanFromURLAsync(result.assets[0].uri);
        if (barcodes && barcodes.length > 0) {
          handleBarcodeScanned(barcodes[0]);
        } else {
          Alert.alert('No Barcode Found', 'Could not detect a valid barcode in the selected image.');
        }
      }
    } catch (e) {
      Alert.alert('Scan Error', 'Unable to process barcode from gallery image.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barcode Scanner</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={pickImage} style={{ marginRight: 16 }}>
            <ImageIcon size={22} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.torchBtn} onPress={() => setEnableTorch(!enableTorch)}>
            <Flashlight size={22} color={enableTorch ? '#fcd34d' : '#ffffff'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Camera / Permission Area */}
      {!permission ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#38bdf8" />
          <Text style={styles.permText}>Initialising Camera Hardware...</Text>
        </View>
      ) : !permission.granted ? (
        <View style={styles.centerContainer}>
          <Barcode size={54} color="#38bdf8" />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permText}>
            Shopora Mobile POS requires camera permission to scan product barcode labels.
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
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

          {/* Scanner Reticle Overlay */}
          <View style={styles.overlayContainer} pointerEvents="none">
            <View style={styles.scanTarget}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <View style={styles.scanLine} />
            </View>
            <Text style={styles.scanHint}>
              {scanned ? '✓ Barcode Detected!' : '📷 Point Rear Lens at Barcode Label'}
            </Text>
          </View>
        </View>
      )}

      {/* Bottom Sheet for Sample Selection */}
      <View style={styles.bottomSheet}>
        <Text style={styles.bottomSheetTitle}>Tap Sample Barcode to Test:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {QUICK_TEST_BARCODES.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.chipBtn}
              onPress={() => handleBarcodeScanned({ data: item.code })}
            >
              <Text style={styles.chipText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#0284c7',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 4 },
  torchBtn: { padding: 4 },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },
  permTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginTop: 16,
  },
  permText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  grantBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  grantBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cameraContainer: { flex: 1, position: 'relative', backgroundColor: '#000000' },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTarget: {
    width: 270,
    height: 160,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38bdf8',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
  scanLine: { width: '85%', height: 2, backgroundColor: '#38bdf8' },
  scanHint: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 24,
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetTitle: { fontSize: 11, fontWeight: 'bold', color: '#0369a1', marginBottom: 10 },
  chipBtn: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  chipText: { fontSize: 12, color: '#0369a1', fontWeight: 'bold' },
});