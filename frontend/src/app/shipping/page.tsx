import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import ShippingPageClient from './ShippingPageClient';

const path = '/shipping';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy',
  description: "Shipping timelines, delivery areas and charges for orders placed with Vasanthi's Signature.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function ShippingPage() {
  return <ShippingPageClient />;
}
