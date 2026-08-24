import type { Metadata } from 'next';
import CollectionsPageClient from './CollectionsPageClient';

export const metadata: Metadata = {
  title: 'Collections',
  description: "Browse curated collections of sarees, lehengas and designer ethnic wear from Vasanthi's Signature.",
  alternates: { canonical: '/collections' },
};

export default function CollectionsPage() {
  return <CollectionsPageClient />;
}
