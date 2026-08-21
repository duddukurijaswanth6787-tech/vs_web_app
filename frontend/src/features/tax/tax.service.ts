import { apiClient } from '@/lib/api/client';
import { TaxRule, CreateTaxRuleDto, CalculateTaxDto, TaxCalculationResult } from './tax.types';

export const taxService = {
  getRules: async (query: { type?: string; isActive?: boolean } = {}): Promise<TaxRule[]> => {
    const res = await apiClient.get<{ data: TaxRule[] }>('/tax/rules', { params: query });
    return res.data?.data || (res.data as unknown as TaxRule[]) || [];
  },

  getRuleById: async (id: string): Promise<TaxRule> => {
    const res = await apiClient.get<{ data: TaxRule }>(`/tax/rules/${id}`);
    return res.data?.data || (res.data as unknown as TaxRule);
  },

  createRule: async (dto: CreateTaxRuleDto): Promise<TaxRule> => {
    const res = await apiClient.post<{ data: TaxRule }>('/tax/rules', dto);
    return res.data?.data || (res.data as unknown as TaxRule);
  },

  updateRule: async (id: string, dto: Partial<CreateTaxRuleDto>): Promise<TaxRule> => {
    const res = await apiClient.patch<{ data: TaxRule }>(`/tax/rules/${id}`, dto);
    return res.data?.data || (res.data as unknown as TaxRule);
  },

  calculateTax: async (dto: CalculateTaxDto): Promise<TaxCalculationResult> => {
    const res = await apiClient.post<{ data: TaxCalculationResult }>('/tax/calculate', dto);
    return res.data?.data || (res.data as unknown as TaxCalculationResult);
  },
};
