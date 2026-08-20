import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Printer, PrinterCheck } from 'lucide-react-native';
import { bluetoothPrinterService, DiscoveredPrinter } from '../services/bluetooth-printer';

/**
 * Pair/connect a Bluetooth thermal printer for the POS app to print receipts
 * (sale-success.tsx) and barcode labels (label-preview.tsx) directly,
 * instead of only sharing the print data out to another app.
 *
 * BLE GATT printers only -- see services/bluetooth-printer.ts's header for
 * why most cheap thermal printers (classic Bluetooth SPP) won't show up
 * here, and what that means for this screen.
 */
export default function PrinterSettingsScreen() {
  const router = useRouter();

  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<DiscoveredPrinter[]>([]);
  const [connectingId, setConnectingId] = useState('');
  const [connectedId, setConnectedId] = useState('');
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [testPrinting, setTestPrinting] = useState(false);

  useEffect(() => {
    if (bluetoothPrinterService.isConnected()) {
      setConnectedName(bluetoothPrinterService.connectedDeviceName());
    }
    const unsubscribe = bluetoothPrinterService.onDisconnect(() => {
      setConnectedId('');
      setConnectedName(null);
      setError('Printer disconnected unexpectedly.');
    });
    return () => {
      bluetoothPrinterService.stopScan();
      unsubscribe();
    };
  }, []);

  const startScan = async () => {
    setError('');
    const granted = await bluetoothPrinterService.requestPermissions();
    if (!granted) {
      setError('Bluetooth permission was denied.');
      return;
    }
    setDevices([]);
    setScanning(true);
    bluetoothPrinterService.startScan((device) => {
      setDevices((prev) => (prev.some((d) => d.id === device.id) ? prev : [...prev, device]));
    });
    setTimeout(() => setScanning(false), 15000);
  };

  const connect = async (device: DiscoveredPrinter) => {
    setError('');
    setConnectingId(device.id);
    try {
      await bluetoothPrinterService.connect(device.id);
      setConnectedId(device.id);
      setConnectedName(device.name);
    } catch (e) {
      setError(
        `Could not connect to ${device.name || device.id}. This printer may not expose the BLE write characteristic this app expects -- check services/bluetooth-printer.ts, or it may only support classic Bluetooth (SPP), which this screen can't reach.`,
      );
    } finally {
      setConnectingId('');
    }
  };

  const disconnect = async () => {
    await bluetoothPrinterService.disconnect();
    setConnectedId('');
    setConnectedName(null);
  };

  const testPrint = async () => {
    setTestPrinting(true);
    setError('');
    try {
      // ESC/POS: initialise, print a line, feed 3 lines. Plain ASCII control
      // bytes -- printText() sends them through as raw bytes unmodified.
      await bluetoothPrinterService.printText('\x1B\x40Shopora POS -- Test Print OK\n\n\n');
      Alert.alert('Test Print Sent', 'Check the printer for output.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test print failed.');
    } finally {
      setTestPrinting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Printer Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <View style={styles.banner}>
          <Printer size={18} color="#0284c7" />
          <Text style={styles.bannerText}>
            BLE printers only. Most cheap thermal printers use classic Bluetooth (SPP) instead and
            won't appear below -- pair those in the phone's Bluetooth settings and check your
            printer's manual for what mode it supports.
          </Text>
        </View>

        {connectedId ? (
          <View style={styles.connectedBox}>
            <PrinterCheck size={28} color="#16a34a" style={{ marginBottom: 10 }} />
            <Text style={styles.connectedText}>Connected to {connectedName || connectedId}</Text>

            <TouchableOpacity
              style={styles.testBtn}
              onPress={testPrint}
              disabled={testPrinting}
            >
              {testPrinting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.testBtnText}>Send Test Print</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={scanning}>
              {scanning ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.scanBtnText}>Scan for Printers</Text>
              )}
            </TouchableOpacity>

            {error !== '' && <Text style={styles.errorText}>{error}</Text>}

            <FlatList
              data={devices}
              keyExtractor={(d) => d.id}
              style={{ marginTop: 16 }}
              ListEmptyComponent={
                !scanning ? (
                  <Text style={styles.emptyText}>No devices found yet. Tap "Scan for Printers".</Text>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.deviceRow}
                  onPress={() => connect(item)}
                  disabled={connectingId === item.id}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>{item.name || 'Unnamed device'}</Text>
                    <Text style={styles.deviceId}>{item.id}</Text>
                  </View>
                  {connectingId === item.id ? (
                    <ActivityIndicator color="#0284c7" />
                  ) : (
                    <Text style={styles.connectLabel}>Connect</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f9ff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#0284c7',
  },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 4 },
  body: { flex: 1, padding: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  bannerText: { flex: 1, fontSize: 11, color: '#0369a1', lineHeight: 16 },
  errorText: { fontSize: 12, color: '#b91c1c', marginTop: 10 },
  scanBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 24, lineHeight: 20 },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  deviceName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  deviceId: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  connectLabel: { fontSize: 12, fontWeight: 'bold', color: '#0284c7' },
  connectedBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  connectedText: { fontSize: 14, fontWeight: 'bold', color: '#16a34a', marginBottom: 14 },
  testBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 10,
    minWidth: 160,
    alignItems: 'center',
  },
  testBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  disconnectBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  disconnectText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 12 },
});
