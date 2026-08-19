import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CloudUpload, RefreshCw, Clock, AlertTriangle, CheckCircle2, XCircle, Trash2 } from 'lucide-react-native';
import { useOfflineSync } from '../services/offline/useOfflineSync';
import { PendingSale, PendingStockIn } from '../services/offline/offline.types';

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#fffbeb', fg: '#b45309' },
  SYNCING: { bg: '#e0f2fe', fg: '#0369a1' },
  SYNCED: { bg: '#ecfdf5', fg: '#047857' },
  NEEDS_REVIEW: { bg: '#fff1f2', fg: '#be123c' },
  FAILED: { bg: '#fff1f2', fg: '#be123c' },
};

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING;
  return (
    <View style={[styles.pill, { backgroundColor: style.bg }]}>
      <Text style={[styles.pillText, { color: style.fg }]}>{status.replace('_', ' ')}</Text>
    </View>
  );
}

/**
 * Lightweight offline queue viewer: the sales and stock-ins that were saved
 * locally while the backend was unreachable. Kept simple (list + retry +
 * discard) per the task's minimum bar -- no elaborate UI is required, just
 * a clear affordance so nothing queued offline is ever silently lost.
 */
export default function PendingSyncScreen() {
  const router = useRouter();
  const offlineSync = useOfflineSync();

  const confirmDiscardSale = (sale: PendingSale) => {
    Alert.alert(
      'Discard this sale?',
      'It will never be recorded in the system. Only do this if the sale is being cancelled at the register.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => offlineSync.dismissSale(sale.localId) },
      ],
    );
  };

  const confirmDiscardStockIn = (entry: PendingStockIn) => {
    Alert.alert(
      'Discard this stock-in?',
      'The stock will never be credited. Only do this if the replenishment was entered by mistake.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => offlineSync.dismissStockIn(entry.localId) },
      ],
    );
  };

  const hasAnything = offlineSync.pendingSales.length > 0 || offlineSync.pendingStockIns.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.connBadge,
            offlineSync.isBackendReachable ? styles.connOnline : styles.connOffline,
          ]}
        >
          <Text
            style={[
              styles.connBadgeText,
              { color: offlineSync.isBackendReachable ? '#047857' : '#b45309' },
            ]}
          >
            {offlineSync.isBackendReachable ? 'Backend Online' : 'Backend Offline'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.syncBtn}
          onPress={() => offlineSync.syncNow()}
          disabled={offlineSync.isSyncing || !offlineSync.isBackendReachable}
        >
          <RefreshCw size={14} color="#ffffff" style={offlineSync.isSyncing ? styles.spin : undefined} />
          <Text style={styles.syncBtnText}>Sync Now</Text>
        </TouchableOpacity>
      </View>

      {!hasAnything ? (
        <View style={styles.emptyBox}>
          <CloudUpload size={40} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Queue is Empty</Text>
          <Text style={styles.emptySub}>Everything taken on this device is synced with the server.</Text>
        </View>
      ) : (
        <>
          {offlineSync.pendingSales.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Pending Sales ({offlineSync.pendingSales.length})</Text>
              {offlineSync.pendingSales.map((sale) => (
                <View key={sale.localId} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {sale.clientOrderNumber}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {new Date(sale.createdAt).toLocaleString()} • ₹{sale.receipt.grandTotal} •{' '}
                        {sale.receipt.items.length} item(s)
                      </Text>
                    </View>
                    <StatusPill status={sale.status} />
                  </View>

                  {sale.status === 'NEEDS_REVIEW' && sale.shortages && sale.shortages.length > 0 && (
                    <View style={styles.warnBox}>
                      <Text style={styles.warnTitle}>Stock changed while offline:</Text>
                      {sale.shortages.map((s, i) => (
                        <Text key={i} style={styles.warnLine}>
                          {s.productName}
                          {s.variantTitle ? ` (${s.variantTitle})` : ''} — wanted {s.requested}, only{' '}
                          {s.available} left
                        </Text>
                      ))}
                    </View>
                  )}

                  {sale.status === 'FAILED' && sale.errorMessage && (
                    <View style={styles.warnBox}>
                      <Text style={styles.warnLine}>{sale.errorMessage}</Text>
                    </View>
                  )}

                  {sale.status === 'SYNCED' && sale.syncedOrderNumber && (
                    <View style={styles.okRow}>
                      <CheckCircle2 size={14} color="#047857" />
                      <Text style={styles.okText}>Synced as order {sale.syncedOrderNumber}</Text>
                    </View>
                  )}

                  {(sale.status === 'NEEDS_REVIEW' || sale.status === 'FAILED') && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => offlineSync.retrySale(sale.localId)}
                      >
                        <Text style={styles.retryBtnText}>Retry Sync</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.discardBtn} onPress={() => confirmDiscardSale(sale)}>
                        <Trash2 size={13} color="#be123c" />
                        <Text style={styles.discardBtnText}>Discard</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {offlineSync.pendingStockIns.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Pending Stock-Ins ({offlineSync.pendingStockIns.length})</Text>
              {offlineSync.pendingStockIns.map((entry) => (
                <View key={entry.localId} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {entry.variant.productName}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {entry.variant.variantTitle || 'Standard'} {entry.variant.sku ? `• ${entry.variant.sku}` : ''}{' '}
                        • +{entry.quantity} pcs
                      </Text>
                      <Text style={styles.cardMeta}>{new Date(entry.createdAt).toLocaleString()}</Text>
                    </View>
                    <StatusPill status={entry.status} />
                  </View>

                  {entry.status === 'FAILED' && entry.errorMessage && (
                    <View style={styles.warnBox}>
                      <Text style={styles.warnLine}>{entry.errorMessage}</Text>
                    </View>
                  )}

                  {entry.status === 'SYNCED' && (
                    <View style={styles.okRow}>
                      <CheckCircle2 size={14} color="#047857" />
                      <Text style={styles.okText}>Stock credited on the server.</Text>
                    </View>
                  )}

                  {entry.status === 'FAILED' && (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => offlineSync.retryStockIn(entry.localId)}
                      >
                        <Text style={styles.retryBtnText}>Retry Sync</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.discardBtn} onPress={() => confirmDiscardStockIn(entry)}>
                        <XCircle size={13} color="#be123c" />
                        <Text style={styles.discardBtnText}>Discard</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
        </>
      )}

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>Close</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  connBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  connOnline: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  connOffline: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  connBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  spin: {
    opacity: 0.7,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cardMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  warnBox: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },
  warnTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#be123c',
    marginBottom: 2,
  },
  warnLine: {
    fontSize: 10,
    color: '#9f1239',
  },
  okRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  okText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  retryBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fda4af',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  discardBtnText: {
    color: '#be123c',
    fontSize: 11,
    fontWeight: 'bold',
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
