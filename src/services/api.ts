import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage } from './error';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const GLOBAL_FEEDBACK_EVENT = 'nextlevel:error-feedback';

const rawEnvBaseUrl =
  import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '';
const rawBaseUrl = String(rawEnvBaseUrl).trim().replace(/\/+$/, '');
const baseURL = /\/api$/i.test(rawBaseUrl) ? rawBaseUrl : `${rawBaseUrl}/api`;

let refreshPromise: Promise<string | null> | null = null;

function getFirstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

function clearAuthStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('selectedCompanyId');
  localStorage.removeItem('auth_user');

  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    clearAuthStorage();
    return null;
  }

  try {
    const refreshClient = axios.create({ baseURL });
    const { data } = await refreshClient.post<{
      access_token?: string;
      accessToken?: string;
      token?: string;
      refresh_token?: string;
      refreshToken?: string;
    }>('/auth/refresh', {
      refresh_token: refreshToken,
    });

    const payload = data as Record<string, unknown>;
    const nestedData = (payload.data || payload.result || payload.tokens || {}) as Record<string, unknown>;
    const nextAccessToken = getFirstString([
      payload.access_token,
      payload.accessToken,
      payload.token,
      nestedData.access_token,
      nestedData.accessToken,
      nestedData.token,
    ]);
    const nextRefreshToken =
      getFirstString([
        payload.refresh_token,
        payload.refreshToken,
        nestedData.refresh_token,
        nestedData.refreshToken,
      ]) || refreshToken;

    if (!nextAccessToken) {
      clearAuthStorage();
      return null;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    return nextAccessToken;
  } catch {
    clearAuthStorage();
    return null;
  }
}

function shouldSkipAuthRetry(config: InternalAxiosRequestConfig) {
  const url = config.url || '';
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
}

function shouldAttachAuthHeader(config: InternalAxiosRequestConfig) {
  const url = config.url || '';
  return !(url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh'));
}

function dispatchFriendlyApiError(error: AxiosError) {
  if (typeof window === 'undefined') return;

  const config = error.config;
  const url = config?.url || '';
  if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
    return;
  }

  const status = error.response?.status || 0;
  const isRecoverableWhatsappConnectionError =
    (url.includes('/whatsapp/connection') || url.includes('/whatsapp/connect/')) &&
    ([409, 429, 502, 503, 504].includes(status) || !error.response);
  if (isRecoverableWhatsappConnectionError) {
    return;
  }

  const message = getErrorMessage(
    error,
    'Algo saiu do fluxo esperado, mas sua operacao continua protegida.',
  );

  window.dispatchEvent(
    new CustomEvent(GLOBAL_FEEDBACK_EVENT, {
      detail: {
        message,
        type: 'error',
      },
    }),
  );
}

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  config.headers = new AxiosHeaders(config.headers);
  if (token && shouldAttachAuthHeader(config)) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalConfig || error.response?.status !== 401 || originalConfig._retry || shouldSkipAuthRetry(originalConfig)) {
      dispatchFriendlyApiError(error);
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const nextToken = await refreshPromise;
    if (!nextToken) {
      dispatchFriendlyApiError(error);
      return Promise.reject(error);
    }

    originalConfig.headers = new AxiosHeaders(originalConfig.headers);
    originalConfig.headers.set('Authorization', `Bearer ${nextToken}`);

    return api.request(originalConfig);
  },
);

export { api };
export default api;
