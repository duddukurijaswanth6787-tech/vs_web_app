import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, scanFromURLAsync } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Flashlight, Image as ImageIcon, Barcode, Bluetooth, Camera as CameraIcon } from 'lucide-react-native';
import { bluetoothScannerService, ScannedDevice } from '../services/bluetooth-scanner';

const QUICK_TEST_BARCODES = [
  { label: 'Saree (890100000005)', code: '890100000005' },
  { label: 'Kurti (890100000001)', code: '890100000001' },
  { label: 'SKU KUR-BLU-L-005', code: 'KUR-BLU-L-005' },
  { label: 'Lehenga (890100000002)', code: '890100000002' },
];

type ScanMode = 'camera' | 'bluetooth';

export default function DedicatedScannerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnScreen = (params.returnScreen as string) || '/sale';
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [enableTorch, setEnableTorch] = useState(false);

  const [mode, setMode] = useState<ScanMode>('camera');
  const [btDevices, setBtDevices] = useState<ScannedDevice[]>([]);
  const [btScanning, setBtScanning] = useState(false);
  const [btConnectingId, setBtConnectingId] = useState('');
  const [btConnectedId, setBtConnectedId] = useState('');
  const [btError, setBtError] = useState('');
  const scannedRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Bluetooth GATT-mode scanning -- see services/bluetooth-scanner.ts for the
  // HID-mode caveat (most scanners need none of this UI at all).
  useEffect(() => {
    if (mode !== 'bluetooth') return;
    const unsubscribe = bluetoothScannerService.onScan((code) => {
      handleBarcodeScanned({ data: code });
    });
    return () => {
      unsubscribe();
      bluetoothScannerService.stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const startBluetoothScan = async () => {
    setBtError('');
    const granted = await bluetoothScannerService.requestPermissions();
    if (!granted) {
      setBtError('Bluetooth permission was denied.');
      return;
    }
    setBtDevices([]);
    setBtScanning(true);
    bluetoothScannerService.startScan((device) => {
      setBtDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device]));
    });
    setTimeout(() => setBtScanning(false), 15000);
  };

  const connectToDevice = async (device: ScannedDevice) => {
    setBtError('');
    setBtConnectingId(device.id);
    try {
      await bluetoothScannerService.connect(device.id);
      setBtConnectedId(device.id);
    } catch (e) {
      setBtError(`Could not connect to ${device.name || device.id}. This device may not use the GATT profile this app expects -- check services/bluetooth-scanner.ts.`);
    } finally {
      setBtConnectingId('');
    }
  };

  const handleBarcodeScanned = (result: any) => {
    if (scannedRef.current) return;
    const rawData = result?.data || result?.raw || (typeof result === 'string' ? result : null);
    if (rawData) {
      scannedRef.current = true;
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
        <Text style={styles.headerTitle}>{mode === 'camera' ? 'Barcode Scanner' : 'Bluetooth Scanner'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {mode === 'camera' && (
            <>
              <TouchableOpacity onPress={pickImage} style={{ marginRight: 16 }}>
                <ImageIcon size={22} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity style={{ marginRight: 16 }} onPress={() => setEnableTorch(!enableTorch)}>
                <Flashlight size={22} color={enableTorch ? '#fcd34d' : '#ffffff'} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={() => setMode(mode === 'camera' ? 'bluetooth' : 'camera')}
          >
            {mode === 'camera' ? (
              <Bluetooth size={22} color="#ffffff" />
            ) : (
              <CameraIcon size={22} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {mode === 'bluetooth' ? (
        <View style={styles.btContainer}>
          <View style={styles.btBanner}>
            <Bluetooth size={18} color="#0284c7" />
            <Text style={styles.btBannerText}>
              GATT-mode scanners only. Most Bluetooth scanners work as a keyboard once paired in phone Settings and need none of this -- check your scanner's manual first.
            </Text>
          </View>

          {btConnectedId ? (
            <View style={styles.btConnectedBox}>
              <Text style={styles.btConnectedText}>Connected -- listening for scans…</Text>
              <TouchableOpacity
                style={styles.btDisconnectBtn}
                onPress={async () => {
                  await bluetoothScannerService.disconnect();
                  setBtConnectedId('');
                }}
              >
                <Text style={styles.btDisconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.grantBtn}
                onPress={startBluetoothScan}
                disabled={btScanning}
              >
                {btScanning ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.grantBtnText}>Scan for Devices</Text>
                )}
              </TouchableOpacity>

              {btError !== '' && <Text style={styles.btErrorText}>{btError}</Text>}

              <FlatList
                data={btDevices}
                keyExtractor={(d) => d.id}
                style={{ marginTop: 16 }}
                ListEmptyComponent={
                  !btScanning ? (
                    <Text style={styles.permText}>No devices found yet. Tap "Scan for Devices".</Text>
                  ) : null
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.btDeviceRow}
                    onPress={() => connectToDevice(item)}
                    disabled={btConnectingId === item.id}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.btDeviceName}>{item.name || 'Unnamed device'}</Text>
                      <Text style={styles.btDeviceId}>{item.id}</Text>
                    </View>
                    {btConnectingId === item.id ? (
                      <ActivityIndicator color="#0284c7" />
                    ) : (
                      <Text style={styles.btConnectLabel}>Connect</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      ) : !permission ? (
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

      {/* Bottom Sheet for Sample Selection (camera mode only) */}
      {mode === 'camera' && (
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
      )}
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
  btContainer: { flex: 1, padding: 16, backgroundColor: '#f0f9ff' },
  btBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  btBannerText: { flex: 1, fontSize: 11, color: '#0369a1', lineHeight: 16 },
  btErrorText: { fontSize: 12, color: '#b91c1c', marginTop: 10 },
  btConnectedBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  btConnectedText: { fontSize: 14, fontWeight: 'bold', color: '#16a34a', marginBottom: 14 },
  btDisconnectBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btDisconnectText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 12 },
  btDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  btDeviceName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  btDeviceId: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  btConnectLabel: { fontSize: 12, fontWeight: 'bold', color: '#0284c7' },
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