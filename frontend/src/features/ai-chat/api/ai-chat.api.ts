import { apiClient } from '@/lib/api/client';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  tokenCount: number;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  userId: string;
  title?: string;
  status: string;
  tokenCount: number;
  messages?: ChatMessage[];
  createdAt: string;
}

type ApiResponse<T> = StandardResponse<T>;

export const aiChatApi = {
  getConversations: async (page = 1, limit = 20) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<ChatConversation>>>('/ai/chat', {
      params: { page, limit },
    });
    return res.data.data!;
  },
  createConversation: async (title?: string) => {
    const res = await apiClient.post<ApiResponse<ChatConversation>>('/ai/chat', {
      title: title || 'New AI Assistant Session',
    });
    return res.data.data!;
  },
  getMessages: async (conversationId: string) => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<ChatMessage>>>(`/ai/chat/${conversationId}/messages`);
    return res.data.data!;
  },
  sendMessage: async (conversationId: string, content: string) => {
    const res = await apiClient.post<ApiResponse<ChatMessage>>(`/ai/chat/${conversationId}/messages`, { content });
    return res.data.data!;
  },
  addFeedback: async (conversationId: string, rating: number, comment?: string) => {
    const res = await apiClient.post<ApiResponse<null>>(`/ai/chat/${conversationId}/feedback`, {
      type: 'AI_CHAT',
      referenceId: conversationId,
      rating,
      comment,
    });
    return res.data;
  },
};
