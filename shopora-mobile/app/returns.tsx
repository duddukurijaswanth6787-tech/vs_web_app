import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, RotateCcw, CheckCircle2, AlertTriangle } from 'lucide-react-native';
import { posMobileService } from '../services/api';

const REFUND_METHODS = ['ORIGINAL', 'CASH', 'UPI', 'CARD'];

interface SaleItem {
  orderItemId: string;
  productName: string;
  variantTitle?: string;
  returnableQuantity: number;
  unitRefund: number;
}

interface Sale {
  orderNumber: string;
  soldAt: string;
  paymentMethod: string;
  grandTotal: number;
  items: SaleItem[];
}

const rupees = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Counter returns on the phone.
 *
 * Refunds used to be web-POS only: a shop running its till on phones could
 * sell but not take anything back, which is the other half of the job. The
 * server still owns the rules -- it re-checks the shift, the quantities and
 * what is actually returnable -- so this screen never decides a refund by
 * itself.
 */
export default function ReturnsScreen() {
  const router = useRouter();

  const [orderNumber, setOrderNumber] = useState('');
  const [sale, setSale] = useState<Sale | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [refundMethod, setRefundMethod] = useState('ORIGINAL');
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<{ returnNumber: string; refundAmount: number } | null>(null);

  const selected = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
    [quantities],
  );

  const refundTotal = useMemo(() => {
    if (!sale) return 0;
    return selected.reduce((sum, sel) => {
      const item = sale.items.find((i) => i.orderItemId === sel.orderItemId);
      return sum + (item ? item.unitRefund * sel.quantity : 0);
    }, 0);
  }, [sale, selected]);

  const handleSearch = async () => {
    const trimmed = orderNumber.trim();
    if (!trimmed) return setError('Enter the order number from the receipt.');
    setError('');
    setReceipt(null);
    setQuantities({});
    setSale(null);
    setSearching(true);
    try {
      setSale(await posMobileService.lookupReturnableSale(trimmed));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'No sale found for that number.');
    } finally {
      setSearching(false);
    }
  };

  const setQty = (item: SaleItem, next: number) => {
    // Clamped to what is actually left on the line, so the screen cannot ask
    // for a refund the server is bound to reject.
    const clamped = Math.max(0, Math.min(next, item.returnableQuantity));
    setQuantities((prev) => ({ ...prev, [item.orderItemId]: clamped }));
  };

  const handleSubmit = async () => {
    if (!sale || !selected.length) return setError('Select at least one item to return.');
    if (!reason.trim()) return setError('Enter a reason for the return.');
    setError('');
    setSubmitting(true);
    try {
      const result = await posMobileService.createReturn({
        orderNumber: sale.orderNumber,
        items: selected,
        refundMethod,
        reason: reason.trim(),
      });
      setReceipt({ returnNumber: result.returnNumber, refundAmount: result.refundAmount });
      setQuantities({});
      setReason('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not complete the return.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <ArrowLeft size={22} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Returns</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.searchRow}>
          <TextInput
            value={orderNumber}
            onChangeText={setOrderNumber}
            placeholder="Order number from the receipt"
            placeholderTextColor="#a3a3a3"
            style={styles.searchInput}
            autoCapitalize="characters"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchBtn} disabled={searching}>
            {searching ? <ActivityIndicator color="#fff" /> : <Search size={18} color="#fff" />}
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <AlertTriangle size={16} color="#be123c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {receipt && (
          <View style={styles.successBox}>
            <CheckCircle2 size={16} color="#047857" />
            <Text style={styles.successText}>
              Return {receipt.returnNumber} done · {rupees(receipt.refundAmount)} refunded
            </Text>
          </View>
        )}

        {sale && (
          <View style={styles.card}>
            <Text style={styles.orderNo}>{sale.orderNumber}</Text>
            <Text style={styles.muted}>
              Sold {new Date(sale.soldAt).toLocaleString()} · paid by {sale.paymentMethod}
            </Text>

            {sale.items.map((item) => {
              const qty = quantities[item.orderItemId] ?? 0;
              return (
                <View key={item.orderItemId} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    {!!item.variantTitle && <Text style={styles.muted}>{item.variantTitle}</Text>}
                    <Text style={styles.muted}>
                      {item.returnableQuantity} returnable · {rupees(item.unitRefund)} each
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      onPress={() => setQty(item, qty - 1)}
                      style={styles.stepBtn}
                      accessibilityLabel={`Reduce ${item.productName}`}
                    >
                      <Text style={styles.stepText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qty}>{qty}</Text>
                    <TouchableOpacity
                      onPress={() => setQty(item, qty + 1)}
                      style={styles.stepBtn}
                      accessibilityLabel={`Increase ${item.productName}`}
                    >
                      <Text style={styles.stepText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            <Text style={styles.label}>Refund by</Text>
            <View style={styles.methodRow}>
              {REFUND_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setRefundMethod(m)}
                  style={[styles.method, refundMethod === m && styles.methodActive]}
                >
                  <Text style={[styles.methodText, refundMethod === m && styles.methodTextActive]}>
                    {m === 'ORIGINAL' ? 'Same as paid' : m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Reason</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Why is this coming back?"
              placeholderTextColor="#a3a3a3"
              style={styles.input}
            />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Refund total</Text>
              <Text style={styles.totalValue}>{rupees(refundTotal)}</Text>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || !selected.length}
              style={[styles.submit, (submitting || !selected.length) && styles.submitDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <RotateCcw size={18} color="#fff" />
                  <Text style={styles.submitText}>Refund {rupees(refundTotal)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fafafa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backBtn: { padding: 6, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#171717' },
  body: { padding: 16, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#171717',
  },
  searchBtn: {
    backgroundColor: '#171717',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 12,
  },
  errorText: { flex: 1, color: '#be123c', fontSize: 13 },
  successBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 12,
  },
  successText: { flex: 1, color: '#047857', fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  orderNo: { fontSize: 16, fontWeight: '700', color: '#171717' },
  muted: { fontSize: 12, color: '#737373' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 10,
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#171717' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 20, color: '#171717' },
  qty: { minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#171717' },
  label: { fontSize: 12, fontWeight: '700', color: '#525252', marginTop: 6 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  method: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  methodActive: { backgroundColor: '#171717', borderColor: '#171717' },
  methodText: { fontSize: 12, color: '#525252' },
  methodTextActive: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#171717',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#525252' },
  totalValue: { fontSize: 18, fontWeight: '800', color: '#171717' },
  submit: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#171717',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
