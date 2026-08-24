import type { Metadata } from 'next';
import CancellationRefundPolicyPageClient from './CancellationRefundPolicyPageClient';

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description: "How order cancellations, returns and refunds work at Vasanthi's Signature.",
  alternates: { canonical: '/cancellation-refund-policy' },
};

export default function CancellationRefundPolicyPage() {
  return <CancellationRefundPolicyPageClient />;
}
