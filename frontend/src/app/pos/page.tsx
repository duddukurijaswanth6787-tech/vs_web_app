'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Search,
  Barcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Printer,
  QrCode,
  CreditCard,
  Banknote,
  Sparkles,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  X,
  History,
  UserCheck,
} from 'lucide-react';
import {
  useScanBarcode,
  useAdoptHandoffSession,
  useCompletePosSale,
  usePreviewReceipt,
  useLookupCustomer,
} from '@/features/pos/pos.hooks';
import {
  PosCartItem,
  PosCustomerInfo,
  PosPaymentMethod,
  CheckoutSessionData,
  PosCustomerLookupResult,
} from '@/features/pos/pos.types';

export default function DesktopPosPage() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customer, setCustomer] = useState<PosCustomerInfo>({
    fullName: 'Walk-in Customer',
    phone: '9999999999',
  });
  const [discountTotal, setDiscountTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('UPI');
  const [activeSession, setActiveSession] = useState<CheckoutSessionData | null>(null);

  // Modals
  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [handoffPin, setHandoffPin] = useState('');
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Record<string, unknown> | null>(null);

  // Customer Lookup & Order History state
  const [customerLookupResult, setCustomerLookupResult] = useState<PosCustomerLookupResult | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useScanBarcode();
  const adoptMutation = useAdoptHandoffSession();
  const completeSaleMutation = useCompletePosSale();
  const previewReceiptMutation = usePreviewReceipt();
  const lookupCustomerMutation = useLookupCustomer();

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setCustomer((prev) => ({ ...prev, phone: clean }));

    if (clean.length === 10) {
      lookupCustomerMutation.mutate(clean, {
        onSuccess: (data) => {
          if (data && data.found) {
            setCustomer((prev) => ({ ...prev, fullName: data.fullName }));
            setCustomerLookupResult(data);
          } else {
            setCustomerLookupResult(null);
          }
        },
        onError: () => setCustomerLookupResult(null),
      });
    } else {
      setCustomerLookupResult(null);
    }
  };
  // Focus barcode input on initial load
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxTotal = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const grandTotal = Math.max(0, Math.round((subtotal + taxTotal - discountTotal) * 100) / 100);

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    scanMutation.mutate(query, {
      onSuccess: (data) => {
        setCart((prev) => {
          const existingIndex = prev.findIndex(
            (i) => i.variantId === data.variantId || (i.sku && i.sku === data.sku),
          );
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex].quantity += 1;
            return updated;
          }
          return [
            ...prev,
            {
              productId: data.productId,
              productName: data.productName,
              variantId: data.variantId,
              sku: data.sku,
              variantTitle: data.variantTitle,
              unitPrice: data.price,
              quantity: 1,
              primaryImage: data.primaryImage,
              availableStock: data.availableStock,
            },
          ];
        });
        setBarcodeInput('');
        barcodeInputRef.current?.focus();
      },
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdoptHandoff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoffPin.trim()) return;

    adoptMutation.mutate(handoffPin.trim(), {
      onSuccess: (data) => {
        setActiveSession(data);
        if (data.items && data.items.length > 0) {
          setCart(data.items);
        }
        if (data.customer) {
          setCustomer(data.customer);
        }
        if (data.discountTotal) {
          setDiscountTotal(data.discountTotal);
        }
        setHandoffModalOpen(false);
        setHandoffPin('');
      },
    });
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    completeSaleMutation.mutate(
      {
        sessionId: activeSession?.sessionId,
        items: cart,
        paymentMethod,
        amountPaid: grandTotal,
        customer,
        discountTotal,
        taxTotal,
        terminalId: 'COUNTER_1',
      },
      {
        onSuccess: (res) => {
          setCompletedOrder(res.order);
          // Preview Receipt HTML
          previewReceiptMutation.mutate(
            {
              orderNumber: res.order.orderNumber,
              grandTotal: res.order.grandTotal,
              items: cart,
              customer,
              paymentMethod,
              discountTotal,
              taxTotal,
            },
            {
              onSuccess: (receiptRes) => {
                setReceiptHtml(receiptRes.html);
                setReceiptModalOpen(true);
              },
            },
          );

          // Reset POS State
          setCart([]);
          setActiveSession(null);
          setDiscountTotal(0);
        },
      },
    );
  };

  const triggerBrowserPrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-100 p-3 sm:p-6 font-sans">
      {/* Top Header & Handoff Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#800020] flex items-center justify-center shadow-2xs overflow-hidden p-1">
            <Image src="/brand/logo-icon.png" alt="Vasanthi's Signature" width={1024} height={1024} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-[#800020] leading-none">
              Shopora Web POS
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Vasanthi&apos;s Signature — Counter 1 Billing
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setHandoffModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Smartphone className="w-4 h-4 text-amber-700 animate-pulse" />
            <span>Receive Mobile Session (Handoff)</span>
          </button>

          {activeSession && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Session #{activeSession.sessionId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Barcode Scanner & Live Item Cart Table (8 Cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Barcode Search Box */}
          <form onSubmit={handleScanSubmit} className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#800020]" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or type SKU (e.g. 890100000005)..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-neutral-900 font-mono font-medium focus:outline-none focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10"
              />
            </div>
            <button
              type="submit"
              disabled={scanMutation.isPending}
              className="bg-[#800020] hover:bg-[#600018] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-2xs disabled:opacity-50"
            >
              {scanMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Add</span>
            </button>
          </form>

          {/* Cart Table Container */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4.5 h-4.5 text-[#800020]" />
                <h2 className="text-sm font-bold text-neutral-900">
                  Cart Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Item List */}
            {cart.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-[#800020] flex items-center justify-center mx-auto">
                  <Barcode className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-neutral-800">Cart is Empty</h3>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Scan a barcode sticker or search a product SKU to start billing for the customer.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-[460px] overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="p-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50/80 transition-colors">
                    {/* Item Image & Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200 shrink-0">
                        {item.primaryImage ? (
                          <Image src={item.primaryImage} alt={item.productName} width={44} height={44} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs font-bold">👗</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 truncate">
                          {item.productName}
                        </h4>
                        <p className="text-[11px] text-neutral-500 font-medium truncate">
                          {item.variantTitle || 'Standard'} {item.sku ? `• ${item.sku}` : ''}
                        </p>
                        <p className="text-[10px] text-rose-800 font-semibold">
                          ₹{item.unitPrice} / unit
                        </p>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1.5 bg-neutral-100 rounded-lg p-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="w-6 h-6 rounded-md bg-white text-neutral-700 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="w-6 h-6 rounded-md bg-white text-neutral-700 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Total Price & Delete */}
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-neutral-900">
                        ₹{item.unitPrice * item.quantity}
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-[10px] text-neutral-400 hover:text-rose-600 transition-colors mt-0.5"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Customer, Payment & Order Checkout Summary (4-5 Cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          
          {/* Customer Selection */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Customer Details</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                customerLookupResult?.found
                  ? 'text-emerald-800 bg-emerald-100 border border-emerald-200'
                  : 'text-neutral-600 bg-neutral-100'
              }`}>
                {customerLookupResult?.found ? 'Registered Customer' : 'Walk-in / New'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={customer.phone || ''}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Mobile Number (10 digits)"
                  maxLength={10}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#800020] font-mono"
                />
                {lookupCustomerMutation.isPending && (
                  <span className="absolute right-3 top-2.5 text-[10px] text-neutral-400 animate-pulse">
                    Checking…
                  </span>
                )}
              </div>

              <input
                type="text"
                value={customer.fullName || ''}
                onChange={(e) => setCustomer((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Customer Name"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[#800020]"
              />

              {customerLookupResult?.found && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{customerLookupResult.fullName}</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                      {customerLookupResult.ordersCount} Past Orders • Total: ₹{customerLookupResult.totalSpent}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryModalOpen(true)}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <History className="w-3 h-3" />
                    <span>History</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Select Payment Method</span>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('SPLIT')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'SPLIT'
                    ? 'bg-[#800020] text-white border-[#800020] shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>Split / Credit</span>
              </button>
            </div>
          </div>

          {/* Pricing Totals & Complete Sale Button */}
          <div className="bg-white p-4.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between items-center text-neutral-600">
                <span>Discount (₹)</span>
                <input
                  type="number"
                  value={discountTotal}
                  onChange={(e) => setDiscountTotal(Number(e.target.value) || 0)}
                  className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-right text-xs font-bold focus:outline-none focus:border-[#800020]"
                />
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>GST Tax (5%)</span>
                <span className="font-semibold text-neutral-900">₹{taxTotal}</span>
              </div>
              <div className="border-t border-neutral-100 pt-2 flex justify-between items-center text-base font-bold text-[#800020]">
                <span>Total Payable</span>
                <span className="text-lg">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0 || completeSaleMutation.isPending}
              className="w-full bg-[#800020] hover:bg-[#600018] text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {completeSaleMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>Complete Sale & Print Invoice</span>
            </button>
          </div>

        </div>

      </div>

      {/* MODAL 1: RECEIVE MOBILE SESSION HANDOFF */}
      {handoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-[#800020] font-bold text-sm">
                <Smartphone className="w-5 h-5" />
                <span>Receive Mobile Handoff</span>
              </div>
              <button onClick={() => setHandoffModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Enter the 6-digit session PIN shown on the cashier&apos;s phone (e.g. <b>582-194</b>) to transfer the cart to desktop.
            </p>

            <form onSubmit={handleAdoptHandoff} className="space-y-3">
              <input
                type="text"
                value={handoffPin}
                onChange={(e) => setHandoffPin(e.target.value)}
                placeholder="582-194"
                maxLength={7}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-neutral-900 focus:outline-none focus:border-[#800020]"
                autoFocus
              />

              <button
                type="submit"
                disabled={adoptMutation.isPending}
                className="w-full bg-[#800020] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#600018] transition-colors"
              >
                {adoptMutation.isPending ? 'Adopting...' : 'Load Cart on Desktop'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INVOICE RECEIPT PRINT PREVIEW */}
      {receiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sale Completed! #{completedOrder?.orderNumber as string}</span>
              </div>
              <button onClick={() => setReceiptModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Receipt Preview Container */}
            <div className="flex-1 overflow-y-auto bg-neutral-100 p-4 rounded-xl border border-neutral-200">
              <iframe
                srcDoc={receiptHtml}
                title="Receipt Preview"
                className="w-full h-80 bg-white shadow-xs border-0 rounded-lg"
              />
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={triggerBrowserPrint}
                className="flex-1 bg-[#800020] hover:bg-[#600018] text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Thermal Invoice</span>
              </button>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CUSTOMER ORDER HISTORY */}
      {historyModalOpen && customerLookupResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-[#800020] font-bold text-sm">
                <History className="w-5 h-5" />
                <span>Customer Order History ({customerLookupResult.fullName})</span>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[11px] text-neutral-500 font-medium">Total Lifetime Orders</span>
                <p className="text-lg font-bold text-neutral-900">{customerLookupResult.ordersCount} Orders</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="text-[11px] text-neutral-500 font-medium">Lifetime Spend</span>
                <p className="text-lg font-bold text-emerald-700">₹{customerLookupResult.totalSpent}</p>
              </div>
            </div>

            {/* List of past orders */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {customerLookupResult.recentOrders?.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs font-medium">
                  No past orders found for this customer.
                </div>
              ) : (
                customerLookupResult.recentOrders?.map((ord) => (
                  <div key={ord.orderId} className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-900">
                      <span className="text-[#800020]">{ord.orderNumber}</span>
                      <span>₹{ord.grandTotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>{new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{`${ord.paymentMethod} • ${ord.status}`}</span>
                    </div>
                    {/* Items list */}
                    <div className="border-t border-neutral-200/60 pt-2 space-y-1">
                      {ord.items?.map((it, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-neutral-700">
                          <span className="truncate max-w-[260px]">{it.productName} x {it.quantity}</span>
                          <span className="font-semibold">₹{it.unitPrice * it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setHistoryModalOpen(false)}
              className="w-full bg-neutral-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
