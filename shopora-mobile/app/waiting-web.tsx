import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Monitor, CheckCircle2, XCircle } from 'lucide-react-native';
import { joinSessionRoom, onSessionAdopted, onSaleCompleted } from '../services/socket';

export default function WaitingWebScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId as string;
  const handoffToken = params.handoffToken as string;
  const grandTotalStr = params.grandTotal as string;

  const [statusText, setStatusText] = useState('Waiting for desktop cashier...');
  const [isAdopted, setIsAdopted] = useState(false);

  useEffect(() => {
    if (sessionId) {
      joinSessionRoom(sessionId);

      const unsubscribeAdopt = onSessionAdopted(() => {
        setIsAdopted(true);
        setStatusText('Active on Shopora Web Desktop...');
      });

      const unsubscribeComplete = onSaleCompleted((saleData: any) => {
        router.replace({
          pathname: '/sale-success',
          params: {
            orderNumber: saleData.orderNumber || 'COMPLETED',
            grandTotal: saleData.grandTotal?.toString() || grandTotalStr,
            completedOn: 'Shopora Web Desktop',
          },
        });
      });

      return () => {
        unsubscribeAdopt();
        unsubscribeComplete();
      };
    }
  }, [sessionId, grandTotalStr, router]);

  const handleCancelSession = () => {
    router.replace('/sale');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Monitor size={36} color="#0284c7" />
        </View>

        <Text style={styles.title}>CHECKOUT ON SHOPORA WEB</Text>
        <Text style={styles.sub}>
          Your sale is ready! Open Shopora on your computer to finish checkout & print invoice.
        </Text>

        {/* Session ID & 6-Digit PIN Display */}
        <View style={styles.pinBox}>
          <Text style={styles.pinLabel}>SESSION PIN (ENTER ON WEB)</Text>
          <Text style={styles.pinValue}>{handoffToken || '582-194'}</Text>
          <Text style={styles.sessionRef}>Session #{sessionId}</Text>
        </View>

        {/* Live Socket Status Badge */}
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

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSession}>
          <XCircle size={16} color="#ef4444" style={{ marginRight: 6 }} />
          <Text style={styles.cancelBtnText}>CANCEL SESSION</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.totalLabel}>Sale Amount</Text>
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
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
    textAlign: 'center',
  },
  sub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  pinBox: {
    width: '100%',
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    padding: 16,
    alignItems: 'center',
    marginVertical: 20,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369a1',
    letterSpacing: 0.5,
  },
  pinValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0284c7',
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginVertical: 4,
  },
  sessionRef: {
    fontSize: 11,
    color: '#0284c7',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7',
    marginLeft: 8,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  footerNote: {
    marginTop: 20,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 2,
  },
});
