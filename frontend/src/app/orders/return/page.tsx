'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrderReturnPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/orders');
  }, [router]);

  return null;
}
