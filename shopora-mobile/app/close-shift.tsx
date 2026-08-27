import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, LockKeyhole, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { posMobileService } from '../services/api';
import { getTerminalId } from '../services/terminal';

const rupees = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Counting the drawer and closing the till from the phone.
 *
 * The app could open a shift but never close one, so a cashier working from a
 * phone had to find a web POS to reconcile their own drawer -- or leave the
 * shift open, which quietly rolls their takings into the next one.
 *
 * The variance is shown before confirming rather than after: a miscount is
 * worth catching while the cash is still in hand.
 */
export default function CloseShiftScreen() {
  const router = useRouter();

  const [shift, setShift] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [closed, setClosed] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const terminalId = await getTerminalId();
        setShift(await posMobileService.getCurrentShift(terminalId));
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Could not load the current shift.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const expected = Number(shift?.expectedCash ?? shift?.openingCash ?? 0);
  const countedNum = parseFloat(counted);
  const hasCount = Number.isFinite(countedNum);
  const variance = hasCount ? countedNum - expected : 0;

  const handleClose = async () => {
    if (!hasCount || countedNum < 0) {
      return setError('Enter the cash you counted in the drawer.');
    }
    setError('');
    setSubmitting(true);
    try {
      const result = await posMobileService.closeShift(shift.id, {
        closingCashCounted: countedNum,
        notes: notes.trim() || undefined,
      });
      setClosed(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not close the shift.');
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
        <Text style={styles.headerTitle}>Close Shift</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#171717" />
        ) : closed ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={18} color="#047857" />
            <View style={{ flex: 1 }}>
              <Text style={styles.successText}>Shift closed</Text>
              <Text style={styles.muted}>
                Counted {rupees(closed.closingCashCounted ?? countedNum)} · variance{' '}
                {rupees(closed.cashVariance ?? variance)}
              </Text>
            </View>
          </View>
        ) : !shift ? (
          <View style={styles.card}>
            <Text style={styles.muted}>
              No shift is open on this register, so there is nothing to close.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.orderNo}>{shift.terminalId ?? 'This register'}</Text>
            <Text style={styles.muted}>
              Opened {shift.openedAt ? new Date(shift.openedAt).toLocaleString() : '—'}
            </Text>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Opening float</Text>
              <Text style={styles.statValue}>{rupees(shift.openingCash ?? 0)}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Expected in drawer</Text>
              <Text style={styles.statValue}>{rupees(expected)}</Text>
            </View>

            <Text style={styles.label}>Cash counted</Text>
            <TextInput
              value={counted}
              onChangeText={setCounted}
              placeholder="0.00"
              placeholderTextColor="#a3a3a3"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            {hasCount && (
              <View
                style={[
                  styles.varianceBox,
                  variance === 0
                    ? styles.varianceOk
                    : variance > 0
                      ? styles.varianceOver
                      : styles.varianceShort,
                ]}
              >
                <Text style={styles.varianceText}>
                  {variance === 0
                    ? 'Drawer balances exactly'
                    : variance > 0
                      ? `Over by ${rupees(variance)}`
                      : `Short by ${rupees(Math.abs(variance))}`}
                </Text>
              </View>
            )}

            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Anything worth recording about this drawer"
              placeholderTextColor="#a3a3a3"
              style={styles.input}
            />

            {!!error && (
              <View style={styles.errorBox}>
                <AlertTriangle size={16} color="#be123c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleClose}
              disabled={submitting || !hasCount}
              style={[styles.submit, (submitting || !hasCount) && styles.submitDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <LockKeyhole size={18} color="#fff" />
                  <Text style={styles.submitText}>Close Shift</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!!error && !shift && !loading && (
          <View style={styles.errorBox}>
            <AlertTriangle size={16} color="#be123c" />
            <Text style={styles.errorText}>{error}</Text>
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 10,
  },
  statLabel: { fontSize: 13, color: '#525252' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#171717' },
  label: { fontSize: 12, fontWeight: '700', color: '#525252', marginTop: 6 },
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
  varianceBox: { borderRadius: 10, padding: 12, borderWidth: 1 },
  varianceOk: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  varianceOver: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  varianceShort: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  varianceText: { fontSize: 13, fontWeight: '700', color: '#171717' },
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
    padding: 14,
  },
  successText: { color: '#047857', fontSize: 14, fontWeight: '700' },
  submit: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#171717',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
