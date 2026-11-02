'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReturnsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/orders');
  }, [router]);

  return null;
}
