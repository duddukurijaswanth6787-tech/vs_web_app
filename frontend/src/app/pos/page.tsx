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
  Smartphone,
  CheckCircle2,
  RefreshCw,
  X,
  History,
  UserCheck,
  Wifi,
  WifiOff,
  CloudUpload,
  AlertTriangle,
  Clock,
  Usb,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import {
  useScanBarcode,
  useAdoptHandoffSession,
  useCompletePosSale,
  usePreviewReceipt,
  useLookupCustomer,
  useCurrentShift,
  useOpenShift,
  useSearchPosProducts,
  useCreateCheckoutSession,
  useHeldSessions,
  useDiscardHeldSession,
  useReprintReceipt,
  useValidateCoupon,
  useLookupGiftCard,
  useLoyaltyBalance,
  usePosProductsByCategory,
} from '@/features/pos/pos.hooks';
import { useCategories } from '@/features/catalog/categories/category.hooks';
import {
  PosCartItem,
  PosCustomerInfo,
  PosPaymentMethod,
  CheckoutSessionData,
  PosCustomerLookupResult,
} from '@/features/pos/pos.types';
import { useOfflineSync, isNetworkFailure } from '@/features/pos/offline/useOfflineSync';
import { offlineScanCacheDb, normalizeScanCacheKey } from '@/features/pos/offline/offlineDb';
import { generateOfflineReceiptHtml } from '@/features/pos/offline/offlineReceipt';
import { PendingSale } from '@/features/pos/offline/offline.types';
import { computeCartTotals } from '@/features/pos/pos-totals';
import { getApiErrorMessage } from '@/utils/api-error';
import { webUsbPrinterService } from '@/features/pos/webusb-printer';
import { useTerminalId } from '@/features/pos/terminal';

export default function DesktopPosPage() {
  const [barcodeInput, setBarcodeInput] = useState('');
  // Typed name/SKU lookup, so an item whose barcode sticker has peeled off can
  // still be sold. A pure-digit value is a scanned barcode, not a name.
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [customer, setCustomer] = useState<PosCustomerInfo>({
    fullName: 'Walk-in Customer',
    phone: '9999999999',
  });
  const [discountTotal, setDiscountTotal] = useState(0);
  // Coupon at the till: the code the cashier typed, the discount the server
  // returned when it was validated, and any error message from that check.
  // Wholesale toggle: when on, scan and search fill in wholesalePrice.
  // Existing cart lines keep their price -- switching mid-cart doesn't
  // silently re-price something the customer already agreed to.
  const [wholesaleMode, setWholesaleMode] = useState(false);
  const [quickBuyOpen, setQuickBuyOpen] = useState(false);
  const [quickBuyCategoryId, setQuickBuyCategoryId] = useState<string>('');
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  // Gift cards attached to this sale. Each is an entered code + the amount
  // the cashier told us to redeem off it. Server caps at live balance.
  const [giftCardInput, setGiftCardInput] = useState('');
  const [giftCardAmountInput, setGiftCardAmountInput] = useState('');
  const [giftCards, setGiftCards] = useState<{ code: string; amount: number; balance: number }[]>([]);
  const [giftCardError, setGiftCardError] = useState('');
  // Loyalty at POS. Requires the customer to be identified by phone lookup
  // first; without that, there's no account to draw points from.
  const [loyaltyPointsInput, setLoyaltyPointsInput] = useState('');
  const [loyaltyApplied, setLoyaltyApplied] = useState<{ points: number; rupees: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethod>('UPI');
  // Split bills: what the customer handed over on each tender. Kept as strings
  // so the boxes can be left blank rather than showing a stubborn 0.
  const [splitTenders, setSplitTenders] = useState<Record<'CASH' | 'UPI' | 'CARD', string>>({
    CASH: '',
    UPI: '',
    CARD: '',
  });
  const [activeSession, setActiveSession] = useState<CheckoutSessionData | null>(null);

  // Modals
  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [reprintModalOpen, setReprintModalOpen] = useState(false);
  const [reprintInput, setReprintInput] = useState('');
  const [handoffPin, setHandoffPin] = useState('');
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptHtml, setReceiptHtml] = useState('');
  const [receiptEscposBase64, setReceiptEscposBase64] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Record<string, unknown> | null>(null);

  // USB direct-connect printer -- see /pos/printers for the connect UI.
  // Re-attaches to a printer authorized in an earlier visit (no new
  // permission prompt needed) so this page doesn't require a detour
  // through Printer Settings every time it loads.
  const [usbPrinterConnected, setUsbPrinterConnected] = useState(false);
  useEffect(() => {
    webUsbPrinterService.reconnectPrevious().then((reconnected) => {
      if (reconnected) setUsbPrinterConnected(true);
    });
  }, []);

  // Customer Lookup & Order History state
  const [customerLookupResult, setCustomerLookupResult] = useState<PosCustomerLookupResult | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Offline queue state
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState<PendingSale | null>(null);
  const [scanOfflineError, setScanOfflineError] = useState('');
  const [saleError, setSaleError] = useState('');
  const [stockCapNotice, setStockCapNotice] = useState('');
  const [cashTendered, setCashTendered] = useState('');

  // Shift state -- a sale can only be completed while online with a shift
  // open on this terminal, so cash reconciliation isn't left to chance.
  // Offline sales are exempt (there's no way to check shift state without
  // the backend, and blocking emergency offline billing defeats the point
  // of the offline queue).
  const [openingCashInput, setOpeningCashInput] = useState('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const scanMutation = useScanBarcode(wholesaleMode);
  const adoptMutation = useAdoptHandoffSession();
  const holdMutation = useCreateCheckoutSession();
  const reprintMutation = useReprintReceipt();
  const validateCouponMutation = useValidateCoupon();
  const lookupGiftCardMutation = useLookupGiftCard();
  const loyaltyBalanceQuery = useLoyaltyBalance(customerLookupResult?.customerProfileId);
  const categoriesQuery = useCategories({ limit: 100 });
  const quickBuyQuery = usePosProductsByCategory(quickBuyCategoryId, wholesaleMode);
  const discardHeldMutation = useDiscardHeldSession();
  const completeSaleMutation = useCompletePosSale();
  const previewReceiptMutation = usePreviewReceipt();
  const lookupCustomerMutation = useLookupCustomer();
  // This browser is its own register, so its shift and its sales are keyed to
  // an id stored on the device. It resolves after mount (localStorage cannot
  // be read while rendering on the server), and the shift lookup waits for it
  // rather than reporting on the wrong register.
  const { terminalId: TERMINAL_ID, isResolved: terminalResolved } = useTerminalId();
  // Only this till's parked bills: another counter's held cart is not this
  // cashier's to resume.
  const heldSessions = useHeldSessions(TERMINAL_ID, terminalResolved);
  const offlineSync = useOfflineSync(TERMINAL_ID);
  const { data: currentShift, isLoading: shiftLoading } = useCurrentShift(
    TERMINAL_ID,
    terminalResolved,
  );
  const openShiftMutation = useOpenShift();
  const shiftRequired =
    terminalResolved &&
    offlineSync.isBackendReachable &&
    !shiftLoading &&
    !currentShift;

  const handleOpenShift = () => {
    const amount = parseFloat(openingCashInput);
    if (isNaN(amount) || amount < 0) return;
    openShiftMutation.mutate(
      { terminalId: TERMINAL_ID, openingCash: amount },
      { onSuccess: () => setOpeningCashInput('') },
    );
  };

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

  // GST at each product's own rate, charged after the discount. This used to
  // be a flat 5% applied before the discount was taken off, which
  // under-collected on 12% goods and overcharged tax on every discounted bill.
  // Order-level discount = the manual discount + whatever the coupon added.
  // The server recomputes both anyway; this is purely for the customer-facing
  // number on the till screen.
  const effectiveDiscount = discountTotal + (couponApplied?.discountAmount || 0);
  const giftCardTotal = giftCards.reduce((s, c) => s + c.amount, 0);
  const { subtotal, taxTotal, grandTotal } = computeCartTotals(cart, effectiveDiscount);

  const splitEntries = (['CASH', 'UPI', 'CARD'] as const)
    .map((method) => ({ method, amount: Number(splitTenders[method]) || 0 }))
    .filter((t) => t.amount > 0);
  const splitTendered = Math.round(splitEntries.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
  const splitShortfall = Math.round(Math.max(0, grandTotal - splitTendered) * 100) / 100;
  const splitExcess = Math.round(Math.max(0, splitTendered - grandTotal) * 100) / 100;
  const splitCash = Number(splitTenders.CASH) || 0;
  // Change only ever comes out of the cash drawer -- the server enforces the
  // same rule, this just stops the cashier finding out after the fact.
  const splitChangeBlocked = splitExcess > splitCash + 0.005;

  useEffect(() => {
    const typed = barcodeInput.trim();
    const looksLikeBarcode = /^\d+$/.test(typed);
    if (typed.length < 2 || looksLikeBarcode) {
      setSearchTerm('');
      return;
    }
    const timer = setTimeout(() => setSearchTerm(typed), 250);
    return () => clearTimeout(timer);
  }, [barcodeInput]);

  const productSearch = useSearchPosProducts(searchTerm, wholesaleMode);
  const suggestions = searchTerm ? (productSearch.data ?? []) : [];

  const addScannedItemToCart = (data: {
    productId: string;
    productName: string;
    variantId?: string;
    sku?: string;
    variantTitle?: string;
    price: number;
    primaryImage?: string;
    availableStock: number;
    taxPercent?: number;
    mrp?: number;
    hsnCode?: string;
  }) => {
    setStockCapNotice('');
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.variantId === data.variantId || (i.sku && i.sku === data.sku),
      );
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const existingStock = existing.availableStock ?? 0;
        if (existingStock > 0 && existing.quantity + 1 > existingStock) {
          setStockCapNotice(`Only ${existingStock} in stock for ${existing.productName}.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
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
          // Carried from the scan so the line is taxed at its own rate.
          taxPercent: data.taxPercent,
          mrp: data.mrp,
          hsnCode: data.hsnCode,
        },
      ];
    });
    setBarcodeInput('');
    setSearchTerm('');
    barcodeInputRef.current?.focus();
  };

  const handleScanSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;
    setScanOfflineError('');
    const cacheKey = normalizeScanCacheKey(query);

    scanMutation.mutate(query, {
      onSuccess: (data) => {
        addScannedItemToCart(data);
        offlineScanCacheDb.cacheScanResult({
          key: cacheKey,
          productId: data.productId,
          productName: data.productName,
          variantId: data.variantId,
          sku: data.sku,
          barcode: data.barcode,
          variantTitle: data.variantTitle,
          price: data.price,
          availableStock: data.availableStock,
          primaryImage: data.primaryImage,
          cachedAt: new Date().toISOString(),
        });
      },
      onError: async (err) => {
        if (!isNetworkFailure(err)) {
          setScanOfflineError(getApiErrorMessage(err, `Could not find a product for "${query}".`));
          return;
        }
        const cached = await offlineScanCacheDb.getCachedScanResult(cacheKey);
        if (cached) {
          addScannedItemToCart(cached);
        } else {
          setScanOfflineError(
            `Offline -- "${query}" was never scanned before on this register, so it isn't in the offline cache.`,
          );
        }
      },
    });
  };

  // A per-line discount, for haggling over one garment rather than the whole
  // bill. Capped at the line value so a discount can never make a line
  // negative, and the server recomputes tax on what is left after it.
  const setLineDiscount = (index: number, value: string) => {
    setStockCapNotice('');
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const lineValue = item.unitPrice * item.quantity;
        const requested = Math.max(0, Number(value) || 0);
        return { ...item, discountAmount: Math.min(requested, lineValue) };
      }),
    );
  };

  const updateQuantity = (index: number, delta: number) => {
    setStockCapNotice('');
    setCart((prev) => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const itemStock = item.availableStock ?? 0;
      if (delta > 0 && itemStock > 0 && newQty > itemStock) {
        setStockCapNotice(`Only ${itemStock} in stock for ${item.productName}.`);
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...item, quantity: newQty };
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

  // Reprint the tax invoice for a past sale into the same modal a fresh sale
  // uses; stamped "DUPLICATE COPY" so the counter can\'t reissue an original.
  // Coupon flow: validate → show discount → include in completeSale payload.
  // The server re-validates and books usage against the created order, so a
  // stale UI value cannot cause an unearned discount.
  const handleApplyCoupon = () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError('');
    validateCouponMutation.mutate(
      {
        code,
        items: cart.map((c) => ({
          productId: c.productId,
          productName: c.productName,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          discountAmount: c.discountAmount,
        })),
        discountTotal,
      },
      {
        onSuccess: (data) => {
          setCouponApplied({ code: data.code, discountAmount: data.discountAmount });
          setCouponInput('');
        },
        onError: (err) => {
          setCouponApplied(null);
          setCouponError(getApiErrorMessage(err, 'Coupon could not be applied.'));
        },
      },
    );
  };

  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponError('');
    setCouponInput('');
  };

  // Look up a gift card, cap the requested redeem at its live balance, and
  // stash it as an additional tender. Server re-caps at complete time in
  // case another till spent the balance in between.
  const handleApplyLoyalty = () => {
    const asked = Math.floor(Number(loyaltyPointsInput) || 0);
    if (asked <= 0) return;
    const bal = loyaltyBalanceQuery.data;
    if (!bal) return;
    const capByBalance = Math.min(asked, bal.pointsBalance);
    // Also cap at what the bill can absorb (in points), so the user gets
    // immediate feedback rather than a server-side capping.
    const remainingRupees = grandTotal;
    const capByBill = Math.floor(remainingRupees / (bal.pointValueRupees || 1));
    const points = Math.max(0, Math.min(capByBalance, capByBill));
    const rupees = Math.round(points * (bal.pointValueRupees || 1) * 100) / 100;
    if (points > 0) {
      setLoyaltyApplied({ points, rupees });
      setLoyaltyPointsInput('');
    }
  };

  const handleRemoveLoyalty = () => {
    setLoyaltyApplied(null);
    setLoyaltyPointsInput('');
  };

  const handleAddGiftCard = () => {
    const code = giftCardInput.trim();
    if (!code) return;
    setGiftCardError('');
    lookupGiftCardMutation.mutate(code, {
      onSuccess: (data) => {
        if (data.status !== 'ACTIVE') {
          setGiftCardError(`Card is ${data.status}, cannot redeem.`);
          return;
        }
        if (data.balance <= 0) {
          setGiftCardError('That card has no remaining balance.');
          return;
        }
        const asked = Number(giftCardAmountInput) || data.balance;
        const amount = Math.min(asked, data.balance);
        setGiftCards((prev) => {
          if (prev.some((c) => c.code === data.code)) return prev;
          return [...prev, { code: data.code, amount, balance: data.balance }];
        });
        setGiftCardInput('');
        setGiftCardAmountInput('');
      },
      onError: (err) => {
        setGiftCardError(getApiErrorMessage(err, 'Gift card not found.'));
      },
    });
  };

  const handleRemoveGiftCard = (code: string) => {
    setGiftCards((prev) => prev.filter((c) => c.code !== code));
  };

  const handleReprintReceipt = (orderNumber: string) => {
    setSaleError('');
    reprintMutation.mutate(orderNumber, {
      onSuccess: (res) => {
        setReceiptHtml(res.html);
        setReceiptEscposBase64(res.escposBase64);
        setReceiptModalOpen(true);
      },
      onError: (err) => {
        setSaleError(getApiErrorMessage(err, `Could not reprint ${orderNumber}.`));
      },
    });
  };

  // Parking a cart reuses the checkout-session record the phone handoff
  // already runs on: same cart, same customer, same totals, just kept at the
  // till until the customer comes back.
  const handleHoldSale = () => {
    if (cart.length === 0) return;
    setSaleError('');
    const heldItems = cart.map(({ productId, productName, variantId, sku, variantTitle, quantity, unitPrice, discountAmount, taxAmount }) => ({
      productId,
      productName,
      variantId,
      sku,
      variantTitle,
      quantity,
      unitPrice,
      discountAmount,
      taxAmount,
    }));

    holdMutation.mutate(
      {
        items: heldItems,
        customer,
        discountTotal,
        deviceId: TERMINAL_ID,
        hold: true,
      },
      {
        onSuccess: () => {
          setCart([]);
          setActiveSession(null);
          setDiscountTotal(0);
          setCashTendered('');
          setSplitTenders({ CASH: '', UPI: '', CARD: '' });
          barcodeInputRef.current?.focus();
        },
        onError: (err) => {
          setSaleError(getApiErrorMessage(err, 'Could not hold this bill.'));
        },
      },
    );
  };

  const handleResumeHeld = (handoffToken: string) => {
    setSaleError('');
    adoptMutation.mutate(handoffToken, {
      onSuccess: (data) => {
        setActiveSession(data);
        if (data.items && data.items.length > 0) {
          setCart(data.items);
        }
        if (data.customer) {
          setCustomer(data.customer);
        }
        setDiscountTotal(data.discountTotal || 0);
        heldSessions.refetch();
      },
      onError: (err) => {
        setSaleError(getApiErrorMessage(err, 'Could not resume that held bill.'));
      },
    });
  };

  const handoffError = adoptMutation.isError
    ? getApiErrorMessage(adoptMutation.error, 'Invalid or expired session PIN.')
    : '';

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    if (shiftRequired) {
      setSaleError('Open a shift before billing so cash sales can be reconciled at close.');
      return;
    }
    if (paymentMethod === 'CASH' && (cashTendered === '' || Number(cashTendered) < grandTotal)) {
      setSaleError('Enter cash tendered of at least the total payable before completing this sale.');
      return;
    }
    if (paymentMethod === 'SPLIT') {
      if (splitShortfall > 0) {
        setSaleError(`Split payment is short by Rs.${splitShortfall.toFixed(2)}.`);
        return;
      }
      if (splitChangeBlocked) {
        setSaleError('Change can only be given against cash. Reduce the card or UPI amount.');
        return;
      }
    }
    setSaleError('');

    // The backend's completeSale/previewReceipt DTOs reject unknown
    // properties (forbidNonWhitelisted) -- strip the cart's display-only
    // fields (primaryImage, availableStock) before sending, or every sale
    // with a scanned item fails validation.
    const saleItems = cart.map(({ productId, productName, variantId, sku, variantTitle, quantity, unitPrice, discountAmount, taxAmount }) => ({
      productId,
      productName,
      variantId,
      sku,
      variantTitle,
      quantity,
      unitPrice,
      discountAmount,
      taxAmount,
    }));

    completeSaleMutation.mutate(
      {
        sessionId: activeSession?.sessionId,
        items: saleItems,
        paymentMethod,
        amountPaid: grandTotal,
        splitPayments: paymentMethod === 'SPLIT' ? splitEntries : undefined,
        couponCode: couponApplied?.code,
        giftCardTenders: giftCards.length ? giftCards.map((c) => ({ code: c.code, amount: c.amount })) : undefined,
        loyaltyPointsRedeem: loyaltyApplied?.points,
        loyaltyCustomerId: loyaltyApplied ? customerLookupResult?.customerProfileId : undefined,
        customer,
        discountTotal,
        taxTotal,
        terminalId: TERMINAL_ID,
      },
      {
        onSuccess: (res) => {
          setCompletedOrder(res.order);
          setOfflineNotice(null);
          setSaleError('');
          // Preview Receipt HTML
          previewReceiptMutation.mutate(
            {
              orderNumber: res.order.orderNumber,
              grandTotal: res.order.grandTotal,
              items: saleItems,
              customer,
              paymentMethod,
              discountTotal,
              taxTotal,
            },
            {
              onSuccess: (receiptRes) => {
                setReceiptHtml(receiptRes.html);
                setReceiptEscposBase64(receiptRes.escposBase64);
                setReceiptModalOpen(true);
              },
              onError: () => {
                // The sale itself already succeeded (order is created and
                // stock deducted) -- only the receipt HTML fetch failed, so
                // fall back to a minimal receipt instead of leaving the
                // cashier with no printable confirmation at all.
                setReceiptHtml(
                  generateOfflineReceiptHtml({
                    localId: res.order.orderId,
                    clientOrderNumber: res.order.orderNumber,
                    payload: {
                      items: saleItems,
                      paymentMethod,
                      amountPaid: res.order.grandTotal,
                      customer,
                      discountTotal,
                      taxTotal,
                      terminalId: TERMINAL_ID,
                    },
                    receipt: {
                      items: saleItems,
                      customer,
                      paymentMethod,
                      subtotal,
                      discountTotal,
                      taxTotal,
                      grandTotal: res.order.grandTotal,
                    },
                    status: 'SYNCED',
                    createdAt: res.order.createdAt,
                    attempts: 0,
                  }),
                );
                // No escposBase64 for this fallback receipt -- fall back to
                // browser print if the cashier hits Print while this is showing.
                setReceiptEscposBase64('');
                setReceiptModalOpen(true);
              },
            },
          );

          // Reset POS State
          setCart([]);
          setActiveSession(null);
          setDiscountTotal(0);
          setCashTendered('');
          setSplitTenders({ CASH: '', UPI: '', CARD: '' });
          setCouponApplied(null);
          setCouponInput('');
          setGiftCards([]);
          setGiftCardInput('');
          setGiftCardAmountInput('');
          setLoyaltyApplied(null);
          setLoyaltyPointsInput('');
        },
        onError: async (err) => {
          if (!isNetworkFailure(err)) {
            setSaleError(getApiErrorMessage(err, 'Could not complete this sale. Please try again.'));
            return;
          }

          // Backend unreachable -- queue the sale locally instead of losing
          // it. sessionId is deliberately dropped: items/customer are
          // already resolved client-side, and the handoff session may have
          // expired by the time this syncs.
          const sale = await offlineSync.queueSale(
            {
              items: saleItems,
              paymentMethod,
              amountPaid: grandTotal,
              splitPayments: paymentMethod === 'SPLIT' ? splitEntries : undefined,
              couponCode: couponApplied?.code,
              giftCardTenders: giftCards.length ? giftCards.map((c) => ({ code: c.code, amount: c.amount })) : undefined,
              loyaltyPointsRedeem: loyaltyApplied?.points,
              loyaltyCustomerId: loyaltyApplied ? customerLookupResult?.customerProfileId : undefined,
              customer,
              discountTotal,
              taxTotal,
              terminalId: TERMINAL_ID,
            },
            {
              items: saleItems,
              customer,
              paymentMethod,
              subtotal,
              discountTotal,
              taxTotal,
              grandTotal,
            },
          );

          setCompletedOrder(null);
          setOfflineNotice(sale);
          setReceiptHtml(generateOfflineReceiptHtml(sale));
          setReceiptEscposBase64('');
          setReceiptModalOpen(true);

          setCart([]);
          setActiveSession(null);
          setDiscountTotal(0);
          setCashTendered('');
          setSplitTenders({ CASH: '', UPI: '', CARD: '' });
          setCouponApplied(null);
          setCouponInput('');
          setGiftCards([]);
          setGiftCardInput('');
          setGiftCardAmountInput('');
          setLoyaltyApplied(null);
          setLoyaltyPointsInput('');
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

  const [receiptPrinting, setReceiptPrinting] = useState(false);

  const handlePrintReceipt = async () => {
    if (usbPrinterConnected && receiptEscposBase64) {
      setReceiptPrinting(true);
      try {
        await webUsbPrinterService.printBase64(receiptEscposBase64);
      } catch (err) {
        setSaleError(getApiErrorMessage(err, 'USB print failed -- falling back to browser print.'));
        triggerBrowserPrint();
      } finally {
        setReceiptPrinting(false);
      }
      return;
    }
    triggerBrowserPrint();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-100 p-3 sm:p-6 font-sans">
      {/* Top Header & Handoff Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shadow-2xs overflow-hidden p-1">
            <Image src="/brand/logo-icon.png" alt="Vasanthi's Signature" width={1024} height={1024} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-[var(--brand-primary)] leading-none">
              Shopora Web POS
            </h1>
            <p className="text-xs text-neutral-500 font-medium mt-1">
              Vasanthi&apos;s Signature — Counter 1 Billing
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Connectivity Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${
              offlineSync.isBackendReachable
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-900 border-amber-300/80'
            }`}
          >
            {offlineSync.isBackendReachable ? (
              <Wifi className="w-4 h-4 text-emerald-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-700 animate-pulse" />
            )}
            <span>{offlineSync.isBackendReachable ? 'Online' : 'Offline — sales queue locally'}</span>
          </div>

          {/* Pending Sync Button */}
          {offlineSync.pendingSales.length > 0 && (
            <button
              onClick={() => setSyncModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                offlineSync.needsReviewCount > 0
                  ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
              }`}
            >
              {offlineSync.isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : offlineSync.needsReviewCount > 0 ? (
                <AlertTriangle className="w-4 h-4 text-sky-600" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              <span>Pending Sync ({offlineSync.pendingSales.length})</span>
            </button>
          )}

          <button
            onClick={() => setHandoffModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Smartphone className="w-4 h-4 text-amber-700 animate-pulse" />
            <span>Receive Mobile Session (Handoff)</span>
          </button>

          <Link
            href="/pos/returns"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Returns</span>
          </Link>

          <button
            onClick={() => setReprintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Reprint</span>
          </button>

          <button
            onClick={() => setWholesaleMode((v) => !v)}
            title="Toggle wholesale pricing on scans and search"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              wholesaleMode
                ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{wholesaleMode ? 'Wholesale ON' : 'Wholesale'}</span>
          </button>

          <Link
            href="/pos/printers"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              usbPrinterConnected
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
            }`}
          >
            <Usb className="w-4 h-4" />
            <span>{usbPrinterConnected ? 'Printer Connected' : 'Printer Settings'}</span>
          </Link>

          {activeSession && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Session #{activeSession.sessionId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Barcode Scanner & Live Item Cart Table (8 Cols) */}
        <div className="md:col-span-7 xl:col-span-8 space-y-4">
          
          {/* Bills parked at this till */}
          {(heldSessions.data?.length ?? 0) > 0 && (
            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Held Bills ({heldSessions.data!.length})
              </span>
              <div className="space-y-1.5">
                {heldSessions.data!.map((held) => (
                  <div
                    key={held.sessionId}
                    className="flex items-center justify-between gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-neutral-900 truncate">
                        {held.customer?.fullName || 'Walk-in Customer'}
                      </span>
                      <span className="block text-[11px] text-neutral-500 font-medium">
                        {held.itemsCount} item{held.itemsCount === 1 ? '' : 's'} &middot; ₹{held.grandTotal.toFixed(2)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleResumeHeld(held.handoffToken)}
                        disabled={adoptMutation.isPending}
                        className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-50"
                      >
                        Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => discardHeldMutation.mutate(held.sessionId)}
                        disabled={discardHeldMutation.isPending}
                        title="Discard this held bill"
                        className="text-neutral-400 hover:text-neutral-700 p-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick-buy: category chips + product tiles */}
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Quick Buy
              </span>
              <button
                type="button"
                onClick={() => setQuickBuyOpen((v) => !v)}
                className="text-[11px] font-bold text-neutral-500 hover:text-neutral-800"
              >
                {quickBuyOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {quickBuyOpen && (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {(categoriesQuery.data?.data ?? []).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setQuickBuyCategoryId(cat.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                        quickBuyCategoryId === cat.id
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {quickBuyCategoryId ? (
                  quickBuyQuery.isPending ? (
                    <p className="text-xs text-neutral-500 font-medium">Loading tiles...</p>
                  ) : (quickBuyQuery.data ?? []).length === 0 ? (
                    <p className="text-xs text-neutral-500 font-medium">
                      No sellable products in this category.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {(quickBuyQuery.data ?? []).map((item) => {
                        const oos = item.availableStock <= 0;
                        return (
                          <button
                            key={item.variantId || item.productId}
                            type="button"
                            disabled={oos}
                            onClick={() => addScannedItemToCart(item)}
                            className="text-left bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl p-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <span className="block text-[11px] font-bold text-neutral-900 truncate">
                              {item.productName}
                            </span>
                            <span className="block text-[10px] text-neutral-500 truncate">
                              {item.variantTitle || item.sku || '--'}
                            </span>
                            <span className="mt-1 flex items-center justify-between">
                              <span className="text-[10px] font-medium text-neutral-500">
                                {oos ? 'Out' : `${item.availableStock} left`}
                              </span>
                              <span className="text-xs font-bold text-neutral-900">
                                ₹{item.price.toFixed(0)}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Pick a category above to see its products as tiles.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Barcode Search Box */}
          <form onSubmit={handleScanSubmit} className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-primary)]" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode, or type a product name or SKU..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-neutral-900 font-mono font-medium focus:outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/10"
              />

              {searchTerm && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                  {productSearch.isPending ? (
                    <div className="px-4 py-3 text-xs text-neutral-500 font-medium">Searching...</div>
                  ) : suggestions.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-neutral-500 font-medium">
                      No product matches &quot;{searchTerm}&quot;.
                    </div>
                  ) : (
                    suggestions.map((item) => {
                      const outOfStock = item.availableStock <= 0;
                      return (
                        <button
                          key={item.variantId || item.productId}
                          type="button"
                          disabled={outOfStock}
                          onClick={() => addScannedItemToCart(item)}
                          className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0 flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="min-w-0">
                            <span className="block text-xs font-bold text-neutral-900 truncate">
                              {item.productName}
                              {item.variantTitle ? ` - ${item.variantTitle}` : ''}
                            </span>
                            <span className="block text-[11px] text-neutral-500 font-mono truncate">
                              {item.sku || item.barcode || '--'} &middot;{' '}
                              {outOfStock ? 'Out of stock' : `${item.availableStock} in stock`}
                            </span>
                          </span>
                          <span className="text-xs font-bold text-neutral-900 shrink-0">
                            Rs.{item.price.toFixed(2)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={scanMutation.isPending}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-2xs disabled:opacity-50"
            >
              {scanMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Add</span>
            </button>
          </form>

          {scanOfflineError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex items-start gap-2 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <span>{scanOfflineError}</span>
            </div>
          )}

          {stockCapNotice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex items-start gap-2 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              <span>{stockCapNotice}</span>
            </div>
          )}

          {/* Cart Table Container */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4.5 h-4.5 text-[var(--brand-primary)]" />
                <h2 className="text-sm font-bold text-neutral-900">
                  Cart Items ({cart.reduce((s, i) => s + i.quantity, 0)})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Item List */}
            {cart.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto">
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
                        <p className="text-[10px] text-sky-800 font-semibold">
                          ₹{item.unitPrice} / unit
                        </p>
                        <label className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-neutral-500">Disc ₹</span>
                          <input
                            type="number"
                            min={0}
                            max={item.unitPrice * item.quantity}
                            value={item.discountAmount ?? ''}
                            onChange={(e) => setLineDiscount(index, e.target.value)}
                            placeholder="0"
                            className="w-16 bg-neutral-50 border border-neutral-200 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-right focus:outline-none focus:border-[var(--brand-primary)]"
                          />
                        </label>
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
                        ₹{Math.round((item.unitPrice * item.quantity - (item.discountAmount || 0)) * 100) / 100}
                      </div>
                      {(item.discountAmount || 0) > 0 && (
                        <div className="text-[10px] text-neutral-400 line-through">
                          ₹{item.unitPrice * item.quantity}
                        </div>
                      )}
                      <button
                        onClick={() => removeItem(index)}
                        className="text-[10px] text-neutral-400 hover:text-sky-600 transition-colors mt-0.5"
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
        <div className="md:col-span-5 xl:col-span-4 space-y-4">
          
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
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)] font-mono"
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
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)]"
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

          {/* Shift Gate -- billing requires an open shift while online */}
          {shiftRequired && (
            <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-2 text-xs font-bold text-amber-900">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span>No shift is open on this terminal. Open one with a starting cash float before billing.</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  placeholder="Opening cash (₹)"
                  className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={handleOpenShift}
                  disabled={openShiftMutation.isPending || !openingCashInput}
                  className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold disabled:opacity-50 whitespace-nowrap"
                >
                  {openShiftMutation.isPending ? 'Opening…' : 'Open Shift'}
                </button>
              </div>
              {openShiftMutation.isError && (
                <p className="text-xs font-medium text-sky-700">
                  {getApiErrorMessage(openShiftMutation.error, 'Could not open the shift.')}
                </p>
              )}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Select Payment Method</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
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
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
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
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
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
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                    : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <Wallet className="w-5 h-5" />
                <span>Split</span>
              </button>

            </div>

            {paymentMethod === 'SPLIT' && (
              <div className="pt-1 space-y-2 border-t border-neutral-100">
                <p className="pt-2 text-[11px] font-semibold text-neutral-600">
                  Enter what the customer paid on each tender. Each is recorded separately.
                </p>
                {(['CASH', 'UPI', 'CARD'] as const).map((method) => (
                  <div key={method} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-neutral-600 shrink-0">{method}</span>
                    <input
                      type="number"
                      min={0}
                      value={splitTenders[method]}
                      onChange={(e) =>
                        setSplitTenders((prev) => ({ ...prev, [method]: e.target.value }))
                      }
                      placeholder="0"
                      className="w-28 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-right text-xs font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                    />
                  </div>
                ))}
                {splitShortfall > 0 ? (
                  <p className="text-[11px] font-semibold text-sky-700">
                    Short by ₹{splitShortfall.toFixed(2)} of ₹{grandTotal.toFixed(2)}.
                  </p>
                ) : splitChangeBlocked ? (
                  <p className="text-[11px] font-semibold text-amber-700">
                    ₹{splitExcess.toFixed(2)} over, but only ₹{splitCash.toFixed(2)} is cash. Change
                    can only be given against cash.
                  </p>
                ) : splitExcess > 0 ? (
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>Change Due</span>
                    <span>₹{splitExcess.toFixed(2)}</span>
                  </div>
                ) : splitTendered > 0 ? (
                  <p className="text-[11px] font-semibold text-emerald-700">Tenders cover the bill exactly.</p>
                ) : null}
              </div>
            )}

            {paymentMethod === 'CASH' && (
              <div className="pt-1 space-y-2 border-t border-neutral-100">
                <div className="flex items-center justify-between gap-2 pt-2">
                  <span className="text-[11px] font-semibold text-neutral-600 shrink-0">Cash Tendered</span>
                  <input
                    type="number"
                    min={0}
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={String(grandTotal)}
                    className="w-28 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-right text-xs font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                </div>
                {cashTendered !== '' && (
                  Number(cashTendered) >= grandTotal ? (
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                      <span>Change Due</span>
                      <span>₹{Math.round((Number(cashTendered) - grandTotal) * 100) / 100}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold text-sky-700">
                      Short by ₹{Math.round((grandTotal - Number(cashTendered)) * 100) / 100}.
                    </p>
                  )
                )}
              </div>
            )}
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
                  className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-right text-xs font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                />
              </div>
              {couponApplied ? (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5">
                  <span className="font-bold text-[11px]">
                    Coupon <span className="font-mono">{couponApplied.code}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">-₹{couponApplied.discountAmount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-emerald-600 hover:text-emerald-900 text-[10px] font-bold"
                    >
                      REMOVE
                    </button>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="Coupon code"
                    className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={validateCouponMutation.isPending || !couponInput.trim() || cart.length === 0}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                  >
                    {validateCouponMutation.isPending ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-[10px] font-medium text-sky-800">{couponError}</p>
              )}

              {giftCards.map((c) => (
                <div key={c.code} className="flex justify-between items-center text-purple-800 bg-purple-50 rounded-lg px-2 py-1.5">
                  <span className="font-bold text-[11px] font-mono truncate">
                    Gift {c.code}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">-₹{c.amount.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGiftCard(c.code)}
                      className="text-purple-600 hover:text-purple-900 text-[10px] font-bold"
                    >
                      REMOVE
                    </button>
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={giftCardInput}
                  onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                  placeholder="Gift card"
                  className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                />
                <input
                  type="number"
                  min={0}
                  value={giftCardAmountInput}
                  onChange={(e) => setGiftCardAmountInput(e.target.value)}
                  placeholder="Amount"
                  className="w-16 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 text-right text-[11px] font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                />
                <button
                  type="button"
                  onClick={handleAddGiftCard}
                  disabled={lookupGiftCardMutation.isPending || !giftCardInput.trim()}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  {lookupGiftCardMutation.isPending ? '...' : 'Add'}
                </button>
              </div>
              {giftCardError && (
                <p className="text-[10px] font-medium text-sky-800">{giftCardError}</p>
              )}

              {loyaltyBalanceQuery.data && loyaltyBalanceQuery.data.pointsBalance > 0 && !loyaltyApplied && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                  <span className="text-[11px] font-bold text-amber-900 flex-1">
                    {loyaltyBalanceQuery.data.pointsBalance} pts (~₹{loyaltyBalanceQuery.data.rupeeEquivalent})
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={loyaltyBalanceQuery.data.pointsBalance}
                    value={loyaltyPointsInput}
                    onChange={(e) => setLoyaltyPointsInput(e.target.value)}
                    placeholder="Redeem"
                    className="w-20 bg-white border border-amber-200 rounded-md px-2 py-1 text-right text-[11px] font-bold focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLoyalty}
                    disabled={!loyaltyPointsInput}
                    className="bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold px-3 py-1 rounded-md disabled:opacity-50"
                  >
                    Use
                  </button>
                </div>
              )}
              {loyaltyApplied && (
                <div className="flex justify-between items-center text-amber-900 bg-amber-50 rounded-lg px-2 py-1.5">
                  <span className="font-bold text-[11px]">
                    Loyalty {loyaltyApplied.points} pts
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-bold">-₹{loyaltyApplied.rupees.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={handleRemoveLoyalty}
                      className="text-amber-700 hover:text-amber-900 text-[10px] font-bold"
                    >
                      REMOVE
                    </button>
                  </span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>GST</span>
                <span className="font-semibold text-neutral-900">₹{taxTotal}</span>
              </div>
              <div className="border-t border-neutral-100 pt-2 flex justify-between items-center text-base font-bold text-[var(--brand-primary)]">
                <span>Total Payable</span>
                <span className="text-lg">₹{grandTotal}</span>
              </div>
            </div>

            {saleError && (
              <div className="bg-sky-50 border border-sky-200 text-sky-900 rounded-xl p-3 flex items-start gap-2 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-sky-600" />
                <span>{saleError}</span>
              </div>
            )}

            <button
              onClick={handleCompleteSale}
              disabled={
                cart.length === 0 ||
                completeSaleMutation.isPending ||
                shiftRequired ||
                (paymentMethod === 'CASH' && (cashTendered === '' || Number(cashTendered) < grandTotal)) ||
                (paymentMethod === 'SPLIT' && (splitShortfall > 0 || splitChangeBlocked))
              }
              className={`w-full text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${
                offlineSync.isBackendReachable ? 'bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)]' : 'bg-amber-700 hover:bg-amber-800'
              }`}
            >
              {completeSaleMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : offlineSync.isBackendReachable ? (
                <Printer className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>{offlineSync.isBackendReachable ? 'Complete Sale & Print Invoice' : 'Save Offline & Print Slip'}</span>
            </button>
            <button
              onClick={handleHoldSale}
              disabled={cart.length === 0 || holdMutation.isPending || !offlineSync.isBackendReachable}
              className="w-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              title={offlineSync.isBackendReachable ? 'Park this bill and serve the next customer' : 'Holding a bill needs the backend'}
            >
              <Clock className="w-4 h-4" />
              <span>{holdMutation.isPending ? 'Holding...' : 'Hold Bill'}</span>
            </button>

            {!offlineSync.isBackendReachable && (
              <p className="text-[10px] text-amber-800 text-center font-medium">
                Backend unreachable — this sale will be queued locally and synced automatically once the connection returns.
              </p>
            )}
          </div>

        </div>

      </div>

      {/* MODAL 1: RECEIVE MOBILE SESSION HANDOFF */}
      {handoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-[var(--brand-primary)] font-bold text-sm">
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
                className="w-full bg-neutral-50 border border-neutral-300 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-neutral-900 focus:outline-none focus:border-[var(--brand-primary)]"
                autoFocus
              />

              {handoffError && (
                <p className="text-xs font-medium text-sky-700">{handoffError}</p>
              )}

              <button
                type="submit"
                disabled={adoptMutation.isPending}
                className="w-full bg-[var(--brand-primary)] text-white py-3 rounded-xl text-xs font-bold hover:bg-[var(--brand-primary-dark)] transition-colors"
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
              {offlineNotice ? (
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <WifiOff className="w-5 h-5" />
                  <span>Saved Offline — Ref #{offlineNotice.clientOrderNumber}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Sale Completed! #{completedOrder?.orderNumber as string}</span>
                </div>
              )}
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

            {usbPrinterConnected && receiptEscposBase64 && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                <Usb className="w-3.5 h-3.5" />
                <span>USB printer connected -- will print directly, no dialog.</span>
              </div>
            )}

            {/* Print Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintReceipt}
                disabled={receiptPrinting}
                className="flex-1 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>{receiptPrinting ? 'Printing…' : 'Print Thermal Invoice'}</span>
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
              <div className="flex items-center gap-2 text-[var(--brand-primary)] font-bold text-sm">
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
                      <span className="text-[var(--brand-primary)]">{ord.orderNumber}</span>
                      <span>₹{ord.grandTotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>{new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{`${ord.paymentMethod} • ${ord.status}`}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryModalOpen(false);
                        handleReprintReceipt(ord.orderNumber);
                      }}
                      disabled={reprintMutation.isPending}
                      className="w-full flex items-center justify-center gap-1.5 border border-neutral-300 hover:bg-neutral-100 text-neutral-800 rounded-lg px-2 py-1.5 text-[11px] font-bold disabled:opacity-50"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Reprint Receipt</span>
                    </button>
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

      {/* Reprint receipt by order number */}
      {reprintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-[var(--brand-primary)] font-bold text-sm">
                <Printer className="w-5 h-5" />
                <span>Reprint Tax Invoice</span>
              </div>
              <button onClick={() => setReprintModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              The reprint is marked &quot;DUPLICATE COPY&quot; on the header so it can&apos;t
              be mistaken for the original. Every reprint is audit-logged.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const value = reprintInput.trim();
                if (!value) return;
                setReprintModalOpen(false);
                handleReprintReceipt(value);
                setReprintInput('');
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={reprintInput}
                onChange={(e) => setReprintInput(e.target.value)}
                placeholder="Order number (e.g. ORD-2026-000123)"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold focus:outline-none focus:border-[var(--brand-primary)]"
                autoFocus
              />
              <button
                type="submit"
                disabled={reprintMutation.isPending || !reprintInput.trim()}
                className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {reprintMutation.isPending ? 'Loading...' : 'Reprint Receipt'}
              </button>
            </form>
          </div>
        </div>
      )}

            {/* MODAL 4: OFFLINE SALES QUEUE */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-[var(--brand-primary)] font-bold text-sm">
                <CloudUpload className="w-5 h-5" />
                <span>Offline Sales Queue ({offlineSync.pendingSales.length})</span>
              </div>
              <button onClick={() => setSyncModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-neutral-500">
                Sales taken while the backend was unreachable. They sync automatically once the connection returns.
              </p>
              <button
                onClick={() => offlineSync.syncNow()}
                disabled={offlineSync.isSyncing || !offlineSync.isBackendReachable}
                className="shrink-0 flex items-center gap-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold px-3 py-2 rounded-xl disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${offlineSync.isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {offlineSync.pendingSales.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs font-medium">
                  Queue is empty — everything is synced.
                </div>
              ) : (
                offlineSync.pendingSales.map((sale) => (
                  <div key={sale.localId} className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 font-mono truncate">{sale.clientOrderNumber}</div>
                        <div className="text-[10px] text-neutral-500">
                          {new Date(sale.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          {' • '}₹{sale.receipt.grandTotal} • {sale.receipt.items.length} item(s)
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                          sale.status === 'SYNCED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.status === 'SYNCING'
                              ? 'bg-blue-100 text-blue-800'
                              : sale.status === 'NEEDS_REVIEW'
                                ? 'bg-sky-100 text-sky-800'
                                : sale.status === 'FAILED'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sale.status === 'SYNCING' && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                        {sale.status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                        {sale.status.replace('_', ' ')}
                      </span>
                    </div>

                    {sale.status === 'NEEDS_REVIEW' && sale.shortages && sale.shortages.length > 0 && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 space-y-1">
                        <div className="text-[10px] font-bold text-sky-800">Stock changed while offline:</div>
                        {sale.shortages.map((s, i) => (
                          <div key={i} className="text-[10px] text-sky-700 flex justify-between">
                            <span className="truncate max-w-[220px]">{s.productName}{s.variantTitle ? ` (${s.variantTitle})` : ''}</span>
                            <span>wanted {s.requested}, only {s.available} left</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {sale.status === 'FAILED' && sale.errorMessage && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 text-[10px] text-sky-700">
                        {sale.errorMessage}
                      </div>
                    )}

                    {sale.status === 'SYNCED' && sale.syncedOrderNumber && (
                      <div className="text-[10px] text-emerald-700 font-semibold">
                        Synced as order {sale.syncedOrderNumber}
                      </div>
                    )}

                    {(sale.status === 'NEEDS_REVIEW' || sale.status === 'FAILED') && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => offlineSync.retrySale(sale.localId)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                        >
                          Retry Sync
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Discard this sale? It will never be recorded in the system. Only do this if the sale itself is being cancelled/refunded at the register.')) {
                              offlineSync.dismissSale(sale.localId);
                            }
                          }}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setSyncModalOpen(false)}
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
