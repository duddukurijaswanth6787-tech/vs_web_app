import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, ShoppingBag, RotateCcw } from 'lucide-react-native';

export default function SaleSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderNumber = (params.orderNumber as string) || 'ORD-20260811-POS101';
  const grandTotal = (params.grandTotal as string) || '2937';
  const completedOn = (params.completedOn as string) || 'Shopora Platform';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={48} color="#0284c7" />
        </View>

        <Text style={styles.title}>✓ SALE COMPLETED</Text>
        <Text style={styles.sub}>
          Transaction processed & stock deducted successfully.
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Number</Text>
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
            <Text style={styles.totalValue}>₹{grandTotal}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newSaleBtn}
          onPress={() => router.replace('/sale')}
        >
          <RotateCcw size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.newSaleBtnText}>START NEW SALE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => router.replace('/')}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
    textAlign: 'center',
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
