import { AxiosError, isAxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api.types';

/**
 * Extracts a human-readable message from an unknown caught error.
 * Prefer this over `catch (err: any)` for enterprise-safe typing.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse | { message?: string }>;
    const data = axiosError.response?.data;
    const status = axiosError.response?.status;
    const statusText = status ? `[HTTP ${status}] ` : '';

    if (data && typeof data === 'object') {
      if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
        return `${statusText}${data.message}`;
      }
      if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
        return `${statusText}${data.error}`;
      }
    }
    if (axiosError.message) {
      const urlInfo = axiosError.config?.url ? ` (${axiosError.config.url})` : '';
      return `${statusText}${axiosError.message}${urlInfo}`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}
