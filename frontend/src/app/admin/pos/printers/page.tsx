'use client';

import React, { useState } from 'react';
import { Printer, CheckCircle2, QrCode, Sparkles, Sliders, ShieldCheck } from 'lucide-react';
import { usePreviewReceipt, useBatchStickers } from '@/features/pos/pos.hooks';

export default function PrintersConfigPage() {
  const [printMode, setPrintMode] = useState<'BROWSER' | 'ESCPOS'>('BROWSER');
  const [paperWidth, setPaperWidth] = useState<'80MM' | '58MM'>('80MM');
  const [testSuccessMessage, setTestSuccessMessage] = useState('');

  const previewReceiptMutation = usePreviewReceipt();
  const batchStickersMutation = useBatchStickers();

  const handleTestPrintReceipt = () => {
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
        onSuccess: (res) => {
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
      },
    );
  };

  const handleTestPrintLabel = () => {
    batchStickersMutation.mutate(
      {
        productName: "Women's Designer Kurti",
        variantTitle: 'Blue / L / Cotton',
        sku: 'KUR-BLU-L-005',
        barcode: '890100000005',
        price: 699,
        quantity: 2,
        storeName: 'VASANTHI DESIGNERS',
      },
      {
        onSuccess: (res) => {
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
          setTestSuccessMessage('Test barcode sticker labels (2 copies) sent to printer!');
        },
      },
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-100 p-3 sm:p-6 font-sans">
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#800020] text-amber-300 flex items-center justify-center font-bold text-lg shadow-2xs">
            🖨️
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-[#800020] leading-none">
              Thermal Printers & Barcode Label Setup
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              ESC/POS Hardware Daemon & Browser Print Integration
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
              ✕
            </button>
          </div>
        )}

        {/* Printer Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => setPrintMode('BROWSER')}
            className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              printMode === 'BROWSER'
                ? 'border-[#800020] ring-2 ring-[#800020]/10 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Mode 1 (Standard)</span>
              {printMode === 'BROWSER' && <CheckCircle2 className="w-5 h-5 text-[#800020]" />}
            </div>
            <h3 className="text-sm font-bold text-neutral-900 mb-1">Universal Browser Print</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Uses system browser dialogs (`window.print()`). Compatible with all standard USB, Bluetooth, and Wireless printers.
            </p>
          </div>

          <div
            onClick={() => setPrintMode('ESCPOS')}
            className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all ${
              printMode === 'ESCPOS'
                ? 'border-[#800020] ring-2 ring-[#800020]/10 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Mode 2 (Direct Hardware)</span>
              {printMode === 'ESCPOS' && <CheckCircle2 className="w-5 h-5 text-[#800020]" />}
            </div>
            <h3 className="text-sm font-bold text-neutral-900 mb-1">ESC/POS Direct Hardware Daemon</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Sends raw binary ESC/POS commands directly to thermal printers with instant paper cut & cash drawer kick.
            </p>
          </div>
        </div>

        {/* Paper Size Configuration */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Paper Width Configuration
          </h2>

          <div className="flex gap-4">
            <button
              onClick={() => setPaperWidth('80MM')}
              className={`px-5 py-3 rounded-xl border text-xs font-bold transition-all ${
                paperWidth === '80MM'
                  ? 'bg-[#800020] text-white border-[#800020]'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200'
              }`}
            >
              80mm Standard Thermal Paper
            </button>
            <button
              onClick={() => setPaperWidth('58MM')}
              className={`px-5 py-3 rounded-xl border text-xs font-bold transition-all ${
                paperWidth === '58MM'
                  ? 'bg-[#800020] text-white border-[#800020]'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200'
              }`}
            >
              58mm Compact Thermal Paper
            </button>
          </div>
        </div>

        {/* Test Print Buttons */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Hardware Diagnostics & Test Print
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleTestPrintReceipt}
              disabled={previewReceiptMutation.isPending}
              className="flex-1 bg-[#800020] hover:bg-[#600018] text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>Test Print Thermal Invoice Receipt</span>
            </button>

            <button
              onClick={handleTestPrintLabel}
              disabled={batchStickersMutation.isPending}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
            >
              <QrCode className="w-4 h-4" />
              <span>Test Print 50x25mm Barcode Stickers</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
