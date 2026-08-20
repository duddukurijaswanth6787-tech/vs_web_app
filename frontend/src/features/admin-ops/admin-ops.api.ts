import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface AiRecommendationDto {
  id: string;
  customerUserId: string;
  recommendedProducts: Array<Record<string, unknown>>;
  createdAt: string;
  [key: string]: unknown;
}

export interface SmsResultDto {
  success: boolean;
  messageId?: string;
  status: string;
}

export interface PushResultDto {
  success: boolean;
  status?: string;
  targetCount?: number;
  successCount?: number;
  notificationId?: string;
  recipientCount?: number;
  [key: string]: unknown;
}

export interface OtpGatewayConfigDto {
  provider: 'mock' | 'startmessaging';
  appName: string;
  templateLogin: string;
  templateRegister: string;
  templateVerifyPhone: string;
  templateOrderConfirmed: string;
  expiryMinutes: number;
  apiKeyConfigured: boolean;
}

export interface OtpTemplateOptionDto {
  id: string;
  body: string;
  usesAppName: boolean;
  usesExpiry: boolean;
}

export interface SessionExpirySettingsDto {
  accessTokenMinutes: number;
  rememberMeAccessTokenDays: number;
  refreshTokenDays: number;
  rememberMeRefreshTokenDays: number;
}

export interface DtdcShipmentDto {
  id: string;
  orderId: string;
  awbNumber: string;
  status: string;
  serviceType?: string;
  labelUrl?: string;
  trackingUrl?: string;
  [key: string]: unknown;
}

export const adminOpsApi = {
  // ── AI Recommendations ─────────────────────────────────
  generateRecommendations: async (customerUserId: string): Promise<AiRecommendationDto> => {
    const res = await apiClient.post<StandardResponse<AiRecommendationDto>>('/ai/recommendations/admin/generate', {
      customerUserId,
    });
    return res.data.data!;
  },

  listRecommendations: async (customerUserId: string, params: Record<string, string | number> = {}): Promise<AiRecommendationDto[]> => {
    const res = await apiClient.get<StandardResponse<AiRecommendationDto[]>>(
      `/ai/recommendations/admin/${customerUserId}`,
      { params },
    );
    return res.data.data!;
  },

  // ── SMS ───────────────────────────────────────────────
  sendSms: async (dto: { phone: string; template: string; message: string; userId?: string }): Promise<SmsResultDto> => {
    const res = await apiClient.post<StandardResponse<SmsResultDto>>('/sms/send', dto);
    return res.data.data!;
  },

  sendOrderSms: async (dto: { orderId: string; template?: string }): Promise<SmsResultDto> => {
    const res = await apiClient.post<StandardResponse<SmsResultDto>>('/sms/order', dto);
    return res.data.data!;
  },

  smsLogs: async (page = 1, limit = 20): Promise<{ logs: Array<Record<string, unknown>>; total: number }> => {
    const res = await apiClient.get<StandardResponse<{ logs: Array<Record<string, unknown>>; total: number }>>('/sms/logs', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  // ── OTP Gateway ───────────────────────────────────────
  getOtpGatewayConfig: async (): Promise<OtpGatewayConfigDto> => {
    const res = await apiClient.get<StandardResponse<OtpGatewayConfigDto>>('/admin/otp-gateway/config');
    return res.data.data!;
  },

  updateOtpGatewayConfig: async (
    dto: Partial<Omit<OtpGatewayConfigDto, 'apiKeyConfigured'>> & { apiKey?: string },
  ): Promise<OtpGatewayConfigDto> => {
    const res = await apiClient.put<StandardResponse<OtpGatewayConfigDto>>('/admin/otp-gateway/config', dto);
    return res.data.data!;
  },

  getOtpTemplates: async (): Promise<OtpTemplateOptionDto[]> => {
    const res = await apiClient.get<StandardResponse<OtpTemplateOptionDto[]>>('/admin/otp-gateway/templates');
    return res.data.data!;
  },

  // ── Session / login token expiry ───────────────────────
  getSessionSettings: async (): Promise<SessionExpirySettingsDto> => {
    const res = await apiClient.get<StandardResponse<SessionExpirySettingsDto>>('/admin/session-settings');
    return res.data.data!;
  },

  updateSessionSettings: async (
    dto: Partial<SessionExpirySettingsDto>,
  ): Promise<SessionExpirySettingsDto> => {
    const res = await apiClient.put<StandardResponse<SessionExpirySettingsDto>>('/admin/session-settings', dto);
    return res.data.data!;
  },

  // ── Push ──────────────────────────────────────────────
  sendPush: async (dto: {
    title: string;
    body: string;
    userId?: string;
    data?: Record<string, unknown>;
  }): Promise<PushResultDto> => {
    const res = await apiClient.post<StandardResponse<PushResultDto>>('/push/send', dto);
    return res.data.data!;
  },

  pushLogs: async (page = 1, limit = 20): Promise<{ logs: Array<Record<string, unknown>>; total: number }> => {
    const res = await apiClient.get<StandardResponse<{ logs: Array<Record<string, unknown>>; total: number }>>('/push/logs', {
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
  }): Promise<DtdcShipmentDto> => {
    const res = await apiClient.post<StandardResponse<DtdcShipmentDto>>('/shipping/dtdc/shipments', dto);
    return res.data.data!;
  },

  trackDtdc: async (awbOrId: string): Promise<Record<string, unknown>> => {
    const res = await apiClient.get<StandardResponse<Record<string, unknown>>>(
      `/shipping/dtdc/shipments/${awbOrId}/track`,
    );
    return res.data.data!;
  },

  dtdcLabel: async (awbOrId: string): Promise<{ labelUrl: string }> => {
    const res = await apiClient.get<StandardResponse<{ labelUrl: string }>>(
      `/shipping/dtdc/shipments/${awbOrId}/label`,
    );
    return res.data.data!;
  },

  dtdcByOrder: async (orderId: string): Promise<DtdcShipmentDto> => {
    const res = await apiClient.get<StandardResponse<DtdcShipmentDto>>(
      `/shipping/dtdc/shipments/order/${orderId}`,
    );
    return res.data.data!;
  },
};
