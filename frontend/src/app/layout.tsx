import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { dehydrate } from "@tanstack/react-query";
import "./globals.css";
import { VDQueryProvider } from "@/lib/query/provider";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { queryClient } from "@/lib/query/client";
import { prefetchStorefrontData } from "@/lib/query/prefetch";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vasanthi's Signature | Luxury Ethnic Wear & Sarees",
  description: "Official Online Store for Vasanthi's Signature - Premium Sarees, Lehengas & Designer Wear",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ponytail: prefetch common storefront data server-side so every page
  // hydrates instantly — no duplicate client requests for categories,
  // settings, banners, coupons, reels.
  await prefetchStorefrontData(queryClient);

  return (
      <html lang="en" className="h-full antialiased" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col`} suppressHydrationWarning>
        <VDQueryProvider dehydratedState={dehydrate(queryClient)}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </VDQueryProvider>
      </body>
    </html>
  );
}
