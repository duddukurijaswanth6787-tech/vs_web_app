import { PermissionsAndroid, Platform } from 'react-native';

/**
 * `tp-react-native-bluetooth-printer` ships a types/index.d.ts that doesn't
 * match its own runtime behaviour (verified directly against its Android
 * source): the declared constant TSC_BARCODETYPE.BARCODE128 doesn't exist
 * on the real runtime object (it's CODE128 there), and scanDevices() is
 * typed as resolving with a parsed object but the native module actually
 * resolves it with a JSON *string* that still needs JSON.parse. Trusting
 * the bad types would either fail to compile or silently break at runtime,
 * so this file imports the native modules untyped and defines its own
 * constants/interfaces below, cross-checked against the library's actual
 * index.js and Android source rather than its declaration file.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
let BluetoothPrinterNative: Record<string, unknown> | null = null;
try {
  BluetoothPrinterNative = require('tp-react-native-bluetooth-printer');
} catch {
  console.warn('[BluetoothPrinter] Native module not available (e.g. Expo Go)');
}

interface NativeBluetoothManager {
  isBluetoothEnabled(): Promise<boolean>;
  scanDevices(): Promise<string>;
  connect(address: string): Promise<void>;
}

interface NativeEscposPrinter {
  printerInit(): Promise<void>;
  printerAlign(align: number): Promise<void>;
  printText(text: string, options: Record<string, unknown>): Promise<void>;
  printColumn(
    columnWidths: number[],
    columnAligns: number[],
    columnTexts: string[],
    options: Record<string, unknown>,
  ): Promise<void>;
  setWidth(width: number): void;
}

interface NativeTscPrinter {
  printLabel(options: Record<string, unknown>): Promise<void>;
}

const BluetoothManager = (BluetoothPrinterNative?.BluetoothManager || null) as NativeBluetoothManager | null;
const BluetoothEscposPrinter = (BluetoothPrinterNative?.BluetoothEscposPrinter || null) as NativeEscposPrinter | null;
const BluetoothTscPrinter = (BluetoothPrinterNative?.BluetoothTscPrinter || null) as NativeTscPrinter | null;

/** Constant values the native module expects -- copied from the library's
 * actual index.js (not its declaration file, see note above). */
const ALIGN = { LEFT: 0, CENTER: 1, RIGHT: 2 };
const TEAR = { ON: 'ON', OFF: 'OFF' };
const READABLE = { DISABLE: 0, ENABLE: 1 };
const FONTTYPE = { FONT_1: '1', FONT_2: '2' };
const TSC_ROTATION = { ROTATION_0: 0 };
const TSC_BARCODETYPE = { CODE128: '128' };
const DIRECTION = { FORWARD: 0, BACKWARD: 1 };
/**
 * Printable-width constants in dots, read from the native Android source
 * (RNBluetoothEscposPrinterModule.java) rather than the library's index.js
 * (which doesn't export these at all, despite the .d.ts claiming a
 * PAGE_WIDTH enum exists). printColumn() rejects any call whose column
 * widths sum past deviceWidth/8 characters, and deviceWidth defaults to
 * WIDTH_58 until setWidth() is called -- printReceipt() below calls it once
 * per print so a genuinely 80mm printer isn't silently capped at the 58mm
 * character budget.
 */
const PAGE_WIDTH = { WIDTH_58: 384, WIDTH_80: 576 };

/**
 * Bluetooth thermal printer integration -- UNTESTED, NO PHYSICAL PRINTER.
 *
 * Built without access to real Bluetooth-printer hardware (the build/dev
 * sandbox has none), so nothing here has run against a real device. Treat
 * it as a wired-up starting point: verify every step below with an actual
 * printer before relying on it in the store.
 *
 * WHY THIS LIBRARY (classic Bluetooth / SPP), NOT BLE:
 * An earlier version of this file used react-native-ble-plx (Bluetooth Low
 * Energy). That turned out to be the wrong transport for real hardware --
 * virtually every budget 58mm/80mm "Bluetooth thermal printer" sold for
 * retail (the kind suitable for both POS receipts and barcode stickers on
 * one device) uses classic Bluetooth SPP, not BLE, and a BLE-only library
 * simply can't see or connect to them. This file uses
 * `tp-react-native-bluetooth-printer` instead, an actively-maintained fork
 * of the long-standing `react-native-bluetooth-escpos-printer` -- it talks
 * classic SPP and, notably, bundles BOTH an ESC/POS driver (for receipts)
 * and a TSC/TSPL driver (for barcode labels) in one native module, matching
 * a single printer doing both jobs.
 *
 * WHY STRUCTURED PRINT CALLS, NOT RAW BYTES:
 * The BLE version streamed the backend's pre-rendered raw ESC/POS/TSPL
 * bytes straight through. This library doesn't expose a raw-byte-write
 * method on its public JS API (checked its native Android source directly
 * -- only printText/printColumn/printPic/printBarCode/printQRCode for
 * receipts and a structured printLabel() for TSC labels) -- pushing binary
 * control bytes through its text methods would get mangled by their
 * GBK-encoding step. So printReceipt()/printLabel() below build the output
 * from the structured calls directly, instead of consuming the backend's
 * escposBase64/tspl fields.
 *
 * KNOWN RISK: this library was last published years ago, targets an old
 * Android compileSdkVersion in its own build.gradle, and predates React
 * Native's New Architecture. This app has `newArchEnabled: false` in
 * app.json (the legacy bridge), which is what makes an old-style native
 * module like this viable at all -- if that ever flips to true, this
 * module would need re-evaluating first.
 *
 * Build requirement: same as the barcode scanner -- this is a native
 * module, so it needs a custom dev client or an EAS build, not plain Expo
 * Go.
 */

export interface DiscoveredPrinter {
  address: string;
  name: string | null;
}

export interface PrinterReceiptItem {
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface PrinterReceiptData {
  storeName: string;
  storeTagline?: string;
  address?: string;
  phone?: string;
  orderNumber: string;
  dateStr: string;
  cashierName?: string;
  customerName?: string;
  customerPhone?: string;
  items: PrinterReceiptItem[];
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  grandTotal: number;
  paymentMethod?: string;
  /** Paper roll width in mm. Defaults to 80 (this app's confirmed target hardware); pass 58 if printing on a narrower printer. */
  paperWidthMm?: number;
}

export interface PrinterLabelData {
  productName: string;
  variantTitle?: string;
  sku: string;
  barcode: string;
  price: number;
  storeName?: string;
  /** Number of copies to print. Defaults to 1. */
  quantity?: number;
  /** Physical label size in mm. Defaults to 50x30 (a common small sticker roll) when omitted. */
  widthMm?: number;
  heightMm?: number;
  gapMm?: number;
}

function parseDeviceList(raw: unknown): DiscoveredPrinter[] {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map((entry) => (typeof entry === 'string' ? JSON.parse(entry) : entry))
    .filter((d): d is { address: string; name?: string } => Boolean(d?.address))
    .map((d) => ({ address: d.address, name: d.name ?? null }));
}

function money(n: number): string {
  return `Rs.${n.toFixed(2)}`;
}

class BluetoothPrinterService {
  private connectedAddress: string | null = null;
  private connectedName: string | null = null;

  /** Android 12+ requires runtime BLUETOOTH_SCAN/BLUETOOTH_CONNECT grants in addition to the manifest entries this library bundles. Classic SPP scanning also needs location permission on older Android, same as BLE. */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    if (Platform.Version < 31) {
      const fineLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return fineLocation === PermissionsAndroid.RESULTS.GRANTED;
    }
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  async isBluetoothEnabled(): Promise<boolean> {
    if (!BluetoothManager) return false;
    return BluetoothManager.isBluetoothEnabled();
  }

  /** Scans for classic-Bluetooth devices, returning already-paired and newly-found ones separately (paired devices are usually the printer once it's been paired once in phone Settings). */
  async scanDevices(): Promise<{ paired: DiscoveredPrinter[]; found: DiscoveredPrinter[] }> {
    if (!BluetoothManager) {
      return { paired: [], found: [] };
    }
    const raw = await BluetoothManager.scanDevices();
    const parsed = JSON.parse(raw) as { paired?: unknown[]; found?: unknown[] };
    return {
      paired: parseDeviceList(parsed.paired),
      found: parseDeviceList(parsed.found),
    };
  }

  async connect(device: DiscoveredPrinter): Promise<void> {
    if (!BluetoothManager) {
      throw new Error('Bluetooth printer native module is not available in this environment.');
    }
    await BluetoothManager.connect(device.address);
    this.connectedAddress = device.address;
    this.connectedName = device.name;
  }

  /**
   * The native module has no "disconnect but stay paired" method -- only
   * `unpair(address)`, which removes the OS-level Bluetooth pairing
   * entirely (requiring the user to re-pair from phone Settings next
   * time). That's too destructive for a routine "Disconnect" button, so
   * this only forgets the connection on the app's side; connecting again
   * (to this or another printer) replaces it at the native layer.
   */
  async disconnect(): Promise<void> {
    this.connectedAddress = null;
    this.connectedName = null;
  }

  isConnected(): boolean {
    return this.connectedAddress != null;
  }

  connectedDeviceName(): string | null {
    return this.connectedName;
  }

  /** Sends a short line to confirm the connection actually reaches the printer. */
  async testPrint(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    if (!BluetoothEscposPrinter) {
      throw new Error('Bluetooth ESC/POS printer native module is not available.');
    }
    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(ALIGN.CENTER);
    await BluetoothEscposPrinter.printText('Shopora POS -- Test Print OK\n\n\n', {});
  }

  /** Prints a POS sale receipt using the printer's built-in ESC/POS text/column commands. */
  async printReceipt(receipt: PrinterReceiptData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    const P = BluetoothEscposPrinter;
    if (!P) {
      throw new Error('Bluetooth ESC/POS printer native module is not available.');
    }
    const paperWidthMm = receipt.paperWidthMm ?? 80;

    // printColumn() rejects any call whose column widths sum past the
    // printer's configured character budget (deviceWidth/8, native-side --
    // see the PAGE_WIDTH comment above), which defaults to the 58mm budget
    // (48 chars) until setWidth() is called. Tell it the real width so an
    // 80mm printer isn't stuck using little more than half its paper.
    await P.setWidth(paperWidthMm >= 80 ? PAGE_WIDTH.WIDTH_80 : PAGE_WIDTH.WIDTH_58);
    // Leaves a safety margin under the hard cap (72 chars at 80mm, 48 at
    // 58mm) rather than using every last character.
    const lineChars = paperWidthMm >= 80 ? 64 : 42;
    const divider = '-'.repeat(lineChars);
    const itemNameChars = lineChars - 12;
    const totalsLabelChars = lineChars - 16;

    await P.printerInit();
    await P.printerAlign(ALIGN.CENTER);
    await P.printText(`${receipt.storeName}\n\r`, { widthtimes: 1, heigthtimes: 1 });
    if (receipt.storeTagline) await P.printText(`${receipt.storeTagline}\n\r`, {});
    if (receipt.address) await P.printText(`${receipt.address}\n\r`, {});
    if (receipt.phone) await P.printText(`Ph: ${receipt.phone}\n\r`, {});
    await P.printText(`${divider}\n\r`, {});

    await P.printerAlign(ALIGN.LEFT);
    await P.printText(`Invoice: ${receipt.orderNumber}\n\r`, {});
    await P.printText(`Date: ${receipt.dateStr}\n\r`, {});
    if (receipt.cashierName) await P.printText(`Cashier: ${receipt.cashierName}\n\r`, {});
    if (receipt.customerName) {
      const suffix = receipt.customerPhone ? ` (${receipt.customerPhone})` : '';
      await P.printText(`Customer: ${receipt.customerName}${suffix}\n\r`, {});
    }
    await P.printText(`${divider}\n\r`, {});

    for (const item of receipt.items) {
      await P.printColumn(
        [itemNameChars, 12],
        [ALIGN.LEFT, ALIGN.RIGHT],
        [item.title, `x${item.quantity}`],
        {},
      );
      await P.printColumn(
        [itemNameChars, 12],
        [ALIGN.LEFT, ALIGN.RIGHT],
        ['', money(item.unitPrice * item.quantity)],
        {},
      );
    }
    await P.printText(`${divider}\n\r`, {});

    await P.printColumn([totalsLabelChars, 16], [ALIGN.LEFT, ALIGN.RIGHT], ['Subtotal', money(receipt.subtotal)], {});
    if (receipt.discountTotal) {
      await P.printColumn(
        [totalsLabelChars, 16],
        [ALIGN.LEFT, ALIGN.RIGHT],
        ['Discount', `-${money(receipt.discountTotal)}`],
        {},
      );
    }
    if (receipt.taxTotal) {
      await P.printColumn([totalsLabelChars, 16], [ALIGN.LEFT, ALIGN.RIGHT], ['GST', money(receipt.taxTotal)], {});
    }
    await P.printText('\n\r', {});
    await P.printColumn(
      [totalsLabelChars, 16],
      [ALIGN.LEFT, ALIGN.RIGHT],
      ['TOTAL', money(receipt.grandTotal)],
      { widthtimes: 1, heigthtimes: 1 },
    );
    if (receipt.paymentMethod) await P.printText(`Payment: ${receipt.paymentMethod}\n\r`, {});

    await P.printText('\n\r', {});
    await P.printerAlign(ALIGN.CENTER);
    await P.printText('Thank You For Shopping With Us!\n\r\n\r\n\r', {});
  }

  /**
   * Prints `quantity` copies of a barcode sticker label using the printer's
   * built-in TSC/TSPL commands. Layout is computed proportionally from the
   * label's physical size (widthMm/heightMm, default 50x30mm) rather than
   * fixed pixel positions, so Small/Medium/Large all lay out sensibly.
   *
   * DOTS_PER_MM assumes 203 DPI (8 dots/mm), the resolution most small
   * TSC-style label printers use -- if your printer is 300 DPI, positions
   * will be a bit small/off-center but still on the label; adjust this
   * constant to match your printer's real resolution if so.
   */
  async printLabel(label: PrinterLabelData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    if (!BluetoothTscPrinter) {
      throw new Error('Bluetooth TSC printer native module is not available.');
    }
    const copies = Math.max(1, label.quantity ?? 1);
    const widthMm = label.widthMm ?? 50;
    const heightMm = label.heightMm ?? 30;
    const gapMm = label.gapMm ?? 2;

    const DOTS_PER_MM = 8;
    const heightDots = heightMm * DOTS_PER_MM;
    const marginDots = Math.round(DOTS_PER_MM * 2);
    // Rough character budget for the default font at this width -- narrower
    // labels get titles truncated harder rather than overflowing the edge.
    const maxChars = Math.max(10, Math.round(widthMm * 0.9));

    const textFields = [
      {
        text: (label.storeName || 'VASANTHI').toUpperCase(),
        x: marginDots,
        y: marginDots,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: label.productName.slice(0, maxChars),
        x: marginDots,
        y: Math.round(heightDots * 0.32),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      ...(label.variantTitle
        ? [
            {
              text: label.variantTitle.slice(0, maxChars),
              x: marginDots,
              y: Math.round(heightDots * 0.5),
              fonttype: FONTTYPE.FONT_1,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
          ]
        : []),
      {
        text: `Rs.${label.price}`,
        x: marginDots,
        y: Math.round(heightDots * 0.66),
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
    ];

    for (let i = 0; i < copies; i++) {
      await BluetoothTscPrinter.printLabel({
        width: widthMm,
        height: heightMm,
        gap: gapMm,
        direction: DIRECTION.FORWARD,
        reference: [0, 0],
        tear: TEAR.ON,
        sound: 0,
        text: textFields,
        barcode: [
          {
            x: marginDots,
            y: Math.round(heightDots * 0.8),
            type: TSC_BARCODETYPE.CODE128,
            height: Math.round(heightDots * 0.16),
            readable: READABLE.ENABLE,
            rotation: TSC_ROTATION.ROTATION_0,
            code: label.barcode,
            wide: 2,
            narrow: 1,
          },
        ],
      });
    }
  }
}

/** Single shared instance for the app's lifetime -- mirrors the in-memory pattern used elsewhere. Connection is in-memory only (not persisted across app restarts). */
export const bluetoothPrinterService = new BluetoothPrinterService();
