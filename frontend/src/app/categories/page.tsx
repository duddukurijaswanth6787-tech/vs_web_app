import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import CategoriesPageClient from './CategoriesPageClient';

const path = '/categories';

export const metadata: Metadata = {
  title: 'Categories',
  description: "Explore lehengas, kurtis, gowns and more by category at Vasanthi's Signature.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}
