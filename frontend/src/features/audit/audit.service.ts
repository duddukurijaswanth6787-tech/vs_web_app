import { apiClient } from '@/lib/api/client';
import { AuditLogQueryDto, AuditLogResponse, AuditStats, CompareVersionResponse } from './audit.types';
import { StandardResponse, PaginatedResponse } from '@/types/api.types';

type ApiResponse<T> = StandardResponse<T>;

export const auditService = {
  async getAuditLogs(query: AuditLogQueryDto): Promise<PaginatedResponse<AuditLogResponse>> {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<AuditLogResponse>>>('/audit-logs', {
      params: query,
    });
    return res.data.data!;
  },

  async getAuditLogById(id: string): Promise<AuditLogResponse> {
    const res = await apiClient.get<ApiResponse<AuditLogResponse>>(`/audit-logs/${id}`);
    return res.data.data!;
  },

  async getAuditStats(): Promise<AuditStats> {
    const res = await apiClient.get<ApiResponse<AuditStats>>('/audit-logs/stats');
    return res.data.data!;
  },

  async getEntityHistory(resource: string, resourceId: string): Promise<AuditLogResponse[]> {
    const res = await apiClient.get<ApiResponse<AuditLogResponse[]>>(`/audit-logs/entity/${resource}/${resourceId}`);
    return res.data.data!;
  },

  async compareVersions(id: string): Promise<CompareVersionResponse> {
    const res = await apiClient.get<ApiResponse<CompareVersionResponse>>(`/audit-logs/compare/${id}`);
    return res.data.data!;
  },
};
