import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Search, ShoppingCart, ArrowLeft } from 'lucide-react-native';
import { shopCatalogService, shopCartService, ShopProduct } from '../services/shop-api';
import { getApiErrorMessage } from '../services/api';

export default function ShopScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [cartCount, setCartCount] = useState(0);

  const load = useCallback(async (query?: string) => {
    setError('');
    try {
      const res = await shopCatalogService.listProducts({ search: query || undefined, limit: 30 });
      setProducts(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }, []);

  const loadCartCount = useCallback(async () => {
    try {
      const cart = await shopCartService.getCart();
      setCartCount(cart.itemCount ?? 0);
    } catch {
      // Not signed in or cart not reachable yet -- badge just stays at 0.
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      loadCartCount();
    }, [loadCartCount]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(search), loadCartCount()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop</Text>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconBtn}>
          <ShoppingCart size={22} color="#1f2937" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <Search size={16} color="#9ca3af" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sarees, lehengas, kurtis..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => load(search)}
          returnKeyType="search"
        />
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
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              activeOpacity={0.85}
            >
              {item.primaryImageUrl ? (
                <Image source={{ uri: item.primaryImageUrl }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                  <Text style={{ fontSize: 24 }}>👗</Text>
                </View>
              )}
              <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.cardPrice}>₹{item.salePrice ?? item.basePrice}</Text>
                {item.salePrice && item.salePrice < item.basePrice && (
                  <Text style={styles.cardOriginalPrice}>₹{item.basePrice}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'serif', color: '#0284c7' },
  iconBtn: { padding: 4, position: 'relative' },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0284c7',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e0e4',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111827' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b91c1c', fontSize: 13, textAlign: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 40 },
  grid: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f0e0e4',
  },
  cardImage: { width: '100%', height: 140, borderRadius: 10, backgroundColor: '#f5f5f5' },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 12, fontWeight: '600', color: '#1f2937', marginTop: 8, minHeight: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: '#0284c7' },
  cardOriginalPrice: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
});
