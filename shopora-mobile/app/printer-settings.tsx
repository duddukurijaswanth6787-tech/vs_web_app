import React, { useEffect, useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Printer, PrinterCheck } from 'lucide-react-native';
import { bluetoothPrinterService, DiscoveredPrinter } from '../services/bluetooth-printer';
import { isAuthenticated } from '../services/api';

/**
 * Pair/connect a Bluetooth thermal printer for the POS app to print receipts
 * (sale-success.tsx) and barcode labels (label-preview.tsx) directly,
 * instead of only sharing the print data out to another app.
 *
 * Classic Bluetooth (SPP) printers only -- see services/bluetooth-printer.ts's
 * header for why. A printer usually needs to be paired once in the phone's
 * own Bluetooth settings before it shows up as "already paired" below.
 */
export default function PrinterSettingsScreen() {
  const router = useRouter();

  const [scanning, setScanning] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<DiscoveredPrinter[]>([]);
  const [foundDevices, setFoundDevices] = useState<DiscoveredPrinter[]>([]);
  const [connectingAddress, setConnectingAddress] = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [testPrinting, setTestPrinting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated()) {
        router.replace('/login?redirect=/printer-settings');
      }
    }, [router]),
  );

  useEffect(() => {
    if (bluetoothPrinterService.isConnected()) {
      setConnectedAddress('connected');
      setConnectedName(bluetoothPrinterService.connectedDeviceName());
    }
  }, []);

  const startScan = async () => {
    setError('');
    const granted = await bluetoothPrinterService.requestPermissions();
    if (!granted) {
      setError('Bluetooth permission was denied.');
      return;
    }
    const enabled = await bluetoothPrinterService.isBluetoothEnabled().catch(() => false);
    if (!enabled) {
      setError('Bluetooth is turned off. Enable it in your phone settings and try again.');
      return;
    }
    setPairedDevices([]);
    setFoundDevices([]);
    setScanning(true);
    try {
      const { paired, found } = await bluetoothPrinterService.scanDevices();
      setPairedDevices(paired);
      setFoundDevices(found);
    } catch (e) {
      setError('Could not scan for Bluetooth devices.');
    } finally {
      setScanning(false);
    }
  };

  const connect = async (device: DiscoveredPrinter) => {
    setError('');
    setConnectingAddress(device.address);
    try {
      await bluetoothPrinterService.connect(device);
      setConnectedAddress(device.address);
      setConnectedName(device.name);
    } catch (e) {
      setError(
        `Could not connect to ${device.name || device.address}. Make sure it's a classic-Bluetooth (SPP) printer and it's paired in the phone's Bluetooth settings first.`,
      );
    } finally {
      setConnectingAddress('');
    }
  };

  const disconnect = async () => {
    await bluetoothPrinterService.disconnect();
    setConnectedAddress('');
    setConnectedName(null);
  };

  const testPrint = async () => {
    setTestPrinting(true);
    setError('');
    try {
      await bluetoothPrinterService.testPrint();
      Alert.alert('Test Print Sent', 'Check the printer for output.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test print failed.');
    } finally {
      setTestPrinting(false);
    }
  };

  const allDevices = [...pairedDevices, ...foundDevices.filter((f) => !pairedDevices.some((p) => p.address === f.address))];

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
            Classic Bluetooth (SPP) printers only -- the kind almost all budget 58mm/80mm receipt +
            label printers use. Pair the printer in your phone's Bluetooth settings first if it
            doesn't appear below.
          </Text>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: 12,
            marginBottom: 16,
          }}
          onPress={() => router.push('/printer-demo')}
        >
          <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 13 }}>
            🔬 Open Printer Demo & Test Lab &rarr;
          </Text>
        </TouchableOpacity>

        {connectedAddress ? (
          <View style={styles.connectedBox}>
            <PrinterCheck size={28} color="#16a34a" style={{ marginBottom: 10 }} />
            <Text style={styles.connectedText}>Connected to {connectedName || 'printer'}</Text>

            <TouchableOpacity style={styles.testBtn} onPress={testPrint} disabled={testPrinting}>
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
              data={allDevices}
              keyExtractor={(d) => d.address}
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
                  disabled={connectingAddress === item.address}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>{item.name || 'Unnamed device'}</Text>
                    <Text style={styles.deviceId}>{item.address}</Text>
                  </View>
                  {connectingAddress === item.address ? (
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
