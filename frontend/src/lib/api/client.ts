import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthTokens } from '@/types/auth.types';

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      if (hostname.includes('vasanthissignature.in')) {
        return 'https://api.vasanthissignature.in/api/v1';
      }
      if (hostname.includes('vasanthis-signature.in')) {
        return 'https://api.vasanthis-signature.in/api/v1';
      }
      if (hostname.includes('vasanthisignature.in') || hostname.includes('vercel.app')) {
        return 'https://api.vasanthissignature.in/api/v1';
      }
      return `${protocol}//${hostname}:4000/api/v1`;
    }
    return '/api/v1';
  }
  return 'https://api.vasanthissignature.in/api/v1';
};
export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The backend's /health endpoint is explicitly excluded from its `api/v1`
// global prefix (backend/src/main.ts), so it lives at the origin root, not
// under /api/v1/. This helper strips the trailing `/api/v1` from whatever
// the axios base URL resolves to for the current environment.
export const getUnprefixedBaseUrl = (): string => {
  const base = getApiBaseUrl();
  return base.replace(/\/api\/v1\/?$/, '');
};

// Memory token cache to avoid scattered localStorage reads
let currentAccessToken: string | null = null;
let currentRefreshToken: string | null = null;

// Synchronization lock to ensure a single-flight refresh request
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Initialize tokens from localStorage (safe check for SSR environment)
export const initializeClientTokens = () => {
  if (typeof window !== 'undefined') {
    currentAccessToken = localStorage.getItem('vd_access_token');
    currentRefreshToken = localStorage.getItem('vd_refresh_token');
  }
};

export const setClientTokens = (tokens: AuthTokens | null) => {
  currentAccessToken = tokens?.accessToken || null;
  currentRefreshToken = tokens?.refreshToken || null;

  if (typeof window !== 'undefined') {
    if (tokens) {
      localStorage.setItem('vd_access_token', tokens.accessToken);
      localStorage.setItem('vd_refresh_token', tokens.refreshToken);
    } else {
      localStorage.removeItem('vd_access_token');
      localStorage.removeItem('vd_refresh_token');
    }
  }
};

export const getClientRefreshToken = (): string | null => {
  if (!currentRefreshToken && typeof window !== 'undefined') {
    currentRefreshToken = localStorage.getItem('vd_refresh_token');
  }
  return currentRefreshToken;
};

// Intercept outgoing requests to attach JWT Authorization Bearer header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // LAN-dev convenience only: rewrite to <phone-hostname>:4000 so teammates on
    // the same network can hit the local backend. Never applies once
    // NEXT_PUBLIC_API_BASE_URL is set (UAT/production), since that value is
    // already the correct absolute backend URL and must not be overridden here.
    if (!process.env.NEXT_PUBLIC_API_BASE_URL && typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        config.baseURL = `http://${hostname}:4000/api/v1`;
      }
    }

    if (!currentAccessToken && typeof window !== 'undefined') {
      currentAccessToken = localStorage.getItem('vd_access_token');
    }
    if (currentAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    // Correlation trace support
    const correlationId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    config.headers['x-correlation-id'] = correlationId;
    config.headers['x-request-id'] = correlationId;

    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle standard errors and token expirations (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.warn('[API] Request timeout:', originalRequest?.url);
      } else {
        console.warn('[API] Network error:', originalRequest?.url, error.message);
      }
      return Promise.reject(error);
    }

    const { status } = error.response;

    // Handle session expirations and token refresh
    if (status === 401 && !originalRequest._retry) {
      // Avoid looping if the refresh endpoint itself returns 401
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        handleAuthFailure();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token: string | null) => {
            if (!token) {
              reject(error);
              return;
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getClientRefreshToken();

      if (!refreshToken) {
        isRefreshing = false;
        onRefreshed(null);
        handleAuthFailure();
        return Promise.reject(error);
      }

      try {
        // ponytail: call refresh token API directly via base axios client to avoid header interception loops
        const response = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
          refreshToken,
        });

        const newTokens = response.data?.data;
        if (newTokens && newTokens.accessToken) {
          setClientTokens(newTokens);
          onRefreshed(newTokens.accessToken);
          isRefreshing = false;

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshed(null);
        handleAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function handleAuthFailure() {
  setClientTokens(null);
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const isProtectedRoute =
      currentPath.startsWith('/admin') ||
      currentPath.startsWith('/staff') ||
      currentPath.startsWith('/profile') ||
      currentPath.startsWith('/orders') ||
      currentPath.startsWith('/checkout');

    if (isProtectedRoute && currentPath !== '/login') {
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
    }
  }
}
