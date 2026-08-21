import { apiClient } from '@/lib/api/client';
import { UserSession, SessionStats } from './session.types';

export const sessionService = {
  getSessions: async (): Promise<UserSession[]> => {
    const res = await apiClient.get<{ data: UserSession[] }>('/sessions');
    return res.data?.data || (res.data as unknown as UserSession[]) || [];
  },

  getCurrentSession: async (): Promise<UserSession> => {
    const res = await apiClient.get<{ data: UserSession }>('/sessions/current');
    return res.data?.data || (res.data as unknown as UserSession);
  },

  getStats: async (): Promise<SessionStats> => {
    const res = await apiClient.get<{ data: SessionStats }>('/sessions/stats');
    return res.data?.data || (res.data as unknown as SessionStats);
  },

  revokeSession: async (id: string): Promise<UserSession> => {
    const res = await apiClient.post<{ data: UserSession }>(`/sessions/${id}/revoke`);
    return res.data?.data || (res.data as unknown as UserSession);
  },

  revokeOthers: async (currentSessionId: string): Promise<void> => {
    await apiClient.post('/sessions/revoke-others', { currentSessionId });
  },

  revokeAll: async (): Promise<void> => {
    await apiClient.post('/sessions/revoke-all');
  },

  revokeExpired: async (): Promise<void> => {
    await apiClient.post('/sessions/revoke-expired');
  },
};
