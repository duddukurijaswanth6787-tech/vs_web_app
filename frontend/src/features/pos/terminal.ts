'use client';

import { useEffect, useState } from 'react';

/**
 * Every device that bills is its own register.
 *
 * A shift's takings are every POS sale on its terminal between openedAt and
 * closedAt -- the report query filters by terminal, not by cashier. So two
 * devices sharing one terminal id would each be charged with the other's
 * sales, and both drawers would read over at close. Giving each device its
 * own id is what keeps a shift's window to one physical drawer.
 *
 * Matches the Square/Shopify model: a register is a device, and a cash-drawer
 * session belongs to that register.
 */
const STORAGE_KEY = 'vd_pos_terminal_id';

/**
 * Terminal a sale is billed against when the device has not been registered
 * yet. Mirrors the server's DEFAULT_TERMINAL_ID -- the two must agree, or a
 * sale bills to one terminal while the shift check looks at another.
 */
export const DEFAULT_TERMINAL_ID = 'COUNTER_1';

const newTerminalId = () =>
  `COUNTER-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

/**
 * Reads this device's terminal id, assigning one on first use.
 * Returns the default on the server, where there is no device to identify.
 */
export function readTerminalId(): string {
  if (typeof window === 'undefined') return DEFAULT_TERMINAL_ID;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const assigned = newTerminalId();
    window.localStorage.setItem(STORAGE_KEY, assigned);
    return assigned;
  } catch {
    // Private browsing, or site data blocked. Billing still has to work; the
    // server default is a real terminal that can hold a shift.
    return DEFAULT_TERMINAL_ID;
  }
}

export function writeTerminalId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id.trim() || DEFAULT_TERMINAL_ID);
  } catch {
    /* nothing we can do, and not worth failing a sale over */
  }
}

/**
 * The device's terminal id, resolved after mount.
 *
 * Empty until then: localStorage cannot be read while rendering on the
 * server, and seeding from it during hydration would render one id on the
 * server and another in the browser. Callers should hold off on shift lookups
 * until this is non-empty rather than querying the wrong terminal.
 */
export function useTerminalId() {
  const [terminalId, setTerminalIdState] = useState('');

  useEffect(() => {
    setTerminalIdState(readTerminalId());
  }, []);

  return {
    terminalId,
    /** Ready to query -- an empty id would look up the wrong register. */
    isResolved: terminalId !== '',
    rename: (id: string) => {
      writeTerminalId(id);
      setTerminalIdState(id.trim() || DEFAULT_TERMINAL_ID);
    },
  };
}
