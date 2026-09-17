/**
 * Web Bluetooth direct-connect thermal printer integration.
 * Supports ESC/POS and TSPL thermal printers (e.g. KPC-307, Xprinter, POS-58, POS-80).
 */

const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Bluetooth Printer Service
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common ESC/POS BLE Service
  '0000ff00-0000-1000-8000-00805f9b34fb', // Feasycom / Xprinter / KPC Service
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent Serial Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Alternate Nordic UART
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (NUS)
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000af30-0000-1000-8000-00805f9b34fb',
  '0000ff12-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb',
];

const BT_WRITE_CHUNK_SIZE = 100; // Safe MTU chunk size for BLE thermal printers

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function textToBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }
  return bytes;
}

class WebBluetoothPrinterService {
  private device: any = null;
  private characteristic: any = null;

  isSupported(): boolean {
    return typeof navigator !== 'undefined' && Boolean((navigator as any).bluetooth);
  }

  isConnected(): boolean {
    return Boolean(this.device?.gatt?.connected && this.characteristic);
  }

  connectedDeviceName(): string | null {
    return this.device?.name || this.device?.id || null;
  }

  async requestAndConnect(): Promise<string> {
    if (!this.isSupported()) {
      throw new Error(
        'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on Desktop/Android.'
      );
    }

    const navBt = (navigator as any).bluetooth;
    const device = await navBt.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_PRINTER_SERVICES,
    });

    if (!device) {
      throw new Error('No Bluetooth device was selected.');
    }

    const server = await device.gatt.connect();

    // Discover writable characteristic across known printer services
    let writeChar: any = null;

    const services = await server.getPrimaryServices().catch(() => []);
    for (const s of services) {
      try {
        const characteristics = await s.getCharacteristics();
        for (const c of characteristics) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            writeChar = c;
            break;
          }
        }
        if (writeChar) break;
      } catch {
        // continue search
      }
    }

    if (!writeChar) {
      // Try querying specific known services directly
      for (const serviceUuid of KNOWN_PRINTER_SERVICES) {
        try {
          const s = await server.getPrimaryService(serviceUuid);
          const chars = await s.getCharacteristics();
          for (const c of chars) {
            if (c.properties.write || c.properties.writeWithoutResponse) {
              writeChar = c;
              break;
            }
          }
          if (writeChar) break;
        } catch {
          // continue search
        }
      }
    }

    if (!writeChar) {
      throw new Error(
        `Connected to ${device.name || 'device'}, but could not find a writable Bluetooth print channel. Please ensure printer is in BLE mode.`
      );
    }

    this.device = device;
    this.characteristic = writeChar;

    device.addEventListener('gattserverdisconnected', () => {
      this.device = null;
      this.characteristic = null;
    });

    return device.name || 'Bluetooth Printer';
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      try {
        this.device.gatt.disconnect();
      } catch {
        // best effort
      }
    }
    this.device = null;
    this.characteristic = null;
  }

  private async writeBytes(bytes: Uint8Array): Promise<void> {
    if (!this.isConnected() || !this.characteristic) {
      throw new Error('Bluetooth printer is not connected.');
    }

    for (let i = 0; i < bytes.length; i += BT_WRITE_CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + BT_WRITE_CHUNK_SIZE);
      if (this.characteristic.writeValueWithoutResponse) {
        await this.characteristic.writeValueWithoutResponse(chunk);
      } else {
        await this.characteristic.writeValue(chunk);
      }
      // Small pause to prevent buffer overrun on older thermal printer microcontrollers
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  async printBase64(base64Data: string): Promise<void> {
    await this.writeBytes(base64ToBytes(base64Data));
  }

  async printText(text: string): Promise<void> {
    await this.writeBytes(textToBytes(text));
  }
}

export const webBluetoothPrinterService = new WebBluetoothPrinterService();
