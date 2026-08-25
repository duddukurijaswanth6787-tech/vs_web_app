'use client';

import React from 'react';
import Link from 'next/link';

export function StaffLoginGate({ redirect }: { redirect: string }) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-sm">Staff login required</p>
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="inline-block bg-sky-700 px-4 py-2 rounded-xl text-xs font-bold">
          Login
        </Link>
      </div>
    </div>
  );
}
