import type { Metadata } from 'next';
import { siteOpenGraph } from '../layout';
import CancellationRefundPolicyPageClient from './CancellationRefundPolicyPageClient';

const path = '/cancellation-refund-policy';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: "How order cancellations, returns and refunds work at Vasanthi's Signature.",
  alternates: { canonical: path },
  openGraph: { ...siteOpenGraph, url: path },
};

export default function CancellationRefundPolicyPage() {
  return <CancellationRefundPolicyPageClient />;
}
