import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, MapPin, Plus, Check } from 'lucide-react-native';
import { shopAddressService, ShopAddress } from '../services/shop-api';
import { getApiErrorMessage, isAuthenticated } from '../services/api';

export default function AddressScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<ShopAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated()) {
        router.replace('/login?redirect=/address');
      }
    }, [router]),
  );

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await shopAddressService.listAddresses();
      setAddresses(res);
      setShowForm(res.length === 0);
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

  const handleCreate = async () => {
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      setError('Please fill in all address fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const created = await shopAddressService.createAddress({
        fullName,
        phone,
        addressLine1,
        city,
        state,
        postalCode,
      });
      await load();
      goToCheckout(created.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const goToCheckout = (addressId: string) => {
    router.push({ pathname: '/checkout', params: { addressId } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#800020" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {error !== '' && <Text style={styles.errorText}>{error}</Text>}

          {addresses.length > 0 && !showForm && (
            <>
              {addresses.map((addr) => (
                <TouchableOpacity key={addr.id} style={styles.addressCard} onPress={() => goToCheckout(addr.id)}>
                  <MapPin size={18} color="#800020" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.addressName}>{addr.fullName} · {addr.phone}</Text>
                    <Text style={styles.addressText}>
                      {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}
                    </Text>
                  </View>
                  <Check size={18} color="#d1d5db" />
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addNewBtn} onPress={() => setShowForm(true)}>
                <Plus size={16} color="#800020" style={{ marginRight: 8 }} />
                <Text style={styles.addNewText}>Add New Address</Text>
              </TouchableOpacity>
            </>
          )}

          {showForm && (
            <View style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Recipient's name" placeholderTextColor="#9ca3af" />

              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="10-digit mobile" placeholderTextColor="#9ca3af" keyboardType="phone-pad" maxLength={10} />

              <Text style={styles.label}>Address Line 1</Text>
              <TextInput style={styles.input} value={addressLine1} onChangeText={setAddressLine1} placeholder="House no., street, area" placeholderTextColor="#9ca3af" />

              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="City" placeholderTextColor="#9ca3af" />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>State</Text>
                  <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="State" placeholderTextColor="#9ca3af" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>PIN Code</Text>
                  <TextInput style={styles.input} value={postalCode} onChangeText={setPostalCode} placeholder="6-digit PIN" placeholderTextColor="#9ca3af" keyboardType="number-pad" maxLength={6} />
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save & Continue</Text>}
              </TouchableOpacity>

              {addresses.length > 0 && (
                <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  iconBtn: { padding: 4 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#b91c1c', fontSize: 13, marginBottom: 12 },
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e0e4',
  },
  addressName: { fontSize: 13, fontWeight: 'bold', color: '#1f2937' },
  addressText: { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 17 },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#800020',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  addNewText: { color: '#800020', fontWeight: 'bold', fontSize: 13 },
  form: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f0e0e4' },
  label: { fontSize: 11, fontWeight: 'bold', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: '#800020',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  cancelText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
});
