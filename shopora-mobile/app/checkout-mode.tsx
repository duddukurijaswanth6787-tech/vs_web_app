import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import {
  Smartphone,
  Monitor,
  ArrowRight,
  User,
  Search,
  Tag,
  Receipt,
  CheckCircle2,
  X,
  Percent,
} from 'lucide-react-native';
import {
  posMobileService,
  PosMobileCartItem,
  PosMobileCustomer,
  isAuthenticated,
  getApiErrorMessage,
} from '../services/api';
import { computeMobileTotals } from '../services/pos-totals';

export default function CheckoutModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cartJson = params.cartJson as string;
  const subtotalStr = params.subtotal as string;

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');

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

  const orderDiscount = couponApplied?.discountAmount || 0;
  const totals = computeMobileTotals(
    cartItems.map((i: any) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountAmount: i.discountAmount,
      taxPercent: i.taxPercent,
    })),
    orderDiscount,
  );

  const subtotal = cartItems.length ? totals.subtotal : Number(subtotalStr || '0');
  const discountTotal = totals.discountTotal;
  const taxTotal = totals.taxTotal;
  const grandTotal = cartItems.length ? totals.grandTotal : Math.max(0, subtotal - orderDiscount);
  const totalQuantity = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    setCouponBusy(true);
    try {
      const data = await posMobileService.validateCoupon({
        code,
        items: cartItems.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          discountAmount: i.discountAmount,
        })),
      });
      setCouponApplied({ code: data.code, discountAmount: data.discountAmount });
      setCouponInput('');
    } catch (err) {
      setCouponApplied(null);
      setCouponError(getApiErrorMessage(err, 'Coupon is invalid or not applicable.'));
    } finally {
      setCouponBusy(false);
    }
  };

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
        subtotal: subtotal.toString(),
        grandTotal: grandTotal.toString(),
        customerJson: JSON.stringify(resolveCustomer()),
        couponCode: couponApplied?.code || '',
        couponDiscount: (couponApplied?.discountAmount || 0).toString(),
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
        couponCode: couponApplied?.code,
      });

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>How would you like to continue?</Text>

      {/* Customer Lookup Card */}
      <View style={styles.customerCard}>
        <View style={styles.customerRow}>
          <User size={15} color="#0284c7" />
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
              <Search size={15} color="#ffffff" />
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

      {/* Coupons & Offers Card */}
      <View style={styles.couponCard}>
        <View style={styles.cardHeaderSmall}>
          <Tag size={15} color="#0284c7" />
          <Text style={styles.customerLabel}>APPLY COUPON / DISCOUNT</Text>
        </View>

        {couponApplied ? (
          <View style={styles.couponAppliedRow}>
            <View style={styles.couponBadge}>
              <CheckCircle2 size={16} color="#16a34a" />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.couponAppliedCode}>{couponApplied.code}</Text>
                <Text style={styles.couponAppliedSavings}>Saved ₹{couponApplied.discountAmount.toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setCouponApplied(null)} style={styles.couponRemoveBtn}>
              <X size={16} color="#ef4444" />
              <Text style={styles.couponRemoveText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code (e.g. SAVE10)"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={couponInput}
                onChangeText={setCouponInput}
              />
              <TouchableOpacity
                style={[styles.couponApplyBtn, (!couponInput.trim() || couponBusy) && styles.btnDisabled]}
                onPress={handleApplyCoupon}
                disabled={!couponInput.trim() || couponBusy}
              >
                {couponBusy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.couponApplyText}>APPLY</Text>
                )}
              </TouchableOpacity>
            </View>
            {!!couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
          </View>
        )}
      </View>

      {/* Zomato-style Detailed Bill Summary Card */}
      <View style={styles.billSummaryCard}>
        <View style={styles.billHeader}>
          <Receipt size={16} color="#0369a1" />
          <Text style={styles.billTitle}>Bill Details</Text>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>Item Total ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})</Text>
          <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
        </View>

        {discountTotal > 0 && (
          <View style={styles.billRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Percent size={12} color="#16a34a" style={{ marginRight: 4 }} />
              <Text style={[styles.billLabel, { color: '#16a34a', fontWeight: '600' }]}>
                Coupon Discount {couponApplied ? `(${couponApplied.code})` : ''}
              </Text>
            </View>
            <Text style={[styles.billValue, { color: '#16a34a', fontWeight: 'bold' }]}>
              -₹{discountTotal.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.billRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.billLabel}>Taxes & GST</Text>
            <View style={styles.taxPill}>
              <Text style={styles.taxPillText}>Included in Price</Text>
            </View>
          </View>
          <Text style={styles.billTaxValue}>₹{taxTotal.toFixed(2)}</Text>
        </View>

        <View style={styles.billDivider} />

        <View style={styles.billTotalRow}>
          <View>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalSub}>Inclusive of all taxes</Text>
          </View>
          <Text style={styles.grandTotalAmount}>₹{grandTotal.toFixed(2)}</Text>
        </View>
      </View>

      {/* Option 1 Card: Continue on Phone */}
      <TouchableOpacity
        style={styles.modeCard}
        onPress={handleContinueOnPhone}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Smartphone size={22} color="#0284c7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>📱 CONTINUE ON PHONE</Text>
            <Text style={styles.cardSub}>
              Complete payment immediately on this phone (Cash, UPI, Card).
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
              <Monitor size={22} color="#0369a1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: '#0369a1' }]}>
                🖥 CONTINUE ON SHOPORA WEBSITE
              </Text>
              <Text style={styles.cardSub}>
                Hand off this sale to desktop/laptop for web checkout & invoice printing.
              </Text>
            </View>
            <ArrowRight size={18} color="#0369a1" />
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  heading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 14,
  },
  customerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
    marginRight: 8,
  },
  lookupBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  couponCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  couponApplyBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  couponErrorText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 6,
  },
  couponAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponAppliedCode: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#15803d',
  },
  couponAppliedSavings: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  couponRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  couponRemoveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ef4444',
    marginLeft: 3,
  },
  billSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  billTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  billValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  taxPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  taxPillText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
  },
  billTaxValue: {
    fontSize: 11,
    color: '#64748b',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  grandTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  modeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 15,
  },
});
