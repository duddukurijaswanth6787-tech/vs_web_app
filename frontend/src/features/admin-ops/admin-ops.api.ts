import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export const adminOpsApi = {
  // ── AI Recommendations ─────────────────────────────────
  generateRecommendations: async (customerUserId: string) => {
    const res = await apiClient.post<StandardResponse<any>>('/ai/recommendations/admin/generate', {
      customerUserId,
    });
    return res.data.data!;
  },

  listRecommendations: async (customerUserId: string, params: Record<string, string | number> = {}) => {
    const res = await apiClient.get<StandardResponse<any>>(
      `/ai/recommendations/admin/${customerUserId}`,
      { params },
    );
    return res.data.data!;
  },

  // ── SMS ───────────────────────────────────────────────
  sendSms: async (dto: { phone: string; template: string; message: string; userId?: string }) => {
    const res = await apiClient.post<StandardResponse<any>>('/sms/send', dto);
    return res.data.data!;
  },

  sendOrderSms: async (dto: { orderId: string; template?: string }) => {
    const res = await apiClient.post<StandardResponse<any>>('/sms/order', dto);
    return res.data.data!;
  },

  smsLogs: async (page = 1, limit = 20) => {
    const res = await apiClient.get<StandardResponse<any>>('/sms/logs', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  // ── Push ──────────────────────────────────────────────
  sendPush: async (dto: {
    title: string;
    body: string;
    userId?: string;
    data?: Record<string, unknown>;
  }) => {
    const res = await apiClient.post<StandardResponse<any>>('/push/send', dto);
    return res.data.data!;
  },

  pushLogs: async (page = 1, limit = 20) => {
    const res = await apiClient.get<StandardResponse<any>>('/push/logs', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  // ── DTDC ──────────────────────────────────────────────
  createDtdcShipment: async (dto: {
    orderId: string;
    serviceType?: string;
    weightKg?: number;
    pieces?: number;
  }) => {
    const res = await apiClient.post<StandardResponse<any>>('/shipping/dtdc/shipments', dto);
    return res.data.data!;
  },

  trackDtdc: async (awbOrId: string) => {
    const res = await apiClient.get<StandardResponse<any>>(
      `/shipping/dtdc/shipments/${awbOrId}/track`,
    );
    return res.data.data!;
  },

  dtdcLabel: async (awbOrId: string) => {
    const res = await apiClient.get<StandardResponse<any>>(
      `/shipping/dtdc/shipments/${awbOrId}/label`,
    );
    return res.data.data!;
  },

  dtdcByOrder: async (orderId: string) => {
    const res = await apiClient.get<StandardResponse<any>>(
      `/shipping/dtdc/shipments/order/${orderId}`,
    );
    return res.data.data!;
  },
};
