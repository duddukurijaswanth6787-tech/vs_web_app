import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { QrCode, Banknote, CreditCard, Sparkles, Check } from 'lucide-react-native';
import {
  posMobileService,
  PosMobileCartItem,
  PosMobileCustomer,
  getApiErrorMessage,
} from '../services/api';
import { useOfflineSync, isNetworkFailure } from '../services/offline/useOfflineSync';
import { ConnectivityBadge } from '../components/ConnectivityBadge';

export default function MobilePaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cartJson = params.cartJson as string;
  const grandTotalStr = params.grandTotal as string;
  const customerJson = params.customerJson as string;

  let customer: PosMobileCustomer = { fullName: 'Walk-in Customer', phone: '9999999999' };
  try {
    if (customerJson) customer = JSON.parse(customerJson);
  } catch (e) {
    console.error('Failed to parse customer:', e);
  }

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('UPI');
  const [loading, setLoading] = useState(false);

  const offlineSync = useOfflineSync();

  let cartItems: PosMobileCartItem[] = [];
  try {
    if (cartJson) cartItems = JSON.parse(cartJson);
  } catch (e) {
    console.error('Failed to parse cart items:', e);
  }

  const grandTotal = Number(grandTotalStr || '0');

  const handleCompleteSale = async () => {
    try {
      setLoading(true);
      const res = await posMobileService.completeSale({
        items: cartItems,
        paymentMethod,
        amountPaid: grandTotal,
        customer,
      });

      router.push({
        pathname: '/sale-success',
        params: {
          orderNumber: res.order.orderNumber,
          grandTotal: res.order.grandTotal.toString(),
          completedOn: 'Shopora Mobile App',
        },
      });
    } catch (err: unknown) {
      if (isNetworkFailure(err)) {
        // Backend unreachable -- queue the sale locally instead of losing it.
        // The customer still gets a confirmation; the order itself is only
        // created once this syncs (see services/offline/useOfflineSync.ts).
        const sale = await offlineSync.queueSale(
          { items: cartItems, paymentMethod, amountPaid: grandTotal, customer },
          { items: cartItems, customer, paymentMethod, grandTotal },
        );

        router.push({
          pathname: '/sale-success',
          params: {
            orderNumber: sale.clientOrderNumber,
            grandTotal: grandTotal.toString(),
            completedOn: 'Shopora Mobile App',
            offline: 'true',
          },
        });
        return;
      }

      Alert.alert('Payment Failed', getApiErrorMessage(err, 'Could not complete POS sale'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <ConnectivityBadge
        isBackendReachable={offlineSync.isBackendReachable}
        pendingCount={offlineSync.pendingCount}
        needsReviewCount={offlineSync.needsReviewCount}
        isSyncing={offlineSync.isSyncing}
      />

      <Text style={styles.sectionTitle}>Select Payment Method</Text>

      <View style={styles.methodsGrid}>
        {/* UPI */}
        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'UPI' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('UPI')}
          activeOpacity={0.85}
        >
          <QrCode size={24} color={paymentMethod === 'UPI' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.methodText, paymentMethod === 'UPI' && styles.methodTextActive]}>
            UPI / QR
          </Text>
        </TouchableOpacity>

        {/* Cash */}
        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'CASH' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('CASH')}
          activeOpacity={0.85}
        >
          <Banknote size={24} color={paymentMethod === 'CASH' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.methodText, paymentMethod === 'CASH' && styles.methodTextActive]}>
            Cash
          </Text>
        </TouchableOpacity>

        {/* Card */}
        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'CARD' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('CARD')}
          activeOpacity={0.85}
        >
          <CreditCard size={24} color={paymentMethod === 'CARD' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.methodText, paymentMethod === 'CARD' && styles.methodTextActive]}>
            Card
          </Text>
        </TouchableOpacity>

        {/* Split */}
        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'SPLIT' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('SPLIT')}
          activeOpacity={0.85}
        >
          <Sparkles size={24} color={paymentMethod === 'SPLIT' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.methodText, paymentMethod === 'SPLIT' && styles.methodTextActive]}>
            Split / Credit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Box */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>Total Amount Due</Text>
        <Text style={styles.summaryValue}>₹{grandTotal}</Text>
      </View>

      <TouchableOpacity
        style={[styles.payBtn, !offlineSync.isBackendReachable && styles.payBtnOffline]}
        onPress={handleCompleteSale}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Check size={20} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.payBtnText}>
              {offlineSync.isBackendReachable ? 'VERIFY & COMPLETE SALE' : 'SAVE OFFLINE & CONTINUE'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      {!offlineSync.isBackendReachable && (
        <Text style={styles.offlineNote}>
          Backend unreachable — this sale will be queued on this device and synced automatically once
          the connection returns.
        </Text>
      )}
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
    marginBottom: 14,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  methodCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodCardActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  methodText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 8,
  },
  methodTextActive: {
    color: '#ffffff',
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 4,
  },
  payBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  payBtnOffline: {
    backgroundColor: '#b45309',
  },
  offlineNote: {
    fontSize: 10,
    color: '#b45309',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});
