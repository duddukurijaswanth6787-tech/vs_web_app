import { apiClient } from '@/lib/api/client';
import { GenerateReportDto, ReportResponse, ExportJob, ExportJobResponse } from './reports.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const reportsService = {
  async getSalesReport(
    startDate?: string,
    endDate?: string,
    granularity?: string,
    channel?: string,
  ): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/sales', {
      // 'ALL' is the absence of a filter, not a channel the backend knows.
      params: { startDate, endDate, granularity, channel: channel === 'ALL' ? undefined : channel },
    });
    return res.data.data!;
  },

  async getInventoryMovementReport(
    startDate?: string,
    endDate?: string,
    granularity?: string,
  ): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/inventory/movements', {
      params: { startDate, endDate, granularity },
    });
    return res.data.data!;
  },

  async getProductCategoryBreakdown(): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/products/category-breakdown');
    return res.data.data!;
  },

  async getInventoryReport(): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/inventory');
    return res.data.data!;
  },

  async getCustomerReport(): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/customers');
    return res.data.data!;
  },

  async getOrderReport(
    startDate?: string,
    endDate?: string,
    channel?: string,
  ): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>('/reports/orders', {
      params: { startDate, endDate, channel: channel === 'ALL' ? undefined : channel },
    });
    return res.data.data!;
  },

  async getListReport(type: string, startDate?: string, endDate?: string, page = 1, limit = 50): Promise<ReportResponse> {
    const res = await apiClient.get<ApiResponse<ReportResponse>>(`/reports/list/${type.toLowerCase()}`, {
      params: { startDate, endDate, page, limit },
    });
    return res.data.data!;
  },

  async createExportJob(dto: GenerateReportDto): Promise<ExportJobResponse> {
    const res = await apiClient.post<ApiResponse<ExportJobResponse>>('/reports/export', dto);
    return res.data.data!;
  },

  async getExportJobs(page = 1, limit = 10): Promise<PaginatedResponse<ExportJob>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<ExportJob>>>('/reports/exports', {
      params: { page, limit },
    });
    return res.data.data!;
  },

  async getExportJobDownloadUrl(id: string): Promise<{ url: string }> {
    const res = await apiClient.get<ApiResponse<{ url: string }>>(`/reports/exports/${id}/download`);
    return res.data.data!;
  },
};
