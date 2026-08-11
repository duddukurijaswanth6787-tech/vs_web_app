'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EditAddressRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/checkout/address');
  }, [router]);
  return <p className="p-6 text-sm text-neutral-500">Redirecting to addresses…</p>;
}
