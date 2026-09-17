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
  waybill: string;
  orderNumber: string;
  paymentType: 'PREPAID' | 'COD';
  codAmount?: number;
  consigneeName: string;
  consigneePhone: string;
  consigneeAddress: string;
  city: string;
  state: string;
  pincode: string;
  routingHub?: string;
  weightGrams?: number;
  sellerName?: string;
  sellerAddress?: string;
  sellerGst?: string;
  itemsSummary?: string;
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

  /** Sends a short line to confirm the connection actually reaches the printer and cuts the paper. */
  async testPrint(): Promise<void> {
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
    await P.printText('================================================\n\r', {});
    await P.printText("VASANTHI'S SIGNATURE\n\r", { widthtimes: 1, heigthtimes: 1 });
    await P.printText('3-Inch POS Thermal Printer Test\n\r', {});
    await P.printText('Bluetooth Connection: OK\n\r', {});
    await P.printText('================================================\n\r\n\r\n\r\n\r', {});
    if (P.cutPaper) {
      try {
        await P.cutPaper();
      } catch (err) {
        console.warn('[BluetoothPrinter] cutPaper error in testPrint:', err);
      }
    }
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

    await P.printerInit();

    // 1. Header (Centered)
    await P.printerAlign(ALIGN.CENTER);
    await P.printText(`${receipt.storeName.toUpperCase()}\n\r`, { widthtimes: 1, heigthtimes: 1 });
    if (receipt.storeTagline) await P.printText(`${receipt.storeTagline}\n\r`, {});
    if (receipt.address) await P.printText(`${receipt.address}\n\r`, {});
    if (receipt.phone) await P.printText(`Ph: ${receipt.phone}\n\r`, {});
    await P.printText(`${divider}\n\r`, {});

    // 2. Metadata (Left aligned)
    await P.printerAlign(ALIGN.LEFT);
    await P.printText(`Invoice : ${receipt.orderNumber}\n\r`, {});
    await P.printText(`Date    : ${receipt.dateStr}\n\r`, {});
    if (receipt.cashierName) await P.printText(`Cashier : ${receipt.cashierName}\n\r`, {});
    if (receipt.customerName) {
      const suffix = receipt.customerPhone ? ` (${receipt.customerPhone})` : '';
      await P.printText(`Customer: ${receipt.customerName}${suffix}\n\r`, {});
    }
    await P.printText(`${divider}\n\r`, {});

    // 3. Item List (Strict 48-char / 32-char fixed alignment)
    if (is80mm) {
      // Columns: Item(24) Qty(4) Rate(8) Total(12) = 48 chars
      const header = 'ITEM'.padEnd(24) + 'QTY'.padStart(4) + 'RATE'.padStart(8) + 'TOTAL'.padStart(12);
      await P.printText(`${header}\n\r`, {});
      await P.printText(`${divider}\n\r`, {});

      for (const item of receipt.items) {
        const itemTotal = (item.unitPrice * item.quantity).toFixed(2);
        const rateStr = Math.round(item.unitPrice).toString();
        const qtyStr = item.quantity.toString();

        if (item.title.length <= 24) {
          const row = item.title.padEnd(24) + qtyStr.padStart(4) + rateStr.padStart(8) + itemTotal.padStart(12);
          await P.printText(`${row}\n\r`, {});
        } else {
          const row1 = item.title.slice(0, 23).padEnd(24) + qtyStr.padStart(4) + rateStr.padStart(8) + itemTotal.padStart(12);
          await P.printText(`${row1}\n\r`, {});
          const rest = item.title.slice(23).trim();
          if (rest) {
            await P.printText(`  ${rest.slice(0, 44)}\n\r`, {});
          }
        }
      }
    } else {
      // 58mm (32 chars)
      const header = 'ITEM'.padEnd(16) + 'QTY'.padStart(4) + 'TOTAL'.padStart(12);
      await P.printText(`${header}\n\r`, {});
      await P.printText(`${divider}\n\r`, {});

      for (const item of receipt.items) {
        const itemTotal = (item.unitPrice * item.quantity).toFixed(2);
        await P.printText(`${item.title}\n\r`, {});
        const row = ''.padEnd(14) + `x${item.quantity}`.padStart(4) + itemTotal.padStart(14);
        await P.printText(`${row}\n\r`, {});
      }
    }
    await P.printText(`${divider}\n\r`, {});

    // 4. Totals (Strict 48-char / 32-char fixed alignment)
    if (is80mm) {
      const subtotalRow = 'Subtotal'.padEnd(32) + money(receipt.subtotal).padStart(16);
      await P.printText(`${subtotalRow}\n\r`, {});

      if (receipt.discountTotal && receipt.discountTotal > 0) {
        const discRow = 'Discount'.padEnd(32) + (`-${money(receipt.discountTotal)}`).padStart(16);
        await P.printText(`${discRow}\n\r`, {});
      }

      if (receipt.taxTotal && receipt.taxTotal > 0) {
        const gstRow = 'GST (5% CGST+SGST)'.padEnd(32) + money(receipt.taxTotal).padStart(16);
        await P.printText(`${gstRow}\n\r`, {});
      }

      await P.printText(`${divider}\n\r`, {});

      const totalRow = 'GRAND TOTAL'.padEnd(28) + money(receipt.grandTotal).padStart(20);
      await P.printText(`${totalRow}\n\r`, { widthtimes: 0, heigthtimes: 1 });
    } else {
      const subtotalRow = 'Subtotal'.padEnd(16) + money(receipt.subtotal).padStart(16);
      await P.printText(`${subtotalRow}\n\r`, {});

      if (receipt.discountTotal && receipt.discountTotal > 0) {
        const discRow = 'Discount'.padEnd(16) + (`-${money(receipt.discountTotal)}`).padStart(16);
        await P.printText(`${discRow}\n\r`, {});
      }

      if (receipt.taxTotal && receipt.taxTotal > 0) {
        const gstRow = 'GST'.padEnd(16) + money(receipt.taxTotal).padStart(16);
        await P.printText(`${gstRow}\n\r`, {});
      }

      await P.printText(`${divider}\n\r`, {});

      const totalRow = 'TOTAL'.padEnd(16) + money(receipt.grandTotal).padStart(16);
      await P.printText(`${totalRow}\n\r`, { widthtimes: 0, heigthtimes: 1 });
    }

    if (receipt.paymentMethod) {
      await P.printText(`Payment Mode: ${receipt.paymentMethod}\n\r`, {});
    }

    await P.printText(`${doubleDivider}\n\r`, {});

    // 5. Footer (Centered)
    await P.printerAlign(ALIGN.CENTER);
    await P.printText('❖ THANK YOU FOR SHOPPING WITH US! ❖\n\r', {});
    await P.printText('Visit again • vasanthissignature.in\n\r', {});

    // Feed lines before cutting
    await P.printText('\n\r\n\r\n\r\n\r', {});

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
   * Prints `quantity` copies of a barcode sticker label using the printer's
   * built-in ESC/POS commands (for standard 3-inch thermal printers) with real scannable
   * Code 128 barcode lines, centered product details, formatted pricing, and auto-cut.
   */
  async printLabel(label: PrinterLabelData): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }

    const P = BluetoothEscposPrinter;
    if (P) {
      const copies = Math.max(1, label.quantity ?? 1);
      const is80mm = (label.widthMm ?? 80) >= 80 || true; // standard 3-inch (80mm) ESC/POS thermal printer
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

        // Barcode (ESC/POS Code 128)
        // nType: 73 (CODE128), nWidthX: 3, nHeight: 70, nHriFontType: 0 (Font A), nHriFontPosition: 2 (Below barcode)
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

    if (BluetoothTscPrinter) {
      const copies = Math.max(1, label.quantity ?? 1);
      const widthMm = label.widthMm ?? 50;
      const heightMm = label.heightMm ?? 30;
      const gapMm = label.gapMm ?? 2;

      const DOTS_PER_MM = 8;
      const heightDots = heightMm * DOTS_PER_MM;
      const marginDots = Math.round(DOTS_PER_MM * 2);
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
      return;
    }

    throw new Error('Bluetooth printer native module is not available.');
  }

  /**
   * Prints a 4x6 inch (100x150mm) Courier Shipping Label using the printer's
   * built-in TSC/TSPL commands. Formatted with barcode, consignee, and seller details.
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
    const DOTS_PER_MM = 8;
    const marginDots = Math.round(DOTS_PER_MM * 3);

    const textFields = [
      {
        text: (shipping.courier || 'DELHIVERY').toUpperCase(),
        x: marginDots,
        y: marginDots,
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 2,
        yscal: 2,
      },
      {
        text: `${shipping.paymentType} ${shipping.paymentType === 'COD' && shipping.codAmount ? `Rs.${shipping.codAmount}` : ''}`,
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 12),
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `AWB: ${shipping.waybill}`,
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 18),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `Order: ${shipping.orderNumber} | Wt: ${shipping.weightGrams || 500}g`,
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 38),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: 'SHIP TO / CONSIGNEE:',
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 45),
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `${shipping.consigneeName} (Ph: ${shipping.consigneePhone})`,
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 51),
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: shipping.consigneeAddress.slice(0, 42),
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 57),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `${shipping.city}, ${shipping.state} - PIN: ${shipping.pincode}`,
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 63),
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `Routing Hub: ${shipping.routingHub || 'HYD/JUB/500033'}`,
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 70),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: 'RETURN / SHIPPER ADDRESS:',
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 78),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: (shipping.sellerName || "Vasanthi's Signature").toUpperCase(),
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 84),
        fonttype: FONTTYPE.FONT_2,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: shipping.sellerAddress || 'Plot 42, Jubilee Hills Rd No 36, Hyd, TS - 500033',
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 90),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `GSTIN: ${shipping.sellerGst || '36AABCU9603R1ZM'}`,
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 96),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
      },
      {
        text: `Items: ${shipping.itemsSummary || 'Ethnic Wear / Apparel'}`,
        x: marginDots,
        y: Math.round(DOTS_PER_MM * 102),
        fonttype: FONTTYPE.FONT_1,
        rotation: TSC_ROTATION.ROTATION_0,
        xscal: 1,
        yscal: 1,
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
          x: marginDots,
          y: Math.round(DOTS_PER_MM * 22),
          type: TSC_BARCODETYPE.CODE128,
          height: Math.round(DOTS_PER_MM * 12),
          readable: READABLE.ENABLE,
          rotation: TSC_ROTATION.ROTATION_0,
          code: shipping.waybill,
          wide: 2,
          narrow: 1,
        },
      ],
    });
  }
}

/** Single shared instance for the app's lifetime -- mirrors the in-memory pattern used elsewhere. Connection is in-memory only (not persisted across app restarts). */
export const bluetoothPrinterService = new BluetoothPrinterService();
