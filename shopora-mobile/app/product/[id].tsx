import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShoppingCart, Minus, Plus, Check } from 'lucide-react-native';
import { shopCatalogService, shopCartService, ShopProduct } from '../../services/shop-api';
import { getApiErrorMessage } from '../../services/api';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    shopCatalogService
      .getProduct(id)
      .then(setProduct)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    setError('');
    setAdded(false);
    try {
      // No variant/size picker yet -- this adds the base product. If the
      // catalog requires a variant to check out, the checkout step will
      // surface that clearly rather than silently failing here.
      await shopCartService.addItem({ productId: product.id, quantity });
      setAdded(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0284c7" />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1f2937" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.iconBtn}>
          <ShoppingCart size={22} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {product.primaryImageUrl ? (
          <Image source={{ uri: product.primaryImageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 48 }}>👗</Text>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.name}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.salePrice ?? product.basePrice}</Text>
            {product.salePrice && product.salePrice < product.basePrice && (
              <Text style={styles.originalPrice}>₹{product.basePrice}</Text>
            )}
          </View>

          {product.shortDescription && <Text style={styles.description}>{product.shortDescription}</Text>}

          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus size={14} color="#1f2937" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityBtn} onPress={() => setQuantity((q) => q + 1)}>
                <Plus size={14} color="#1f2937" />
              </TouchableOpacity>
            </View>
          </View>

          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.addBtn, added && styles.addBtnSuccess]}
            onPress={handleAddToCart}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="#ffffff" />
            ) : added ? (
              <>
                <Check size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.addBtnText}>Added to Cart</Text>
              </>
            ) : (
              <>
                <ShoppingCart size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.addBtnText}>Add to Cart</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconBtn: { padding: 4 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#b91c1c', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  backLink: { marginTop: 12 },
  backLinkText: { color: '#0284c7', fontWeight: 'bold', fontSize: 13 },
  image: { width: '100%', height: 340, backgroundColor: '#f5f5f5' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20 },
  name: { fontSize: 19, fontWeight: 'bold', fontFamily: 'serif', color: '#1f2937' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#0284c7' },
  originalPrice: { fontSize: 14, color: '#9ca3af', textDecorationLine: 'line-through' },
  description: { fontSize: 13, color: '#6b7280', marginTop: 14, lineHeight: 20 },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  quantityLabel: { fontSize: 13, fontWeight: 'bold', color: '#374151' },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quantityBtn: { padding: 2 },
  quantityValue: { fontSize: 14, fontWeight: 'bold', color: '#1f2937', minWidth: 20, textAlign: 'center' },
  addBtn: {
    marginTop: 24,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnSuccess: { backgroundColor: '#16a34a' },
  addBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
});
