'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { posService } from './pos.service';
import {
  PosCartItem,
  PosCustomerInfo,
  CompletePosSalePayload,
  BatchStickersPayload,
  PreviewReceiptPayload,
  OpenShiftPayload,
  CloseShiftPayload,
  CreateReturnPayload,
  CreateExchangePayload,
} from './pos.types';

export const posKeys = {
  all: ['pos'] as const,
  sessions: () => [...posKeys.all, 'sessions'] as const,
};

export function useScanBarcode() {
  return useMutation({
    mutationFn: (barcode: string) => posService.scanBarcode(barcode),
  });
}

/**
 * Name/SKU lookup for the till's search box.
 *
 * Idle until two characters are typed: a single letter matches most of the
 * catalogue and is never what the cashier meant.
 */
export function useSearchPosProducts(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: [...posKeys.all, 'search', trimmed],
    queryFn: () => posService.searchProducts(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 30_000,
  });
}

export function useAdoptHandoffSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (handoffToken: string) => posService.adoptHandoffSession(handoffToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

/** Look up a customer's loyalty balance for the till. */
export function useLoyaltyBalance(customerId?: string) {
  return useQuery({
    queryKey: [...posKeys.all, 'loyalty-balance', customerId],
    queryFn: () => posService.lookupLoyaltyBalance(customerId!),
    enabled: !!customerId,
  });
}

/** Look up a gift card's remaining balance for the till. */
export function useLookupGiftCard() {
  return useMutation({
    mutationFn: (code: string) => posService.lookupGiftCardBalance(code),
  });
}

/** Validate a coupon against the current cart before completing the sale. */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof posService.validateCoupon>[0]) =>
      posService.validateCoupon(payload),
  });
}

/** Reprint a past sale's tax invoice, stamped as a duplicate. */
export function useReprintReceipt() {
  return useMutation({
    mutationFn: (orderNumber: string) => posService.reprintReceipt(orderNumber),
  });
}

/** Drawer movements recorded against a shift. */
export function useCashMovements(shiftId?: string) {
  return useQuery({
    queryKey: [...posKeys.all, 'cash-movements', shiftId],
    queryFn: () => posService.listCashMovements(shiftId!),
    enabled: !!shiftId,
  });
}

export function useRecordCashMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      terminalId: string;
      direction: 'IN' | 'OUT';
      amount: number;
      reason: string;
    }) =>
      posService.recordCashMovement(params.terminalId, {
        direction: params.direction,
        amount: params.amount,
        reason: params.reason,
      }),
    onSuccess: () => {
      // The drawer expectation and the X-report both move with this.
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

/** Carts parked at this till. Refetched whenever one is held or resumed. */
export function useHeldSessions(terminalId?: string, enabled = true) {
  return useQuery({
    queryKey: [...posKeys.sessions(), 'held', terminalId ?? 'all'],
    queryFn: () => posService.listHeldSessions(terminalId),
    enabled,
  });
}

export function useDiscardHeldSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => posService.discardHeldSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.sessions() });
    },
  });
}

export function useCreateCheckoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      items: PosCartItem[];
      customer?: PosCustomerInfo;
      notes?: string;
      deviceId?: string;
      discountTotal?: number;
      hold?: boolean;
    }) => posService.createCheckoutSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.sessions() });
    },
  });
}

export function useCompletePosSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CompletePosSalePayload) => posService.completeSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] });
    },
  });
}

export function useBatchStickers() {
  return useMutation({
    mutationFn: (payload: BatchStickersPayload) => posService.generateBatchStickers(payload),
  });
}

export function usePreviewReceipt() {
  return useMutation({
    mutationFn: (payload: PreviewReceiptPayload) => posService.previewReceipt(payload),
  });
}

export function useLookupCustomer() {
  return useMutation({
    mutationFn: (phone: string) => posService.lookupCustomer(phone),
  });
}

/**
 * Omitting terminalId asks for this cashier's open shift on any register.
 * When a caller does pass one, `enabled` lets it wait until the device's
 * terminal id has resolved -- querying before then would report on the wrong
 * register.
 */
export function useCurrentShift(terminalId?: string, enabled = true) {
  return useQuery({
    queryKey: [...posKeys.all, 'current-shift', terminalId],
    queryFn: () => posService.getCurrentShift(terminalId),
    enabled,
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpenShiftPayload) => posService.openShift(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, payload }: { shiftId: string; payload: CloseShiftPayload }) =>
      posService.closeShift(shiftId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

export function useShiftsList(params: { page?: number; limit?: number; status?: string; terminalId?: string; cashierId?: string } = {}) {
  return useQuery({
    queryKey: [...posKeys.all, 'shifts', params],
    queryFn: () => posService.listShifts(params),
  });
}

export function useShiftReport(shiftId?: string) {
  return useQuery({
    queryKey: [...posKeys.all, 'shift-report', shiftId],
    queryFn: () => posService.getShiftReport(shiftId!),
    enabled: !!shiftId,
  });
}

export function usePosDaySummary(date?: string) {
  return useQuery({
    queryKey: [...posKeys.all, 'day-summary', date],
    queryFn: () => posService.getPosDaySummary(date),
  });
}

/**
 * A past in-store sale and what is still returnable on it. Only runs once an
 * order number has actually been entered.
 */
export function useReturnableSale(orderNumber: string) {
  return useQuery({
    queryKey: [...posKeys.all, 'returnable-sale', orderNumber],
    queryFn: () => posService.lookupSaleForReturn(orderNumber),
    enabled: !!orderNumber,
    retry: false,
  });
}

export function useCreatePosExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExchangePayload) => posService.createExchange(payload),
    onSuccess: () => {
      // Same reason as return: the drawer expectation moves the moment this lands.
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

export function useCreatePosReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReturnPayload) => posService.createReturn(payload),
    onSuccess: () => {
      // The refund changes what the drawer should hold, so the shift figures
      // on screen are stale the moment it lands.
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}
