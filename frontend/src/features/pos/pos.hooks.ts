'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from './pos.service';
import {
  PosCartItem,
  PosCustomerInfo,
  CompletePosSalePayload,
  BatchStickersPayload,
  PreviewReceiptPayload,
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

export function useAdoptHandoffSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (handoffToken: string) => posService.adoptHandoffSession(handoffToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (payload: { items: PosCartItem[]; customer?: PosCustomerInfo; notes?: string }) =>
      posService.createCheckoutSession(payload),
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
