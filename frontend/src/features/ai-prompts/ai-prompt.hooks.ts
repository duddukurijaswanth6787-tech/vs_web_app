'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiPromptService, PromptTemplate, PromptType } from './ai-prompt.service';

const key = ['admin', 'ai', 'prompts'] as const;

export function usePromptTemplates(enabled = true) {
  return useQuery({
    queryKey: key,
    queryFn: () => aiPromptService.list(),
    enabled,
    // Templates change rarely and the Add Product page reads them on mount.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUpdatePromptTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, body }: { type: PromptType; body: Partial<PromptTemplate> }) =>
      aiPromptService.update(type, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useResetPromptTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: PromptType) => aiPromptService.reset(type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function usePromptHistory(type: PromptType | null) {
  return useQuery({
    queryKey: [...key, 'history', type],
    queryFn: () => aiPromptService.history(type!),
    enabled: !!type,
    retry: false,
  });
}
