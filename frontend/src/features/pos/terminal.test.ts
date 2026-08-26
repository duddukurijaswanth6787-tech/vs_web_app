import { DEFAULT_TERMINAL_ID, readTerminalId, writeTerminalId } from './terminal';

/**
 * A shift's takings are every POS sale on its terminal within its window --
 * the report filters by terminal, not by cashier. So two devices sharing one
 * terminal id are each charged with the other's sales and both drawers read
 * over at close. These pin the properties that prevent that: the id is unique
 * per device, and it does not change underneath a shift.
 *
 * Runs against a hand-rolled localStorage rather than jsdom, which this
 * project does not install.
 */
const fakeStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    clear: () => {
      store = {};
    },
  };
};

describe('POS terminal identity', () => {
  beforeEach(() => {
    (globalThis as any).window = { localStorage: fakeStorage() };
  });

  afterAll(() => {
    delete (globalThis as any).window;
  });

  it('assigns an id on first use and keeps it thereafter', () => {
    const first = readTerminalId();
    expect(first).toMatch(/^COUNTER-[A-Z0-9]{4}$/);
    // Stability matters more than the format: a shift is reconciled against
    // the terminal that was open when it started.
    expect(readTerminalId()).toBe(first);
  });

  it('gives separate devices separate ids', () => {
    const deviceA = readTerminalId();
    (globalThis as any).window = { localStorage: fakeStorage() }; // another device
    expect(readTerminalId()).not.toBe(deviceA);
  });

  it('honours an explicitly named register', () => {
    writeTerminalId('FRONT_DESK');
    expect(readTerminalId()).toBe('FRONT_DESK');
  });

  it('falls back to the shared default rather than billing to an empty id', () => {
    writeTerminalId('   ');
    expect(readTerminalId()).toBe(DEFAULT_TERMINAL_ID);
  });

  it('still returns a usable terminal when storage is blocked', () => {
    // Private browsing / site data blocked: reads throw. Billing must still
    // work, and the default is a real terminal that can hold a shift.
    (globalThis as any).window = {
      localStorage: {
        getItem: () => {
          throw new Error('SecurityError');
        },
        setItem: () => undefined,
      },
    };
    expect(readTerminalId()).toBe(DEFAULT_TERMINAL_ID);
  });

  it('reports the shared default when there is no device (server render)', () => {
    delete (globalThis as any).window;
    expect(readTerminalId()).toBe(DEFAULT_TERMINAL_ID);
  });
});
