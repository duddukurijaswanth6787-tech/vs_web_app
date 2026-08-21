import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxService } from './tax.service';
import { CreateTaxRuleDto, CalculateTaxDto } from './tax.types';

export const taxKeys = {
  all: ['tax'] as const,
  rules: (query?: object) => [...taxKeys.all, 'rules', query] as const,
};

export function useTaxRules(query: { type?: string; isActive?: boolean } = {}) {
  return useQuery({
    queryKey: taxKeys.rules(query),
    queryFn: () => taxService.getRules(query),
  });
}

export function useCreateTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTaxRuleDto) => taxService.createRule(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
}

export function useUpdateTaxRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateTaxRuleDto> }) => taxService.updateRule(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxKeys.all });
    },
  });
}

export function useCalculateTax() {
  return useMutation({
    mutationFn: (dto: CalculateTaxDto) => taxService.calculateTax(dto),
  });
}
