'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Barcode,
  Search,
  Plus,
  Printer,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useScanBarcode, useBatchStickers } from '@/features/pos/pos.hooks';
import { ScanBarcodeResult, LabelSize, LABEL_SIZE_OPTIONS } from '@/features/pos/pos.types';
import { useStockIn } from '@/features/inventory/inventory.hooks';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';
import { webUsbPrinterService } from '@/features/pos/webusb-printer';

export default function AddStockPage() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<ScanBarcodeResult | null>(null);

  // Stock Form State
  const [quantityReceived, setQuantityReceived] = useState(1);
  const [location, setLocation] = useState('Main Store');
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [printLabels, setPrintLabels] = useState(true);
  const [labelSize, setLabelSize] = useState<LabelSize>('SMALL');

  // Sticker Preview Modal
  const [stickerHtml, setStickerHtml] = useState('');
  const [stickerTspl, setStickerTspl] = useState('');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [labelPrinting, setLabelPrinting] = useState(false);

  // USB direct-connect printer -- see /pos/printers for the connect UI.
  const [usbPrinterConnected, setUsbPrinterConnected] = useState(false);
  useEffect(() => {
    webUsbPrinterService.reconnectPrevious().then((reconnected) => {
      if (reconnected) setUsbPrinterConnected(true);
    });
  }, []);

  const scanMutation = useScanBarcode();
  const batchStickersMutation = useBatchStickers();
  const stockInMutation = useStockIn();
  const { toast } = useToast();

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    scanMutation.mutate(query, {
      onSuccess: (data) => {
        setSelectedVariant(data);
        if (data.costPrice) {
          // costPrice available from scan result
        }
      },
      onError: (err) => {
        toast('error', 'Could not find variant', getApiErrorMessage(err, `No product found for "${query}".`));
      },
    });
  };

  const handleSaveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant?.variantId || quantityReceived <= 0) return;

    const remarks = [
      location && `Location: ${location}`,
      invoiceNumber.trim() && `Invoice: ${invoiceNumber.trim()}`,
      notes.trim(),
    ]
      .filter(Boolean)
      .join(' • ');

    // 1. Persist the stock increase first — everything below (labels) is
    //    secondary and must not run if this fails.
    stockInMutation.mutate(
      {
        variantId: selectedVariant.variantId,
        quantity: quantityReceived,
        reason: supplier.trim() ? `Stock-in from ${supplier.trim()}` : 'Web POS stock replenishment',
        remarks: remarks || undefined,
      },
      {
        onSuccess: (updated) => {
          toast(
            'success',
            'Stock updated',
            `Added +${quantityReceived} pcs to ${selectedVariant.productName} (now ${updated.availableQuantity} pcs available).`,
          );

          // 2. Generate batch stickers only after the stock is actually saved.
          if (printLabels && selectedVariant.barcode) {
            batchStickersMutation.mutate(
              {
                productName: selectedVariant.productName,
                variantTitle: selectedVariant.variantTitle,
                sku: selectedVariant.sku || 'SKU-CODE',
                barcode: selectedVariant.barcode,
                price: selectedVariant.price,
                quantity: quantityReceived,
                storeName: 'VASANTHI DESIGNERS',
                labelSize,
              },
              {
                onSuccess: (res) => {
                  setStickerHtml(res.html);
                  setStickerTspl(res.tspl);
                  setPreviewModalOpen(true);
                },
                onError: (err) => {
                  // Stock is already saved at this point -- only label
                  // generation failed, so warn and clear the form instead of
                  // leaving the cashier staring at a form that looks stuck.
                  toast(
                    'error',
                    'Stock saved, but labels failed',
                    getApiErrorMessage(err, 'Could not generate barcode labels for this batch.'),
                  );
                  setSelectedVariant(null);
                  setBarcodeInput('');
                },
              },
            );
          } else {
            // No labels requested — clear the form so the next scan can start.
            setSelectedVariant(null);
            setBarcodeInput('');
          }
        },
        onError: (err) => {
          toast('error', 'Could not update stock', getApiErrorMessage(err, 'Stock was not saved.'));
        },
      },
    );
  };

  const triggerLabelPrint = async () => {
    if (usbPrinterConnected && stickerTspl) {
      setLabelPrinting(true);
      try {
        await webUsbPrinterService.printText(stickerTspl);
      } catch (err) {
        toast('error', 'USB print failed', getApiErrorMessage(err, 'Falling back to browser print.'));
        printViaBrowser();
      } finally {
        setLabelPrinting(false);
      }
      return;
    }
    printViaBrowser();
  };

  const printViaBrowser = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(stickerHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const closeLabelModal = () => {
    setPreviewModalOpen(false);
    setSelectedVariant(null);
    setBarcodeInput('');
    setStickerHtml('');
    setStickerTspl('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-100 p-3 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0284c7] text-amber-300 flex items-center justify-center font-bold text-lg shadow-2xs">
            📦
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-[#0284c7] leading-none">
              + Add Stock & Print Barcode Labels
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Inventory Replenishment & Sticker Label Generation
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Search/Scan Product Variant (5 Cols) */}
        <div className="md:col-span-5 space-y-4">
          <form onSubmit={handleScanSubmit} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
              1. Scan or Search Variant
            </label>
            <div className="relative">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0284c7]" />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or type SKU (e.g. 890100000005)..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-11 pr-4 py-2.5 text-xs text-neutral-900 font-mono font-medium focus:outline-none focus:border-[#0284c7]"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={scanMutation.isPending}
              className="w-full bg-[#0284c7] hover:bg-[#0B3B78] text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              {scanMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Find Variant</span>
            </button>
          </form>

          {/* Selected Variant Information Card */}
          {selectedVariant && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4 animate-in fade-in">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                  {selectedVariant.primaryImage ? (
                    <Image src={selectedVariant.primaryImage} alt={selectedVariant.productName} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg">👗</div>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Target Variant
                  </span>
                  <h3 className="text-sm font-bold text-neutral-900 truncate mt-1">
                    {selectedVariant.productName}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium truncate">
                    {selectedVariant.variantTitle || 'Standard'} • SKU: {selectedVariant.sku}
                  </p>
                  <p className="text-xs font-bold text-rose-800 mt-1">
                    Selling Price: ₹{selectedVariant.price}
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-3 grid grid-cols-2 gap-3 text-center">
                <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Current Stock</span>
                  <span className="text-sm font-bold text-neutral-900">{selectedVariant.availableStock} PCS</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">New Stock After</span>
                  <span className="text-sm font-bold text-emerald-900">
                    {selectedVariant.availableStock + Number(quantityReceived || 0)} PCS
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Stock Quantity & Label Batch Configuration (7 Cols) */}
        <div className="md:col-span-7 space-y-4">
          <form onSubmit={handleSaveStock} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-500">
              2. Stock Replenishment Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Quantity Received (Pieces) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantityReceived}
                  onChange={(e) => setQuantityReceived(Number(e.target.value) || 0)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#0284c7]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Stock Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#0284c7]"
                >
                  <option value="Main Store">Main Store (Banjara Hills)</option>
                  <option value="Hyderabad Warehouse">Hyderabad Central Warehouse</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Purchase Invoice Ref
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Batch Remarks / Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#0284c7] resize-none"
              />
            </div>

            {/* Checkbox: Print Sticker Labels */}
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-amber-800" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Print Barcode Sticker Labels</span>
                    <span className="text-[11px] text-amber-800">
                      Generate {quantityReceived} stickers for received pieces.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={printLabels}
                  onChange={(e) => setPrintLabels(e.target.checked)}
                  className="w-4 h-4 accent-[#0284c7] rounded"
                />
              </div>

              {printLabels && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {LABEL_SIZE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLabelSize(opt.value)}
                      className={`text-left p-2.5 rounded-lg border transition-all ${
                        labelSize === opt.value
                          ? 'bg-[#0284c7] border-[#0284c7] text-white'
                          : 'bg-white border-amber-200 text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{opt.title}</div>
                      <div className={`text-[10px] ${labelSize === opt.value ? 'text-rose-100' : 'text-amber-700'}`}>
                        {opt.dimensions}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {printLabels && (
                <p className="text-[10px] text-amber-700">
                  {LABEL_SIZE_OPTIONS.find((o) => o.value === labelSize)?.description}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedVariant || stockInMutation.isPending || batchStickersMutation.isPending}
              className="w-full bg-[#0284c7] hover:bg-[#0B3B78] text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {stockInMutation.isPending || batchStickersMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>
                {stockInMutation.isPending
                  ? 'Saving stock…'
                  : batchStickersMutation.isPending
                    ? 'Generating labels…'
                    : `Save Stock (+${quantityReceived} Pcs)${printLabels ? ' & Generate Labels' : ''}`}
              </span>
            </button>
          </form>
        </div>

      </div>

      {/* MODAL: BATCH STICKER LABELS PRINT PREVIEW */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Labels Ready ({quantityReceived} Stickers)</span>
              </div>
              <button onClick={closeLabelModal} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600">
              Preview of {LABEL_SIZE_OPTIONS.find((o) => o.value === labelSize)?.dimensions} barcode stickers ready to print for <b>{selectedVariant?.productName}</b>.
            </p>

            <div className="flex-1 overflow-y-auto bg-neutral-100 p-4 rounded-xl border border-neutral-200">
              <iframe
                srcDoc={stickerHtml}
                title="Sticker Labels Preview"
                className="w-full h-80 bg-white shadow-xs border-0 rounded-lg"
              />
            </div>

            {usbPrinterConnected && stickerTspl && (
              <p className="text-[11px] font-bold text-emerald-700">
                USB printer connected -- will print directly, no dialog.
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={triggerLabelPrint}
                disabled={labelPrinting}
                className="flex-1 bg-[#0284c7] hover:bg-[#0B3B78] text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{labelPrinting ? 'Printing…' : `Print All ${quantityReceived} Sticker Labels`}</span>
              </button>
              <button
                onClick={closeLabelModal}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
