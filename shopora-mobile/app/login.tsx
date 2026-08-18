import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LogIn, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { authService, getApiErrorMessage, API_BASE_URL } from '../services/api';

/**
 * Staff sign-in.
 *
 * Creating products, variants and inventory is guarded by JwtAuthGuard +
 * RolesGuard('super_admin', 'admin') on the API, so the device has to carry a
 * staff token before the add-product flow will work at all.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      router.replace((redirect as any) || '/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sign in failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.badge}>
            <ShieldCheck size={26} color="#0284c7" />
          </View>
          <Text style={styles.title}>Staff Sign In</Text>
          <Text style={styles.subtitle}>
            Adding products and stock requires an admin account.
          </Text>

          {error !== '' && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#b91c1c" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@example.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            onSubmitEditing={onSubmit}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <LogIn size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>SIGN IN</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hostNote}>Server: {API_BASE_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDFBFB' },
  container: { padding: 24, paddingTop: 48 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1f2937' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 6, marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  button: {
    marginTop: 28,
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15, letterSpacing: 0.5 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorText: { flex: 1, color: '#b91c1c', fontSize: 13 },
  hostNote: { marginTop: 20, fontSize: 11, color: '#9ca3af', textAlign: 'center' },
});
