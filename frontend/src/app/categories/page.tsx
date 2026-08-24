import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import CategoriesPageClient from './CategoriesPageClient';

const path = '/categories';

export const metadata: Metadata = {
  title: 'Shop by Category',
  description: "Explore sarees, lehengas, kurtis and more by category at Vasanthi's Signature.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
