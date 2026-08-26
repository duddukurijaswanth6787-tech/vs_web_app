import * as SecureStore from 'expo-secure-store';

/**
 * Every device that bills is its own register.
 *
 * A shift's takings are every POS sale on its terminal between openedAt and
 * closedAt -- the report query filters by terminal, not by cashier. Two
 * devices sharing one terminal id would therefore each be charged with the
 * other's sales, and both drawers would read over at close. Giving this phone
 * its own id keeps a shift's window to one physical drawer.
 *
 * Matches the Square/Shopify model: a register is a device, and a cash-drawer
 * session belongs to that register.
 */
const TERMINAL_STORAGE_KEY = 'pos_terminal_id';

/**
 * Terminal a sale bills against before this device has been registered.
 * Mirrors the server's DEFAULT_TERMINAL_ID -- the two must agree, or a sale
 * bills to one terminal while the shift check looks at another.
 */
export const DEFAULT_TERMINAL_ID = 'COUNTER_1';

const newTerminalId = () =>
  `MOBILE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// Read once, then kept in memory: the terminal id is needed on the billing
// path, which should not wait on storage for every sale.
let cachedTerminalId: string | null = null;

/**
 * This device's terminal id, assigning one on first use.
 * Falls back to the shared default if storage is unavailable -- billing still
 * has to work, and the default is a real terminal that can hold a shift.
 */
export async function getTerminalId(): Promise<string> {
  if (cachedTerminalId) return cachedTerminalId;
  try {
    const stored = await SecureStore.getItemAsync(TERMINAL_STORAGE_KEY);
    if (stored) {
      cachedTerminalId = stored;
      return stored;
    }
    const assigned = newTerminalId();
    await SecureStore.setItemAsync(TERMINAL_STORAGE_KEY, assigned);
    cachedTerminalId = assigned;
    return assigned;
  } catch {
    return DEFAULT_TERMINAL_ID;
  }
}

/** Synchronous read for code already past an await of getTerminalId(). */
export function peekTerminalId(): string {
  return cachedTerminalId ?? DEFAULT_TERMINAL_ID;
}
