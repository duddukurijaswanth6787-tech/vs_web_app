import { apiClient } from '@/lib/api/client';
import { DashboardSummary, SalesChartData, OrderAnalytics, PaymentAnalytics, RecentActivity } from './dashboard.types';
import { StandardResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    if (!res.data?.data) throw new Error('Empty summary response');
    return res.data.data;
  },

  async getSalesChart(period?: string): Promise<SalesChartData> {
    const res = await apiClient.get<ApiResponse<SalesChartData>>('/dashboard/sales-chart', { params: { period } });
    if (!res.data?.data) throw new Error('Empty chart response');
    return res.data.data;
  },

  async getOrderAnalytics(): Promise<OrderAnalytics> {
    const res = await apiClient.get<ApiResponse<OrderAnalytics>>('/dashboard/order-analytics');
    if (!res.data?.data) throw new Error('Empty order analytics response');
    return res.data.data;
  },

  async getPaymentAnalytics(): Promise<PaymentAnalytics> {
    const res = await apiClient.get<ApiResponse<PaymentAnalytics>>('/dashboard/payment-analytics');
    if (!res.data?.data) throw new Error('Empty payment analytics response');
    return res.data.data;
  },

  async getRecentActivity(): Promise<RecentActivity> {
    const res = await apiClient.get<ApiResponse<RecentActivity>>('/dashboard/recent-activity');
    if (!res.data?.data) throw new Error('Empty recent activity response');
    return res.data.data;
  },
};
