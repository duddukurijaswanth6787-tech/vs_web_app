import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, ShoppingBag, RotateCcw, CloudUpload, Printer } from 'lucide-react-native';
import { PosMobileCartItem, PosMobileCustomer, getCurrentUser } from '../services/api';
import { bluetoothPrinterService } from '../services/bluetooth-printer';
import { setGlobalCart } from './sale';

const STORE_NAME = "VASANTHI'S SIGNATURE";
const STORE_TAGLINE = 'Haute Couture & Boutique';
const STORE_ADDRESS = 'Road No. 12, Banjara Hills, Hyderabad - 500034';
const STORE_PHONE = '+91 98765 43210';

export default function SaleSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderNumber = (params.orderNumber as string) || '—';
  const grandTotal = (params.grandTotal as string) || '0';
  const completedOn = (params.completedOn as string) || '—';
  // Set by checkout-phone.tsx when the sale was queued locally instead of
  // completed live -- the backend was unreachable at the moment of payment.
  const isOffline = params.offline === 'true';

  // Carried through from checkout-phone.tsx on a live (non-offline) sale so
  // a receipt can be requested and sent to a connected Bluetooth printer.
  const cartJson = params.cartJson as string | undefined;
  const customerJson = params.customerJson as string | undefined;
  const paymentMethod = params.paymentMethod as string | undefined;
  const [printing, setPrinting] = useState(false);

  const canPrint = !isOffline && Boolean(cartJson);

  const handlePrintReceipt = async () => {
    if (!bluetoothPrinterService.isConnected()) {
      Alert.alert(
        'No Printer Connected',
        'Connect a Bluetooth thermal printer to print receipts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Printer Settings', onPress: () => router.push('/printer-settings') },
        ],
      );
      return;
    }
    setPrinting(true);
    try {
      const items: PosMobileCartItem[] = cartJson ? JSON.parse(cartJson) : [];
      const customer: PosMobileCustomer | undefined = customerJson ? JSON.parse(customerJson) : undefined;
      const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      const taxTotal = Math.round(subtotal * 0.05 * 100) / 100;
      const user = getCurrentUser();
      await bluetoothPrinterService.printReceipt({
        storeName: STORE_NAME,
        storeTagline: STORE_TAGLINE,
        address: STORE_ADDRESS,
        phone: STORE_PHONE,
        orderNumber,
        dateStr: new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        cashierName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined : undefined,
        customerName: customer?.fullName,
        customerPhone: customer?.phone,
        items: items.map((i) => ({
          title: i.variantTitle ? `${i.productName} (${i.variantTitle})` : i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        subtotal,
        taxTotal,
        grandTotal: Number(grandTotal),
        paymentMethod,
      });
    } catch (err) {
      Alert.alert('Print Failed', err instanceof Error ? err.message : 'Could not print the receipt.');
    } finally {
      setPrinting(false);
    }
  };

  React.useEffect(() => {
    // If a Bluetooth printer is connected, auto-print immediately
    if (canPrint && bluetoothPrinterService.isConnected()) {
      handlePrintReceipt();
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.iconCircle, isOffline && styles.iconCircleOffline]}>
          {isOffline ? (
            <CloudUpload size={48} color="#b45309" />
          ) : (
            <CheckCircle2 size={48} color="#0284c7" />
          )}
        </View>

        <Text style={[styles.title, isOffline && styles.titleOffline]}>
          {isOffline ? '⏳ SAVED OFFLINE' : '✓ SALE COMPLETED'}
        </Text>
        <Text style={styles.sub}>
          {isOffline
            ? 'Backend was unreachable -- this sale is queued on this device and will sync automatically (and deduct stock) once the connection returns.'
            : 'Transaction processed & stock deducted successfully.'}
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{isOffline ? 'Reference (Provisional)' : 'Order Number'}</Text>
            <Text style={styles.infoValue}>{orderNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Completed On</Text>
            <Text style={styles.infoValue}>{completedOn}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Amount</Text>
            <Text style={[styles.totalValue, isOffline && styles.totalValueOffline]}>₹{grandTotal}</Text>
          </View>
        </View>

        {isOffline && (
          <TouchableOpacity
            style={styles.pendingSyncBtn}
            onPress={() => router.push('/pending-sync')}
          >
            <CloudUpload size={16} color="#b45309" style={{ marginRight: 6 }} />
            <Text style={styles.pendingSyncBtnText}>View Pending Sync Queue</Text>
          </TouchableOpacity>
        )}

        {isOffline && (
          <Text style={styles.offlinePrintNote}>
            Receipt printing is available once this sale syncs to the server.
          </Text>
        )}

        {canPrint && (
          <TouchableOpacity
            style={styles.printBtn}
            onPress={handlePrintReceipt}
            disabled={printing}
          >
            {printing ? (
              <ActivityIndicator color="#0369a1" size="small" />
            ) : (
              <>
                <Printer size={18} color="#0369a1" style={{ marginRight: 6 }} />
                <Text style={styles.printBtnText}>
                  {bluetoothPrinterService.isConnected() ? '🖨️ Re-Print Receipt' : '🖨️ Print Receipt'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.newSaleBtn}
          onPress={() => {
            setGlobalCart([]);
            router.replace('/sale');
          }}
        >
          <RotateCcw size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.newSaleBtnText}>START NEW SALE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => {
            setGlobalCart([]);
            router.replace('/');
          }}
        >
          <ShoppingBag size={16} color="#0369a1" style={{ marginRight: 6 }} />
          <Text style={styles.homeBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleOffline: {
    backgroundColor: '#fef3c7',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
    textAlign: 'center',
  },
  titleOffline: {
    color: '#b45309',
  },
  sub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  totalValueOffline: {
    color: '#b45309',
  },
  pendingSyncBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  pendingSyncBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
  },
  offlinePrintNote: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 14,
  },
  printBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  printBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  newSaleBtn: {
    width: '100%',
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  newSaleBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  homeBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
  },
});
