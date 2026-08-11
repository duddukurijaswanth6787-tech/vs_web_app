import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Smartphone, Monitor, ArrowRight } from 'lucide-react-native';
import { posMobileService, PosMobileCartItem } from '../services/api';

export default function CheckoutModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cartJson = params.cartJson as string;
  const subtotalStr = params.subtotal as string;

  const [loading, setLoading] = React.useState(false);

  let cartItems: PosMobileCartItem[] = [];
  try {
    if (cartJson) cartItems = JSON.parse(cartJson);
  } catch (e) {
    console.error('Failed to parse cart items:', e);
  }

  const subtotal = Number(subtotalStr || '0');
  const taxTotal = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = subtotal + taxTotal;

  // Option 1: Continue on Phone
  const handleContinueOnPhone = () => {
    router.push({
      pathname: '/checkout-phone',
      params: {
        cartJson,
        subtotal: subtotalStr,
        grandTotal: grandTotal.toString(),
      },
    });
  };

  // Option 2: Continue on Shopora Website (Handoff)
  const handleContinueOnWeb = async () => {
    try {
      setLoading(true);
      const session = await posMobileService.createCheckoutSession({
        items: cartItems,
        customer: { fullName: 'Walk-in Customer', phone: '9999999999' },
      });

      // Navigate to Waiting Screen with Session ID & 6-digit PIN
      router.push({
        pathname: '/waiting-web',
        params: {
          sessionId: session.sessionId,
          handoffToken: session.handoffToken,
          grandTotal: session.grandTotal.toString(),
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      Alert.alert('Handoff Error', `Failed to transfer checkout to Shopora Web: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How would you like to continue?</Text>

      {/* Option 1 Card: Continue on Phone */}
      <TouchableOpacity
        style={styles.modeCard}
        onPress={handleContinueOnPhone}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Smartphone size={24} color="#0284c7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>📱 CONTINUE ON PHONE</Text>
            <Text style={styles.cardSub}>
              Complete payment immediately on this Shopora mobile app (Cash, UPI, Card).
            </Text>
          </View>
          <ArrowRight size={18} color="#0284c7" />
        </View>
      </TouchableOpacity>

      {/* Option 2 Card: Continue on Shopora Website */}
      <TouchableOpacity
        style={[styles.modeCard, { borderColor: '#bae6fd', backgroundColor: '#f0f9ff' }]}
        onPress={handleContinueOnWeb}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0284c7" style={{ padding: 12 }} />
        ) : (
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: '#e0f2fe' }]}>
              <Monitor size={24} color="#0369a1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: '#0369a1' }]}>
                🖥 CONTINUE ON SHOPORA WEBSITE
              </Text>
              <Text style={styles.cardSub}>
                Hand off this sale to your desktop or laptop for web checkout & invoice printing.
              </Text>
            </View>
            <ArrowRight size={18} color="#0369a1" />
          </View>
        )}
      </TouchableOpacity>

      {/* Footer Total */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Sale Total Payable</Text>
        <Text style={styles.totalValue}>₹{grandTotal}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f9ff',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 20,
  },
  modeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  totalBox: {
    marginTop: 'auto',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  totalValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 4,
  },
});
