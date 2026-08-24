import axios from 'axios';
import { getUnprefixedBaseUrl } from '@/lib/api/client';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  info?: Record<string, { status: string; [key: string]: unknown }>;
  error?: Record<string, { status: string; [key: string]: unknown }>;
  details?: Record<string, { status: string; [key: string]: unknown }>;
}

export const healthService = {
  getHealth: async (): Promise<HealthCheckResponse> => {
    let url = process.env.NEXT_PUBLIC_HEALTH_URL;
    if (!url || url.includes('api.vasanthisignature.in') || url.includes('api.vasanthis-signature.in')) {
      url = `${getUnprefixedBaseUrl()}/health`;
    }
    const response = await axios.get<HealthCheckResponse>(url, {
      timeout: 5000,
    });
    return response.data;
  },
};
