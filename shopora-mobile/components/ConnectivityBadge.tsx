import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Wifi, WifiOff, CloudUpload, AlertTriangle, RefreshCw } from 'lucide-react-native';

interface ConnectivityBadgeProps {
  isBackendReachable: boolean;
  pendingCount: number;
  needsReviewCount: number;
  isSyncing: boolean;
}

/**
 * Small always-visible connectivity + queue indicator, reused on every
 * screen that can queue work offline (sale, checkout-phone, add-stock).
 * Tapping the queue pill opens the Pending Sync screen. Mirrors the color
 * conventions already used across this app (sky blue = normal/info, amber =
 * offline/attention, rose = needs review) rather than introducing a new
 * palette.
 */
export function ConnectivityBadge({
  isBackendReachable,
  pendingCount,
  needsReviewCount,
  isSyncing,
}: ConnectivityBadgeProps) {
  const router = useRouter();
  const hasQueue = pendingCount > 0 || needsReviewCount > 0;

  return (
    <View style={styles.row}>
      <View style={[styles.badge, isBackendReachable ? styles.badgeOnline : styles.badgeOffline]}>
        {isBackendReachable ? (
          <Wifi size={13} color="#047857" />
        ) : (
          <WifiOff size={13} color="#b45309" />
        )}
        <Text style={[styles.badgeText, isBackendReachable ? styles.textOnline : styles.textOffline]}>
          {isBackendReachable ? 'Online' : 'Offline'}
        </Text>
      </View>

      {hasQueue && (
        <TouchableOpacity
          style={[styles.badge, needsReviewCount > 0 ? styles.badgeReview : styles.badgeQueue]}
          onPress={() => router.push('/pending-sync')}
          activeOpacity={0.8}
        >
          {isSyncing ? (
            <RefreshCw size={13} color="#0369a1" />
          ) : needsReviewCount > 0 ? (
            <AlertTriangle size={13} color="#be123c" />
          ) : (
            <CloudUpload size={13} color="#0369a1" />
          )}
          <Text style={[styles.badgeText, needsReviewCount > 0 ? styles.textReview : styles.textQueue]}>
            {isSyncing ? 'Syncing…' : `${pendingCount + needsReviewCount} Queued`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  badgeOnline: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  badgeOffline: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  badgeQueue: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  badgeReview: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  textOnline: {
    color: '#047857',
  },
  textOffline: {
    color: '#b45309',
  },
  textQueue: {
    color: '#0369a1',
  },
  textReview: {
    color: '#be123c',
  },
});
