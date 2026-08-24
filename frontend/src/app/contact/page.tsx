import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import ContactPageClient from './ContactPageClient';

const path = '/contact';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: "Get in touch with Vasanthi's Signature for order support, styling help or general enquiries.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
