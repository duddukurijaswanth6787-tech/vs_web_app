import { apiClient } from '@/lib/api/client';

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export const aiChatApi = {
  getConversations: async (page = 1, limit = 20) => {
    const res = await apiClient.get<ChatConversation[]>(`/ai/chat?page=${page}&limit=${limit}`);
    return res.data;
  },
  createConversation: async (title?: string) => {
    const res = await apiClient.post<ChatConversation>('/ai/chat', { title: title || 'New AI Assistant Session' });
    return res.data;
  },
  getMessages: async (conversationId: string) => {
    const res = await apiClient.get<ChatMessage[]>(`/ai/chat/${conversationId}/messages`);
    return res.data;
  },
  sendMessage: async (conversationId: string, content: string) => {
    const res = await apiClient.post<ChatMessage>(`/ai/chat/${conversationId}/messages`, { content });
    return res.data;
  },
  addFeedback: async (conversationId: string, rating: number, comment?: string) => {
    const res = await apiClient.post(`/ai/chat/${conversationId}/feedback`, { rating, comment });
    return res.data;
  },
};
