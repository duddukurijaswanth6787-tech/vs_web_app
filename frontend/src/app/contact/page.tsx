import type { Metadata } from 'next';
import ContactPageClient from './ContactPageClient';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: "Get in touch with Vasanthi's Signature for order support, styling help or general enquiries.",
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
