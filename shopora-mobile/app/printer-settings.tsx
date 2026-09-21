import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Printer, PrinterCheck, RefreshCw, Check } from 'lucide-react-native';
import {
  bluetoothPrinterService,
  DiscoveredPrinter,
  isLabelPrinterName,
  isPosReceiptPrinterName,
} from '../services/bluetooth-printer';
import { isAuthenticated } from '../services/api';

/**
 * Pair/connect a Bluetooth thermal printer for the POS app to print receipts
 * (sale-success.tsx) and barcode labels (label-preview.tsx) directly.
 *
 * Classic Bluetooth (SPP) printers only -- supports 4x6" shipping labels,
 * 3x2" brand logos/barcodes, and 58mm/80mm POS receipts.
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

  const syncConnectionState = useCallback(() => {
    if (bluetoothPrinterService.isConnected()) {
      setConnectedAddress(bluetoothPrinterService.connectedDeviceAddress() || 'connected');
      setConnectedName(bluetoothPrinterService.connectedDeviceName());
    } else {
      setConnectedAddress('');
      setConnectedName(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated()) {
        router.replace('/login?redirect=/printer-settings');
        return;
      }
      syncConnectionState();
      loadDevicesAndAutoConnect();
    }, [router, syncConnectionState]),
  );

  const loadDevicesAndAutoConnect = async () => {
    try {
      const granted = await bluetoothPrinterService.requestPermissions();
      if (!granted) return;
      const enabled = await bluetoothPrinterService.isBluetoothEnabled().catch(() => false);
      if (!enabled) return;

      // Auto-connect if not connected
      if (!bluetoothPrinterService.isConnected()) {
        const auto = await bluetoothPrinterService.autoConnect();
        if (auto) {
          syncConnectionState();
        }
      }

      // Fetch paired and discovered devices
      const { paired, found } = await bluetoothPrinterService.scanDevices();
      setPairedDevices(paired);
      setFoundDevices(found);
      syncConnectionState();
    } catch (e) {
      console.warn('[PrinterSettings] auto-load devices:', e);
    }
  };

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
    setScanning(true);
    try {
      const { paired, found } = await bluetoothPrinterService.scanDevices();
      setPairedDevices(paired);
      setFoundDevices(found);
      syncConnectionState();
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

  const testPrint = async (type: 'auto' | 'logo3x2' | 'label3x2' | 'shipping4x6' | 'receipt' = 'auto') => {
    setTestPrinting(true);
    setError('');
    try {
      if (type === 'logo3x2') {
        await bluetoothPrinterService.testPrintLogo(75, 50);
        Alert.alert('3×2" Brand Logo Sent', "Printed Vasanthi's Signature logo sticker.");
      } else if (type === 'label3x2') {
        await bluetoothPrinterService.testPrintLabel(75, 50);
        Alert.alert('3×2" Tag Sent', 'Printed 3×2" Barcode Price Tag to label printer.');
      } else if (type === 'shipping4x6') {
        await bluetoothPrinterService.testPrintShippingLabel();
        Alert.alert('4×6" Shipping Label Sent', 'Printed 4×6" Courier Waybill to label printer.');
      } else if (type === 'receipt') {
        await bluetoothPrinterService.testPrintReceipt();
        Alert.alert('Receipt Sent', 'Printed POS Thermal Receipt.');
      } else {
        await bluetoothPrinterService.testPrint();
        Alert.alert('Test Print Sent', 'Check your thermal printer for output.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test print failed.');
    } finally {
      setTestPrinting(false);
    }
  };

  const isCurrentConnected = (addr: string) => {
    if (!connectedAddress) return false;
    return connectedAddress.toLowerCase() === addr.toLowerCase();
  };

  const getPrinterBadge = (name?: string | null) => {
    if (!name) return null;
    if (isPosReceiptPrinterName(name)) {
      return { text: '🧾 POS BILLING PRINTER (80mm/58mm)', color: '#047857', bg: '#ecfdf5' };
    }
    if (isLabelPrinterName(name)) {
      return { text: '🏷️ LABEL & BARCODE PRINTER (4×6 & 3×2)', color: '#6d28d9', bg: '#f5f3ff' };
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Printer Settings</Text>
        <TouchableOpacity style={styles.backBtn} onPress={startScan} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <RefreshCw size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.banner}>
          <Printer size={18} color="#0284c7" />
          <Text style={styles.bannerText}>
            Classic Bluetooth (SPP) printers only — supports 4×6" shipping labels, 3×2" brand logos, and 58mm/80mm POS receipts.
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

        {/* 1. CURRENTLY CONNECTED PRINTER BOX */}
        {connectedAddress ? (
          <View style={styles.connectedBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <PrinterCheck size={26} color="#16a34a" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.connectedText}>Connected: {connectedName || 'Thermal Printer'}</Text>
                <Text style={styles.connectedSub}>{connectedAddress}</Text>
              </View>
            </View>

            {getPrinterBadge(connectedName) && (
              <View style={[styles.badgeTag, { backgroundColor: getPrinterBadge(connectedName)!.bg }]}>
                <Text style={[styles.badgeTagText, { color: getPrinterBadge(connectedName)!.color }]}>
                  {getPrinterBadge(connectedName)!.text}
                </Text>
              </View>
            )}

            <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '600', marginVertical: 10 }}>
              Ready for 4×6" & 3×2" Label / POS Receipt Printing
            </Text>

            <View style={{ width: '100%', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity style={[styles.testBtn, { backgroundColor: '#c026d3' }]} onPress={() => testPrint('logo3x2')} disabled={testPrinting}>
                {testPrinting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.testBtnText}>✨ Print 3×2" Brand Logo Test</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.testBtn} onPress={() => testPrint('label3x2')} disabled={testPrinting}>
                {testPrinting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.testBtnText}>🏷️ Print 3×2" Barcode Tag Test</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.testBtn, { backgroundColor: '#4338ca' }]} onPress={() => testPrint('shipping4x6')} disabled={testPrinting}>
                {testPrinting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.testBtnText}>📦 Print 4×6" Shipping Label Test</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.testBtn, { backgroundColor: '#047857' }]} onPress={() => testPrint('receipt')} disabled={testPrinting}>
                {testPrinting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.testBtnText}>🧾 Print POS Receipt Test</Text>
                )}
              </TouchableOpacity>
            </View>

            {error !== '' && <Text style={[styles.errorText, { marginBottom: 12 }]}>{error}</Text>}

            <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.scanBtn} onPress={startScan} disabled={scanning}>
            {scanning ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.scanBtnText}>Scan for Bluetooth Printers</Text>
            )}
          </TouchableOpacity>
        )}

        {error !== '' && !connectedAddress && <Text style={styles.errorText}>{error}</Text>}

        {/* 2. PAIRED PRINTERS / DEVICES SECTION */}
        <View style={{ marginTop: 24, marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.sectionHeaderTitle}>Paired Bluetooth Printers ({pairedDevices.length})</Text>
            <TouchableOpacity onPress={startScan} disabled={scanning}>
              <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: 'bold' }}>
                {scanning ? 'Scanning...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {pairedDevices.length === 0 && !scanning && (
            <Text style={styles.emptyText}>
              No paired Bluetooth devices found. Pair your printer in Android Settings first.
            </Text>
          )}

          {pairedDevices.map((item) => {
            const isConn = isCurrentConnected(item.address);
            const badge = getPrinterBadge(item.name);
            const isConnecting = connectingAddress === item.address;

            return (
              <TouchableOpacity
                key={item.address}
                style={[styles.deviceRow, isConn && styles.deviceRowConnected]}
                onPress={() => (isConn ? null : connect(item))}
                disabled={isConnecting || isConn}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[styles.deviceName, isConn && { color: '#16a34a' }]}>
                      {item.name || 'Unnamed printer'}
                    </Text>
                    {isConn && (
                      <View style={styles.activePill}>
                        <Check size={12} color="#16a34a" />
                        <Text style={styles.activePillText}>Active</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.deviceId}>{item.address}</Text>
                  {badge && (
                    <View style={[styles.inlineBadge, { backgroundColor: badge.bg, alignSelf: 'flex-start' }]}>
                      <Text style={[styles.inlineBadgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                  )}
                </View>

                {isConn ? (
                  <Text style={styles.connectedLabel}>Connected</Text>
                ) : isConnecting ? (
                  <ActivityIndicator color="#0284c7" />
                ) : (
                  <View style={styles.connectBtnAction}>
                    <Text style={styles.connectLabel}>Connect</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. OTHER DISCOVERED DEVICES */}
        {foundDevices.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionHeaderTitle}>Other Discovered Devices ({foundDevices.length})</Text>
            {foundDevices.map((item) => {
              const isConnecting = connectingAddress === item.address;
              return (
                <TouchableOpacity
                  key={item.address}
                  style={styles.deviceRow}
                  onPress={() => connect(item)}
                  disabled={isConnecting}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>{item.name || 'Unnamed device'}</Text>
                    <Text style={styles.deviceId}>{item.address}</Text>
                  </View>
                  {isConnecting ? (
                    <ActivityIndicator color="#0284c7" />
                  ) : (
                    <Text style={styles.connectLabel}>Connect</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  emptyText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginVertical: 16, lineHeight: 18 },
  sectionHeaderTitle: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  deviceRowConnected: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  deviceName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  deviceId: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  connectedLabel: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },
  connectBtnAction: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectLabel: { fontSize: 12, fontWeight: 'bold', color: '#0284c7' },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    gap: 2,
  },
  activePillText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },
  inlineBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  inlineBadgeText: { fontSize: 9, fontWeight: '700' },
  badgeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeTagText: { fontSize: 10, fontWeight: '700' },
  connectedBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  connectedText: { fontSize: 14, fontWeight: 'bold', color: '#16a34a' },
  connectedSub: { fontSize: 10, color: '#64748b' },
  testBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    paddingVertical: 8,
    marginTop: 4,
  },
  disconnectText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 12 },
});
