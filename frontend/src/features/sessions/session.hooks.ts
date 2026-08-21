import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from './session.service';

export const sessionKeys = {
  all: ['sessions'] as const,
  list: () => [...sessionKeys.all, 'list'] as const,
  current: () => [...sessionKeys.all, 'current'] as const,
  stats: () => [...sessionKeys.all, 'stats'] as const,
};

export function useUserSessions() {
  return useQuery({
    queryKey: sessionKeys.list(),
    queryFn: () => sessionService.getSessions(),
  });
}

export function useCurrentSession() {
  return useQuery({
    queryKey: sessionKeys.current(),
    queryFn: () => sessionService.getCurrentSession(),
  });
}

export function useSessionStats() {
  return useQuery({
    queryKey: sessionKeys.stats(),
    queryFn: () => sessionService.getStats(),
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sessionService.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (currentId: string) => sessionService.revokeOthers(currentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useRevokeExpiredSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionService.revokeExpired(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
