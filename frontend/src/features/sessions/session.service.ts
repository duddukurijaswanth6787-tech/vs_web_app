import { apiClient } from '@/lib/api/client';
import { UserSession, SessionStats } from './session.types';

export const sessionService = {
  getSessions: async (): Promise<UserSession[]> => {
    try {
      const res = await apiClient.get<any>('/sessions');
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.data?.data)) return payload.data.data;
      return [];
    } catch {
      return [];
    }
  },

  getCurrentSession: async (): Promise<UserSession | null> => {
    try {
      const res = await apiClient.get<any>('/sessions/current');
      return res.data?.data || res.data || null;
    } catch {
      return null;
    }
  },

  getStats: async (): Promise<SessionStats> => {
    try {
      const res = await apiClient.get<any>('/sessions/stats');
      const d = res.data?.data || res.data || {};
      return {
        totalActiveSessions: d.activeSessions ?? d.totalActiveSessions ?? 0,
        uniqueUsersActive: d.uniqueUsersActive ?? (d.activeSessions ? Math.max(1, d.activeSessions) : 0),
        revokedSessionsCount: d.revokedSessions ?? d.revokedSessionsCount ?? 0,
        expiredSessionsCount: d.expiredSessions ?? d.expiredSessionsCount ?? 0,
      };
    } catch {
      return {
        totalActiveSessions: 0,
        uniqueUsersActive: 0,
        revokedSessionsCount: 0,
        expiredSessionsCount: 0,
      };
    }
  },

  revokeSession: async (id: string): Promise<UserSession> => {
    const res = await apiClient.post<any>(`/sessions/${id}/revoke`);
    return res.data?.data || res.data;
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
