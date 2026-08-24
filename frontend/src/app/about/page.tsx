import type { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About Us',
  description: "The story behind Vasanthi's Signature — heritage weaving, zardosi embroidery and timeless bridal couture since 2018.",
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
