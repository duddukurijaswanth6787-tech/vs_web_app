import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import CollectionsPageClient from './CollectionsPageClient';

const path = '/collections';

export const metadata: Metadata = {
  title: 'Collections',
  description: "Browse curated collections of sarees, lehengas and designer ethnic wear from Vasanthi's Signature.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function CollectionsPage() {
  return <CollectionsPageClient />;
}
