import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { QrCode, Banknote, CreditCard, Sparkles, Check, History, Clock } from 'lucide-react-native';
import {
  posMobileService,
  PosMobileCartItem,
  PosMobileCustomer,
  getApiErrorMessage,
  isAuthenticated,
} from '../services/api';
import { useOfflineSync, isNetworkFailure } from '../services/offline/useOfflineSync';
import { ConnectivityBadge } from '../components/ConnectivityBadge';
import { getTerminalId } from '../services/terminal';

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

  const couponCodeParam = (params.couponCode as string) || '';
  const couponDiscountParam = Number(params.couponDiscount || '0');

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT'>('UPI');
  const [loading, setLoading] = useState(false);
  // Coupon at the till.
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number } | null>(
    couponCodeParam && couponDiscountParam > 0
      ? { code: couponCodeParam, discountAmount: couponDiscountParam }
      : null,
  );
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  // Split-payment tenders. Cashier picks amounts on each method; server
  // validates they cover the total (minus coupon and any redemptions).
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [splitCard, setSplitCard] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated()) {
        router.replace('/login?redirect=/checkout-phone');
      }
    }, [router]),
  );

  const offlineSync = useOfflineSync();

  // Billing requires an open shift on this terminal while online, so cash
  // sales can be reconciled at close -- mirrors the same gate on the web
  // POS. Offline sales are exempt since shift state can't be checked
  // without the backend.
  // This phone is its own register, so its shift and its sales are keyed to
  // an id stored on the device rather than to the counter till.
  const [terminalId, setTerminalId] = useState('');
  const [shiftChecked, setShiftChecked] = useState(false);
  const [hasOpenShift, setHasOpenShift] = useState(true);
  const [openingCashInput, setOpeningCashInput] = useState('');
  const [openingShift, setOpeningShift] = useState(false);
  const [shiftError, setShiftError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getTerminalId().then((id) => {
      if (!cancelled) setTerminalId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!offlineSync.isBackendReachable) {
      setShiftChecked(true);
      return;
    }
    // Wait for the device's terminal id: looking up the shared default would
    // report on the counter's register, not this phone's.
    if (!terminalId) return;
    let cancelled = false;
    posMobileService
      .getCurrentShift(terminalId)
      .then((shift) => {
        if (!cancelled) setHasOpenShift(Boolean(shift));
      })
      .catch(() => {
        if (!cancelled) setHasOpenShift(true); // fail open: don't block billing on a lookup error
      })
      .finally(() => {
        if (!cancelled) setShiftChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [offlineSync.isBackendReachable, terminalId]);

  const shiftRequired = shiftChecked && offlineSync.isBackendReachable && !hasOpenShift;

  const handleOpenShift = async () => {
    const amount = parseFloat(openingCashInput);
    if (isNaN(amount) || amount < 0) return;
    try {
      setOpeningShift(true);
      setShiftError('');
      await posMobileService.openShift({ terminalId, openingCash: amount });
      setHasOpenShift(true);
      setOpeningCashInput('');
    } catch (err) {
      setShiftError(getApiErrorMessage(err, 'Could not open the shift.'));
    } finally {
      setOpeningShift(false);
    }
  };

  let cartItems: PosMobileCartItem[] = [];
  try {
    if (cartJson) cartItems = JSON.parse(cartJson);
  } catch (e) {
    console.error('Failed to parse cart items:', e);
  }

  const grandTotal = Number(grandTotalStr || '0');
  const effectiveTotal = Math.max(0, grandTotal - (couponApplied?.discountAmount || 0));
  const splitEntries = ([
    { method: 'CASH' as const, value: splitCash },
    { method: 'UPI' as const, value: splitUpi },
    { method: 'CARD' as const, value: splitCard },
  ]
    .map((t) => ({ method: t.method, amount: Number(t.value) || 0 }))
    .filter((t) => t.amount > 0));
  const splitTendered = Math.round(splitEntries.reduce((s, t) => s + t.amount, 0) * 100) / 100;
  const splitShortfall = Math.round(Math.max(0, effectiveTotal - splitTendered) * 100) / 100;
  const splitExcess = Math.round(Math.max(0, splitTendered - effectiveTotal) * 100) / 100;
  const splitCashN = Number(splitCash) || 0;
  const splitChangeBlocked = splitExcess > splitCashN + 0.005;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError('');
    setCouponBusy(true);
    try {
      const data = await posMobileService.validateCoupon({
        code,
        items: cartItems,
      });
      setCouponApplied({ code: data.code, discountAmount: data.discountAmount });
      setCouponInput('');
    } catch (err) {
      setCouponApplied(null);
      setCouponError(getApiErrorMessage(err, 'Coupon could not be applied.'));
    } finally {
      setCouponBusy(false);
    }
  };

  const handleCompleteSale = async () => {
    if (shiftRequired) {
      Alert.alert('Shift Required', 'Open a shift before billing so cash sales can be reconciled at close.');
      return;
    }
    if (paymentMethod === 'SPLIT') {
      if (splitShortfall > 0) {
        Alert.alert('Split short', `Split payment is short by Rs.${splitShortfall.toFixed(2)}.`);
        return;
      }
      if (splitChangeBlocked) {
        Alert.alert('Cannot give change', 'Change can only come out of cash. Reduce the card or UPI amount.');
        return;
      }
    }
    try {
      setLoading(true);
      const res = await posMobileService.completeSale({
        items: cartItems,
        paymentMethod,
        amountPaid: grandTotal,
        customer,
        terminalId,
        couponCode: couponApplied?.code,
        splitPayments: paymentMethod === 'SPLIT' ? splitEntries : undefined,
      });

      router.push({
        pathname: '/sale-success',
        params: {
          orderNumber: res.order.orderNumber,
          grandTotal: res.order.grandTotal.toString(),
          completedOn: 'Shopora Mobile App',
          // Carried through so the success screen can request a printable
          // receipt (POST /pos/printers/preview-receipt) without needing to
          // refetch the order.
          cartJson: JSON.stringify(cartItems),
          customerJson: JSON.stringify(customer),
          paymentMethod,
        },
      });
    } catch (err: unknown) {
      if (isNetworkFailure(err)) {
        // Backend unreachable -- queue the sale locally instead of losing it.
        // The customer still gets a confirmation; the order itself is only
        // created once this syncs (see services/offline/useOfflineSync.ts).
        const sale = await offlineSync.queueSale(
          { items: cartItems, paymentMethod, amountPaid: grandTotal, customer, terminalId, couponCode: couponApplied?.code, splitPayments: paymentMethod === 'SPLIT' ? splitEntries : undefined },
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
            Split
          </Text>
        </TouchableOpacity>

        {/* Credit */}
        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'CREDIT' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('CREDIT')}
          activeOpacity={0.85}
        >
          <History size={24} color={paymentMethod === 'CREDIT' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.methodText, paymentMethod === 'CREDIT' && styles.methodTextActive]}>
            On Credit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'SPLIT' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('SPLIT')}
          activeOpacity={0.85}
        >
          <Sparkles size={24} color={paymentMethod === 'SPLIT' ? '#ffffff' : '#0284c7'} />
          <Text style={[styles.methodText, paymentMethod === 'SPLIT' && styles.methodTextActive]}>
            Split
          </Text>
        </TouchableOpacity>
      </View>

      {paymentMethod === 'SPLIT' && (
        <View style={styles.splitBox}>
          <Text style={styles.splitTitle}>Enter what the customer paid on each tender</Text>
          {(['CASH', 'UPI', 'CARD'] as const).map((m) => {
            const value = m === 'CASH' ? splitCash : m === 'UPI' ? splitUpi : splitCard;
            const setter = m === 'CASH' ? setSplitCash : m === 'UPI' ? setSplitUpi : setSplitCard;
            return (
              <View key={m} style={styles.splitRow}>
                <Text style={styles.splitMethod}>{m}</Text>
                <TextInput
                  style={styles.splitInput}
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={setter}
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            );
          })}
          {splitShortfall > 0 ? (
            <Text style={styles.splitStatus}>Short by Rs.{splitShortfall.toFixed(2)} of Rs.{effectiveTotal.toFixed(2)}.</Text>
          ) : splitChangeBlocked ? (
            <Text style={[styles.splitStatus, { color: '#b45309' }]}>Rs.{splitExcess.toFixed(2)} over, but only Rs.{splitCashN.toFixed(2)} is cash.</Text>
          ) : splitExcess > 0 ? (
            <Text style={[styles.splitStatus, { color: '#059669' }]}>Change due: Rs.{splitExcess.toFixed(2)}</Text>
          ) : splitTendered > 0 ? (
            <Text style={[styles.splitStatus, { color: '#059669' }]}>Tenders cover the bill exactly.</Text>
          ) : null}
        </View>
      )}

      {/* Coupon */}
      {couponApplied ? (
        <View style={styles.couponChip}>
          <Text style={styles.couponChipCode}>Coupon {couponApplied.code}</Text>
          <Text style={styles.couponChipAmount}>-₹{couponApplied.discountAmount.toFixed(2)}</Text>
          <TouchableOpacity onPress={() => setCouponApplied(null)}>
            <Text style={styles.couponChipRemove}>REMOVE</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.couponRow}>
          <TextInput
            style={styles.couponInput}
            value={couponInput}
            onChangeText={(t) => setCouponInput(t.toUpperCase())}
            placeholder="Coupon code"
            placeholderTextColor="#a3a3a3"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            onPress={handleApplyCoupon}
            disabled={couponBusy || !couponInput.trim()}
            style={[styles.couponBtn, (couponBusy || !couponInput.trim()) && { opacity: 0.5 }]}
          >
            <Text style={styles.couponBtnText}>{couponBusy ? '...' : 'Apply'}</Text>
          </TouchableOpacity>
        </View>
      )}
      {!!couponError && <Text style={styles.shiftErrorText}>{couponError}</Text>}

      {/* Summary Box */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>Total Amount Due</Text>
        <Text style={styles.summaryValue}>
          ₹{Math.max(0, grandTotal - (couponApplied?.discountAmount || 0))}
        </Text>
        {couponApplied && (
          <Text style={styles.summaryStrike}>₹{grandTotal}</Text>
        )}
      </View>

      {shiftRequired && (
        <View style={styles.shiftGate}>
          <View style={styles.shiftGateHeader}>
            <Clock size={16} color="#b45309" />
            <Text style={styles.shiftGateText}>
              No shift is open on this terminal. Open one with a starting cash float before billing.
            </Text>
          </View>
          <View style={styles.shiftGateRow}>
            <TextInput
              style={styles.shiftInput}
              keyboardType="numeric"
              value={openingCashInput}
              onChangeText={setOpeningCashInput}
              placeholder="Opening cash (₹)"
              placeholderTextColor="#a16207"
            />
            <TouchableOpacity
              style={[styles.shiftOpenBtn, (!openingCashInput || openingShift) && styles.shiftOpenBtnDisabled]}
              onPress={handleOpenShift}
              disabled={!openingCashInput || openingShift}
            >
              {openingShift ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.shiftOpenBtnText}>Open Shift</Text>
              )}
            </TouchableOpacity>
          </View>
          {shiftError !== '' && <Text style={styles.shiftErrorText}>{shiftError}</Text>}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.payBtn,
          !offlineSync.isBackendReachable && styles.payBtnOffline,
          shiftRequired && styles.payBtnDisabled,
        ]}
        onPress={handleCompleteSale}
        disabled={loading || shiftRequired || (paymentMethod === 'SPLIT' && (splitShortfall > 0 || splitChangeBlocked))}
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
  couponRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  couponInput: { flex: 1, borderWidth: 1, borderColor: '#e5e5e5', backgroundColor: '#fafafa', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'monospace', fontWeight: '700', fontSize: 13, color: '#171717' },
  couponBtn: { backgroundColor: '#171717', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  couponBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 12 },
  couponChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  couponChipCode: { flex: 1, fontWeight: '800', color: '#065f46', fontSize: 12 },
  couponChipAmount: { fontWeight: '800', color: '#065f46', marginRight: 12 },
  couponChipRemove: { fontWeight: '800', color: '#059669', fontSize: 10 },
  summaryStrike: { color: '#a3a3a3', textDecorationLine: 'line-through', fontSize: 12, marginTop: 2 },
  splitBox: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, marginBottom: 12, gap: 8 },
  splitTitle: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  splitMethod: { width: 60, fontSize: 12, fontWeight: '800', color: '#374151' },
  splitInput: { flex: 1, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, textAlign: 'right', color: '#111827' },
  splitStatus: { fontSize: 11, fontWeight: '700', color: '#0284c7' },
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
  payBtnDisabled: {
    opacity: 0.5,
  },
  shiftGate: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  shiftGateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  shiftGateText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  shiftGateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shiftInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8,
  },
  shiftOpenBtn: {
    backgroundColor: '#b45309',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  shiftOpenBtnDisabled: {
    opacity: 0.5,
  },
  shiftOpenBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  shiftErrorText: {
    fontSize: 10,
    color: '#b91c1c',
    fontWeight: '600',
    marginTop: 8,
  },
  offlineNote: {
    fontSize: 10,
    color: '#b45309',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});
