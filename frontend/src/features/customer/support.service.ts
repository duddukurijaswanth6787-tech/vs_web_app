import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  CreateSupportTicketDto,
  CreateSupportReplyDto,
  SupportTicketResponse,
} from '@/features/support/support.types';

export const customerSupportService = {
  getTickets: async (): Promise<SupportTicketResponse[]> => {
    const response = await apiClient.get<StandardResponse<SupportTicketResponse[]>>('/support/tickets');
    return response.data.data!;
  },
  getTicketById: async (id: string): Promise<SupportTicketResponse> => {
    const response = await apiClient.get<StandardResponse<SupportTicketResponse>>(`/support/tickets/${id}`);
    return response.data.data!;
  },
  createTicket: async (dto: CreateSupportTicketDto): Promise<SupportTicketResponse> => {
    const response = await apiClient.post<StandardResponse<SupportTicketResponse>>('/support/tickets', dto);
    return response.data.data!;
  },
  addReply: async (id: string, dto: CreateSupportReplyDto): Promise<any> => {
    const response = await apiClient.post(`/support/tickets/${id}/replies`, dto);
    return response.data;
  },
};
