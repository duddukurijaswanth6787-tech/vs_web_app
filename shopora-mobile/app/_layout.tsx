import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
          name="add-product"
          options={{
            title: "+ Add Product",
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
      </Stack>
    </>
  );
}
