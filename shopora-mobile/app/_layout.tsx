import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { restoreSession } from '../services/api';

export default function RootLayout() {
  // Restore a previously saved sign-in (SecureStore) before any screen mounts
  // and checks isAuthenticated() -- otherwise every screen would see "signed
  // out" for a moment after a cold start even when a valid session exists.
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setRestoring(false));
  }, []);

  if (restoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f9ff' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0284c7',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#f0f9ff',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "SHOPORA POS",
            headerTitleAlign: 'center',
          }}
        />
        <Stack.Screen
          name="sale"
          options={{
            title: "Sale Product",
          }}
        />
        <Stack.Screen
          name="checkout-mode"
          options={{
            title: "Checkout Mode",
          }}
        />
        <Stack.Screen
          name="checkout-phone"
          options={{
            title: "Mobile Payment",
          }}
        />
        <Stack.Screen
          name="waiting-web"
          options={{
            title: "Checkout on Shopora Web",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="sale-success"
          options={{
            title: "Sale Completed",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: "Sign In",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="add-product"
          options={{
            title: "+ Add Product",
          }}
        />
        <Stack.Screen
          name="label-preview"
          options={{
            title: "Barcode Labels",
            headerBackVisible: false,
          }}
        />
        <Stack.Screen
          name="add-stock"
          options={{
            title: "+ Add Stock & Labels",
          }}
        />
        <Stack.Screen
          name="view-product"
          options={{
            title: "Inspect Product",
          }}
        />
        <Stack.Screen
          name="scanner"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="pending-sync"
          options={{
            title: "Pending Sync",
          }}
        />
        <Stack.Screen name="shop" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ headerShown: false }} />
        <Stack.Screen name="address" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen
          name="order-success"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
