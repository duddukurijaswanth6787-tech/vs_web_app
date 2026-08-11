'use client';

import React, { useEffect } from 'react';
import { QueryClientProvider, HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import { queryClient } from './client';
import { initializeClientTokens } from '@/lib/api/client';

export function VDQueryProvider({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) {
  useEffect(() => {
    initializeClientTokens();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
