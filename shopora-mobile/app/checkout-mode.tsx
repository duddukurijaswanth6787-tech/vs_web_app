import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Smartphone, Monitor, ArrowRight, User, Search } from 'lucide-react-native';
import { posMobileService, PosMobileCartItem, PosMobileCustomer, isAuthenticated } from '../services/api';
import { computeMobileTotals } from '../services/pos-totals';

export default function CheckoutModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cartJson = params.cartJson as string;
  const subtotalStr = params.subtotal as string;

  const [loading, setLoading] = React.useState(false);
  const [phone, setPhone] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [lookupStatus, setLookupStatus] = React.useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated()) {
        router.replace('/login?redirect=/checkout-mode');
      }
    }, [router]),
  );

  let cartItems: PosMobileCartItem[] = [];
  try {
    if (cartJson) cartItems = JSON.parse(cartJson);
  } catch (e) {
    console.error('Failed to parse cart items:', e);
  }

  // GST at each product's own rate, not a flat 5%. Falls back to the
  // subtotal passed in when the cart could not be parsed, so a display bug
  // never becomes a billing one -- the server recomputes either way.
  const totals = computeMobileTotals(
    cartItems.map((i: any) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountAmount: i.discountAmount,
      taxPercent: i.taxPercent,
    })),
  );
  const subtotal = cartItems.length ? totals.subtotal : Number(subtotalStr || '0');
  const taxTotal = totals.taxTotal;
  const grandTotal = cartItems.length ? totals.grandTotal : subtotal;

  const handleLookupCustomer = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Invalid Phone', 'Enter a 10-digit phone number to look up the customer.');
      return;
    }
    try {
      setLookupStatus('loading');
      const result = await posMobileService.lookupCustomer(cleanPhone);
      if (result?.found) {
        setCustomerName(result.fullName || '');
        setLookupStatus('found');
      } else {
        setCustomerName('');
        setLookupStatus('not_found');
      }
    } catch (e) {
      console.error('Customer lookup failed:', e);
      setLookupStatus('idle');
    }
  };

  const resolveCustomer = (): PosMobileCustomer => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return { fullName: 'Walk-in Customer', phone: '9999999999' };
    }
    return { fullName: customerName.trim() || 'Walk-in Customer', phone: cleanPhone };
  };

  // Option 1: Continue on Phone
  const handleContinueOnPhone = () => {
    router.push({
      pathname: '/checkout-phone',
      params: {
        cartJson,
        subtotal: subtotalStr,
        grandTotal: grandTotal.toString(),
        customerJson: JSON.stringify(resolveCustomer()),
      },
    });
  };

  // Option 2: Continue on Shopora Website (Handoff)
  const handleContinueOnWeb = async () => {
    try {
      setLoading(true);
      const session = await posMobileService.createCheckoutSession({
        items: cartItems,
        customer: resolveCustomer(),
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

      {/* Customer Lookup (optional — defaults to Walk-in Customer) */}
      <View style={styles.customerCard}>
        <View style={styles.customerRow}>
          <User size={16} color="#0284c7" />
          <Text style={styles.customerLabel}>CUSTOMER (OPTIONAL)</Text>
        </View>
        <View style={styles.phoneRow}>
          <TextInput
            style={styles.phoneInput}
            placeholder="10-digit phone number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(t) => {
              setPhone(t);
              setLookupStatus('idle');
            }}
          />
          <TouchableOpacity style={styles.lookupBtn} onPress={handleLookupCustomer} disabled={lookupStatus === 'loading'}>
            {lookupStatus === 'loading' ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Search size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
        {lookupStatus === 'found' && (
          <Text style={styles.lookupFound}>✓ {customerName || 'Registered customer'}</Text>
        )}
        {lookupStatus === 'not_found' && (
          <>
            <Text style={styles.lookupNotFound}>No account found — enter a name to save with this sale</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Customer name"
              placeholderTextColor="#94a3b8"
              value={customerName}
              onChangeText={setCustomerName}
            />
          </>
        )}
      </View>

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
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 16,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369a1',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginRight: 8,
  },
  lookupBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupFound: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
    marginTop: 8,
  },
  lookupNotFound: {
    fontSize: 11,
    color: '#ca8a04',
    marginTop: 8,
    marginBottom: 6,
  },
  nameInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
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
