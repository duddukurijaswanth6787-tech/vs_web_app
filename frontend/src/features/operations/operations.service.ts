import { apiClient, getUnprefixedBaseUrl } from '@/lib/api/client';
import { SystemHealth } from './operations.types';

export const operationsService = {
  async getHealth(): Promise<SystemHealth> {
    // /health is excluded from the backend's api/v1 global prefix and lives
    // at the origin root, so the versioned baseURL has to be stripped.
    const res = await apiClient.get<SystemHealth>('/health', {
      baseURL: getUnprefixedBaseUrl(),
    });
    return res.data;
  },
};
