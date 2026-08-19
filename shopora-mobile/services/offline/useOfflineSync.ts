import { useCallback, useEffect, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { API_ORIGIN, getApiErrorMessage, inventoryService, posMobileService } from '../api';
import { offlineSalesDb, offlineStockInDb } from './offlineDb';
import { CompleteSaleCorePayload, PendingSale, PendingStockIn, StockShortage } from './offline.types';

/**
 * Mirrors the web POS's offline sync hook
 * (frontend/src/features/pos/offline/useOfflineSync.ts): reachability
 * polling against /health, an expo-sqlite backed queue instead of
 * IndexedDB, and the same per-item retry/backoff-on-network-drop behaviour
 * on sync. Also drives a second queue for stock-in, which the web POS has
 * no equivalent of.
 */

const HEALTH_CHECK_INTERVAL_MS = 15000;
const HEALTH_CHECK_TIMEOUT_MS = 5000;
const AUTO_SYNC_INTERVAL_MS = 20000;
const DEVICE_TAG = 'MOBILE';

function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Distinguishes "the request never reached the backend" from a real server-side error. */
export function isNetworkFailure(err: unknown): boolean {
  return isAxiosError(err) && !err.response;
}

export function useOfflineSync() {
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [pendingStockIns, setPendingStockIns] = useState<PendingStockIn[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshPendingSales = useCallback(async () => {
    try {
      setPendingSales(await offlineSalesDb.getAllPendingSales());
    } catch {
      // expo-sqlite unavailable -- offline queueing simply isn't available on
      // this device; the app still works fully online.
    }
  }, []);

  const refreshPendingStockIns = useCallback(async () => {
    try {
      setPendingStockIns(await offlineStockInDb.getAllPendingStockIns());
    } catch {
      // Same fallback as above.
    }
  }, []);

  useEffect(() => {
    refreshPendingSales();
    refreshPendingStockIns();
  }, [refreshPendingSales, refreshPendingStockIns]);

  // navigator.onLine has no reliable equivalent on-device, so this is the
  // only source of truth: poll GET /health on the API's origin.
  useEffect(() => {
    let cancelled = false;

    const checkHealth = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
      try {
        const res = await fetch(`${API_ORIGIN}/health`, {
          method: 'GET',
          signal: controller.signal,
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
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);

    try {
      // --- Sales queue ---
      const salesQueue = await offlineSalesDb.getAllPendingSales();
      const salesToSync = salesQueue.filter((s) => s.status === 'PENDING' || s.status === 'FAILED');

      for (const sale of salesToSync) {
        const syncing: PendingSale = { ...sale, status: 'SYNCING', lastAttemptAt: new Date().toISOString() };
        await offlineSalesDb.updatePendingSale(syncing);
        await refreshPendingSales();

        try {
          const res = await posMobileService.completeSale({
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
            // Backend went unreachable again mid-sync -- stop this queue,
            // leave the rest as PENDING for the next auto-sync pass.
            await offlineSalesDb.updatePendingSale({ ...syncing, status: 'PENDING', attempts: sale.attempts + 1 });
            await refreshPendingSales();
            break;
          }

          if (isAxiosError(err) && (err.response?.data as any)?.code === 'POS_STOCK_CONFLICT') {
            const shortages = ((err.response?.data as any)?.metadata?.shortages as StockShortage[]) || [];
            await offlineSalesDb.updatePendingSale({
              ...syncing,
              status: 'NEEDS_REVIEW',
              shortages,
              attempts: sale.attempts + 1,
              errorMessage: 'Stock changed while offline -- review before syncing.',
            });
          } else {
            await offlineSalesDb.updatePendingSale({
              ...syncing,
              status: 'FAILED',
              attempts: sale.attempts + 1,
              errorMessage: getApiErrorMessage(err, 'Sync failed'),
            });
          }
        }

        await refreshPendingSales();
      }

      // --- Stock-in queue ---
      const stockQueue = await offlineStockInDb.getAllPendingStockIns();
      const stockToSync = stockQueue.filter((s) => s.status === 'PENDING' || s.status === 'FAILED');

      for (const entry of stockToSync) {
        const syncing: PendingStockIn = {
          ...entry,
          status: 'SYNCING',
          lastAttemptAt: new Date().toISOString(),
        };
        await offlineStockInDb.updatePendingStockIn(syncing);
        await refreshPendingStockIns();

        try {
          await inventoryService.stockIn(
            entry.variantId,
            entry.quantity,
            entry.reason,
            entry.thresholds,
            entry.clientRequestId,
          );
          await offlineStockInDb.updatePendingStockIn({ ...syncing, status: 'SYNCED', attempts: entry.attempts + 1 });
        } catch (err) {
          if (isNetworkFailure(err)) {
            await offlineStockInDb.updatePendingStockIn({
              ...syncing,
              status: 'PENDING',
              attempts: entry.attempts + 1,
            });
            await refreshPendingStockIns();
            break;
          }
          await offlineStockInDb.updatePendingStockIn({
            ...syncing,
            status: 'FAILED',
            attempts: entry.attempts + 1,
            errorMessage: getApiErrorMessage(err, 'Sync failed'),
          });
        }

        await refreshPendingStockIns();
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
      await refreshPendingSales();
      await refreshPendingStockIns();
    }
  }, [refreshPendingSales, refreshPendingStockIns]);

  // Auto-sync on mount and whenever reachability flips back on. syncNow()
  // re-reads both queues from SQLite itself and is a no-op when empty, so
  // this doesn't need the queue state as a dependency.
  useEffect(() => {
    if (!isBackendReachable) return;
    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBackendReachable]);

  useEffect(() => {
    if (!isBackendReachable) return;
    const interval = setInterval(() => {
      const hasWork =
        pendingSales.some((s) => s.status === 'PENDING' || s.status === 'FAILED') ||
        pendingStockIns.some((s) => s.status === 'PENDING' || s.status === 'FAILED');
      if (hasWork) syncNow();
    }, AUTO_SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isBackendReachable, pendingSales, pendingStockIns, syncNow]);

  const queueSale = useCallback(
    async (payload: CompleteSaleCorePayload, receipt: PendingSale['receipt']): Promise<PendingSale> => {
      const localId = generateLocalId();
      const clientOrderNumber = `OFF-${DEVICE_TAG}-${Date.now().toString(36).toUpperCase()}-${localId.slice(-4).toUpperCase()}`;
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
    [refreshPendingSales],
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

  const queueStockIn = useCallback(
    async (input: {
      variantId: string;
      quantity: number;
      reason?: string;
      thresholds?: { minimumStock?: number; reorderLevel?: number };
      variant: PendingStockIn['variant'];
    }): Promise<PendingStockIn> => {
      const localId = generateLocalId();
      const entry: PendingStockIn = {
        localId,
        clientRequestId: `OFF-STOCK-${DEVICE_TAG}-${Date.now().toString(36).toUpperCase()}-${localId.slice(-4).toUpperCase()}`,
        variantId: input.variantId,
        quantity: input.quantity,
        reason: input.reason,
        thresholds: input.thresholds,
        variant: input.variant,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        attempts: 0,
      };
      await offlineStockInDb.addPendingStockIn(entry);
      await refreshPendingStockIns();
      return entry;
    },
    [refreshPendingStockIns],
  );

  const dismissStockIn = useCallback(
    async (localId: string) => {
      await offlineStockInDb.deletePendingStockIn(localId);
      await refreshPendingStockIns();
    },
    [refreshPendingStockIns],
  );

  const retryStockIn = useCallback(
    async (localId: string) => {
      const queue = await offlineStockInDb.getAllPendingStockIns();
      const entry = queue.find((s) => s.localId === localId);
      if (!entry) return;
      await offlineStockInDb.updatePendingStockIn({ ...entry, status: 'PENDING', errorMessage: undefined });
      await refreshPendingStockIns();
      syncNow();
    },
    [refreshPendingStockIns, syncNow],
  );

  const pendingCount =
    pendingSales.filter((s) => s.status === 'PENDING' || s.status === 'SYNCING').length +
    pendingStockIns.filter((s) => s.status === 'PENDING' || s.status === 'SYNCING').length;
  const needsReviewCount =
    pendingSales.filter((s) => s.status === 'NEEDS_REVIEW' || s.status === 'FAILED').length +
    pendingStockIns.filter((s) => s.status === 'FAILED').length;

  return {
    isBackendReachable,
    pendingSales,
    pendingStockIns,
    pendingCount,
    needsReviewCount,
    isSyncing,
    queueSale,
    queueStockIn,
    syncNow,
    dismissSale,
    dismissStockIn,
    retrySale,
    retryStockIn,
  };
}
