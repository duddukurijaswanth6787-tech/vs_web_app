import type { Metadata } from 'next';
import FaqsPageClient from './FaqsPageClient';

export const metadata: Metadata = {
  title: 'FAQs',
  description: "Answers to common questions about orders, sizing, shipping, returns and payments at Vasanthi's Signature.",
  alternates: { canonical: '/faqs' },
};

export default function FaqsPage() {
  return <FaqsPageClient />;
}
