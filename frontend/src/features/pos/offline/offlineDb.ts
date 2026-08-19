import { PendingSale, CachedScanResult } from './offline.types';

const DB_NAME = 'vs-pos-offline';
const DB_VERSION = 1;
const SALES_STORE = 'pendingSales';
const SCAN_CACHE_STORE = 'scanCache';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SALES_STORE)) {
        const store = db.createObjectStore(SALES_STORE, { keyPath: 'localId' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(SCAN_CACHE_STORE)) {
        db.createObjectStore(SCAN_CACHE_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const offlineSalesDb = {
  async addPendingSale(sale: PendingSale): Promise<void> {
    await runTransaction<IDBValidKey>(SALES_STORE, 'readwrite', (store) => store.add(sale));
  },

  async updatePendingSale(sale: PendingSale): Promise<void> {
    await runTransaction<IDBValidKey>(SALES_STORE, 'readwrite', (store) => store.put(sale));
  },

  async deletePendingSale(localId: string): Promise<void> {
    await runTransaction<undefined>(SALES_STORE, 'readwrite', (store) => store.delete(localId));
  },

  async getAllPendingSales(): Promise<PendingSale[]> {
    const rows = await runTransaction<PendingSale[]>(SALES_STORE, 'readonly', (store) => store.getAll());
    return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
};

export const offlineScanCacheDb = {
  async cacheScanResult(entry: CachedScanResult): Promise<void> {
    await runTransaction<IDBValidKey>(SCAN_CACHE_STORE, 'readwrite', (store) => store.put(entry));
  },

  async getCachedScanResult(key: string): Promise<CachedScanResult | undefined> {
    return runTransaction<CachedScanResult | undefined>(SCAN_CACHE_STORE, 'readonly', (store) =>
      store.get(key.trim().toLowerCase()),
    );
  },
};

export function normalizeScanCacheKey(rawQuery: string): string {
  return rawQuery.trim().toLowerCase();
}
