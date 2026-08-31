import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ShoppingBag,
  PlusCircle,
  PackagePlus,
  Barcode,
  AlertTriangle,
  ChevronRight,
  LogIn,
  LogOut,
  Store,
  RotateCcw,
  LockKeyhole,
} from 'lucide-react-native';
import {
  dashboardService,
  DashboardSummary,
  isAuthenticated,
  getCurrentUser,
  authService,
} from '../services/api';

export default function ShoporaHomeScreen() {
  const router = useRouter();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [authed, setAuthed] = useState(false);

  const loadSummary = useCallback(async () => {
    const signedIn = isAuthenticated();
    setAuthed(signedIn);
    if (!signedIn) {
      setSummary(null);
      return;
    }
    try {
      const data = await dashboardService.getSummary();
      setSummary(data);
    } catch (e) {
      console.error('Failed to load dashboard summary:', e);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  }, [loadSummary]);

  const handleSignOut = () => {
    authService.logout();
    setAuthed(false);
    setSummary(null);
  };

  const todaySales = summary ? `₹${(summary.todayRevenue ?? 0).toLocaleString('en-IN')}` : '—';
  const itemsSold = summary ? `${summary.todayItemsSold ?? 0} Pcs` : '—';
  const lowStockCount = summary?.lowStockCount ?? 0;
  const currentUser = getCurrentUser();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0284c7" />
      }
    >
      {/* Top Banner / Store Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoSymbol}>❖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeName}>Vasanthi's Signature</Text>
            <Text style={styles.storeTagline}>Shopora Retail & Inventory System</Text>
          </View>
          {authed ? (
            <TouchableOpacity style={styles.authBtn} onPress={handleSignOut} activeOpacity={0.8}>
              <LogOut size={14} color="#0284c7" />
              <Text style={styles.authBtnText} numberOfLines={1}>{currentUser?.email || 'Sign Out'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.authBtn, styles.authBtnActive]}
              onPress={() => router.push('/login?redirect=/')}
              activeOpacity={0.8}
            >
              <LogIn size={14} color="#ffffff" />
              <Text style={[styles.authBtnText, styles.authBtnTextActive]}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {!authed && (
          <Text style={styles.signInHint}>Sign in to see today's sales & stock stats.</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Today's Sales</Text>
            <Text style={styles.statValue}>{todaySales}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Items Sold</Text>
            <Text style={styles.statValue}>{itemsSold}</Text>
          </View>
        </View>
      </View>

      {/* Main 4 Action Cards Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.grid}>
        {/* 1. SALE PRODUCT (Mobile POS) */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#0284c7', borderColor: '#0284c7' }]}
          onPress={() => router.push('/sale')}
          activeOpacity={0.85}
        >
          <View style={styles.iconCircleLight}>
            <ShoppingBag size={24} color="#0284c7" />
          </View>
          <Text style={styles.actionCardTitleLight}>Sale Product</Text>
          <Text style={styles.actionCardSubLight}>Scan barcode & checkout</Text>
        </TouchableOpacity>

        {/* 2. + ADD PRODUCT (Wizard) */}
        <TouchableOpacity
          style={styles.actionCardWhite}
          onPress={() => router.push('/add-product')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconCircleDark, { backgroundColor: '#e0f2fe' }]}>
            <PlusCircle size={24} color="#0284c7" />
          </View>
          <Text style={styles.actionCardTitleDark}>+ Add Product</Text>
          <Text style={styles.actionCardSubDark}>Single or multi-variant</Text>
        </TouchableOpacity>

        {/* 3. + ADD STOCK (Replenishment & Labels) */}
        <TouchableOpacity
          style={styles.actionCardWhite}
          onPress={() => router.push('/add-stock')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconCircleDark, { backgroundColor: '#fefce8' }]}>
            <PackagePlus size={24} color="#ca8a04" />
          </View>
          <Text style={styles.actionCardTitleDark}>+ Add Stock</Text>
          <Text style={styles.actionCardSubDark}>Receive & print labels</Text>
        </TouchableOpacity>

        {/* 4. RETURNS -- the other half of selling; was web-POS only. */}
        <TouchableOpacity
          style={styles.actionCardWhite}
          onPress={() => router.push('/returns')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconCircleDark, { backgroundColor: '#fff1f2' }]}>
            <RotateCcw size={24} color="#be123c" />
          </View>
          <Text style={styles.actionCardTitleDark}>Returns</Text>
          <Text style={styles.actionCardSubDark}>Refund & restock</Text>
        </TouchableOpacity>

        {/* 5. CLOSE SHIFT -- the app could open one but never close it. */}
        <TouchableOpacity
          style={styles.actionCardWhite}
          onPress={() => router.push('/close-shift')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconCircleDark, { backgroundColor: '#eff6ff' }]}>
            <LockKeyhole size={24} color="#1d4ed8" />
          </View>
          <Text style={styles.actionCardTitleDark}>Close Shift</Text>
          <Text style={styles.actionCardSubDark}>Count drawer & reconcile</Text>
        </TouchableOpacity>

        {/* 4. SCAN / INSPECT PRODUCT */}
        <TouchableOpacity
          style={styles.actionCardWhite}
          onPress={() => router.push('/view-product')}
          activeOpacity={0.85}
        >
          <View style={[styles.iconCircleDark, { backgroundColor: '#f0fdf4' }]}>
            <Barcode size={24} color="#16a34a" />
          </View>
          <Text style={styles.actionCardTitleDark}>Inspect Product</Text>
          <Text style={styles.actionCardSubDark}>View stock & barcodes</Text>
        </TouchableOpacity>

        {/* 5. SHOP (Customer browsing & checkout) */}
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#0284c7', borderColor: '#0284c7' }]}
          onPress={() => router.push('/shop')}
          activeOpacity={0.85}
        >
          <View style={styles.iconCircleLight}>
            <Store size={24} color="#0284c7" />
          </View>
          <Text style={styles.actionCardTitleLight}>Shop</Text>
          <Text style={styles.actionCardSubLight}>Browse & buy as a customer</Text>
        </TouchableOpacity>
      </View>

      {/* Stock Alerts Widget */}
      <Text style={styles.sectionTitle}>Stock Alerts</Text>

      <TouchableOpacity
        style={styles.alertCard}
        onPress={() => router.push('/add-stock')}
        activeOpacity={0.85}
      >
        <View style={styles.alertIconCircle}>
          <AlertTriangle size={20} color="#0284c7" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>
            {lowStockCount > 0 ? `${lowStockCount} Products Low on Stock` : 'Stock levels are healthy'}
          </Text>
          <Text style={styles.alertSub}>Tap to replenish inventory & print labels</Text>
        </View>
        <ChevronRight size={18} color="#94a3b8" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 20,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoSymbol: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  storeName: {
    fontSize: 17,
    fontWeight: 'bold',
    fontFamily: 'serif',
    color: '#0369a1',
  },
  storeTagline: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    maxWidth: 130,
  },
  authBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  authBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0284c7',
    marginLeft: 5,
  },
  authBtnTextActive: {
    color: '#ffffff',
  },
  signInHint: {
    fontSize: 11,
    color: '#ca8a04',
    marginBottom: 8,
    marginTop: -4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#bae6fd',
  },
  statLabel: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0284c7',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCard: {
    width: '48%',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
    minHeight: 124,
    elevation: 2,
  },
  actionCardWhite: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    justifyContent: 'space-between',
    minHeight: 124,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircleLight: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconCircleDark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionCardTitleLight: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  actionCardSubLight: {
    fontSize: 10,
    color: '#e0f2fe',
    marginTop: 2,
  },
  actionCardTitleDark: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  actionCardSubDark: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  alertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  alertSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
});
