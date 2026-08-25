import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Package } from 'lucide-react-native';
import { shopOrdersService, ShopOrderSummary } from '../services/shop-api';
import { getApiErrorMessage, isAuthenticated } from '../services/api';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<ShopOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated()) {
        router.replace('/login?redirect=/orders');
        return;
      }
      setLoading(true);
      setError('');
      shopOrdersService
        .listOrders()
        .then(setOrders)
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setLoading(false));
    }, [router]),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Package size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>No orders yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderRow}>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <Text style={styles.orderStatus}>{item.status}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderDate}>
                  {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <Text style={styles.orderTotal}>₹{item.grandTotal}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  iconBtn: { padding: 4 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b91c1c', fontSize: 13, textAlign: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 13, marginTop: 10 },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e0e4',
  },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  orderNumber: { fontSize: 13, fontWeight: 'bold', color: '#0284c7' },
  orderStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  orderDate: { fontSize: 11, color: '#9ca3af' },
  orderTotal: { fontSize: 13, fontWeight: 'bold', color: '#1f2937' },
});
