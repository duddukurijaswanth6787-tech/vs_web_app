import { AxiosError, isAxiosError } from 'axios';
import { ApiErrorResponse } from '@/types/api.types';

/**
 * Extracts a human-readable message from an unknown caught error.
 * Prefer this over `catch (err: any)` for enterprise-safe typing.
 */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse | { message?: string; error?: string }>;
    const data = axiosError.response?.data;

    if (data && typeof data === 'object') {
      let rawMsg = '';
      if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
        rawMsg = data.message;
      } else if ('error' in data && typeof data.error === 'string' && data.error.trim()) {
        rawMsg = data.error;
      }
      if (rawMsg) {
        if (rawMsg.includes('Invalid `this.prisma') || rawMsg.includes('Database operation failed') || rawMsg.includes('dist/src/domains')) {
          return 'Unable to process request. Please try again later.';
        }
        return rawMsg;
      }
    }
    if (axiosError.message) {
      if (axiosError.message.includes('timeout')) return 'Request timed out. Please try again.';
      return axiosError.message;
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
