import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  AnalyticsPeriod,
  OmnichannelSummary,
  OfflinePosAnalytics,
  OnlineSalesAnalytics,
  InventoryVelocityAnalytics,
} from './analytics.types';

export const analyticsService = {
  getOmnichannel: async (period: AnalyticsPeriod = 'monthly'): Promise<OmnichannelSummary> => {
    const res = await apiClient.get<StandardResponse<OmnichannelSummary>>('/analytics/omnichannel', {
      params: { period },
    });
    return res.data.data!;
  },

  getOfflinePos: async (period: AnalyticsPeriod = 'monthly'): Promise<OfflinePosAnalytics> => {
    const res = await apiClient.get<StandardResponse<OfflinePosAnalytics>>('/analytics/offline-pos', {
      params: { period },
    });
    return res.data.data!;
  },

  getOnlineSales: async (period: AnalyticsPeriod = 'monthly'): Promise<OnlineSalesAnalytics> => {
    const res = await apiClient.get<StandardResponse<OnlineSalesAnalytics>>('/analytics/online-sales', {
      params: { period },
    });
    return res.data.data!;
  },

  getInventoryVelocity: async (): Promise<InventoryVelocityAnalytics> => {
    const res = await apiClient.get<StandardResponse<InventoryVelocityAnalytics>>('/analytics/inventory-velocity');
    return res.data.data!;
  },

  syncAnalytics: async (): Promise<boolean> => {
    await apiClient.post('/analytics/sync');
    return true;
  },
};
