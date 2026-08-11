import { isAxiosError } from 'axios';
import { getApiErrorMessage } from '@/utils/api-error';

export type ErrorCategory = 'auth' | 'forbidden' | 'not-found' | 'validation' | 'rate-limit' | 'server' | 'network' | 'timeout' | 'unknown';

export interface ApiErrorInfo {
  message: string;
  status: number | null;
  category: ErrorCategory;
}

export function categorizeApiError(error: unknown): ApiErrorInfo {
  const message = getApiErrorMessage(error);

  if (!isAxiosError(error)) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return { message: 'Network request failed. Please check your connection.', status: null, category: 'network' };
    }
    return { message, status: null, category: 'unknown' };
  }

  if (error.code === 'ECONNABORTED') {
    return { message: 'Request timed out. Please try again.', status: null, category: 'timeout' };
  }

  if (!error.response) {
    return { message: 'Unable to reach the server. Check your network connection.', status: null, category: 'network' };
  }

  const status = error.response.status;
  switch (status) {
    case 400: return { message, status, category: 'validation' };
    case 401: return { message, status, category: 'auth' };
    case 403: return { message, status, category: 'forbidden' };
    case 404: return { message, status, category: 'not-found' };
    case 409: return { message, status, category: 'validation' };
    case 422: return { message, status, category: 'validation' };
    case 429: return { message: 'Too many requests. Please wait before trying again.', status, category: 'rate-limit' };
    default: return { message, status, category: status >= 500 ? 'server' : 'unknown' };
  }
}
