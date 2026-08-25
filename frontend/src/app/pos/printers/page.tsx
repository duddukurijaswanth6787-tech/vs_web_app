'use client';

import React, { useEffect, useState } from 'react';
import { Printer, CheckCircle2, QrCode, Usb, AlertTriangle, X } from 'lucide-react';
import { usePreviewReceipt, useBatchStickers } from '@/features/pos/pos.hooks';
import { LabelSize, LABEL_SIZE_OPTIONS } from '@/features/pos/pos.types';
import { webUsbPrinterService } from '@/features/pos/webusb-printer';
import { getApiErrorMessage } from '@/utils/api-error';

export default function PrintersConfigPage() {
  const [printMode, setPrintMode] = useState<'BROWSER' | 'ESCPOS'>('BROWSER');
  const [testLabelSize, setTestLabelSize] = useState<LabelSize>('SMALL');
  const [testSuccessMessage, setTestSuccessMessage] = useState('');

  const [usbSupported, setUsbSupported] = useState(true);
  const [usbConnected, setUsbConnected] = useState(false);
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [usbConnecting, setUsbConnecting] = useState(false);
  const [usbError, setUsbError] = useState('');
  const [testPrintError, setTestPrintError] = useState('');

  const previewReceiptMutation = usePreviewReceipt();
  const batchStickersMutation = useBatchStickers();

  useEffect(() => {
    setUsbSupported(webUsbPrinterService.isSupported());
    webUsbPrinterService.reconnectPrevious().then((reconnected) => {
      if (reconnected) {
        setUsbConnected(true);
        setUsbDeviceName(webUsbPrinterService.connectedDeviceName());
        setPrintMode('ESCPOS');
      }
    });
  }, []);

  const handleConnectUsb = async () => {
    setUsbError('');
    setUsbConnecting(true);
    try {
      await webUsbPrinterService.requestAndConnect();
      setUsbConnected(true);
      setUsbDeviceName(webUsbPrinterService.connectedDeviceName());
      setPrintMode('ESCPOS');
    } catch (err) {
      setUsbError(getApiErrorMessage(err, 'Could not connect to a USB printer.'));
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

  const handleTestPrintReceipt = () => {
    setTestPrintError('');
    previewReceiptMutation.mutate(
      {
        orderNumber: 'TEST-ORD-2026-001',
        grandTotal: 2937,
        items: [
          { productId: 'test-1', productName: "Women's Designer Kurti", variantTitle: 'Blue / L', quantity: 2, unitPrice: 699 },
          { productId: 'test-2', productName: 'Floral Dress', variantTitle: 'Red / Free Size', quantity: 1, unitPrice: 1499 },
        ],
        customer: { fullName: 'Walk-in Customer', phone: '9999999999' },
        paymentMethod: 'UPI',
        discountTotal: 100,
        taxTotal: 140,
      },
      {
        onSuccess: async (res) => {
          if (printMode === 'ESCPOS' && usbConnected) {
            try {
              await webUsbPrinterService.printBase64(res.escposBase64);
              setTestSuccessMessage('Test receipt sent directly to the USB printer!');
            } catch (err) {
              setUsbError(getApiErrorMessage(err, 'USB print failed.'));
            }
            return;
          }
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(res.html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 250);
          }
          setTestSuccessMessage('Test thermal receipt sent to browser print engine!');
        },
        onError: (err) => {
          setTestPrintError(getApiErrorMessage(err, 'Could not generate the test receipt.'));
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
        quantity: 2,
        storeName: 'VASANTHI DESIGNERS',
        labelSize: testLabelSize,
      },
      {
        onSuccess: async (res) => {
          if (printMode === 'ESCPOS' && usbConnected) {
            try {
              await webUsbPrinterService.printText(res.tspl);
              setTestSuccessMessage('Test barcode sticker labels sent directly to the USB printer!');
            } catch (err) {
              setUsbError(getApiErrorMessage(err, 'USB print failed.'));
            }
            return;
          }
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(res.html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
              printWindow.close();
            }, 250);
          }
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
          <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-amber-300 flex items-center justify-center font-bold text-lg shadow-2xs">
            🖨️
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-[#0284c7] leading-none">
              Thermal Printers & Barcode Label Setup
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              USB Direct-Connect & Browser Print Integration
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
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

        {/* Printer Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setPrintMode('BROWSER')}
            className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              printMode === 'BROWSER'
                ? 'border-[#0284c7] ring-2 ring-[#0284c7]/10 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Mode 1 (Standard)</span>
              {printMode === 'BROWSER' && <CheckCircle2 className="w-5 h-5 text-[#0284c7]" />}
            </div>
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Universal Browser Print</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Uses system browser dialogs (`window.print()`). Compatible with all standard USB, Bluetooth, and Wireless printers.
            </p>
          </div>

          <div
            className={`bg-white p-5 rounded-2xl border-2 transition-all ${
              !usbSupported
                ? 'border-neutral-200 opacity-60'
                : printMode === 'ESCPOS'
                  ? 'border-[#0284c7] ring-2 ring-[#0284c7]/10 shadow-sm cursor-pointer'
                  : 'border-neutral-200 hover:border-neutral-300 cursor-pointer'
            }`}
            onClick={() => usbSupported && usbConnected && setPrintMode('ESCPOS')}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Mode 2 (Direct Hardware)</span>
              {printMode === 'ESCPOS' && usbConnected && <CheckCircle2 className="w-5 h-5 text-[#0284c7]" />}
            </div>
            <h3 className="text-sm font-bold text-neutral-900 mb-1">USB Direct-Connect (WebUSB)</h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-3">
              Streams raw ESC/POS receipt and TSPL label bytes straight to a printer plugged in by USB-C -- no
              browser print dialog. Chrome/Edge/Opera desktop only, and only works if the printer exposes a raw
              USB interface rather than registering itself as a standard system printer (some do, some don&apos;t --
              there&apos;s no way to know without trying).
            </p>

            {!usbSupported ? (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>This browser doesn&apos;t support WebUSB. Use Chrome, Edge, or Opera.</span>
              </div>
            ) : usbConnected ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <Usb className="w-4 h-4" />
                  <span>Connected: {usbDeviceName || 'USB printer'}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDisconnectUsb();
                  }}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900"
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
                className="w-full bg-neutral-900 hover:bg-black text-white py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
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

        {/* Test Print Buttons */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Hardware Diagnostics & Test Print
          </h2>

          <button
            onClick={handleTestPrintReceipt}
            disabled={previewReceiptMutation.isPending}
            className="w-full bg-[#0284c7] hover:bg-[#0B3B78] text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
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
