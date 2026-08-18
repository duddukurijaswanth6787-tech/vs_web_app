import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import "./globals.css";
import { VDQueryProvider } from "@/lib/query/provider";
import { AuthProvider } from "@/lib/auth/AuthContext";
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
// Trigger Vercel Production Build - 2026-08-13

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A fresh QueryClient per request -- this is a server component running on
  // a shared Node process, so reusing the client-side singleton here would
  // mean every concurrent request prefetches into and dehydrates from the
  // same cache object. The singleton from lib/query/client is only for the
  // browser, inside VDQueryProvider.
  const queryClient = new QueryClient();

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
