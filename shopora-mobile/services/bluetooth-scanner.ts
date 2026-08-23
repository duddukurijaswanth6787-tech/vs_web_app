import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State, Subscription } from 'react-native-ble-plx';
import { toByteArray } from 'base64-js';

function decodeBase64ToUtf8(base64Value: string): string {
  const bytes = toByteArray(base64Value);
  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    result += String.fromCharCode(bytes[i]);
  }
  return result;
}

/**
 * Bluetooth barcode scanner integration -- UNTESTED, NO BLE HARDWARE.
 *
 * This was built without access to a physical Bluetooth scanner or any BLE
 * radio (the build/dev sandbox has neither), so nothing in this file has run
 * against real hardware. Treat it as a wired-up starting point, not a
 * finished feature: verify every step below on an actual device and scanner
 * before relying on it in the store.
 *
 * IMPORTANT — read this before wiring anything to a real scanner:
 * Most handheld Bluetooth barcode scanners sold for retail operate in one of
 * two completely different modes, and this file only covers one of them:
 *
 *   1. HID (keyboard-emulation) mode -- the overwhelming majority of cheap
 *      "Bluetooth barcode scanner" devices on the market. The phone pairs
 *      with the scanner at the OS level (Settings > Bluetooth), and from
 *      then on the scanner "types" the barcode into whatever text field has
 *      focus, exactly like a wireless keyboard. NO APP CODE IS NEEDED for
 *      this mode -- the existing barcode TextInput on the sale/scanner
 *      screens already receives HID scanner input for free once the device
 *      is paired in the phone's Bluetooth settings. Check your scanner's
 *      manual first; if it lists an "HID mode" or "keyboard mode" (often
 *      the factory default), you likely don't need anything in this file.
 *
 *   2. BLE GATT mode -- a smaller set of scanners expose a custom Bluetooth
 *      Low Energy service that an app must connect to and read from
 *      directly, bypassing the OS keyboard layer. This file implements
 *      that path, using react-native-ble-plx. The SERVICE_UUID and
 *      CHARACTERISTIC_UUID below are PLACEHOLDERS -- there is no
 *      industry-standard UUID for this, every vendor picks their own, so
 *      these must be replaced with the values from your scanner's SDK
 *      documentation before this will discover anything.
 *
 * Build requirement: react-native-ble-plx is a native module. It will NOT
 * run inside plain Expo Go -- the app needs `npx expo prebuild` plus a
 * custom dev client (`npx expo run:android` / `run:ios`) or an EAS build.
 * The `react-native-ble-plx` config plugin is already registered in
 * app.json for this.
 */

// TODO: replace with the real service/characteristic UUIDs from your
// scanner's documentation -- these are placeholders and will not match any
// real device.
export const SCANNER_SERVICE_UUID = '0000FFE0-0000-1000-8000-00805F9B34FB';
export const SCANNER_CHARACTERISTIC_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB';

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

type ScanCallback = (code: string) => void;

class BluetoothScannerService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private notifySubscription: Subscription | null = null;
  private scanCallbacks = new Set<ScanCallback>();

  private getManager(): BleManager | null {
    if (!this.manager) {
      try {
        this.manager = new BleManager();
      } catch {
        console.warn('[BluetoothScanner] BleManager native module not available');
        return null;
      }
    }
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
    const manager = this.getManager();
    if (!manager) return State.Unsupported;
    return manager.state();
  }

  /** Scans for nearby BLE peripherals for up to `timeoutMs`, reporting each one found. Stop with stopScan() once the user picks a device. */
  startScan(onDeviceFound: (device: ScannedDevice) => void, timeoutMs = 15000): void {
    const manager = this.getManager();
    if (!manager) return;
    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.warn('[BluetoothScanner] scan error', error);
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

  /** Connects to a device the user picked from startScan's results and subscribes to the scan-data characteristic. */
  async connect(deviceId: string): Promise<void> {
    const manager = this.getManager();
    if (!manager) throw new Error('Bluetooth scanner native module is not available.');
    this.stopScan();

    const device = await manager.connectToDevice(deviceId);
    await device.discoverAllServicesAndCharacteristics();
    this.connectedDevice = device;

    this.notifySubscription = device.monitorCharacteristicForService(
      SCANNER_SERVICE_UUID,
      SCANNER_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          console.warn('[BluetoothScanner] notify error', error);
          return;
        }
        const base64Value = characteristic?.value;
        if (!base64Value) return;
        const code = decodeBase64ToUtf8(base64Value).trim();
        if (!code) return;
        this.scanCallbacks.forEach((cb) => cb(code));
      },
    );
  }

  async disconnect(): Promise<void> {
    this.notifySubscription?.remove();
    this.notifySubscription = null;
    if (this.connectedDevice) {
      await this.manager?.cancelDeviceConnection(this.connectedDevice.id).catch(() => {});
      this.connectedDevice = null;
    }
  }

  isConnected(): boolean {
    return this.connectedDevice != null;
  }

  /** Registers a listener for decoded barcode strings from the connected scanner. Returns an unsubscribe function. */
  onScan(callback: ScanCallback): () => void {
    this.scanCallbacks.add(callback);
    return () => this.scanCallbacks.delete(callback);
  }

  destroy(): void {
    this.disconnect();
    this.manager?.destroy();
    this.manager = null;
  }
}

/** Single shared instance for the app's lifetime -- mirrors the in-memory session pattern already used by services/api.ts. */
export const bluetoothScannerService = new BluetoothScannerService();
