import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { StandardResponse } from '@/types/api.types';
import type {
  CreateQuotationInput,
  Quotation,
  QuotationListResponse,
} from './quotation.types';

const KEY = 'quotations';

export const quotationService = {
  async list(params: { status?: string; search?: string; page?: number }) {
    const res = await apiClient.get<StandardResponse<QuotationListResponse>>('/quotations', {
      params: {
        status: params.status || undefined,
        search: params.search || undefined,
        page: params.page,
      },
    });
    return res.data.data!;
  },

  async get(id: string) {
    const res = await apiClient.get<StandardResponse<Quotation>>(`/quotations/${id}`);
    return res.data.data!;
  },

  async create(dto: CreateQuotationInput) {
    const res = await apiClient.post<StandardResponse<Quotation>>('/quotations', dto);
    return res.data.data!;
  },

  async update(id: string, dto: Partial<CreateQuotationInput>) {
    const res = await apiClient.patch<StandardResponse<Quotation>>(`/quotations/${id}`, dto);
    return res.data.data!;
  },

  async cancel(id: string) {
    const res = await apiClient.post<StandardResponse<Quotation>>(`/quotations/${id}/cancel`, {});
    return res.data.data!;
  },

  async convert(
    id: string,
    dto: { paymentMethod: string; amountPaid: number; terminalId?: string },
  ) {
    const res = await apiClient.post<StandardResponse<Quotation>>(
      `/quotations/${id}/convert`,
      dto,
    );
    return res.data.data!;
  },
};

export function useQuotations(params: { status?: string; search?: string; page?: number }) {
  return useQuery({
    queryKey: [KEY, params.status, params.search, params.page],
    queryFn: () => quotationService.list(params),
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => quotationService.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateQuotationInput) => quotationService.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCancelQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quotationService.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useConvertQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string;
      paymentMethod: string;
      amountPaid: number;
      terminalId?: string;
    }) => quotationService.convert(vars.id, vars),
    // Converting deducts stock and creates an order, so the inventory and
    // sales views on screen are stale the moment it succeeds.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['inventory-report'] });
      qc.invalidateQueries({ queryKey: ['sales-report'] });
    },
  });
}
