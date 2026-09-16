'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isChunkError, setIsChunkError] = useState(false);

  useEffect(() => {
    console.error('Application error:', error);
    const isChunk =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Failed to load chunk') ||
      error?.message?.includes('Loading chunk');

    if (isChunk) {
      setIsChunkError(true);
      const lastReload = sessionStorage.getItem('global_chunk_error_reload');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem('global_chunk_error_reload', String(now));
        window.location.reload();
      }
    }
  }, [error]);

  const handleRetry = () => {
    if (isChunkError) {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-4 text-center px-4">
      <AlertCircle className="h-12 w-12 text-amber-500" />
      <div>
        <h2 className="text-xl font-bold text-neutral-800">
          {isChunkError ? 'Application Updated' : 'Something went wrong'}
        </h2>
        <p className="text-sm text-neutral-500 mt-1 max-w-md">
          {isChunkError
            ? 'A new version of the store has been deployed. Refreshing to load the latest version...'
            : 'An unexpected error occurred. Please try again.'}
        </p>
      </div>
      <div className="flex gap-3 mt-2">
        <button
          onClick={handleRetry}
          className="rounded-md bg-neutral-900 px-4 h-9 text-sm font-medium text-white hover:bg-neutral-800 transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {isChunkError ? 'Refresh Page' : 'Try Again'}
        </button>
        <Link
          href="/"
          className="rounded-md border border-neutral-300 px-4 h-9 flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
        >
          <Home className="h-3.5 w-3.5" />
          Home
        </Link>
      </div>
    </div>
  );
}
