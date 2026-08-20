/**
 * WebUSB direct-connect thermal printer integration -- UNTESTED, NO
 * PHYSICAL PRINTER. Built without access to real hardware, so nothing
 * here has run against an actual device. Treat it as a wired-up starting
 * point: verify every step below with a real printer before relying on it
 * in the store.
 *
 * WHY THIS MIGHT SIMPLY NOT WORK FOR YOUR PRINTER:
 * Many USB thermal/receipt printers implement the standard USB Printer
 * Class (class code 07h). The moment a device identifies as that class,
 * the operating system's own print subsystem (the Windows spooler, CUPS
 * on Mac) claims it automatically -- and WebUSB is deliberately blocked
 * from opening any interface an OS driver already owns, for safety. If
 * the printer's USB-C port exposes itself this way, this feature will
 * never see it in the browser's device picker, or will fail to claim its
 * interface. It only works if the printer instead exposes a
 * vendor-specific bulk-transfer interface with no class driver -- common
 * on cheap ESC/POS printers, but not something that can be known without
 * testing on the real device.
 *
 * Browser support: Chrome/Edge/Opera on desktop only (Firefox and Safari
 * never implemented WebUSB). Requires HTTPS and a physical USB-C cable
 * between the computer and the printer -- this is unrelated to the
 * printer's Bluetooth mode, and Bluetooth is not reachable this way at
 * all (Web Bluetooth only covers BLE, not this printer's classic SPP
 * mode, same constraint documented in the mobile app's bluetooth-printer.ts).
 *
 * WHY RAW BYTES WORK HERE (unlike the mobile app): the mobile Bluetooth
 * library had no raw-byte-write API, so receipts/labels there are built
 * from structured print calls. WebUSB has no such wrapper -- transferOut()
 * sends whatever bytes you give it -- so this can stream the backend's
 * pre-rendered escposBase64 (receipts) and tspl (labels) fields straight
 * through unmodified, the same way real ESC/POS and TSPL printers are
 * normally driven over USB/serial.
 */

const WRITE_CHUNK_SIZE = 64; // conservative USB full-speed bulk packet size

function textToBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

class WebUsbPrinterService {
  private device: USBDevice | null = null;
  private interfaceNumber: number | null = null;
  private outEndpointNumber: number | null = null;

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && Boolean(navigator.usb);
  }

  isConnected(): boolean {
    return this.device != null && this.device.opened;
  }

  connectedDeviceName(): string | null {
    return this.device?.productName ?? null;
  }

  /** Re-attaches to a printer the user already authorized in an earlier visit, without a new picker prompt. Call this on page load. */
  async reconnectPrevious(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const devices = await navigator.usb!.getDevices();
      if (devices.length === 0) return false;
      await this.openDevice(devices[0]);
      return true;
    } catch {
      return false;
    }
  }

  /** Opens the browser's USB device picker -- must be called from a real user click (browsers require a user gesture for this). */
  async requestAndConnect(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('This browser does not support WebUSB. Use Chrome, Edge, or Opera on a desktop computer.');
    }
    const device = await navigator.usb!.requestDevice({ filters: [] });
    await this.openDevice(device);
  }

  private async openDevice(device: USBDevice): Promise<void> {
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    const iface = device.configuration?.interfaces.find((i) =>
      i.alternates.some((alt) => alt.endpoints.some((ep) => ep.direction === 'out' && ep.type === 'bulk')),
    );
    if (!iface) {
      await device.close();
      throw new Error(
        "Couldn't find a USB bulk-transfer interface on this device -- it may be claimed by your computer as a standard printer instead of exposing raw USB access. See webusb-printer.ts.",
      );
    }
    const altWithEndpoint = iface.alternates.find((alt) =>
      alt.endpoints.some((ep) => ep.direction === 'out' && ep.type === 'bulk'),
    );
    const outEndpoint = altWithEndpoint?.endpoints.find((ep) => ep.direction === 'out' && ep.type === 'bulk');
    if (!outEndpoint) {
      await device.close();
      throw new Error('No bulk OUT endpoint found on this device.');
    }

    await device.claimInterface(iface.interfaceNumber);

    this.device = device;
    this.interfaceNumber = iface.interfaceNumber;
    this.outEndpointNumber = outEndpoint.endpointNumber;
  }

  async disconnect(): Promise<void> {
    if (this.device) {
      try {
        if (this.interfaceNumber != null) await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
      } catch {
        // best-effort
      }
    }
    this.device = null;
    this.interfaceNumber = null;
    this.outEndpointNumber = null;
  }

  private async writeBytes(bytes: Uint8Array): Promise<void> {
    if (!this.device || this.outEndpointNumber == null) {
      throw new Error('No printer connected. Connect one first.');
    }
    for (let offset = 0; offset < bytes.length; offset += WRITE_CHUNK_SIZE) {
      const chunk = bytes.slice(offset, offset + WRITE_CHUNK_SIZE);
      const result = await this.device.transferOut(this.outEndpointNumber, chunk);
      if (result.status !== 'ok') {
        throw new Error(`USB transfer failed (status: ${result.status}).`);
      }
    }
  }

  /** Streams the backend's base64-encoded raw ESC/POS receipt bytes through unmodified. */
  async printBase64(base64Data: string): Promise<void> {
    await this.writeBytes(base64ToBytes(base64Data));
  }

  /** Streams a plain-text command payload (the backend's raw TSPL label commands) through unmodified. */
  async printText(text: string): Promise<void> {
    await this.writeBytes(textToBytes(text));
  }
}

/** Single shared instance for the page's lifetime. Connection is in-memory only -- reconnectPrevious() re-attaches on reload using the browser's own USB permission grant, no server-side persistence needed. */
export const webUsbPrinterService = new WebUsbPrinterService();
