import { apiClient } from '@/lib/api/client';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

export interface StaffSupportReply {
  id: string;
  message: string;
  isStaff: boolean;
  attachments: string[];
  createdAt: string;
}

export interface StaffSupportTicket {
  id: string;
  ticketNumber: string;
  customerId?: string;
  customerName?: string;
  subject: string;
  description: string;
  category?: string;
  priority: string;
  status: string;
  assignedTo?: string;
  replies?: StaffSupportReply[];
  createdAt: string;
}

export interface StaffTicketQuery {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface UpdateTicketStatusPayload {
  status?: string;
  assignedTo?: string;
  priority?: string;
}

type ApiResponse<T> = StandardResponse<T>;

export const staffSupportApi = {
  listTickets: async (query: StaffTicketQuery = {}) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<StaffSupportTicket>>>('/support/tickets', {
      params: query,
    });
    return res.data.data!;
  },
  getTicket: async (id: string) => {
    const res = await apiClient.get<ApiResponse<StaffSupportTicket>>(`/support/tickets/${id}`);
    return res.data.data!;
  },
  updateStatus: async (id: string, payload: UpdateTicketStatusPayload) => {
    const res = await apiClient.patch<ApiResponse<StaffSupportTicket>>(`/support/tickets/${id}/status`, payload);
    return res.data.data!;
  },
  reply: async (id: string, message: string) => {
    const res = await apiClient.post<ApiResponse<StaffSupportReply>>(`/support/tickets/${id}/replies`, { message });
    return res.data.data!;
  },
};
