import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CreditCard } from 'lucide-react-native';
import { shopCheckoutService, ShopCheckoutPreview } from '../services/shop-api';
import { getApiErrorMessage, isAuthenticated } from '../services/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { addressId } = useLocalSearchParams<{ addressId: string }>();
  const [preview, setPreview] = useState<ShopCheckoutPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login?redirect=/cart');
    }
  }, [router]);

  useEffect(() => {
    if (!addressId) return;
    setLoading(true);
    setError('');
    shopCheckoutService
      .preview(addressId)
      .then(setPreview)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [addressId]);

  const handlePlaceOrder = async () => {
    if (!addressId) return;
    setPlacing(true);
    setError('');
    try {
      const order = await shopCheckoutService.placeOrder(addressId);
      router.replace({ pathname: '/order-success', params: { orderNumber: order.orderNumber } });
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  const subtotal = preview?.subtotal ?? 0;
  const discount = preview?.discount ?? preview?.discountTotal ?? 0;
  const shipping = preview?.shipping ?? preview?.shippingCharge ?? 0;
  const tax = preview?.tax ?? preview?.taxTotal ?? 0;
  const total = preview?.total ?? preview?.grandTotal ?? subtotal - discount + shipping + tax;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Order</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : (
        <View style={styles.content}>
          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          {preview && (
            <View style={styles.summaryCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Subtotal</Text>
                <Text style={styles.rowValue}>₹{subtotal}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Discount</Text>
                  <Text style={[styles.rowValue, { color: '#16a34a' }]}>-₹{discount}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Shipping</Text>
                <Text style={styles.rowValue}>{shipping > 0 ? `₹${shipping}` : 'Free'}</Text>
              </View>
              {tax > 0 && (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Tax</Text>
                  <Text style={styles.rowValue}>₹{tax}</Text>
                </View>
              )}
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{total}</Text>
              </View>
            </View>
          )}

          <View style={{ flex: 1 }} />

          <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder} disabled={placing || !preview}>
            {placing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <CreditCard size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.placeBtnText}>Place Order · Cash/UPI on Delivery</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.paymentNote}>
            Online payment isn't wired up in this app yet -- orders are placed the same way the desktop
            checkout preview supports, and settled through the payment methods already configured for the store.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  iconBtn: { padding: 4 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 16 },
  errorText: { color: '#b91c1c', fontSize: 13, marginBottom: 12 },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0e0e4',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowLabel: { fontSize: 13, color: '#6b7280' },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#f0e0e4', marginTop: 6, paddingTop: 12 },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#1f2937' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#0284c7' },
  placeBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  paymentNote: { fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: 10, lineHeight: 15 },
});
