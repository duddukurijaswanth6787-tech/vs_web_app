import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import FaqsPageClient from './FaqsPageClient';

const path = '/faqs';

export const metadata: Metadata = {
  title: 'FAQs',
  description: "Answers to common questions about orders, sizing, shipping, returns and payments at Vasanthi's Signature.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function FaqsPage() {
  return <FaqsPageClient />;
}
