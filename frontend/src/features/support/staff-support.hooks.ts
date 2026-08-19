'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { staffSupportApi, StaffTicketQuery, UpdateTicketStatusPayload } from './staff-support.api';

export const staffSupportKeys = {
  all: ['staff-support'] as const,
  tickets: (query: StaffTicketQuery) => [...staffSupportKeys.all, 'tickets', query] as const,
};

export function useStaffTickets(query: StaffTicketQuery = {}, enabled = true) {
  return useQuery({
    queryKey: staffSupportKeys.tickets(query),
    queryFn: () => staffSupportApi.listTickets(query),
    enabled,
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketStatusPayload }) =>
      staffSupportApi.updateStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSupportKeys.all });
    },
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => staffSupportApi.reply(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffSupportKeys.all });
    },
  });
}
