import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getErrorMessage } from './error';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const GLOBAL_FEEDBACK_EVENT = 'nextlevel:error-feedback';
const COMPANY_ACCESS_INVALID_EVENT = 'nextlevel:company-access-invalid';
const AUTH_CHANGED_EVENT = 'nextlevel:auth-changed';
const BILLING_ACCESS_INVALID_EVENT = 'nextlevel:billing-access-invalid';
const BILLING_CACHE_PREFIX = 'nextlevel:billing:';
const DEFAULT_PRODUCTION_API_URL = 'https://next-level-backend.onrender.com';
const DEFAULT_API_TIMEOUT_MS = 30000;

const rawEnvBaseUrl =
  import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '';
const rawBaseUrl = String(
  rawEnvBaseUrl || (import.meta.env.PROD ? DEFAULT_PRODUCTION_API_URL : ''),
).trim().replace(/\/+$/, '');
const baseURL = /\/api$/i.test(rawBaseUrl) ? rawBaseUrl : `${rawBaseUrl}/api`;

let refreshPromise: Promise<boolean> | null = null;

function removeLegacyTokenStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function clearAuthStorage() {
  clearBillingStorage();
  removeLegacyTokenStorage();
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

async function refreshSession(): Promise<boolean> {
  try {
    const refreshClient = axios.create({
      baseURL,
      timeout: DEFAULT_API_TIMEOUT_MS,
      withCredentials: true,
    });
    await refreshClient.post('/auth/refresh', {});
    removeLegacyTokenStorage();
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
    return true;
  } catch {
    clearAuthStorage();
    return false;
  }
}

function shouldSkipAuthRetry(config: InternalAxiosRequestConfig) {
  const url = config.url || '';
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
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
  removeLegacyTokenStorage();
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
      refreshPromise = refreshSession().finally(() => {
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
export default api;
