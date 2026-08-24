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
  metadataBase: new URL("https://vasanthissignature.in"),
  title: {
    default: "Vasanthi's Signature | Luxury Ethnic Wear & Designer Sarees",
    template: "%s | Vasanthi's Signature",
  },
  description: "Official Online Store for Vasanthi's Signature - Discover premium handcrafted sarees, designer lehengas, bridal ethnic wear, and luxury outfits.",
  keywords: [
    "Vasanthi's Signature",
    "vasanthissignature",
    "vasanthi signature",
    "vasanthissignature.in",
    "Luxury Ethnic Wear",
    "Designer Sarees",
    "Bridal Sarees",
    "Lehengas",
    "Indian Festive Wear",
  ],
  alternates: {
    canonical: "https://vasanthissignature.in",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://vasanthissignature.in",
    siteName: "Vasanthi's Signature",
    title: "Vasanthi's Signature | Luxury Ethnic Wear & Designer Sarees",
    description: "Official Online Store for Vasanthi's Signature - Premium Sarees, Lehengas & Handcrafted Designer Wear",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vasanthi's Signature | Luxury Ethnic Wear & Sarees",
    description: "Official Online Store for Vasanthi's Signature - Premium Sarees & Designer Wear",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Vasanthi's Signature",
    "alternateName": ["vasanthissignature", "Vasanthi Signature"],
    "url": "https://vasanthissignature.in",
  };

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
