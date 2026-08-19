'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { getUnprefixedBaseUrl } from '@/lib/api/client';
import { posService } from '../pos.service';
import { CompletePosSalePayload } from '../pos.types';
import { offlineSalesDb } from './offlineDb';
import { PendingSale, StockShortage } from './offline.types';

const HEALTH_CHECK_INTERVAL_MS = 15000;
const HEALTH_CHECK_TIMEOUT_MS = 5000;
const AUTO_SYNC_INTERVAL_MS = 20000;

function generateLocalId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Distinguishes "the request never reached the backend" from a real server-side error. */
export function isNetworkFailure(err: unknown): boolean {
  return isAxiosError(err) && !err.response;
}

export function useOfflineSync(terminalId: string) {
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshPendingSales = useCallback(async () => {
    try {
      const rows = await offlineSalesDb.getAllPendingSales();
      setPendingSales(rows);
    } catch {
      // IndexedDB unavailable (e.g. private browsing) -- offline queueing is
      // simply not available in this session; the register still works online.
    }
  }, []);

  useEffect(() => {
    refreshPendingSales();
  }, [refreshPendingSales]);

  // Backend reachability: navigator.onLine only reflects link-layer
  // connectivity, not whether *our* API is actually up, so poll /health.
  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
      try {
        const res = await fetch(`${getUnprefixedBaseUrl()}/health`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!cancelled) setIsBackendReachable(res.ok);
      } catch {
        if (!cancelled) setIsBackendReachable(false);
      } finally {
        clearTimeout(timeout);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS);
    window.addEventListener('online', checkHealth);
    window.addEventListener('offline', () => !cancelled && setIsBackendReachable(false));

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('online', checkHealth);
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const queue = await offlineSalesDb.getAllPendingSales();
      const toSync = queue.filter((s) => s.status === 'PENDING' || s.status === 'FAILED');

      for (const sale of toSync) {
        const syncing: PendingSale = { ...sale, status: 'SYNCING', lastAttemptAt: new Date().toISOString() };
        await offlineSalesDb.updatePendingSale(syncing);
        await refreshPendingSales();

        try {
          const res = await posService.completeSale({
            ...sale.payload,
            clientOrderNumber: sale.clientOrderNumber,
            isOfflineSync: true,
          });
          await offlineSalesDb.updatePendingSale({
            ...syncing,
            status: 'SYNCED',
            syncedOrderNumber: res.order.orderNumber,
            attempts: sale.attempts + 1,
          });
        } catch (err) {
          if (isNetworkFailure(err)) {
            // Backend went unreachable again mid-sync -- stop the run, leave
            // this and the rest of the queue as PENDING to retry later.
            await offlineSalesDb.updatePendingSale({
              ...syncing,
              status: 'PENDING',
              attempts: sale.attempts + 1,
            });
            await refreshPendingSales();
            break;
          }

          if (isAxiosError(err) && err.response?.data?.code === 'POS_STOCK_CONFLICT') {
            const shortages = (err.response.data.metadata?.shortages as StockShortage[]) || [];
            await offlineSalesDb.updatePendingSale({
              ...syncing,
              status: 'NEEDS_REVIEW',
              shortages,
              attempts: sale.attempts + 1,
              errorMessage: 'Stock changed while offline -- review before syncing.',
            });
          } else {
            const message = isAxiosError(err)
              ? (err.response?.data as { message?: string })?.message || err.message
              : err instanceof Error
                ? err.message
                : 'Sync failed';
            await offlineSalesDb.updatePendingSale({
              ...syncing,
              status: 'FAILED',
              attempts: sale.attempts + 1,
              errorMessage: message,
            });
          }
        }

        await refreshPendingSales();
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshPendingSales();
    }
  }, [refreshPendingSales]);

  // Auto-sync on mount and on every offline->online transition. syncNow()
  // re-reads the queue from IndexedDB itself and is a no-op when it's empty,
  // so this doesn't need pendingSales as a dependency.
  useEffect(() => {
    if (!isBackendReachable) return;
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBackendReachable]);

  useEffect(() => {
    if (!isBackendReachable) return;
    const interval = setInterval(() => {
      if (pendingSales.some((s) => s.status === 'PENDING' || s.status === 'FAILED')) {
        syncNow();
      }
    }, AUTO_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isBackendReachable, pendingSales, syncNow]);

  const queueSale = useCallback(
    async (payload: CompletePosSalePayload, receipt: PendingSale['receipt']): Promise<PendingSale> => {
      const localId = generateLocalId();
      const clientOrderNumber = `OFF-${terminalId}-${Date.now().toString(36).toUpperCase()}-${localId.slice(0, 4).toUpperCase()}`;
      const sale: PendingSale = {
        localId,
        clientOrderNumber,
        payload,
        receipt,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        attempts: 0,
      };
      await offlineSalesDb.addPendingSale(sale);
      await refreshPendingSales();
      return sale;
    },
    [terminalId, refreshPendingSales],
  );

  const dismissSale = useCallback(
    async (localId: string) => {
      await offlineSalesDb.deletePendingSale(localId);
      await refreshPendingSales();
    },
    [refreshPendingSales],
  );

  const retrySale = useCallback(
    async (localId: string) => {
      const queue = await offlineSalesDb.getAllPendingSales();
      const sale = queue.find((s) => s.localId === localId);
      if (!sale) return;
      await offlineSalesDb.updatePendingSale({
        ...sale,
        status: 'PENDING',
        shortages: undefined,
        errorMessage: undefined,
      });
      await refreshPendingSales();
      syncNow();
    },
    [refreshPendingSales, syncNow],
  );

  const pendingCount = pendingSales.filter((s) => s.status === 'PENDING' || s.status === 'SYNCING').length;
  const needsReviewCount = pendingSales.filter((s) => s.status === 'NEEDS_REVIEW' || s.status === 'FAILED').length;

  return {
    isBackendReachable,
    pendingSales,
    pendingCount,
    needsReviewCount,
    isSyncing,
    queueSale,
    syncNow,
    dismissSale,
    retrySale,
  };
}
