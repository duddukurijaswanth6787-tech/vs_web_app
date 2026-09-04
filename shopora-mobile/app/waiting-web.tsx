import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Monitor, CheckCircle2, XCircle, ArrowLeft, BookmarkPlus, Sparkles } from 'lucide-react-native';
import { joinSessionRoom, onSessionAdopted, onSaleCompleted } from '../services/socket';
import { posMobileService } from '../services/api';
import { setGlobalCart } from './sale';

export default function WaitingWebScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;
  const handoffToken = params.handoffToken as string;
  const grandTotalStr = params.grandTotal as string;

  const [statusText, setStatusText] = useState('Waiting for billing counter...');
  const [isAdopted, setIsAdopted] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (sessionId) {
      joinSessionRoom(sessionId);

      const unsubscribeAdopt = onSessionAdopted(() => {
        setIsAdopted(true);
        setStatusText('Counter Cashier Adopted Session...');
      });

      const unsubscribeComplete = onSaleCompleted((saleData: any) => {
        setGlobalCart([]);
        router.replace({
          pathname: '/sale-success',
          params: {
            orderNumber: saleData.orderNumber || 'COMPLETED',
            grandTotal: saleData.grandTotal?.toString() || grandTotalStr,
            completedOn: 'Shopora Web Counter',
          },
        });
      });

      return () => {
        unsubscribeAdopt();
        unsubscribeComplete();
      };
    }
  }, [sessionId, grandTotalStr, router]);

  // Park the session so the floor staff can immediately assist the next customer!
  const handleParkSession = () => {
    setGlobalCart([]);
    Alert.alert(
      'Session Parked',
      `PIN ${handoffToken} is ready at the billing counter. You can now assist the next customer!`,
      [{ text: 'OK', onPress: () => router.replace('/sale') }]
    );
  };

  // Void / Cancel the session if customer walks away
  const handleCancelSession = () => {
    Alert.alert(
      'Cancel Counter Session?',
      'Are you sure you want to cancel this checkout session? Any items reserved will be released.',
      [
        { text: 'Keep Session', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              if (sessionId) {
                await posMobileService.discardHeldSession(sessionId);
              }
            } catch (e) {
              console.log('Error discarding session:', e);
            } finally {
              setCancelling(false);
              setGlobalCart([]);
              router.replace('/sale');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Monitor size={36} color="#0284c7" />
        </View>

        <Text style={styles.title}>CHECKOUT AT BILLING COUNTER</Text>
        <Text style={styles.sub}>
          Show this PIN or QR to the main billing counter to complete payment and print the tax invoice.
        </Text>

        {/* Session PIN Box */}
        <View style={styles.pinBox}>
          <Text style={styles.pinLabel}>SESSION PIN (ENTER ON WEB POS)</Text>
          <Text style={styles.pinValue}>{handoffToken || '—'}</Text>
          <Text style={styles.sessionRef}>Session #{sessionId}</Text>
        </View>

        {/* Live Status Row */}
        <View style={styles.statusRow}>
          {isAdopted ? (
            <CheckCircle2 size={16} color="#16a34a" />
          ) : (
            <ActivityIndicator size="small" color="#0284c7" />
          )}
          <Text style={[styles.statusText, isAdopted && { color: '#16a34a' }]}>
            {statusText}
          </Text>
        </View>

        {/* Action 1: Non-blocking Park / Assist Next Customer */}
        <TouchableOpacity style={styles.parkBtn} onPress={handleParkSession}>
          <BookmarkPlus size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.parkBtnText}>PARK & ASSIST NEXT CUSTOMER</Text>
        </TouchableOpacity>

        {/* Action 2: Cancel Session */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancelSession}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#ef4444" style={{ marginRight: 6 }} />
          ) : (
            <XCircle size={16} color="#ef4444" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.cancelBtnText}>CANCEL SESSION</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.totalLabel}>Cart Total</Text>
        <Text style={styles.totalValue}>₹{grandTotalStr || '0'}</Text>
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
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0369a1',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  sub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  pinBox: {
    width: '100%',
    backgroundColor: '#f0f9ff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    padding: 18,
    alignItems: 'center',
    marginVertical: 18,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369a1',
    letterSpacing: 0.8,
  },
  pinValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: 6,
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  sessionRef: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
    marginLeft: 8,
  },
  parkBtn: {
    width: '100%',
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  parkBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
  },
  footerNote: {
    marginTop: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0284c7',
    marginTop: 2,
  },
});
