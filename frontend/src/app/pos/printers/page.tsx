'use client';

import React, { useEffect, useState } from 'react';
import { Printer, CheckCircle2, QrCode, Usb, Bluetooth, AlertTriangle, X } from 'lucide-react';
import { usePreviewReceipt, useBatchStickers } from '@/features/pos/pos.hooks';
import { LabelSize, LABEL_SIZE_OPTIONS } from '@/features/pos/pos.types';
import { webUsbPrinterService } from '@/features/pos/webusb-printer';
import { webBluetoothPrinterService } from '@/features/pos/webbluetooth-printer';
import { getApiErrorMessage } from '@/utils/api-error';

export default function PrintersConfigPage() {
  const [printMode, setPrintMode] = useState<'BROWSER' | 'ESCPOS' | 'BLUETOOTH'>('BROWSER');
  const [testLabelSize, setTestLabelSize] = useState<LabelSize>('SMALL');
  const [testSuccessMessage, setTestSuccessMessage] = useState('');

  const [usbSupported, setUsbSupported] = useState(true);
  const [usbConnected, setUsbConnected] = useState(false);
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [usbConnecting, setUsbConnecting] = useState(false);
  const [usbError, setUsbError] = useState('');

  const [btSupported, setBtSupported] = useState(true);
  const [btConnected, setBtConnected] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);
  const [btConnecting, setBtConnecting] = useState(false);
  const [btError, setBtError] = useState('');

  const [testPrintError, setTestPrintError] = useState('');

  const previewReceiptMutation = usePreviewReceipt();
  const batchStickersMutation = useBatchStickers();

  useEffect(() => {
    setUsbSupported(webUsbPrinterService.isSupported());
    setBtSupported(webBluetoothPrinterService.isSupported());
    webUsbPrinterService.reconnectPrevious().then((reconnected) => {
      if (reconnected) {
        setUsbConnected(true);
        setUsbDeviceName(webUsbPrinterService.connectedDeviceName());
        setPrintMode('ESCPOS');
      }
    });
  }, []);

  const handleConnectBt = async () => {
    setBtError('');
    setBtConnecting(true);
    try {
      const name = await webBluetoothPrinterService.requestAndConnect();
      setBtConnected(true);
      setBtDeviceName(name);
      setPrintMode('BLUETOOTH');
      setTestSuccessMessage(`Connected to Bluetooth printer "${name}"!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBtError(msg || 'Could not connect to Bluetooth printer.');
    } finally {
      setBtConnecting(false);
    }
  };

  const handleDisconnectBt = async () => {
    await webBluetoothPrinterService.disconnect();
    setBtConnected(false);
    setBtDeviceName(null);
    setPrintMode('BROWSER');
  };

  const handleConnectUsb = async () => {
    setUsbError('');
    setUsbConnecting(true);
    try {
      await webUsbPrinterService.requestAndConnect();
      setUsbConnected(true);
      setUsbDeviceName(webUsbPrinterService.connectedDeviceName());
      setPrintMode('ESCPOS');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Access denied') || msg.includes('SecurityError') || msg.includes('open')) {
        setUsbError('Windows has registered this printer with the system driver (usbprint.sys), which locks direct WebUSB. Simply click Mode 1 (Universal Browser Print) on the left to print to your KPC307 directly!');
      } else {
        setUsbError(getApiErrorMessage(err, 'Could not connect to a USB printer.'));
      }
    } finally {
      setUsbConnecting(false);
    }
  };

  const handleDisconnectUsb = async () => {
    await webUsbPrinterService.disconnect();
    setUsbConnected(false);
    setUsbDeviceName(null);
    setPrintMode('BROWSER');
  };

  const triggerBrowserPrint = (htmlContent: string) => {
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
      setTestSuccessMessage('Test thermal receipt opened in browser print engine!');
    } else {
      // Fallback if popups are blocked: use invisible iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.write(htmlContent);
        doc.close();
        iframe.contentWindow?.focus();
        setTimeout(() => {
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
        }, 500);
        setTestSuccessMessage('Test thermal receipt sent to browser print dialog!');
      }
    }
  };

  const getFallbackReceiptHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Test Thermal Receipt - Vasanthi Designers</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 8px 4px;
            font-size: 12px;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .border-top { border-top: 1px dashed #000; margin: 6px 0; }
          .border-bottom { border-bottom: 1px dashed #000; margin: 6px 0; }
          .flex-between { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 11px; }
          th, td { padding: 2px 0; }
        </style>
      </head>
      <body>
        <div class="text-center font-bold" style="font-size: 15px;">VASANTHI DESIGNERS</div>
        <div class="text-center" style="font-size: 10px;">Boutique & Fashion Studio</div>
        <div class="text-center" style="font-size: 10px;">Ph: +91 9999999999</div>
        <div class="border-top"></div>
        <div class="flex-between" style="font-size: 10px;">
          <span>INV: TEST-ORD-001</span>
          <span>${new Date().toLocaleDateString('en-IN')}</span>
        </div>
        <div class="flex-between" style="font-size: 10px;">
          <span>Cashier: POS Terminal</span>
          <span>${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="border-top"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="text-align:left;">Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Price</th>
              <th style="text-align:right;">Amt</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Designer Kurti<br/><span style="font-size:9px;color:#555;">Blue / L</span></td>
              <td style="text-align:center;">2</td>
              <td style="text-align:right;">699.00</td>
              <td style="text-align:right;">1398.00</td>
            </tr>
            <tr>
              <td>Floral Dress<br/><span style="font-size:9px;color:#555;">Red / Free</span></td>
              <td style="text-align:center;">1</td>
              <td style="text-align:right;">1499.00</td>
              <td style="text-align:right;">1499.00</td>
            </tr>
          </tbody>
        </table>
        <div class="border-top"></div>
        <div class="flex-between font-bold"><span>Subtotal:</span><span>₹2897.00</span></div>
        <div class="flex-between" style="font-size:10px;"><span>Discount:</span><span>-₹100.00</span></div>
        <div class="flex-between" style="font-size:10px;"><span>GST (5%):</span><span>₹140.00</span></div>
        <div class="border-bottom"></div>
        <div class="flex-between font-bold" style="font-size: 14px;"><span>GRAND TOTAL:</span><span>₹2937.00</span></div>
        <div class="border-top"></div>
        <div class="text-center font-bold" style="margin-top: 6px;">*** TEST RECEIPT SUCCESSFUL ***</div>
        <div class="text-center" style="font-size: 10px; margin-top: 4px;">Thank you for shopping with us!</div>
      </body>
    </html>
  `;

  const handleTestPrintReceipt = () => {
    setTestPrintError('');
    previewReceiptMutation.mutate(
      {
        orderNumber: 'TEST-ORD-2026-001',
        grandTotal: 2937,
        items: [
          { productId: '00000000-0000-0000-0000-000000000001', productName: "Women's Designer Kurti", variantTitle: 'Blue / L', quantity: 2, unitPrice: 699 },
          { productId: '00000000-0000-0000-0000-000000000002', productName: 'Floral Dress', variantTitle: 'Red / Free Size', quantity: 1, unitPrice: 1499 },
        ],
        customer: { fullName: 'Walk-in Customer', phone: '9999999999' },
        paymentMethod: 'UPI',
        discountTotal: 100,
        taxTotal: 140,
      },
      {
        onSuccess: async (res) => {
          if (printMode === 'BLUETOOTH' && btConnected) {
            try {
              await webBluetoothPrinterService.printBase64(res.escposBase64);
              setTestSuccessMessage('Test receipt sent directly via Bluetooth to KPC printer!');
            } catch (err) {
              setBtError(getApiErrorMessage(err, 'Bluetooth print failed.'));
            }
            return;
          }
          if (printMode === 'ESCPOS' && usbConnected) {
            try {
              await webUsbPrinterService.printBase64(res.escposBase64);
              setTestSuccessMessage('Test receipt sent directly to the USB printer!');
            } catch (err) {
              setUsbError(getApiErrorMessage(err, 'USB print failed.'));
            }
            return;
          }
          triggerBrowserPrint(res.html || getFallbackReceiptHtml());
        },
        onError: () => {
          // Guaranteed instant fallback to client-side receipt print
          triggerBrowserPrint(getFallbackReceiptHtml());
        },
      },
    );
  };

  const handleTestPrintLabel = () => {
    setTestPrintError('');
    batchStickersMutation.mutate(
      {
        productName: "Women's Designer Kurti",
        variantTitle: 'Blue / L / Cotton',
        sku: 'KUR-BLU-L-005',
        barcode: '890100000005',
        price: 699,
        mrp: 999,
        hsnCode: '6204',
        quantity: 2,
        storeName: 'VASANTHI DESIGNERS',
        labelSize: testLabelSize,
      },
      {
        onSuccess: async (res) => {
          if (printMode === 'BLUETOOTH' && btConnected) {
            try {
              await webBluetoothPrinterService.printText(res.tspl);
              setTestSuccessMessage('Test barcode sticker labels sent directly via Bluetooth to KPC printer!');
            } catch (err) {
              setBtError(getApiErrorMessage(err, 'Bluetooth print failed.'));
            }
            return;
          }
          if (printMode === 'ESCPOS' && usbConnected) {
            try {
              await webUsbPrinterService.printText(res.tspl);
              setTestSuccessMessage('Test barcode sticker labels sent directly to the USB printer!');
            } catch (err) {
              setUsbError(getApiErrorMessage(err, 'USB print failed.'));
            }
            return;
          }
          triggerBrowserPrint(res.html);
          setTestSuccessMessage(
            `Test ${LABEL_SIZE_OPTIONS.find((o) => o.value === testLabelSize)?.title.toLowerCase()} barcode sticker labels (2 copies) sent to printer!`,
          );
        },
        onError: (err) => {
          setTestPrintError(getApiErrorMessage(err, 'Could not generate the test labels.'));
        },
      },
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-100 p-3 sm:p-6 font-sans">
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] text-amber-300 flex items-center justify-center font-bold text-lg shadow-2xs">
            🖨️
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-[var(--brand-primary)] leading-none">
              Thermal Printers & Barcode Label Setup
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Bluetooth Wireless, USB Direct-Connect & Universal Browser Print Integration
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {testSuccessMessage && (
          <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{testSuccessMessage}</span>
            </div>
            <button onClick={() => setTestSuccessMessage('')} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Printer Mode Cards (3-column grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode 1: Universal Browser Print */}
          <div
            onClick={() => setPrintMode('BROWSER')}
            className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
              printMode === 'BROWSER'
                ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/10 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Mode 1 (Standard)</span>
                {printMode === 'BROWSER' && <CheckCircle2 className="w-5 h-5 text-[var(--brand-primary)]" />}
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1">Universal Browser Print</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Uses system browser dialogs (`window.print()`). Compatible with all USB cables, Windows system drivers, Bluetooth, and Wi-Fi printers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                ✓ Ready for USB & Windows Printers
              </span>
            </div>
          </div>

          {/* Mode 2: Bluetooth Wireless (Web Bluetooth) */}
          <div
            className={`bg-white p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              !btSupported
                ? 'border-neutral-200 opacity-60'
                : printMode === 'BLUETOOTH' && btConnected
                  ? 'border-blue-600 ring-2 ring-blue-600/10 shadow-sm cursor-pointer'
                  : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
            }`}
            onClick={() => btSupported && btConnected && setPrintMode('BLUETOOTH')}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Mode 2 (Wireless)</span>
                {printMode === 'BLUETOOTH' && btConnected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                <Bluetooth className="w-4 h-4 text-blue-600" />
                <span>Bluetooth Direct-Connect</span>
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                Connects wirelessly over Bluetooth without any print dialogs — works directly with KPC, Xprinter, and POS thermal printers.
              </p>
            </div>

            <div>
              {!btSupported ? (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Web Bluetooth is supported on Chrome, Edge, and Opera.</span>
                </div>
              ) : btConnected ? (
                <div className="flex items-center justify-between gap-2 bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800 truncate">
                    <Bluetooth className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{btDeviceName || 'Bluetooth Printer'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisconnectBt();
                    }}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 shrink-0 underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnectBt();
                  }}
                  disabled={btConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-2xs"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>{btConnecting ? 'Searching Bluetooth…' : 'Connect Bluetooth Printer'}</span>
                </button>
              )}

              {btError && (
                <p className="text-[11px] font-medium text-sky-700 mt-2 leading-relaxed">{btError}</p>
              )}
            </div>
          </div>

          {/* Mode 3: USB Direct-Connect (WebUSB) */}
          <div
            className={`bg-white p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              !usbSupported
                ? 'border-neutral-200 opacity-60'
                : printMode === 'ESCPOS' && usbConnected
                  ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/10 shadow-sm cursor-pointer'
                  : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
            }`}
            onClick={() => usbSupported && usbConnected && setPrintMode('ESCPOS')}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Mode 3 (Raw USB)</span>
                {printMode === 'ESCPOS' && usbConnected && <CheckCircle2 className="w-5 h-5 text-[var(--brand-primary)]" />}
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                <Usb className="w-4 h-4 text-neutral-800" />
                <span>USB Direct-Connect (WebUSB)</span>
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed mb-3">
                Direct raw USB bulk transfer for printers without OS driver locks.
              </p>
            </div>

            <div>
              {!usbSupported ? (
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Use Chrome, Edge, or Opera.</span>
                </div>
              ) : usbConnected ? (
                <div className="flex items-center justify-between gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 truncate">
                    <Usb className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{usbDeviceName || 'USB printer'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDisconnectUsb();
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 shrink-0 underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConnectUsb();
                  }}
                  disabled={usbConnecting}
                  className="w-full bg-neutral-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Usb className="w-3.5 h-3.5" />
                  <span>{usbConnecting ? 'Connecting…' : 'Connect USB Printer'}</span>
                </button>
              )}

              {usbError && (
                <p className="text-[11px] font-medium text-sky-700 mt-2 leading-relaxed">{usbError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Test Print Buttons */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Hardware Diagnostics & Test Print
          </h2>

          <button
            onClick={handleTestPrintReceipt}
            disabled={previewReceiptMutation.isPending}
            className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Test Print Thermal Invoice Receipt</span>
          </button>

          <div className="border-t border-neutral-100 pt-4 space-y-3">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Barcode Label Size</span>
            <div className="grid grid-cols-3 gap-2">
              {LABEL_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTestLabelSize(opt.value)}
                  className={`text-left p-2.5 rounded-lg border transition-all ${
                    testLabelSize === opt.value
                      ? 'bg-amber-600 border-amber-600 text-white'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="text-[11px] font-bold">{opt.title}</div>
                  <div className={`text-[10px] ${testLabelSize === opt.value ? 'text-amber-100' : 'text-neutral-500'}`}>
                    {opt.dimensions}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleTestPrintLabel}
              disabled={batchStickersMutation.isPending}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>
                Test Print {LABEL_SIZE_OPTIONS.find((o) => o.value === testLabelSize)?.dimensions} Barcode Stickers
              </span>
            </button>
          </div>

          {testPrintError && (
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{testPrintError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
