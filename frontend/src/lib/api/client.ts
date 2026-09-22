import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AuthTokens } from '@/types/auth.types';
import { reportClientError } from '@/lib/error-reporter';

export const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://api.vasanthissignature.in/api/v1';
    }
    return '/api/v1';
  }
  return 'https://api.vasanthissignature.in/api/v1';
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 20000,
  withCredentials: true,
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

// Memory-first access token cache with persistent localStorage fallback.
let currentAccessToken: string | null = null;

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

export const initializeClientTokens = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('vd_access_token') || sessionStorage.getItem('vd_access_token');
    if (token) currentAccessToken = token;
  }
};

export const setClientTokens = (tokens: AuthTokens | null) => {
  currentAccessToken = tokens?.accessToken || null;
  if (typeof window !== 'undefined') {
    try {
      if (tokens?.accessToken) {
        localStorage.setItem('vd_access_token', tokens.accessToken);
        sessionStorage.setItem('vd_access_token', tokens.accessToken);
      } else {
        localStorage.removeItem('vd_access_token');
        sessionStorage.removeItem('vd_access_token');
      }

      if (tokens?.refreshToken) {
        localStorage.setItem('vd_refresh_token', tokens.refreshToken);
        sessionStorage.setItem('vd_refresh_token', tokens.refreshToken);
      } else if (tokens === null) {
        localStorage.removeItem('vd_refresh_token');
        sessionStorage.removeItem('vd_refresh_token');
      }
    } catch {
      // safe storage fallback
    }
  }
  bootstrapSettled = true;
};

export const getStoredAccessToken = (): string | null => {
  if (currentAccessToken) return currentAccessToken;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('vd_access_token') || sessionStorage.getItem('vd_access_token');
      if (stored) {
        currentAccessToken = stored;
        return stored;
      }
    } catch {
      // safe fallback
    }
  }
  return null;
};

export const getClientRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('vd_refresh_token') || sessionStorage.getItem('vd_refresh_token') || null;
    } catch {
      return null;
    }
  }
  return null;
};

let bootstrapSettled = false;
let bootstrapPromise: Promise<void> | null = null;

const bootstrapAccessToken = (): Promise<void> => {
  if (getStoredAccessToken()) {
    bootstrapSettled = true;
    return Promise.resolve();
  }

  if (!bootstrapPromise) {
    const refreshToken = getClientRefreshToken();
    bootstrapPromise = axios
      .post(
        `${getApiBaseUrl()}/auth/refresh`,
        refreshToken ? { refreshToken } : {},
        { withCredentials: true }
      )
      .then((res) => {
        const tokens = res.data?.data;
        if (tokens?.accessToken) {
          setClientTokens(tokens);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        bootstrapSettled = true;
        bootstrapPromise = null;
      });
  }
  return bootstrapPromise;
};

export const hasClientAccessToken = (): boolean => !!getStoredAccessToken();

/**
 * Resolves whether this visitor has a session, doing the one-time bootstrap if
 * it has not run yet.
 */
export const resolveSession = async (): Promise<boolean> => {
  if (getStoredAccessToken()) return true;
  if (!bootstrapSettled) await bootstrapAccessToken();
  return !!getStoredAccessToken();
};

// Intercept outgoing requests to attach JWT Authorization Bearer header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url || '';
    const isAuthEntryPoint =
      url.includes('/auth/refresh') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/google') ||
      url.includes('/auth/otp');
    if (!getStoredAccessToken() && !bootstrapSettled && !isAuthEntryPoint) {
      await bootstrapAccessToken();
    }

    if (!config.baseURL) {
      config.baseURL = getApiBaseUrl();
    }

    const token = getStoredAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
        reportClientError({
          message: `Request timeout: ${originalRequest?.url || 'API'}`,
          status: 408,
          errorCode: 'TIMEOUT',
        });
      } else {
        console.warn('[API] Network error:', originalRequest?.url, error.message);
        reportClientError({
          message: `Network error reaching ${originalRequest?.url || 'backend'}: ${error.message}`,
          status: 0,
          errorCode: error.code || 'ERR_NETWORK',
        });
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // Report unexpected server and client errors to admin notifications (except normal auth check 401/403)
    const reqUrl = originalRequest?.url || '';
    const isReportingEndpoint = reqUrl.includes('/notifications/client-error');
    const isNormalAuthCheck =
      (status === 401 || status === 403) &&
      (reqUrl.includes('/auth/me') || reqUrl.includes('/auth/refresh') || reqUrl.includes('/auth/login'));

    if (status >= 400 && !isReportingEndpoint && !isNormalAuthCheck) {
      const serverMsg =
        (data as Record<string, unknown>)?.message ||
        (data as Record<string, unknown>)?.error ||
        error.message ||
        `HTTP ${status} error`;
      const code =
        (data as Record<string, unknown>)?.code ||
        (data as Record<string, unknown>)?.errorCode ||
        `HTTP_${status}`;

      reportClientError({
        message: typeof serverMsg === 'string' ? serverMsg : JSON.stringify(serverMsg),
        status,
        errorCode: String(code),
        url: typeof window !== 'undefined' ? window.location.href : reqUrl,
        metadata: {
          endpoint: reqUrl,
          method: originalRequest?.method?.toUpperCase(),
        },
      });
    }

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

      try {
        const refreshToken = getClientRefreshToken();
        const response = await axios.post(`${getApiBaseUrl()}/auth/refresh`, refreshToken ? { refreshToken } : {}, {
          withCredentials: true,
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
