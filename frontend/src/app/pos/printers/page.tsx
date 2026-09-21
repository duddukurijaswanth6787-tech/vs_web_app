'use client';

import React, { useEffect, useState } from 'react';
import {
  Printer,
  CheckCircle2,
  QrCode,
  Usb,
  Bluetooth,
  AlertTriangle,
  X,
  Package,
  Receipt,
  Tag,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { usePreviewReceipt, useBatchStickers } from '@/features/pos/pos.hooks';
import { LabelSize, LABEL_SIZE_OPTIONS } from '@/features/pos/pos.types';
import { webUsbPrinterService } from '@/features/pos/webusb-printer';
import { webBluetoothPrinterService } from '@/features/pos/webbluetooth-printer';
import { getApiErrorMessage } from '@/utils/api-error';

export default function PrintersConfigPage() {
  const [printMode, setPrintMode] = useState<'BROWSER' | 'ESCPOS' | 'BLUETOOTH'>('BROWSER');
  const [activeTestTab, setActiveTestTab] = useState<'RECEIPT' | 'SHIPPING' | 'BARCODE_3X2' | 'LOGO_3X2'>('RECEIPT');
  const [receiptWidth, setReceiptWidth] = useState<80 | 58>(80);
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
        setUsbError('Windows has registered this printer with the system driver (usbprint.sys), which locks direct WebUSB. Click Mode 1 (Universal Browser Print) to print to your printer directly!');
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

  const triggerBrowserPrint = (htmlContent: string, title = 'Thermal Print Document') => {
    const printWindow = window.open('', '_blank', 'width=550,height=750');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 350);
      setTestSuccessMessage(`${title} opened in system print dialog!`);
    } else {
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
        setTestSuccessMessage(`${title} sent to browser print dialog!`);
      }
    }
  };

  // 1. 80mm & 58mm POS Thermal Receipt HTML
  const getReceiptHtml = (is80mm: boolean) => {
    const rollWidth = is80mm ? '80mm' : '58mm';
    const contentWidth = is80mm ? '72mm' : '48mm';
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>POS Thermal Receipt - Vasanthi's Signature</title>
        <style>
          @page { size: ${rollWidth} auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: ${contentWidth};
            margin: 0 auto;
            padding: 8px 4px;
            font-size: ${is80mm ? '12px' : '10px'};
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .border-top { border-top: 1px dashed #000; margin: 6px 0; }
          .border-bottom { border-bottom: 1px dashed #000; margin: 6px 0; }
          .flex-between { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: ${is80mm ? '11px' : '9.5px'}; }
          th, td { padding: 2px 0; }
        </style>
      </head>
      <body>
        <div class="text-center font-bold" style="font-size: ${is80mm ? '16px' : '13px'};">VASANTHI'S SIGNATURE</div>
        <div class="text-center" style="font-size: ${is80mm ? '10px' : '8.5px'};">Women's Ethnic Wear & Designer Couture</div>
        <div class="text-center" style="font-size: ${is80mm ? '10px' : '8.5px'};">Plot 42, Jubilee Hills Rd No 36, Hyderabad - 500033</div>
        <div class="text-center" style="font-size: ${is80mm ? '10px' : '8.5px'};">GSTIN: 36AABCU9603R1ZM | Ph: +91 98765 43210</div>
        <div class="border-top"></div>
        <div class="flex-between" style="font-size: ${is80mm ? '10px' : '8.5px'};">
          <span>Invoice: ORD-POS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0001</span>
        </div>
        <div class="flex-between" style="font-size: ${is80mm ? '10px' : '8.5px'};">
          <span>Date: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>Counter: 01</span>
        </div>
        <div class="flex-between" style="font-size: ${is80mm ? '10px' : '8.5px'};">
          <span>Customer: Sravani Varma (9848012345)</span>
        </div>
        <div class="border-top"></div>
        <table>
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="text-align:left;">Item</th>
              <th style="text-align:center;">Qty</th>
              <th style="text-align:right;">Rate</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Banarasi Silk Saree</td>
              <td style="text-align:center;">1</td>
              <td style="text-align:right;">5,499</td>
              <td style="text-align:right;">5,499.00</td>
            </tr>
            <tr>
              <td>Designer Anarkali Set (M)</td>
              <td style="text-align:center;">1</td>
              <td style="text-align:right;">3,299</td>
              <td style="text-align:right;">3,299.00</td>
            </tr>
            <tr>
              <td>Silk Dupatta - Gold</td>
              <td style="text-align:center;">1</td>
              <td style="text-align:right;">999</td>
              <td style="text-align:right;">999.00</td>
            </tr>
          </tbody>
        </table>
        <div class="border-top"></div>
        <div class="flex-between"><span>Subtotal:</span><span>Rs.9,797.00</span></div>
        <div class="flex-between"><span>Discount:</span><span>-Rs.500.00</span></div>
        <div class="flex-between"><span>GST (5% CGST+SGST):</span><span>Rs.442.71</span></div>
        <div class="border-bottom"></div>
        <div class="flex-between font-bold" style="font-size: ${is80mm ? '14px' : '12px'};"><span>GRAND TOTAL:</span><span>Rs.9,739.71</span></div>
        <div class="flex-between" style="font-size: ${is80mm ? '10px' : '8.5px'};"><span>Payment Mode:</span><span>UPI / PhonePe</span></div>
        <div class="border-top"></div>
        <div class="text-center font-bold" style="margin-top: 6px;">*** THANK YOU FOR SHOPPING WITH US! ***</div>
        <div class="text-center" style="font-size: ${is80mm ? '10px' : '8.5px'}; margin-top: 2px;">Visit again : vasanthissignature.in</div>
      </body>
    </html>
    `;
  };

  // 2. 4×6" (100×150mm) Courier Shipping Label HTML
  const getShippingLabelHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>4x6 Shipping Label - Delhivery</title>
        <style>
          @page { size: 100mm 150mm; margin: 0; }
          body {
            font-family: Arial, sans-serif;
            width: 96mm;
            height: 144mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            box-sizing: border-box;
            color: #000;
            font-size: 11px;
          }
          .box { border: 2px solid #000; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding: 6px 8px; }
          .courier-title { font-size: 16px; font-weight: 900; }
          .badge-prepaid { background: #000; color: #fff; font-weight: bold; font-size: 12px; padding: 3px 8px; border-radius: 4px; }
          .barcode-section { text-align: center; border-bottom: 2px solid #000; padding: 8px 4px; }
          .barcode-img { height: 44px; width: 80%; object-fit: contain; }
          .waybill-txt { font-family: monospace; font-size: 14px; font-weight: bold; letter-spacing: 2px; margin-top: 2px; }
          .routing-row { display: flex; border-bottom: 2px solid #000; font-size: 10px; }
          .routing-cell { flex: 1; padding: 4px 6px; border-right: 1px solid #000; }
          .routing-cell:last-child { border-right: none; }
          .address-section { padding: 6px 8px; border-bottom: 1.5px solid #000; flex: 1; }
          .addr-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #444; }
          .addr-name { font-size: 13px; font-weight: bold; margin: 2px 0; }
          .seller-section { padding: 6px 8px; font-size: 9.5px; border-bottom: 1.5px solid #000; background: #fafafa; }
          .footer-section { padding: 4px 8px; font-size: 9px; display: flex; justify-content: space-between; align-items: center; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="header">
            <div>
              <div class="courier-title">DELHIVERY SURFACE</div>
              <div style="font-size: 9px; font-weight: bold;">STANDARD EXPRESS</div>
            </div>
            <div class="badge-prepaid">PREPAID</div>
          </div>
          <div class="barcode-section">
            <svg id="barcode" style="width: 85%; height: 42px;"></svg>
            <div class="waybill-txt">DEL749281034</div>
          </div>
          <div class="routing-row">
            <div class="routing-cell"><b>HUB:</b> BLR/IND/560038</div>
            <div class="routing-cell"><b>WT:</b> 650g</div>
            <div class="routing-cell"><b>PCS:</b> 1/1</div>
          </div>
          <div class="address-section">
            <div class="addr-title">Deliver To (Consignee):</div>
            <div class="addr-name">Priya Sharma</div>
            <div style="font-size: 11px; line-height: 1.3;">
              Flat 402, Green Palms, 12th Main Road,<br/>
              Indiranagar, Bengaluru, Karnataka<br/>
              <b>PIN: 560038</b> | Ph: +91 98451 23098
            </div>
          </div>
          <div class="seller-section">
            <div class="addr-title">Shipped By (Seller / Return):</div>
            <div style="font-weight: bold; font-size: 11px;">VASANTHI CREATIONS PVT LTD</div>
            <div>2-1-156/3 Ashoknagar main road, Manuguru, TS - 507117</div>
            <div>Ph: +91 7659034198 | GSTIN: 36AABCU9603R1ZM | Ref: ORD-ONL-2026-0012</div>
          </div>
          <div class="footer-section">
            <div>Item: Emerald Silk Lehenga Set (M)</div>
            <div>Ordered on: ${new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          if (window.JsBarcode) {
            JsBarcode("#barcode", "DEL749281034", { format: "CODE128", width: 2, height: 40, displayValue: false });
          }
        </script>
      </body>
    </html>
  `;

  // 3. 3×2" (75×50mm) Barcode Price Tag HTML
  const getBarcodeTagHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>3x2 Barcode Price Tag</title>
        <style>
          @page { size: 75mm 50mm; margin: 0; }
          body {
            font-family: Arial, sans-serif;
            width: 72mm;
            height: 46mm;
            margin: 0 auto;
            padding: 2mm;
            box-sizing: border-box;
            text-align: center;
            color: #000;
          }
          .tag-box { border: 1.5px solid #000; border-radius: 4px; padding: 4px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
          .brand { font-size: 12px; font-weight: 900; letter-spacing: 1px; }
          .prod-name { font-size: 11px; font-weight: bold; margin: 1px 0; }
          .variant { font-size: 9px; color: #333; }
          .barcode-area { margin: 2px 0; }
          .price-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #000; padding-top: 2px; }
          .mrp { font-size: 9.5px; text-decoration: line-through; color: #555; }
          .offer { font-size: 13px; font-weight: 900; }
        </style>
      </head>
      <body>
        <div class="tag-box">
          <div>
            <div class="brand">VASANTHI'S SIGNATURE</div>
            <div class="prod-name">Banarasi Silk Saree</div>
            <div class="variant">Royal Pink &amp; Gold | Free Size | HSN: 5208</div>
          </div>
          <div class="barcode-area">
            <svg id="barcode" style="width: 80%; height: 30px;"></svg>
            <div style="font-family: monospace; font-size: 9px; font-weight: bold; letter-spacing: 1px;">890123456789</div>
          </div>
          <div class="price-row">
            <div class="mrp">MRP: Rs.7,999</div>
            <div class="offer">OFFER: Rs.5,499</div>
          </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          if (window.JsBarcode) {
            JsBarcode("#barcode", "890123456789", { format: "CODE128", width: 1.8, height: 28, displayValue: false });
          }
        </script>
      </body>
    </html>
  `;

  // 4. 3×2" (75×50mm) Brand Logo Sticker HTML
  const getBrandLogoHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>3x2 Brand Logo Sticker</title>
        <style>
          @page { size: 75mm 50mm; margin: 0; }
          body {
            font-family: 'Times New Roman', serif;
            width: 72mm;
            height: 46mm;
            margin: 0 auto;
            padding: 3mm;
            box-sizing: border-box;
            text-align: center;
            color: #000;
          }
          .sticker-box { border: 2px solid #000; border-radius: 6px; padding: 6px 4px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; justify-content: center; align-items: center; }
          .logo-symbol { font-size: 24px; font-weight: bold; margin-bottom: 2px; }
          .brand-main { font-size: 15px; font-weight: 900; letter-spacing: 1.5px; }
          .tagline { font-family: Arial, sans-serif; font-size: 8.5px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px; font-weight: 600; color: #222; }
          .footer-url { font-family: Arial, sans-serif; font-size: 7.5px; margin-top: 6px; border-top: 1px solid #000; padding-top: 3px; width: 85%; }
        </style>
      </head>
      <body>
        <div class="sticker-box">
          <div class="logo-symbol">❖</div>
          <div class="brand-main">VASANTHI'S SIGNATURE</div>
          <div class="tagline">Women's Ethnic Wear &amp; Designer Boutique</div>
          <div class="footer-url">Hyderabad • vasanthissignature.in</div>
        </div>
      </body>
    </html>
  `;

  const handlePrint = (type: 'RECEIPT_80' | 'RECEIPT_58' | 'SHIPPING_4X6' | 'TAG_3X2' | 'LOGO_3X2') => {
    if (type === 'RECEIPT_80') {
      triggerBrowserPrint(getReceiptHtml(true), '80mm Thermal POS Receipt');
    } else if (type === 'RECEIPT_58') {
      triggerBrowserPrint(getReceiptHtml(false), '58mm Compact POS Receipt');
    } else if (type === 'SHIPPING_4X6') {
      triggerBrowserPrint(getShippingLabelHtml(), '4x6" Delhivery Shipping Label');
    } else if (type === 'TAG_3X2') {
      triggerBrowserPrint(getBarcodeTagHtml(), '3x2" Barcode Price Tag');
    } else if (type === 'LOGO_3X2') {
      triggerBrowserPrint(getBrandLogoHtml(), '3x2" Brand Logo Sticker');
    }
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
              Supports 80mm/58mm POS Receipts, 4×6" Shipping Labels, and 3×2" Barcode & Brand Stickers
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
              <h3 className="text-sm font-bold text-neutral-900 mb-1">Universal System Print</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Uses Windows/macOS print dialog. Compatible with all connected USB cables, Windows system drivers, Bluetooth, and Wi-Fi printers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-100">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                ✓ Active for USB & Windows Printers
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
                Connects wirelessly over Web Bluetooth without print dialogs — works directly with KPC, Xprinter, and POS thermal printers.
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

        {/* Multi-Format Hardware Diagnostics & Test Lab */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <span>🔬 Physical Printer Diagnostic & Test Lab</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Select your printer format below and test one-click physical printing from your laptop/system.
              </p>
            </div>
          </div>

          {/* Test Tabs */}
          <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 overflow-x-auto">
            <button
              onClick={() => setActiveTestTab('RECEIPT')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTestTab === 'RECEIPT'
                  ? 'border-[var(--brand-primary)] text-[var(--brand-primary)] bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>1. POS Thermal Receipt (80mm / 58mm)</span>
            </button>

            <button
              onClick={() => setActiveTestTab('SHIPPING')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTestTab === 'SHIPPING'
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>2. 4×6" Shipping Label (Delhivery)</span>
            </button>

            <button
              onClick={() => setActiveTestTab('BARCODE_3X2')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTestTab === 'BARCODE_3X2'
                  ? 'border-sky-600 text-sky-700 bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>3. 3×2" Barcode Price Tag</span>
            </button>

            <button
              onClick={() => setActiveTestTab('LOGO_3X2')}
              className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeTestTab === 'LOGO_3X2'
                  ? 'border-purple-600 text-purple-700 bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>4. 3×2" Brand Logo Sticker</span>
            </button>
          </div>

          {/* Tab 1: POS Thermal Receipt */}
          {activeTestTab === 'RECEIPT' && (
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">In-Store Thermal Billing Receipt</h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Formatted for POS thermal roll machines (e.g. KPC307, Epson, Rongta, NGX).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReceiptWidth(80)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      receiptWidth === 80
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-emerald-900 border-emerald-300'
                    }`}
                  >
                    80mm (Standard 3")
                  </button>
                  <button
                    onClick={() => setReceiptWidth(58)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      receiptWidth === 58
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-emerald-900 border-emerald-300'
                    }`}
                  >
                    58mm (Handheld 2")
                  </button>
                </div>
              </div>

              {/* Receipt Preview Card */}
              <div className="max-w-md mx-auto bg-neutral-50 p-6 rounded-2xl border border-neutral-300 shadow-inner font-mono text-xs">
                <div className="text-center font-bold text-sm">VASANTHI'S SIGNATURE</div>
                <div className="text-center text-[10px] text-neutral-600">Women's Ethnic Wear & Designer Couture</div>
                <div className="text-center text-[10px] text-neutral-600">Plot 42, Jubilee Hills Rd No 36, Hyderabad</div>
                <div className="border-t border-dashed border-neutral-400 my-2"></div>
                <div className="flex justify-between text-[10px]">
                  <span>Invoice: ORD-POS-2026-0001</span>
                  <span>{new Date().toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Cashier: POS Counter 01</span>
                  <span>Payment: UPI</span>
                </div>
                <div className="border-t border-dashed border-neutral-400 my-2"></div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>1x Banarasi Silk Saree</span>
                    <span className="font-bold">Rs.5,499.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Designer Anarkali Set (M)</span>
                    <span className="font-bold">Rs.3,299.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Silk Dupatta - Gold</span>
                    <span className="font-bold">Rs.999.00</span>
                  </div>
                </div>
                <div className="border-t border-dashed border-neutral-400 my-2"></div>
                <div className="flex justify-between font-bold text-sm">
                  <span>GRAND TOTAL</span>
                  <span>Rs.9,739.71</span>
                </div>
                <div className="border-t border-dashed border-neutral-400 my-2"></div>
                <div className="text-center font-bold text-[10px] mt-2">*** THANK YOU FOR SHOPPING! ***</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handlePrint(receiptWidth === 80 ? 'RECEIPT_80' : 'RECEIPT_58')}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print {receiptWidth}mm POS Receipt Test</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: 4x6 Shipping Label */}
          {activeTestTab === 'SHIPPING' && (
            <div className="p-6 space-y-6">
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <h3 className="text-sm font-bold text-indigo-950">4×6" Courier Shipping Label (100×150 mm)</h3>
                <p className="text-xs text-indigo-800 mt-0.5">
                  Formatted for 4×6" desktop & Bluetooth thermal label printers (e.g. ITPP130B, Zebra, Munbyn, TSC).
                </p>
              </div>

              {/* 4x6 Label Preview */}
              <div className="max-w-sm mx-auto bg-white p-4 rounded-xl border-2 border-neutral-900 shadow-sm font-sans text-xs space-y-3">
                <div className="flex justify-between items-center border-b-2 border-neutral-900 pb-2">
                  <div className="font-black text-sm">DELHIVERY SURFACE</div>
                  <div className="bg-black text-white px-2 py-0.5 font-bold text-[10px] rounded">PREPAID</div>
                </div>
                <div className="text-center py-2 border-b-2 border-neutral-900">
                  <div className="font-mono text-sm tracking-widest font-black">||||| | |||| |||| ||| |||||</div>
                  <div className="font-mono font-bold text-xs mt-1">DEL749281034</div>
                </div>
                <div className="border-b border-neutral-900 pb-2 text-[11px]">
                  <div className="text-[10px] text-neutral-500 font-bold uppercase">Deliver To:</div>
                  <div className="font-bold text-xs">Priya Sharma</div>
                  <div>Flat 402, Green Palms, Indiranagar, Bengaluru</div>
                  <div className="font-black">PIN: 560038 | Ph: +91 98451 23098</div>
                </div>
                <div className="text-[10px] text-neutral-600">
                  <span className="font-bold">Shipped By:</span> Vasanthi's Signature, Jubilee Hills, Hyderabad
                </div>
              </div>

              <button
                onClick={() => handlePrint('SHIPPING_4X6')}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print 4×6" Delhivery Shipping Label Test</span>
              </button>
            </div>
          )}

          {/* Tab 3: 3x2 Barcode Price Tag */}
          {activeTestTab === 'BARCODE_3X2' && (
            <div className="p-6 space-y-6">
              <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
                <h3 className="text-sm font-bold text-sky-950">3×2" Barcode Price Tag (75×50 mm)</h3>
                <p className="text-xs text-sky-800 mt-0.5">
                  Standard garment price tag with Code128 barcode, variant details, MRP and Offer Price.
                </p>
              </div>

              {/* 3x2 Barcode Tag Preview */}
              <div className="max-w-xs mx-auto bg-white p-4 rounded-xl border-2 border-neutral-900 shadow-sm font-sans text-xs text-center space-y-2">
                <div className="font-black text-xs tracking-wider">VASANTHI'S SIGNATURE</div>
                <div className="font-bold text-[11px]">Banarasi Silk Saree</div>
                <div className="text-[9.5px] text-neutral-600">Royal Pink &amp; Gold | Free Size</div>
                <div className="py-1">
                  <div className="font-mono text-xs font-bold tracking-widest">|||| | |||| || |||||</div>
                  <div className="font-mono text-[9px] font-bold">890123456789</div>
                </div>
                <div className="flex justify-between items-center border-t border-neutral-900 pt-1 text-xs">
                  <span className="line-through text-neutral-500 text-[10px]">MRP: Rs.7,999</span>
                  <span className="font-black text-xs text-emerald-800">OFFER: Rs.5,499</span>
                </div>
              </div>

              <button
                onClick={() => handlePrint('TAG_3X2')}
                className="w-full bg-sky-700 hover:bg-sky-800 text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print 3×2" Barcode Price Tag Test</span>
              </button>
            </div>
          )}

          {/* Tab 4: 3x2 Brand Logo Sticker */}
          {activeTestTab === 'LOGO_3X2' && (
            <div className="p-6 space-y-6">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <h3 className="text-sm font-bold text-purple-950">3×2" Brand Logo Sticker (75×50 mm)</h3>
                <p className="text-xs text-purple-800 mt-0.5">
                  High-contrast brand sticker for packaging, boutique boxes, and garment tags.
                </p>
              </div>

              {/* 3x2 Brand Logo Preview */}
              <div className="max-w-xs mx-auto bg-white p-6 rounded-xl border-2 border-neutral-900 shadow-sm font-serif text-center space-y-1">
                <div className="text-2xl font-bold">❖</div>
                <div className="font-black text-sm tracking-wider">VASANTHI'S SIGNATURE</div>
                <div className="font-sans text-[8.5px] tracking-widest uppercase font-semibold text-neutral-600">
                  Women's Ethnic Wear &amp; Designer Boutique
                </div>
                <div className="border-t border-neutral-900 mt-3 pt-1 font-sans text-[8px] text-neutral-500">
                  Hyderabad • vasanthissignature.in
                </div>
              </div>

              <button
                onClick={() => handlePrint('LOGO_3X2')}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print 3×2" Brand Logo Sticker Test</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

