import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import CollectionsPageClient from './CollectionsPageClient';

const path = '/collections';

export const metadata: Metadata = {
  title: 'Curated Collections',
  description: "Browse curated collections of lehengas, gowns and designer ethnic wear from Vasanthi's Signature.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function CollectionsPage() {
  return <CollectionsPageClient />;
}
