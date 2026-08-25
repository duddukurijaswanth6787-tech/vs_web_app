import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react-native';
import { shopCartService, ShopCart, ShopCartItem } from '../services/shop-api';
import { getApiErrorMessage, isAuthenticated } from '../services/api';

export default function CartScreen() {
  const router = useRouter();
  const [cart, setCart] = useState<ShopCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyItemId, setBusyItemId] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated()) {
        router.replace('/login?redirect=/cart');
      }
    }, [router]),
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await shopCartService.getCart();
      setCart(res);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const updateQuantity = async (item: ShopCartItem, delta: number) => {
    const newQty = item.quantity + delta;
    setBusyItemId(item.id);
    try {
      if (newQty <= 0) {
        await shopCartService.removeItem(item.id);
      } else {
        await shopCartService.updateQuantity(item.id, newQty);
      }
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyItemId('');
    }
  };

  const items = cart?.items ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
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
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <ShoppingBag size={40} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <TouchableOpacity style={styles.shopLink} onPress={() => router.push('/shop')}>
            <Text style={styles.shopLinkText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Text style={{ fontSize: 18 }}>👗</Text>
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.productName || 'Product'}</Text>
                  <Text style={styles.itemPrice}>₹{item.unitPrice} × {item.quantity} = ₹{item.totalPrice}</Text>
                  <View style={styles.itemControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item, -1)}
                      disabled={busyItemId === item.id}
                    >
                      <Minus size={12} color="#1f2937" />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item, 1)}
                      disabled={busyItemId === item.id}
                    >
                      <Plus size={12} color="#1f2937" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => updateQuantity(item, -item.quantity)}
                      disabled={busyItemId === item.id}
                    >
                      <Trash2 size={14} color="#b91c1c" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{cart?.subtotal ?? 0}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/address')}>
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
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
  emptyTitle: { fontSize: 14, color: '#6b7280', marginTop: 12, marginBottom: 16 },
  shopLink: { backgroundColor: '#0284c7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  shopLinkText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e0e4',
  },
  itemImage: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#f5f5f5' },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 12, fontWeight: '600', color: '#1f2937' },
  itemPrice: { fontSize: 11, color: '#6b7280', marginTop: 4 },
  itemControls: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: { fontSize: 12, fontWeight: 'bold', color: '#1f2937', minWidth: 16, textAlign: 'center' },
  removeBtn: { marginLeft: 'auto', padding: 4 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f0e0e4',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 13, color: '#6b7280' },
  totalValue: { fontSize: 17, fontWeight: 'bold', color: '#0284c7' },
  checkoutBtn: { backgroundColor: '#0284c7', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  checkoutBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
