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
  Modal,
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
  History,
  ShoppingBag,
  Calendar,
  ChevronRight,
  UserPlus,
  UserCheck,
  BadgePercent,
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
  const [customerEmail, setCustomerEmail] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [customerData, setCustomerData] = useState<any>(null);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Tax Mode Toggle: True = GST Included in MRP (Default), False = Add GST on top
  const [taxInclusive, setTaxInclusive] = useState(true);

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<Array<{ code: string; name: string; discountText: string }>>([
    { code: 'WELCOME10', name: 'Welcome 10% OFF', discountText: '10% OFF' },
    { code: 'VASANTHI50', name: 'Store Special ₹50 OFF', discountText: '₹50 OFF' },
    { code: 'FESTIVE20', name: 'Festive 20% OFF', discountText: '20% OFF' },
    { code: 'SAVE10', name: 'Instant 10% Savings', discountText: '10% OFF' },
  ]);

  useEffect(() => {
    posMobileService.getActiveCoupons().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        const mapped = list.map((c: any) => ({
          code: c.code,
          name: c.name || c.code,
          discountText: c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `₹${c.value} OFF`,
        }));
        setAvailableCoupons(mapped);
      }
    }).catch(() => {});
  }, []);

  const suggestedCoupons = useMemo(() => {
    const q = couponInput.trim().toUpperCase();
    if (!q) return availableCoupons;
    return availableCoupons.filter(
      (c) => c.code.toUpperCase().includes(q) || c.name.toUpperCase().includes(q)
    );
  }, [couponInput, availableCoupons]);

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
    taxInclusive,
  );

  const subtotal = cartItems.length ? totals.subtotal : Number(subtotalStr || '0');
  const discountTotal = totals.discountTotal;
  const taxTotal = totals.taxTotal;
  const grandTotal = cartItems.length ? totals.grandTotal : Math.max(0, subtotal - orderDiscount);
  const totalQuantity = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride || couponInput).trim().toUpperCase();
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
      Alert.alert('Invalid Phone', 'Enter a 10-digit phone number to look up customer details & order history.');
      return;
    }
    try {
      setLookupStatus('loading');
      const result = await posMobileService.lookupCustomer(cleanPhone);
      if (result?.found) {
        setCustomerName(result.fullName || '');
        setCustomerEmail(result.email || '');
        setCustomerData(result);
        setLookupStatus('found');
      } else {
        setCustomerName('');
        setCustomerEmail('');
        setCustomerData(null);
        setLookupStatus('not_found');
      }
    } catch (e) {
      console.error('Customer lookup failed:', e);
      setLookupStatus('idle');
    }
  };

  const handleSaveCustomer = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      Alert.alert('Phone Required', 'Enter a 10-digit phone number to register customer.');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Name Required', 'Please enter customer full name.');
      return;
    }

    try {
      setSavingCustomer(true);
      const saved = await posMobileService.saveCustomer({
        fullName: customerName.trim(),
        phone: cleanPhone,
        email: customerEmail.trim() || undefined,
      });
      if (saved) {
        setCustomerData(saved);
        setCustomerName(saved.fullName || customerName);
        setCustomerEmail(saved.email || customerEmail);
        setLookupStatus('found');
        Alert.alert('Customer Saved', `Customer "${saved.fullName}" registered & saved successfully.`);
      }
    } catch (e: any) {
      Alert.alert('Save Error', getApiErrorMessage(e, 'Could not save customer details.'));
    } finally {
      setSavingCustomer(false);
    }
  };

  const resolveCustomer = (): PosMobileCustomer => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return { fullName: 'Walk-in Customer', phone: '9999999999' };
    }
    return {
      fullName: customerName.trim() || 'Walk-in Customer',
      phone: cleanPhone,
      email: customerEmail.trim() || undefined,
    };
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
        taxInclusive: taxInclusive ? 'true' : 'false',
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

      {/* Customer Lookup & Profile Card */}
      <View style={styles.customerCard}>
        <View style={styles.customerRow}>
          <User size={15} color="#0284c7" />
          <Text style={styles.customerLabel}>CUSTOMER DETAILS</Text>
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
              if (t.length !== 10) {
                setLookupStatus('idle');
                setCustomerData(null);
              }
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

        {/* Existing Customer Profile Card */}
        {lookupStatus === 'found' && customerData && (
          <View style={styles.existingCustomerBox}>
            <View style={styles.existingCustomerHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <CheckCircle2 size={15} color="#16a34a" style={{ marginRight: 5 }} />
                  <Text style={styles.customerFoundName}>{customerName || 'Registered Customer'}</Text>
                </View>
                {!!customerEmail && <Text style={styles.customerFoundEmail}>{customerEmail}</Text>}
                <View style={styles.customerStatsRow}>
                  <Text style={styles.customerStatsText}>
                    Orders: <Text style={{ fontWeight: 'bold' }}>{customerData.ordersCount || 0}</Text> • Total Spent: <Text style={{ fontWeight: 'bold' }}>₹{customerData.totalSpent?.toFixed(0) || 0}</Text>
                  </Text>
                </View>
              </View>

              {customerData.recentOrders && customerData.recentOrders.length > 0 && (
                <TouchableOpacity
                  style={styles.historyBtn}
                  onPress={() => setHistoryModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <History size={13} color="#0284c7" style={{ marginRight: 4 }} />
                  <Text style={styles.historyBtnText}>History ({customerData.recentOrders.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* New Customer Registration Form */}
        {lookupStatus === 'not_found' && (
          <View style={styles.newCustomerBox}>
            <View style={styles.newCustomerHeader}>
              <UserPlus size={14} color="#d97706" style={{ marginRight: 5 }} />
              <Text style={styles.newCustomerTitle}>New Customer — Add Details</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              placeholder="Customer Full Name (Required)"
              placeholderTextColor="#94a3b8"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              style={[styles.nameInput, { marginTop: 6 }]}
              placeholder="Email Address (Optional)"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={customerEmail}
              onChangeText={setCustomerEmail}
            />

            <TouchableOpacity
              style={[styles.saveCustomerBtn, (!customerName.trim() || savingCustomer) && styles.btnDisabled]}
              onPress={handleSaveCustomer}
              disabled={!customerName.trim() || savingCustomer}
              activeOpacity={0.85}
            >
              {savingCustomer ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <UserCheck size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveCustomerBtnText}>💾 SAVE CUSTOMER</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
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
                onPress={() => handleApplyCoupon()}
                disabled={!couponInput.trim() || couponBusy}
              >
                {couponBusy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.couponApplyText}>APPLY</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Live Auto-Suggest Coupon Chips */}
            {suggestedCoupons.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.5, marginBottom: 4 }}>
                  AVAILABLE OFFERS (TAP TO APPLY):
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {suggestedCoupons.map((c) => (
                    <TouchableOpacity
                      key={c.code}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#f0fdf4',
                        borderColor: '#bbf7d0',
                        borderWidth: 1,
                        borderRadius: 20,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                      }}
                      onPress={() => {
                        setCouponInput(c.code);
                        handleApplyCoupon(c.code);
                      }}
                      disabled={couponBusy}
                    >
                      <Tag size={12} color="#0284c7" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#15803d', marginRight: 6 }}>{c.code}</Text>
                      <View style={{ backgroundColor: '#dcfce7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#166534' }}>{c.discountText}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {!!couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
          </View>
        )}
      </View>

      {/* Zomato-style Detailed Bill Summary Card with GST Mode Toggle */}
      <View style={styles.billSummaryCard}>
        <View style={styles.billHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Receipt size={16} color="#0369a1" />
            <Text style={styles.billTitle}>Bill Details</Text>
          </View>

          {/* GST Included / Excluded Toggle */}
          <View style={styles.gstToggleContainer}>
            <TouchableOpacity
              style={[styles.gstToggleBtn, taxInclusive && styles.gstToggleBtnActive]}
              onPress={() => setTaxInclusive(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.gstToggleText, taxInclusive && styles.gstToggleTextActive]}>
                MRP (GST Inc)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gstToggleBtn, !taxInclusive && styles.gstToggleBtnActive]}
              onPress={() => setTaxInclusive(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.gstToggleText, !taxInclusive && styles.gstToggleTextActive]}>
                + Add GST
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.billRow}>
          <Text style={styles.billLabel}>
            {taxInclusive ? 'Item Total (MRP)' : 'Item Total (Base Price)'} ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'})
          </Text>
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

        {/* GST Row */}
        {taxInclusive ? (
          <View style={styles.billRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.billLabel}>Taxes & GST</Text>
              <View style={styles.taxPill}>
                <Text style={styles.taxPillText}>Included in MRP</Text>
              </View>
            </View>
            <Text style={[styles.billTaxValue, { color: '#16a34a', fontWeight: '600' }]}>
              ₹0.00 (Included)
            </Text>
          </View>
        ) : (
          <View style={styles.billRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.billLabel}>Taxes & GST (5%)</Text>
              <View style={[styles.taxPill, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.taxPillText, { color: '#b45309' }]}>
                  Added to Total (+GST)
                </Text>
              </View>
            </View>
            <Text style={[styles.billTaxValue, { color: '#0284c7', fontWeight: 'bold' }]}>
              +₹{taxTotal.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.billDivider} />

        <View style={styles.billTotalRow}>
          <View>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalSub}>
              {taxInclusive ? 'Inclusive of all taxes (MRP)' : 'Subtotal + 5% GST'}
            </Text>
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

      {/* Customer Order History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.historyModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <History size={18} color="#0284c7" style={{ marginRight: 6 }} />
                <Text style={styles.modalHeaderTitle}>Order History ({customerName})</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {customerData?.recentOrders?.map((ord: any, idx: number) => (
                <View key={ord.orderId || idx} style={styles.historyOrderCard}>
                  <View style={styles.historyOrderHeader}>
                    <Text style={styles.historyOrderNumber}>#{ord.orderNumber}</Text>
                    <Text style={styles.historyOrderAmount}>₹{ord.grandTotal?.toFixed(2)}</Text>
                  </View>

                  <View style={styles.historyOrderMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Calendar size={11} color="#94a3b8" style={{ marginRight: 4 }} />
                      <Text style={styles.historyOrderDate}>
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                      </Text>
                    </View>
                    <View style={styles.historyPaymentPill}>
                      <Text style={styles.historyPaymentText}>{ord.paymentMethod || 'PAID'}</Text>
                    </View>
                  </View>

                  {ord.items && ord.items.length > 0 && (
                    <View style={styles.historyItemsList}>
                      {ord.items.map((it: any, itIdx: number) => (
                        <View key={itIdx} style={styles.historyItemRow}>
                          <ShoppingBag size={11} color="#64748b" style={{ marginRight: 4 }} />
                          <Text style={styles.historyItemName} numberOfLines={1}>{it.productName}</Text>
                          <Text style={styles.historyItemQty}>x{it.quantity} (₹{it.unitPrice})</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setHistoryModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>Close History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  existingCustomerBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  existingCustomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerFoundName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#15803d',
  },
  customerFoundEmail: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },
  customerStatsRow: {
    marginTop: 4,
  },
  customerStatsText: {
    fontSize: 11,
    color: '#15803d',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  newCustomerBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  newCustomerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  newCustomerTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#b45309',
  },
  nameInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0f172a',
  },
  saveCustomerBtn: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveCustomerBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
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
  billHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 6,
  },
  gstToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gstToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gstToggleBtnActive: {
    backgroundColor: '#0284c7',
  },
  gstToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  gstToggleTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  historyModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  historyOrderCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  historyOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyOrderNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  historyOrderAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  historyOrderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  historyOrderDate: {
    fontSize: 10,
    color: '#94a3b8',
  },
  historyPaymentPill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  historyPaymentText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  historyItemsList: {
    marginTop: 6,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  historyItemName: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
  },
  historyItemQty: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  modalCloseBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
