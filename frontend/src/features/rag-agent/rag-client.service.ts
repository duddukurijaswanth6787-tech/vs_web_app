import { apiClient } from '@/lib/api/client';

export interface RagChatMessage {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface RagConversation {
  id: string;
  customerId?: string;
  title: string;
  createdAt: string;
  messages?: RagChatMessage[];
}

export const ragClientService = {
  chat: async (message: string, conversationId?: string): Promise<{ reply: RagChatMessage; conversationId: string }> => {
    const res = await apiClient.post<{ data: { reply: RagChatMessage; conversationId: string } }>('/ai/agent/chat', {
      message,
      conversationId,
    });
    return res.data?.data || (res.data as unknown as { reply: RagChatMessage; conversationId: string });
  },

  getConversations: async (): Promise<RagConversation[]> => {
    const res = await apiClient.get<{ data: RagConversation[] }>('/ai/agent/conversations');
    return res.data?.data || (res.data as unknown as RagConversation[]) || [];
  },

  getConversationById: async (id: string): Promise<RagConversation> => {
    const res = await apiClient.get<{ data: RagConversation }>(`/ai/agent/conversations/${id}`);
    return res.data?.data || (res.data as unknown as RagConversation);
  },

  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai/agent/conversations/${id}`);
  },

  submitFeedback: async (messageId: string, rating: 'POSITIVE' | 'NEGATIVE', comment?: string): Promise<void> => {
    await apiClient.post(`/ai/agent/messages/${messageId}/feedback`, { rating, comment });
  },
};
