import { PermissionsAndroid, Platform } from 'react-native';
import { VASANTHI_THERMAL_LOGO_BASE64 } from './brand-logo';

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
  printAndFeed(feed: number): Promise<void>;
  printBarCode?(
    str: string,
    nType: number,
    nWidthX: number,
    nHeight: number,
    nHriFontType: number,
    nHriFontPosition: number,
  ): Promise<void>;
  cutPaper?(): Promise<void>;
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
 * Printable-width constants in dots:
 * 576 dots = 80mm width (48 chars standard font A)
 * 384 dots = 58mm width (32 chars standard font A)
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

export interface PrinterShippingLabelData {
  courier: string;
  subCourierText?: string;
  waybill: string;
  orderNumber: string;
  invoiceNumber?: string;
  orderDate?: string;
  paymentType: 'PREPAID' | 'COD';
  codAmount?: number;
  serviceType?: string;
  consigneeName: string;
  consigneePhone: string;
  consigneeAddress: string;
  city: string;
  state: string;
  pincode: string;
  routingHub?: string;
  weightGrams?: number;
  dimensions?: string;
  pieces?: string;
  sellerName?: string;
  sellerAddress?: string;
  sellerPhone?: string;
  sellerGst?: string;
  itemsSummary?: string;
  sku?: string;
  hsn?: string;
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

export function isLabelPrinterName(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toUpperCase();
  return (
    n.includes('ITPP') ||
    n.includes('130') ||
    n.includes('BY482') ||
    n.includes('MUNBYN') ||
    n.includes('LABEL') ||
    n.includes('TSC') ||
    n.includes('XP-') ||
    n.includes('4B') ||
    n.includes('420') ||
    n.includes('460') ||
    n.includes('470') ||
    n.includes('480') ||
    n.includes('490') ||
    n.includes('POSTEK') ||
    n.includes('ZEBRA') ||
    n.includes('HPRT') ||
    n.includes('BARCODE') ||
    n.includes('STICKER') ||
    n.includes('SHIPPING')
  );
}

import * as SecureStore from 'expo-secure-store';

const LAST_PRINTER_STORAGE_KEY = 'shopora_last_bluetooth_printer';

export function isPosReceiptPrinterName(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toUpperCase();
  return (
    n.includes('KPC') ||
    n.includes('POS') ||
    n.includes('RECEIPT') ||
    n.includes('BILLING') ||
    n.includes('58MM') ||
    n.includes('80MM') ||
    n.includes('RP') ||
    n.includes('EPSON') ||
    n.includes('THERMAL') ||
    n.includes('UEWB') ||
    n.includes('265C')
  );
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

  async scanDevices(): Promise<{ paired: DiscoveredPrinter[]; found: DiscoveredPrinter[] }> {
    if (!BluetoothManager) {
      throw new Error('Bluetooth manager native module is not available.');
    }
    const raw = await BluetoothManager.scanDevices();
    let parsed: { paired?: unknown; found?: unknown } = {};
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw || {};
    } catch {
      parsed = {};
    }
    return {
      paired: parseDeviceList(parsed.paired),
      found: parseDeviceList(parsed.found),
    };
  }

  async connect(device: DiscoveredPrinter): Promise<void> {
    if (!BluetoothManager) {
      throw new Error('Bluetooth manager native module is not available.');
    }
    await BluetoothManager.connect(device.address);
    this.connectedAddress = device.address;
    this.connectedName = device.name;
    try {
      await SecureStore.setItemAsync(LAST_PRINTER_STORAGE_KEY, JSON.stringify(device));
    } catch (e) {
      console.warn('[BluetoothPrinter] Could not save last printer:', e);
    }
  }

  async disconnect(): Promise<void> {
    this.connectedAddress = null;
    this.connectedName = null;
    try {
      await SecureStore.deleteItemAsync(LAST_PRINTER_STORAGE_KEY);
    } catch {}
  }

  isConnected(): boolean {
    return this.connectedAddress != null;
  }

  connectedDeviceName(): string | null {
    return this.connectedName;
  }

  connectedDeviceAddress(): string | null {
    return this.connectedAddress;
  }

  async getLastConnectedPrinter(): Promise<DiscoveredPrinter | null> {
    try {
      const raw = await SecureStore.getItemAsync(LAST_PRINTER_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  }

  /**
   * Automatically discovers and connects to a known thermal/POS printer
   * or the last connected printer without requiring manual user input.
   */
  async autoConnect(): Promise<DiscoveredPrinter | null> {
    if (this.isConnected()) {
      return { address: this.connectedAddress!, name: this.connectedName };
    }
    try {
      const granted = await this.requestPermissions();
      if (!granted) return null;
      const enabled = await this.isBluetoothEnabled().catch(() => false);
      if (!enabled) return null;

      const { paired } = await this.scanDevices();
      if (!paired || paired.length === 0) return null;

      // 1. Try last connected printer
      const last = await this.getLastConnectedPrinter();
      if (last) {
        const match = paired.find((p) => p.address === last.address);
        if (match) {
          try {
            await this.connect(match);
            return match;
          } catch (e) {
            console.warn('[BluetoothPrinter] autoConnect last device failed, falling back to discovery:', e);
          }
        }
      }

      // 2. Try known POS or label printers
      const knownPrinter = paired.find((p) => {
        const n = (p.name || '').toUpperCase();
        return isPosReceiptPrinterName(n) || isLabelPrinterName(n);
      });

      if (knownPrinter) {
        try {
          await this.connect(knownPrinter);
          return knownPrinter;
        } catch (e) {
          console.warn('[BluetoothPrinter] autoConnect known printer failed:', e);
        }
      }
    } catch (e) {
      console.warn('[BluetoothPrinter] autoConnect error:', e);
    }
    return null;
  }

  /**
   * Universal Test Print:
   * Checks whether the connected device is a TSC Label printer (like ITPP130B) or ESC/POS receipt printer
   * and sends the appropriate test command.
   */
  async testPrint(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    const isLabel = isLabelPrinterName(this.connectedName);
    if (isLabel && BluetoothTscPrinter) {
      await this.testPrintLabel();
      return;
    }

    try {
      await this.testPrintReceipt();
    } catch (escErr) {
      if (BluetoothTscPrinter) {
        await this.testPrintLabel();
      } else {
        throw escErr;
      }
    }
  }

  async testPrintReceipt(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    const P = BluetoothEscposPrinter;
    if (!P) {
      throw new Error('Bluetooth ESC/POS printer native module is not available.');
    }
    await P.printerInit();
    await P.setWidth(PAGE_WIDTH.WIDTH_80);
    await P.printerAlign(ALIGN.CENTER);
    await P.printText('================================================\n\r', { codepage: 1 });
    await P.printText("VASANTHI'S SIGNATURE\n\r", { widthtimes: 1, heigthtimes: 1, codepage: 1 });
    await P.printText('POS Thermal Receipt Test\n\r', { codepage: 1 });
    await P.printText('Bluetooth Connection: OK\n\r', { codepage: 1 });
    await P.printText('================================================\n\r\n\r\n\r', { codepage: 1 });
    if (P.cutPaper) {
      try {
        await P.cutPaper();
      } catch (err) {
        console.warn('[BluetoothPrinter] cutPaper error in testPrintReceipt:', err);
      }
    }
  }

  async testPrintLabel(widthMm = 75, heightMm = 50): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    await this.printLabel({
      productName: 'Silk Anarkali Suit',
      variantTitle: 'Size: L | Wine Red',
      sku: 'VS-TEST-001',
      barcode: '890123456789',
      price: 4999,
      storeName: "VASANTHI'S SIGNATURE",
      widthMm,
      heightMm,
      quantity: 1,
    });
  }

  /**
   * Prints the official brand logo (Vasanthi's Signature) on a 3x2" (75x50mm) label sticker.
   */
  async testPrintLogo(widthMm = 75, heightMm = 50): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    if (BluetoothTscPrinter) {
      await BluetoothTscPrinter.printLabel({
        width: widthMm,
        height: heightMm,
        gap: 2,
        direction: DIRECTION.FORWARD,
        reference: [0, 0],
        tear: TEAR.ON,
        sound: 0,
        text: [
          {
            text: 'LUXURY COUTURE - HYDERABAD',
            x: 120,
            y: 275,
            fonttype: FONTTYPE.FONT_2,
            rotation: TSC_ROTATION.ROTATION_0,
            xscal: 1,
            yscal: 1,
            bold: true,
          },
          {
            text: 'www.vasanthissignature.in',
            x: 155,
            y: 315,
            fonttype: FONTTYPE.FONT_1,
            rotation: TSC_ROTATION.ROTATION_0,
            xscal: 1,
            yscal: 1,
          },
        ],
        image: [
          {
            x: 90,
            y: 35,
            width: 420,
            mode: 0,
            image: VASANTHI_THERMAL_LOGO_BASE64,
          },
        ],
      });
      return;
    }
    throw new Error('Bluetooth TSC printer native module is not available.');
  }

  async testPrintShippingLabel(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    await this.printShippingLabel({
      courier: 'DELHIVERY',
      subCourierText: 'SMALL WORLD',
      paymentType: 'PREPAID',
      serviceType: 'SURFACE',
      sellerName: "VASANTHI CREATIONS PVT LTD",
      sellerAddress: '2-1-156/3 Ashoknagar main rd, Manuguru - 507117',
      sellerPhone: '+91 7659034198',
      consigneeName: 'Priya Sharma',
      consigneeAddress: 'Flat No. 402, Sai Residency',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      consigneePhone: '91234 56789',
      orderNumber: 'VS1234567890',
      invoiceNumber: 'INV-20260920-001',
      orderDate: '20 Sep 2026',
      dimensions: '30 x 20 x 10',
      weightGrams: 500,
      pieces: '1/1',
      waybill: 'DLVH28917654321',
      routingHub: 'BLR/INR',
      itemsSummary: "Women's Ethnic Dress (Red)",
      sku: 'VS-DRS-001-RED-M',
      hsn: '6204',
    });
  }

  /** Prints a POS sale receipt using the printer's built-in ESC/POS text commands with exact 48-char alignment and auto-cut. */
  async printReceipt(receipt: PrinterReceiptData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    const P = BluetoothEscposPrinter;
    if (!P) {
      throw new Error('Bluetooth ESC/POS printer native module is not available.');
    }
    const paperWidthMm = receipt.paperWidthMm ?? 80;
    const is80mm = paperWidthMm >= 80;

    // Set printable width in dots (576 dots for 80mm, 384 dots for 58mm)
    await P.setWidth(is80mm ? PAGE_WIDTH.WIDTH_80 : PAGE_WIDTH.WIDTH_58);

    const lineChars = is80mm ? 48 : 32;
    const divider = '-'.repeat(lineChars);
    const doubleDivider = '='.repeat(lineChars);
    const opt = { codepage: 1 };

    await P.printerInit();

    // 1. Header (Centered)
    await P.printerAlign(ALIGN.CENTER);
    await P.printText(`${receipt.storeName.toUpperCase()}\n\r`, { widthtimes: 1, heigthtimes: 1, codepage: 1 });
    if (receipt.storeTagline) await P.printText(`${receipt.storeTagline}\n\r`, opt);
    if (receipt.address) await P.printText(`${receipt.address}\n\r`, opt);
    if (receipt.phone) await P.printText(`Ph: ${receipt.phone}\n\r`, opt);
    await P.printText(`${divider}\n\r`, opt);

    // 2. Metadata (Left aligned)
    await P.printerAlign(ALIGN.LEFT);
    await P.printText(`Invoice : ${receipt.orderNumber}\n\r`, opt);
    await P.printText(`Date    : ${receipt.dateStr}\n\r`, opt);
    if (receipt.cashierName) await P.printText(`Cashier : ${receipt.cashierName}\n\r`, opt);
    if (receipt.customerName) {
      const suffix = receipt.customerPhone ? ` (${receipt.customerPhone})` : '';
      await P.printText(`Customer: ${receipt.customerName}${suffix}\n\r`, opt);
    }
    await P.printText(`${divider}\n\r`, opt);

    // 3. Item List (Strict 48-char / 32-char fixed alignment)
    if (is80mm) {
      // Columns: Item(24) Qty(4) Rate(8) Total(12) = 48 chars
      const header = 'ITEM'.padEnd(24) + 'QTY'.padStart(4) + 'RATE'.padStart(8) + 'TOTAL'.padStart(12);
      await P.printText(`${header}\n\r`, opt);
      await P.printText(`${divider}\n\r`, opt);

      for (const item of receipt.items) {
        const itemTotal = (item.unitPrice * item.quantity).toFixed(2);
        const rateStr = Math.round(item.unitPrice).toString();
        const qtyStr = item.quantity.toString();

        if (item.title.length <= 24) {
          const row = item.title.padEnd(24) + qtyStr.padStart(4) + rateStr.padStart(8) + itemTotal.padStart(12);
          await P.printText(`${row}\n\r`, opt);
        } else {
          const row1 = item.title.slice(0, 23).padEnd(24) + qtyStr.padStart(4) + rateStr.padStart(8) + itemTotal.padStart(12);
          await P.printText(`${row1}\n\r`, opt);
          const rest = item.title.slice(23).trim();
          if (rest) {
            await P.printText(`  ${rest.slice(0, 44)}\n\r`, opt);
          }
        }
      }
    } else {
      // 58mm (32 chars)
      const header = 'ITEM'.padEnd(16) + 'QTY'.padStart(4) + 'TOTAL'.padStart(12);
      await P.printText(`${header}\n\r`, opt);
      await P.printText(`${divider}\n\r`, opt);

      for (const item of receipt.items) {
        const itemTotal = (item.unitPrice * item.quantity).toFixed(2);
        await P.printText(`${item.title}\n\r`, opt);
        const row = ''.padEnd(14) + `x${item.quantity}`.padStart(4) + itemTotal.padStart(14);
        await P.printText(`${row}\n\r`, opt);
      }
    }
    await P.printText(`${divider}\n\r`, opt);

    // 4. Totals (Strict 48-char / 32-char fixed alignment)
    if (is80mm) {
      const subtotalRow = 'Subtotal'.padEnd(32) + money(receipt.subtotal).padStart(16);
      await P.printText(`${subtotalRow}\n\r`, opt);

      if (receipt.discountTotal && receipt.discountTotal > 0) {
        const discRow = 'Discount'.padEnd(32) + (`-${money(receipt.discountTotal)}`).padStart(16);
        await P.printText(`${discRow}\n\r`, opt);
      }

      if (receipt.taxTotal && receipt.taxTotal > 0) {
        const gstRow = 'GST (5% CGST+SGST)'.padEnd(32) + money(receipt.taxTotal).padStart(16);
        await P.printText(`${gstRow}\n\r`, opt);
      }

      await P.printText(`${divider}\n\r`, opt);

      const totalRow = 'GRAND TOTAL'.padEnd(28) + money(receipt.grandTotal).padStart(20);
      await P.printText(`${totalRow}\n\r`, { widthtimes: 0, heigthtimes: 1, codepage: 1 });
    } else {
      const subtotalRow = 'Subtotal'.padEnd(16) + money(receipt.subtotal).padStart(16);
      await P.printText(`${subtotalRow}\n\r`, opt);

      if (receipt.discountTotal && receipt.discountTotal > 0) {
        const discRow = 'Discount'.padEnd(16) + (`-${money(receipt.discountTotal)}`).padStart(16);
        await P.printText(`${discRow}\n\r`, opt);
      }

      if (receipt.taxTotal && receipt.taxTotal > 0) {
        const gstRow = 'GST'.padEnd(16) + money(receipt.taxTotal).padStart(16);
        await P.printText(`${gstRow}\n\r`, opt);
      }

      await P.printText(`${divider}\n\r`, opt);

      const totalRow = 'TOTAL'.padEnd(16) + money(receipt.grandTotal).padStart(16);
      await P.printText(`${totalRow}\n\r`, { widthtimes: 0, heigthtimes: 1, codepage: 1 });
    }

    if (receipt.paymentMethod) {
      await P.printText(`Payment Mode: ${receipt.paymentMethod}\n\r`, opt);
    }

    await P.printText(`${doubleDivider}\n\r`, opt);

    // 5. Footer (Centered)
    await P.printerAlign(ALIGN.CENTER);
    await P.printText('*** THANK YOU FOR SHOPPING WITH US! ***\n\r', opt);
    await P.printText('Visit again : vasanthissignature.in\n\r', opt);

    // Feed lines before cutting
    await P.printText('\n\r\n\r\n\r', opt);

    // 6. Cut Paper
    if (P.cutPaper) {
      try {
        await P.cutPaper();
      } catch (cutErr) {
        console.warn('[BluetoothPrinter] cutPaper failed:', cutErr);
      }
    }
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
  /**
   * Prints `quantity` copies of a barcode sticker label (e.g. 3x2" or 50x30mm)
   * using the printer's built-in TSC/TSPL commands.
   */
  async printLabel(label: PrinterLabelData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }

    if (BluetoothTscPrinter) {
      const copies = Math.max(1, label.quantity ?? 1);
      const widthMm = label.widthMm ?? 75;
      const heightMm = label.heightMm ?? 50;
      const gapMm = label.gapMm ?? 2;

      // 3x2 inch (75x50mm = 600x400 dots) Label Layout
      const is3x2 = widthMm >= 65;

      const textFields = is3x2
        ? [
            {
              text: "VASANTHI'S SIGNATURE",
              x: 55,
              y: 20,
              fonttype: FONTTYPE.FONT_3,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 2,
              yscal: 2,
              bold: true,
            },
            {
              text: 'LUXURY COUTURE - HYDERABAD',
              x: 125,
              y: 75,
              fonttype: FONTTYPE.FONT_2,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
              bold: true,
            },
            {
              text: '--------------------------------------------------------',
              x: 20,
              y: 105,
              fonttype: FONTTYPE.FONT_1,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
            {
              text: (label.productName || 'Designer Suit').slice(0, 30),
              x: 30,
              y: 125,
              fonttype: FONTTYPE.FONT_3,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
              bold: true,
            },
            {
              text: (label.variantTitle || 'Standard Size').slice(0, 30),
              x: 30,
              y: 160,
              fonttype: FONTTYPE.FONT_2,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
            {
              text: `SKU: ${label.sku || 'VS-001'}`,
              x: 30,
              y: 190,
              fonttype: FONTTYPE.FONT_2,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
            {
              text: `MRP: Rs.${Math.round(label.price * 1.35)}`,
              x: 30,
              y: 220,
              fonttype: FONTTYPE.FONT_2,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
            {
              text: `PRICE: Rs.${label.price.toFixed(2)}`,
              x: 30,
              y: 250,
              fonttype: FONTTYPE.FONT_3,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
              bold: true,
            },
            {
              text: '(Incl. of all taxes)',
              x: 380,
              y: 250,
              fonttype: FONTTYPE.FONT_1,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
          ]
        : [
            {
              text: (label.storeName || "VASANTHI'S").toUpperCase(),
              x: 20,
              y: 15,
              fonttype: FONTTYPE.FONT_2,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
            {
              text: label.productName.slice(0, 24),
              x: 20,
              y: 50,
              fonttype: FONTTYPE.FONT_1,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
            ...(label.variantTitle
              ? [
                  {
                    text: label.variantTitle.slice(0, 24),
                    x: 20,
                    y: 80,
                    fonttype: FONTTYPE.FONT_1,
                    rotation: TSC_ROTATION.ROTATION_0,
                    xscal: 1,
                    yscal: 1,
                  },
                ]
              : []),
            {
              text: `Rs.${label.price.toFixed(2)}`,
              x: 20,
              y: 110,
              fonttype: FONTTYPE.FONT_2,
              rotation: TSC_ROTATION.ROTATION_0,
              xscal: 1,
              yscal: 1,
            },
          ];

      const barcodeConfig = is3x2
        ? [
            {
              x: 70,
              y: 285,
              type: TSC_BARCODETYPE.CODE128,
              height: 60,
              readable: READABLE.ENABLE,
              rotation: TSC_ROTATION.ROTATION_0,
              code: label.barcode || '890123456789',
              wide: 3,
              narrow: 2,
            },
          ]
        : [
            {
              x: 20,
              y: 145,
              type: TSC_BARCODETYPE.CODE128,
              height: 45,
              readable: READABLE.ENABLE,
              rotation: TSC_ROTATION.ROTATION_0,
              code: label.barcode || '890123456789',
              wide: 2,
              narrow: 1,
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
          barcode: barcodeConfig,
        });
      }
      return;
    }

    const P = BluetoothEscposPrinter;
    if (P) {
      const copies = Math.max(1, label.quantity ?? 1);
      const is80mm = (label.widthMm ?? 80) >= 80 || true;
      await P.printerInit();
      await P.setWidth(is80mm ? PAGE_WIDTH.WIDTH_80 : PAGE_WIDTH.WIDTH_58);

      const divider = '------------------------------------------------';

      for (let i = 0; i < copies; i++) {
        await P.printerInit();
        await P.printerAlign(ALIGN.CENTER);

        // Header / Store Name
        await P.printText(`${divider}\n\r`, {});
        await P.printText(`${(label.storeName || "VASANTHI'S SIGNATURE").toUpperCase()}\n\r`, {
          widthtimes: 1,
          heigthtimes: 1,
        });
        await P.printText(`${divider}\n\r`, {});

        // Product Details
        await P.printText(`${label.productName}\n\r`, {});
        if (label.variantTitle) {
          await P.printText(`${label.variantTitle}\n\r`, {});
        }
        await P.printText(`SKU: ${label.sku}\n\r\n\r`, {});

        if (P.printBarCode) {
          try {
            await P.printBarCode(label.barcode, 73, 3, 70, 0, 2);
          } catch (err) {
            console.warn('[BluetoothPrinter] printBarCode fallback:', err);
            await P.printText(`* ${label.barcode} *\n\r`, { widthtimes: 1, heigthtimes: 0 });
          }
        } else {
          await P.printText(`* ${label.barcode} *\n\r`, { widthtimes: 1, heigthtimes: 0 });
        }

        // Price Section
        await P.printText('\n\r', {});
        await P.printText(`PRICE: Rs.${label.price.toFixed(2)}\n\r`, {
          widthtimes: 1,
          heigthtimes: 1,
        });
        await P.printText(`${divider}\n\r`, {});

        // Feed margin before cutting (4 lines)
        await P.printText('\n\r\n\r\n\r\n\r', {});

        // Clean single cut
        if (P.cutPaper) {
          try {
            await P.cutPaper();
          } catch (cutErr) {
            console.warn('[BluetoothPrinter] cutPaper failed in printLabel:', cutErr);
          }
        }
      }
      return;
    }

    throw new Error('Bluetooth printer native module is not available.');
  }

  /**
   * Prints a 4x6 inch (100x150mm = 800x1200 dots) Courier Shipping Label
   * matching the standard Delhivery courier format with QR code, Barcode,
   * Ship To / Ship From columns, routing codes, and handling icons.
   */
  async printShippingLabel(shipping: PrinterShippingLabelData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    if (!BluetoothTscPrinter) {
      throw new Error('Bluetooth TSC printer native module is not available.');
    }
    const widthMm = 100;
    const heightMm = 150;
    const gapMm = 3;

    const divLine = '--------------------------------------------------------------------------------';
    const isCod = shipping.paymentType === 'COD';
    const paymentTitle = isCod ? 'COLLECT COD' : 'PREPAID';
    const surfaceText = shipping.serviceType || 'SURFACE';
    const subPaymentText = isCod
      ? `COLLECT: Rs.${shipping.codAmount || 0}`
      : 'DO NOT COLLECT CASH';

    const textFields = [
      // 1. Top Header: DELHIVERY & Payment Header (y: 30 to 135)
      {
        text: (shipping.courier || 'DELHIVERY').toUpperCase(),
        x: 35,
        y: 30,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 2,
        yscal: 2,
        bold: true,
      },
      {
        text: shipping.subCourierText || 'SMALL WORLD',
        x: 35,
        y: 90,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: '|',
        x: 480,
        y: 30,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: '|',
        x: 480,
        y: 65,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: '|',
        x: 480,
        y: 95,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: paymentTitle,
        x: 520,
        y: 30,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 2,
        yscal: 2,
        bold: true,
      },
      {
        text: surfaceText,
        x: 545,
        y: 75,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: subPaymentText,
        x: 495,
        y: 105,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: divLine,
        x: 30,
        y: 135,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },

      // 2. Ship From / Ship To (y: 155 to 375)
      {
        text: 'Ship From:',
        x: 35,
        y: 155,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: (shipping.sellerName || "Vasanthi's Signature").slice(0, 24),
        x: 35,
        y: 185,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: (shipping.sellerAddress || 'Plot No. 123, Phase 2').slice(0, 26),
        x: 35,
        y: 220,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: 'Kondapur, Hyderabad',
        x: 35,
        y: 250,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: 'Telangana - 500084',
        x: 35,
        y: 280,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `Ph: ${shipping.sellerPhone || '+91 98765 43210'}`,
        x: 35,
        y: 315,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },

      // Center Vertical Divider
      ...[155, 190, 225, 260, 295, 330].map((yVal) => ({
        text: '|',
        x: 390,
        y: yVal,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      })),

      // Ship To (Right Column)
      {
        text: 'Ship To:',
        x: 410,
        y: 155,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: shipping.consigneeName.slice(0, 24),
        x: 410,
        y: 185,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: shipping.consigneeAddress.slice(0, 26),
        x: 410,
        y: 220,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: (shipping.consigneeAddress.length > 26 ? shipping.consigneeAddress.slice(26, 52) : '12th Cross, Indiranagar').slice(0, 26),
        x: 410,
        y: 250,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `${shipping.city} - ${shipping.pincode}`,
        x: 410,
        y: 280,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: shipping.state,
        x: 410,
        y: 310,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `Ph: +91 ${shipping.consigneePhone}`,
        x: 410,
        y: 340,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: divLine,
        x: 30,
        y: 380,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },

      // 3. Order ID & Metadata (y: 395 to 495)
      {
        text: `Order ID:      ${shipping.orderNumber}`,
        x: 35,
        y: 395,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: `Invoice No:   ${shipping.invoiceNumber || 'INV-20260920-001'}`,
        x: 35,
        y: 430,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `Order Date:   ${shipping.orderDate || '20 Sep 2026'}`,
        x: 35,
        y: 465,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },

      ...[395, 430, 465].map((yVal) => ({
        text: '|',
        x: 410,
        y: yVal,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      })),

      {
        text: `Dimensions (cm): ${shipping.dimensions || '30 x 20 x 10'}`,
        x: 430,
        y: 395,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `Weight: ${shipping.weightGrams ? (shipping.weightGrams / 1000).toFixed(2) : '0.50'} kg`,
        x: 430,
        y: 430,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: `Pieces: ${shipping.pieces || '1/1'}`,
        x: 430,
        y: 465,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: divLine,
        x: 30,
        y: 505,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },

      // 4. Barcode Waybill Text + Scan for Tracking (y: 525 to 705)
      {
        text: shipping.waybill,
        x: 100,
        y: 650,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 2,
        yscal: 2,
        bold: true,
      },
      ...[525, 570, 615, 660].map((yVal) => ({
        text: '|',
        x: 520,
        y: yVal,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      })),
      {
        text: 'Scan for Tracking',
        x: 540,
        y: 660,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: divLine,
        x: 30,
        y: 715,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },

      // 5. Routing Code, Destination Pin Code, STD Badge (y: 730 to 850)
      {
        text: 'Routing Code:',
        x: 35,
        y: 730,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: shipping.routingHub || 'BLR/INR',
        x: 35,
        y: 765,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 2,
        yscal: 2,
        bold: true,
      },

      ...[730, 765, 800].map((yVal) => ({
        text: '|',
        x: 290,
        y: yVal,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      })),

      {
        text: 'Destination Pin Code:',
        x: 310,
        y: 730,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: shipping.pincode || '560038',
        x: 310,
        y: 765,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 2,
        yscal: 2,
        bold: true,
      },

      ...[730, 765, 800].map((yVal) => ({
        text: '|',
        x: 580,
        y: yVal,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      })),

      {
        text: 'STD',
        x: 635,
        y: 760,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 2,
        yscal: 2,
        bold: true,
      },
      {
        text: divLine,
        x: 30,
        y: 860,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },

      // 6. Product Details (y: 875 to 975)
      {
        text: 'Product Details:',
        x: 35,
        y: 875,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: (shipping.itemsSummary || "Women's Ethnic Dress (Red)").slice(0, 40),
        x: 35,
        y: 910,
        fonttype: FONTTYPE.FONT_3,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: `SKU: ${shipping.sku || 'VS-DRS-001-RED-M'}`,
        x: 35,
        y: 945,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `HSN: ${shipping.hsn || '6204'}`,
        x: 480,
        y: 945,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: divLine,
        x: 30,
        y: 985,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },

      // 7. If Undelivered Return To & Handling Icons (y: 1000 to 1130)
      {
        text: 'If undelivered, return to:',
        x: 35,
        y: 1000,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: (shipping.sellerName || "Vasanthi's Signature").slice(0, 24),
        x: 35,
        y: 1025,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: 'Plot No. 123, Phase 2, Kondapur',
        x: 35,
        y: 1055,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: 'Hyderabad - 500084, Telangana',
        x: 35,
        y: 1075,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `Ph: ${shipping.sellerPhone || '+91 98765 43210'}`,
        x: 35,
        y: 1100,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },

      ...[1000, 1035, 1070, 1105].map((yVal) => ({
        text: '|',
        x: 380,
        y: yVal,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      })),

      // Handling Boxes
      {
        text: '+-------+  +-------+  +-------+',
        x: 400,
        y: 1005,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: '|  [Y]  |  |  (^)  |  |  /|\\  |',
        x: 400,
        y: 1025,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: '+-------+  +-------+  +-------+',
        x: 400,
        y: 1045,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: 'FRAGILE',
        x: 408,
        y: 1075,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: 'KEEP DRY',
        x: 500,
        y: 1075,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: 'THIS SIDE UP',
        x: 585,
        y: 1075,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
      {
        text: divLine,
        x: 30,
        y: 1135,
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },

      // 8. Footer (y: 1150 to 1180)
      {
        text: 'Thank you for shopping with us!  <3',
        x: 180,
        y: 1150,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
        bold: true,
      },
    ];

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
          x: 35,
          y: 525,
          type: TSC_BARCODETYPE.CODE128,
          height: 110,
          readable: READABLE.DISABLE,
          rotation: TSC_ROTATION.ROTATION_0,
          code: shipping.waybill,
          wide: 3,
          narrow: 2,
        },
      ],
      qrcode: [
        {
          x: 550,
          y: 520,
          level: 'M',
          width: 6,
          rotation: TSC_ROTATION.ROTATION_0,
          code: `https://www.delhivery.com/track/package/${shipping.waybill}`,
        },
      ],
      reverse: [
        {
          x: 605,
          y: 745,
          width: 140,
          height: 75,
        },
      ],
    });
  }
}

/** Single shared instance for the app's lifetime -- mirrors the in-memory pattern used elsewhere. Connection is in-memory only (not persisted across app restarts). */
export const bluetoothPrinterService = new BluetoothPrinterService();
