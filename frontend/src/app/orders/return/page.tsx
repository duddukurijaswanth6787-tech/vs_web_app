'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReturnRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/orders');
  }, [router]);
  return <p className="p-6 text-sm text-neutral-500">Redirecting to orders…</p>;
}
