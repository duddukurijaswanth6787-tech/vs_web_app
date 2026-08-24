import type { Metadata } from 'next';
import CategoriesPageClient from './CategoriesPageClient';

export const metadata: Metadata = {
  title: 'Shop by Category',
  description: "Explore sarees, lehengas, kurtis and more by category at Vasanthi's Signature.",
  alternates: { canonical: '/categories' },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
