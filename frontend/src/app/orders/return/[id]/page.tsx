'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderReturnDetailPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/orders');
  }, [router]);

  return null;
}
