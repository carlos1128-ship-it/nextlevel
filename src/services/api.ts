import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage } from './error';

const ACCESS_TOKEN_KEY = 'access_token';
const GLOBAL_FEEDBACK_EVENT = 'nextlevel:error-feedback';
const COMPANY_ACCESS_INVALID_EVENT = 'nextlevel:company-access-invalid';
const AUTH_CHANGED_EVENT = 'nextlevel:auth-changed';
const BILLING_ACCESS_INVALID_EVENT = 'nextlevel:billing-access-invalid';
const BILLING_CACHE_PREFIX = 'nextlevel:billing:';
const DEFAULT_PRODUCTION_API_URL = 'https://next-level-backend.onrender.com';

const rawEnvBaseUrl =
  import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '';
const rawBaseUrl = String(
  rawEnvBaseUrl || (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_URL : ''),
).trim().replace(/\/+$/, '');
const baseURL = /\/api$/i.test(rawBaseUrl) ? rawBaseUrl : `${rawBaseUrl}/api`;

let refreshPromise: Promise<string | null> | null = null;

function getFirstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return null;
}

function clearAuthStorage() {
  clearBillingStorage();
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('selectedCompanyId');
  localStorage.removeItem('auth_user');

  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

function clearBillingStorage() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(BILLING_CACHE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshClient = axios.create({ baseURL, withCredentials: true });
    const { data } = await refreshClient.post<{
      access_token?: string;
      accessToken?: string;
      token?: string;
      user?: Record<string, unknown>;
    }>('/auth/refresh');

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

    if (!nextAccessToken) {
      clearAuthStorage();
      return null;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
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

function isCompanyAccessError(error: AxiosError) {
  if (error.response?.status !== 403) return false;
  const payload = error.response.data;
  const message =
    typeof payload === 'string'
      ? payload
      : payload && typeof payload === 'object'
        ? String((payload as { message?: unknown }).message || '')
        : '';

  return message.toLowerCase().includes('sem acesso a empresa');
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

  if (isCompanyAccessError(error)) {
    localStorage.removeItem('selectedCompanyId');
    window.dispatchEvent(new CustomEvent(COMPANY_ACCESS_INVALID_EVENT));
  }

  const payload = error.response?.data as { code?: string } | undefined;
  if (error.response?.status === 402 || payload?.code === 'SUBSCRIPTION_REQUIRED') {
    clearBillingStorage();
    window.dispatchEvent(new CustomEvent(BILLING_ACCESS_INVALID_EVENT));
    window.dispatchEvent(
      new CustomEvent(GLOBAL_FEEDBACK_EVENT, {
        detail: {
          message: getErrorMessage(error, 'Este recurso exige outro plano.'),
          type: 'error',
        },
      }),
    );
    return;
  }

  if (payload?.code === 'PLAN_UPGRADE_REQUIRED' || payload?.code === 'FEATURE_NOT_INCLUDED' || payload?.code === 'INTEGRATION_NOT_INCLUDED') {
    window.dispatchEvent(
      new CustomEvent(GLOBAL_FEEDBACK_EVENT, {
        detail: {
          message: getErrorMessage(error, 'Este recurso exige outro plano.'),
          type: 'error',
        },
      }),
    );
    return;
  }

  const message = getErrorMessage(
    error,
    'Nao foi possivel concluir esta etapa agora.',
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
  withCredentials: true,
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
export async function restoreAuthSession() {
  const nextToken = await refreshAccessToken();
  if (!nextToken) return null;

  try {
    const { data } = await api.get('/profile');
    return data as {
      name?: string | null;
      email?: string | null;
      admin?: boolean;
      detailLevel?: string;
      theme?: 'dark' | 'light';
      niche?: string | null;
    };
  } catch {
    return null;
  }
}
export default api;
