import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State, Subscription } from 'react-native-ble-plx';
import { fromByteArray, toByteArray } from 'base64-js';

/**
 * Bluetooth thermal printer integration -- UNTESTED, NO BLE HARDWARE.
 *
 * Built without access to a physical Bluetooth printer or any BLE radio (the
 * build/dev sandbox has neither), so nothing here has run against real
 * hardware. Treat it as a wired-up starting point: verify every step below
 * on an actual device and printer before relying on it in the store. This
 * mirrors bluetooth-scanner.ts's caveats -- read that file's header too if
 * you haven't.
 *
 * IMPORTANT -- read this before wiring anything to a real printer:
 * Most cheap 58mm/80mm "Bluetooth thermal printer" units sold for retail use
 * classic Bluetooth SPP (serial port profile), NOT Bluetooth Low Energy.
 * This file only reaches BLE printers -- a smaller but real category (some
 * modern Epson/Star/Zjiang models expose a BLE GATT serial service). Check
 * your printer's spec sheet for "BLE" / "Bluetooth Low Energy" support
 * before assuming this will find it; if it only supports classic SPP, it
 * won't show up in the scan here at all, and a different native module
 * (react-native-ble-plx is BLE-only by design) would be needed for that
 * transport instead.
 *
 * SERVICE_UUID and CHARACTERISTIC_UUID below are PLACEHOLDERS -- there is no
 * industry-standard UUID for a printer's write characteristic, every vendor
 * picks their own (often documented in the printer's SDK/manual, sometimes
 * discoverable by connecting once and calling device.discoverAllServicesAndCharacteristics()
 * and inspecting what's returned). Replace them with your printer's real
 * values before this can print anything.
 *
 * What this DOES give you for free: the backend already renders receipts to
 * raw ESC/POS bytes (POST /pos/printers/preview-receipt -> escposBase64) and
 * labels to raw TSPL command text (POST /pos/barcodes/batch-stickers ->
 * tspl) -- both are exactly what a printer's write characteristic expects,
 * so printText()/printBase64() below just stream those bytes through
 * unmodified. No print-formatting logic needs to live in the app.
 *
 * Build requirement: same as the scanner -- react-native-ble-plx is a
 * native module, so this needs a custom dev client or an EAS build, not
 * plain Expo Go.
 */

// TODO: replace with the real service/characteristic UUIDs from your
// printer's documentation -- these are placeholders and will not match any
// real device.
export const PRINTER_SERVICE_UUID = '000018F0-0000-1000-8000-00805F9B34FB';
export const PRINTER_CHARACTERISTIC_UUID = '00002AF1-0000-1000-8000-00805F9B34FB';

/** Conservative default write size in bytes -- the safe minimum before MTU negotiation (3-byte ATT header subtracted from the 23-byte default MTU). Raised after connect() negotiates a bigger MTU on Android. */
const DEFAULT_CHUNK_SIZE = 20;
/** Small pause between chunk writes -- most cheap printer receive buffers can't keep up with an unthrottled burst. */
const WRITE_DELAY_MS = 20;

export interface DiscoveredPrinter {
  id: string;
  name: string | null;
  rssi: number | null;
}

function textToBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

class BluetoothPrinterService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private disconnectSubscription: Subscription | null = null;
  private chunkSize = DEFAULT_CHUNK_SIZE;
  private onDisconnectCallbacks = new Set<() => void>();

  private getManager(): BleManager {
    if (!this.manager) this.manager = new BleManager();
    return this.manager;
  }

  /** Android 12+ requires runtime BLUETOOTH_SCAN/BLUETOOTH_CONNECT grants in addition to the manifest entries the config plugin adds. */
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

  async getState(): Promise<State> {
    return this.getManager().state();
  }

  /** Scans for nearby BLE peripherals for up to `timeoutMs`, reporting each one found. Stop with stopScan() once the user picks a device. */
  startScan(onDeviceFound: (device: DiscoveredPrinter) => void, timeoutMs = 15000): void {
    const manager = this.getManager();
    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.warn('[BluetoothPrinter] scan error', error);
        this.stopScan();
        return;
      }
      if (device) {
        onDeviceFound({ id: device.id, name: device.name, rssi: device.rssi });
      }
    });
    setTimeout(() => this.stopScan(), timeoutMs);
  }

  stopScan(): void {
    this.manager?.stopDeviceScan();
  }

  /** Connects to a printer the user picked from startScan's results and negotiates a larger MTU where possible so prints go faster. */
  async connect(deviceId: string): Promise<void> {
    const manager = this.getManager();
    this.stopScan();

    let device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();

    if (Platform.OS === 'android') {
      try {
        device = await device.requestMTU(185);
        this.chunkSize = Math.max(DEFAULT_CHUNK_SIZE, device.mtu - 3);
      } catch {
        this.chunkSize = DEFAULT_CHUNK_SIZE; // printer/phone didn't support the request -- fall back to the safe default
      }
    }

    this.connectedDevice = device;
    this.disconnectSubscription = manager.onDeviceDisconnected(device.id, () => {
      this.connectedDevice = null;
      this.disconnectSubscription?.remove();
      this.disconnectSubscription = null;
      this.onDisconnectCallbacks.forEach((cb) => cb());
    });
  }

  async disconnect(): Promise<void> {
    this.disconnectSubscription?.remove();
    this.disconnectSubscription = null;
    if (this.connectedDevice) {
      await this.manager?.cancelDeviceConnection(this.connectedDevice.id).catch(() => {});
      this.connectedDevice = null;
    }
  }

  isConnected(): boolean {
    return this.connectedDevice != null;
  }

  connectedDeviceName(): string | null {
    return this.connectedDevice?.name ?? null;
  }

  /** Registers a listener fired when the connected printer drops the link unexpectedly. Returns an unsubscribe function. */
  onDisconnect(callback: () => void): () => void {
    this.onDisconnectCallbacks.add(callback);
    return () => this.onDisconnectCallbacks.delete(callback);
  }

  /** Writes raw bytes to the printer, split into MTU-sized chunks with a short delay between writes. */
  private async printBytes(bytes: Uint8Array): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('No printer connected. Open Printer Settings and connect one first.');
    }
    for (let offset = 0; offset < bytes.length; offset += this.chunkSize) {
      const chunk = bytes.slice(offset, offset + this.chunkSize);
      const chunkBase64 = fromByteArray(chunk);
      await this.connectedDevice.writeCharacteristicWithoutResponseForService(
        PRINTER_SERVICE_UUID,
        PRINTER_CHARACTERISTIC_UUID,
        chunkBase64,
      );
      if (offset + this.chunkSize < bytes.length) {
        await new Promise((resolve) => setTimeout(resolve, WRITE_DELAY_MS));
      }
    }
  }

  /** Prints base64-encoded raw data as-is -- for the backend's escposBase64 receipt payload. */
  async printBase64(base64Data: string): Promise<void> {
    await this.printBytes(toByteArray(base64Data));
  }

  /** Prints a plain-text command payload -- for the backend's raw TSPL label commands. */
  async printText(text: string): Promise<void> {
    await this.printBytes(textToBytes(text));
  }

  destroy(): void {
    this.disconnect();
    this.manager?.destroy();
    this.manager = null;
  }
}

/** Single shared instance for the app's lifetime -- mirrors bluetoothScannerService in services/api.ts's session pattern. Connection is in-memory only (not persisted across app restarts), matching how the login session itself works in this app. */
export const bluetoothPrinterService = new BluetoothPrinterService();
