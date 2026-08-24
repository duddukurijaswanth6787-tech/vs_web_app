import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import AboutPageClient from './AboutPageClient';

const path = '/about';

export const metadata: Metadata = {
  title: 'About Us',
  description: "The story behind Vasanthi's Signature — heritage weaving, zardosi embroidery and timeless bridal couture since 2018.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
