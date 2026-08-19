import * as SQLite from 'expo-sqlite';
import { CachedScanResult, PendingSale, PendingStockIn } from './offline.types';

/**
 * expo-sqlite backed replacement for the web POS's IndexedDB wrapper
 * (frontend/src/features/pos/offline/offlineDb.ts) -- React Native has no
 * IndexedDB. One shared database holds three tables: pending sales, pending
 * stock-ins, and cached scans. Each row stores its record as a JSON blob
 * (`data`) alongside a couple of plain columns used for filtering/sorting,
 * which keeps this file resilient to the record shapes evolving without a
 * schema migration.
 */

const DB_NAME = 'shopora-offline.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS pending_sales (
          localId TEXT PRIMARY KEY NOT NULL,
          createdAt TEXT NOT NULL,
          status TEXT NOT NULL,
          data TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS pending_stock_ins (
          localId TEXT PRIMARY KEY NOT NULL,
          createdAt TEXT NOT NULL,
          status TEXT NOT NULL,
          data TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS scan_cache (
          key TEXT PRIMARY KEY NOT NULL,
          cachedAt TEXT NOT NULL,
          data TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export const offlineSalesDb = {
  async addPendingSale(sale: PendingSale): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO pending_sales (localId, createdAt, status, data) VALUES (?, ?, ?, ?)',
      sale.localId,
      sale.createdAt,
      sale.status,
      JSON.stringify(sale),
    );
  },

  async updatePendingSale(sale: PendingSale): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO pending_sales (localId, createdAt, status, data) VALUES (?, ?, ?, ?)',
      sale.localId,
      sale.createdAt,
      sale.status,
      JSON.stringify(sale),
    );
  },

  async deletePendingSale(localId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM pending_sales WHERE localId = ?', localId);
  },

  async getAllPendingSales(): Promise<PendingSale[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ data: string }>(
      'SELECT data FROM pending_sales ORDER BY createdAt ASC',
    );
    return rows.map((row) => JSON.parse(row.data) as PendingSale);
  },
};

export const offlineStockInDb = {
  async addPendingStockIn(entry: PendingStockIn): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO pending_stock_ins (localId, createdAt, status, data) VALUES (?, ?, ?, ?)',
      entry.localId,
      entry.createdAt,
      entry.status,
      JSON.stringify(entry),
    );
  },

  async updatePendingStockIn(entry: PendingStockIn): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO pending_stock_ins (localId, createdAt, status, data) VALUES (?, ?, ?, ?)',
      entry.localId,
      entry.createdAt,
      entry.status,
      JSON.stringify(entry),
    );
  },

  async deletePendingStockIn(localId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM pending_stock_ins WHERE localId = ?', localId);
  },

  async getAllPendingStockIns(): Promise<PendingStockIn[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ data: string }>(
      'SELECT data FROM pending_stock_ins ORDER BY createdAt ASC',
    );
    return rows.map((row) => JSON.parse(row.data) as PendingStockIn);
  },
};

export const offlineScanCacheDb = {
  async cacheScanResult(entry: CachedScanResult): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO scan_cache (key, cachedAt, data) VALUES (?, ?, ?)',
      entry.key,
      entry.cachedAt,
      JSON.stringify(entry),
    );
  },

  async getCachedScanResult(key: string): Promise<CachedScanResult | undefined> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ data: string }>(
      'SELECT data FROM scan_cache WHERE key = ?',
      key.trim().toLowerCase(),
    );
    return row ? (JSON.parse(row.data) as CachedScanResult) : undefined;
  },
};

export function normalizeScanCacheKey(rawQuery: string): string {
  return rawQuery.trim().toLowerCase();
}
