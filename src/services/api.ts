import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage } from './error';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const GLOBAL_FEEDBACK_EVENT = 'nextlevel:error-feedback';
const COMPANY_ACCESS_INVALID_EVENT = 'nextlevel:company-access-invalid';
const AUTH_CHANGED_EVENT = 'nextlevel:auth-changed';
const BILLING_ACCESS_INVALID_EVENT = 'nextlevel:billing-access-invalid';
const BILLING_CACHE_PREFIX = 'nextlevel:billing:';
const DEFAULT_API_TIMEOUT_MS = 30000;

const rawEnvBaseUrl =
  import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '';

const RENDER_BACKEND_HOST = 'next-level-backend.onrender.com';

function shouldPreferSameOriginApi(configuredUrl: string) {
  if (typeof window === 'undefined') return false;

  const appHost = window.location.hostname;
  const isHostedApp =
    appHost === 'nextlevel.qzz.io' || appHost.endsWith('.vercel.app');
  if (!isHostedApp) return false;

  const raw = configuredUrl.trim();
  if (!raw) return true;

  try {
    const url = new URL(raw, window.location.origin);
    return url.hostname === RENDER_BACKEND_HOST;
  } catch {
    return false;
  }
}

function normalizeApiBaseUrl(configuredUrl: string) {
  if (shouldPreferSameOriginApi(configuredUrl)) {
    return window.location.origin;
  }

  const fallbackUrl = 'https://next-level-backend.onrender.com';
  const candidate = String(configuredUrl || fallbackUrl).trim();
  if (candidate.startsWith('/')) {
    return candidate.replace(/\/+$/, '');
  }
  const httpsUrl = candidate.replace(/^http:\/\//i, 'https://');
  return httpsUrl.replace(/\/+$/, '');
}

const rawBaseUrl = normalizeApiBaseUrl(rawEnvBaseUrl);
export const apiBaseURL = rawBaseUrl
  ? (/\/api$/i.test(rawBaseUrl) ? rawBaseUrl : `${rawBaseUrl}/api`)
  : 'https://next-level-backend.onrender.com/api';
const baseURL = apiBaseURL;

let refreshPromise: Promise<boolean> | null = null;
let accessToken: string | null = null;
let legacyRefreshToken: string | null = null;

axios.defaults.withCredentials = true;

function readAccessToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as {
    accessToken?: unknown;
    access_token?: unknown;
    token?: unknown;
    data?: unknown;
    result?: unknown;
    tokens?: unknown;
  };
  const direct = data.accessToken || data.access_token || data.token;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  return readAccessToken(data.data || data.result || data.tokens);
}

function readRefreshToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as {
    refreshToken?: unknown;
    refresh_token?: unknown;
    data?: unknown;
    result?: unknown;
    tokens?: unknown;
  };
  const direct = data.refreshToken || data.refresh_token;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  return readRefreshToken(data.data || data.result || data.tokens);
}

function setAccessToken(nextAccessToken: string | null) {
  accessToken = nextAccessToken?.trim() || null;
}

function setLegacyRefreshToken(nextRefreshToken: string | null) {
  legacyRefreshToken = nextRefreshToken?.trim() || null;
}

function captureAccessToken(payload: unknown) {
  const nextAccessToken = readAccessToken(payload);
  const nextRefreshToken = readRefreshToken(payload);
  if (nextRefreshToken) setLegacyRefreshToken(nextRefreshToken);
  if (!nextAccessToken) return false;
  setAccessToken(nextAccessToken);
  return true;
}

function isAuthEndpoint(url: string) {
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
}

function removeLegacyTokenStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function clearAccessToken() {
  setAccessToken(null);
  setLegacyRefreshToken(null);
  removeLegacyTokenStorage();
}

function clearAuthStorage() {
  clearAccessToken();
  clearBillingStorage();
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

async function refreshSession(options: { redirectOnFailure?: boolean } = {}): Promise<boolean> {
  try {
    const legacyPayload = legacyRefreshToken ? { refresh_token: legacyRefreshToken } : undefined;
    const response = await api.post('/auth/refresh', legacyPayload, legacyRefreshToken
      ? { headers: { 'x-refresh-token': legacyRefreshToken } }
      : undefined);
    if (!captureAccessToken(response.data)) {
      return false;
    }
    removeLegacyTokenStorage();
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
    return true;
  } catch {
    if (options.redirectOnFailure) {
      clearAuthStorage();
    } else {
      clearAccessToken();
    }
    return false;
  }
}

function shouldSkipAuthRetry(config: InternalAxiosRequestConfig) {
  const url = config.url || '';
  return isAuthEndpoint(url);
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
  timeout: DEFAULT_API_TIMEOUT_MS,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.withCredentials = true;
  removeLegacyTokenStorage();
  const url = config.url || '';
  if (accessToken && !isAuthEndpoint(url)) {
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const url = response.config.url || '';
    if (url.includes('/auth/logout')) {
      setAccessToken(null);
      removeLegacyTokenStorage();
      return response;
    }
    captureAccessToken(response.data);
    return response;
  },
  async (error: AxiosError) => {
    const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!originalConfig || error.response?.status !== 401 || originalConfig._retry || shouldSkipAuthRetry(originalConfig)) {
      dispatchFriendlyApiError(error);
      return Promise.reject(error);
    }

    originalConfig._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshSession({ redirectOnFailure: true }).finally(() => {
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (!refreshed) {
      dispatchFriendlyApiError(error);
      return Promise.reject(error);
    }

    return api.request(originalConfig);
  },
);

export { api };

export async function restoreAuthSession(options: { redirectOnFailure?: boolean } = {}) {
  const refreshed = await refreshSession({ redirectOnFailure: options.redirectOnFailure ?? false });
  if (!refreshed) return null;

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

export async function restoreAuthSessionFromCallbackHash(hash: string) {
  const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(rawHash);
  const callbackAccessToken =
    params.get('accessToken') || params.get('access_token') || params.get('token');

  if (!callbackAccessToken?.trim()) return null;

  setAccessToken(callbackAccessToken);
  setLegacyRefreshToken(params.get('refreshToken') || params.get('refresh_token'));
  removeLegacyTokenStorage();
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));

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
    clearAccessToken();
    return null;
  }
}

export default api;
