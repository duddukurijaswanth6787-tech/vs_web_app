import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={48} color="#16a34a" />
        </View>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>Order #{orderNumber} has been placed successfully.</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/orders')}>
          <Text style={styles.primaryBtnText}>View My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/shop')}>
          <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: 'bold', fontFamily: 'serif', color: '#1f2937' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 8, textAlign: 'center' },
  primaryBtn: {
    marginTop: 32,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  secondaryBtn: { marginTop: 14, paddingVertical: 10 },
  secondaryBtnText: { color: '#0284c7', fontWeight: 'bold', fontSize: 13 },
});
