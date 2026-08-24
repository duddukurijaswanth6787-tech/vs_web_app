import type { Metadata } from 'next';
import ShippingPageClient from './ShippingPageClient';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy',
  description: "Shipping timelines, delivery areas and charges for orders placed with Vasanthi's Signature.",
  alternates: { canonical: '/shipping' },
};

export default function ShippingPage() {
  return <ShippingPageClient />;
}
