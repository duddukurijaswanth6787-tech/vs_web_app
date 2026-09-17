'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/error-reporter';

export function GlobalErrorListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const errorHandler = (event: ErrorEvent) => {
      // Ignore normal browser extension errors or harmless resize observer noise
      if (
        event.message?.includes('ResizeObserver') ||
        event.message?.includes('startTime') ||
        event.message?.includes('Script error') ||
        event.filename?.includes('extension')
      ) {
        return;
      }

      reportClientError({
        message: event.message || 'Unhandled window error',
        url: window.location.href,
        errorCode: 'JS_UNHANDLED_ERROR',
        stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
      });
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        typeof reason === 'string'
          ? reason
          : reason?.message || (reason ? JSON.stringify(reason) : 'Unhandled promise rejection');

      // Ignore standard Axios cancellation or auth probes
      if (
        msg.includes('canceled') ||
        msg.includes('AbortError') ||
        msg.includes('/auth/me') ||
        msg.includes('ResizeObserver')
      ) {
        return;
      }

      reportClientError({
        message: msg,
        url: window.location.href,
        errorCode: 'UNHANDLED_PROMISE_REJECTION',
        stack: reason?.stack,
      });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  return null;
}
