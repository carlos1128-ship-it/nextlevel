import React, { useCallback, useEffect, useState, createContext, useContext, ReactNode, lazy, Suspense, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Integrations from './pages/Integrations';
import Companies from './pages/Companies';
import LoginPage from './pages/LoginPage';
import { ToastProvider } from './components/Toast';
import NextLevelLoader from './components/NextLevelLoader';
import { SplashScreen } from './src/components/ui/SplashScreen';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import { DASHBOARD_ROUTE } from './src/app/routes';
import { useDetailLevel } from './src/hooks/useDetailLevel';
import { useTheme } from './src/hooks/useTheme';
import type { Company, DetailLevel, UserNiche } from './src/types/domain';
import NotFound from './src/app/not-found';
import { applyMetadata, resolveMetadata } from './src/app/layout';
import { getBillingMe, getCompanies, getCompanyPersonalizationStatus, getUserProfile } from './src/services/endpoints';
import api, { clearAccessToken } from './src/services/api';
import {
  buildPlanosSubscribeUrl,
  clearPendingSelectedPlan,
  readPendingSelectedPlan,
  readPlanSelectionFromSearch,
} from './src/utils/billingSelection';
import { restoreAuthSession } from './src/services/api';

// Lazy load pages with heavy dependencies
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const Insights = lazy(() => import('./pages/Insights'));
const FinancialFlow = lazy(() => import('./pages/FinancialFlow'));
const Plans = lazy(() => import('./pages/Plans'));
const BillingSuccess = lazy(() => import('./pages/BillingSuccess'));
const BillingCancel = lazy(() => import('./pages/BillingCancel'));
const PlanUsage = lazy(() => import('./pages/PlanUsage'));
const Products = lazy(() => import('./pages/Products'));
const Orders = lazy(() => import('./pages/Orders'));
const Customers = lazy(() => import('./pages/Customers'));
const Costs = lazy(() => import('./pages/Costs'));
const AddData = lazy(() => import('./pages/AddData'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const MarketIntel = lazy(() => import('./pages/MarketIntel'));
const Attendant = lazy(() => import('./pages/Attendant'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));
const OnboardingPersonalization = lazy(() => import('./pages/OnboardingPersonalization'));
const Help = lazy(() => import('./pages/Help'));
const Alerts = lazy(() => import('./pages/Alerts'));

// Authentication Context
interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isProfileReady: boolean;
  isCompanyReady: boolean;
  authSessionKey: string | null;
  username: string | null;
  email: string | null;
  niche: UserNiche | null;
  selectedCompanyId: string | null;
  detailLevel: DetailLevel;
  theme: 'dark' | 'light';
  setSelectedCompanyId: (value: string | null) => void;
  setNiche: (value: UserNiche | null) => void;
  setDetailLevel: (value: DetailLevel) => void;
  setTheme: (value: 'dark' | 'light') => void;
  login: (user: { name?: string | null; email?: string | null; admin?: boolean; niche?: UserNiche | null }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const BillingContext = createContext<BillingContextType | null>(null);
const COMPANY_ID_STORAGE_KEY = "selectedCompanyId";
const AUTH_USER_STORAGE_KEY = "auth_user";
const ONBOARDING_STATUS_CACHE_PREFIX = "nextlevel:onboarding-status:";
const COMPANY_ACCESS_INVALID_EVENT = "nextlevel:company-access-invalid";
const AUTH_CHANGED_EVENT = "nextlevel:auth-changed";
const BILLING_ACCESS_INVALID_EVENT = "nextlevel:billing-access-invalid";
const BILLING_CACHE_PREFIX = "nextlevel:billing:";
const BILLING_CACHE_TTL_MS = 5 * 60 * 1000;
const BILLING_VALIDATION_TIMEOUT_MS = 15000;
const AUTH_CALLBACK_TIMEOUT_MS = 15000;
const AUTH_CALLBACK_START_DELAY_MS = 0;
const getCompanyId = (company: Partial<Company> | null | undefined) => company?.id || company?._id || null;

type BillingStatus = "UNKNOWN" | "ACTIVE" | "INACTIVE";
type AuthCallbackState = "callbackLoading" | "authResolved" | "companyResolved" | "billingResolved" | "success" | "error";

type BillingPlanKey = "COMMON" | "PREMIUM" | "PRO_BUSINESS";

const PLAN_LEVELS: Record<BillingPlanKey, number> = {
  COMMON: 1,
  PREMIUM: 2,
  PRO_BUSINESS: 3,
};

const PLAN_LABELS: Record<BillingPlanKey, string> = {
  COMMON: "Essencial",
  PREMIUM: "Premium",
  PRO_BUSINESS: "Pro Business",
};

function normalizePlanKey(plan: string | null | undefined): BillingPlanKey | null {
  const normalized = String(plan || "").trim().toUpperCase();
  if (normalized === "COMUM" || normalized === "ESSENTIAL" || normalized === "ESSENCIAL") return "COMMON";
  if (normalized === "PRO" || normalized === "PREMIUM") return "PREMIUM";
  if (normalized === "BUSINESS" || normalized === "PROBUSINESS" || normalized === "ENTERPRISE") return "PRO_BUSINESS";
  return normalized === "COMMON" || normalized === "PRO_BUSINESS" ? (normalized as BillingPlanKey) : null;
}

function hasPlanLevel(currentPlan: string | null, requiredPlan: BillingPlanKey) {
  const normalized = normalizePlanKey(currentPlan);
  return Boolean(normalized && PLAN_LEVELS[normalized] >= PLAN_LEVELS[requiredPlan]);
}

type BillingCacheEntry = {
  userKey: string;
  status: BillingStatus;
  hasActiveSubscription: boolean;
  currentPlan: string | null;
  checkedAt: number;
};

type BillingContextType = {
  billingStatus: BillingStatus;
  hasActiveSubscription: boolean;
  currentPlan: string | null;
  isBillingLoaded: boolean;
  isBillingValidating: boolean;
  billingError: string | null;
  lastCheckedAt: number | null;
  hasCachedBillingStatus: boolean;
  refreshBilling: (force?: boolean) => Promise<BillingCacheEntry | null>;
  clearBilling: () => void;
};

function readCachedOnboardingRedirect(companyId: string | null) {
  if (!companyId) return null;
  const raw = sessionStorage.getItem(`${ONBOARDING_STATUS_CACHE_PREFIX}${companyId}`);
  if (raw === "redirect") return true;
  if (raw === "ready") return false;
  return null;
}

function writeCachedOnboardingRedirect(companyId: string | null, shouldRedirect: boolean) {
  if (!companyId) return;
  sessionStorage.setItem(`${ONBOARDING_STATUS_CACHE_PREFIX}${companyId}`, shouldRedirect ? "redirect" : "ready");
}

type StoredAuthUser = {
  name: string | null;
  email: string | null;
  admin: boolean;
  niche: UserNiche | null;
};

function writeStoredUser(user: StoredAuthUser) {
  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

function readStoredUser() {
  const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) {
    return { name: null as string | null, email: null as string | null, admin: false, niche: null as UserNiche | null };
  }
  try {
    const parsed = JSON.parse(raw) as { name?: string | null; email?: string | null; admin?: boolean; niche?: UserNiche | null };
    return {
      name: parsed.name || null,
      email: parsed.email || null,
      admin: Boolean(parsed.admin),
      niche: parsed.niche || null,
    };
  } catch {
    return { name: null as string | null, email: null as string | null, admin: false, niche: null as UserNiche | null };
  }
}

function sessionFingerprint(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();
  return normalizedEmail ? `cookie:${normalizedEmail}` : `cookie:${Date.now()}`;
}

function billingUserKey(email: string | null, authSessionKey: string | null, companyId?: string | null) {
  if (!companyId) return null;
  const normalizedEmail = email?.trim().toLowerCase();
  const companySegment = companyId;
  if (normalizedEmail) return `email:${normalizedEmail}:company:${companySegment}:${authSessionKey || 'no-token'}`;
  if (authSessionKey) return `token:${authSessionKey}:company:${companySegment}`;
  return null;
}

function billingCacheKey(userKey: string) {
  return `${BILLING_CACHE_PREFIX}${userKey}`;
}

function readBillingCache(userKey: string | null): BillingCacheEntry | null {
  if (!userKey) return null;
  const raw = sessionStorage.getItem(billingCacheKey(userKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BillingCacheEntry;
    if (parsed.userKey !== userKey) return null;
    if (Date.now() - Number(parsed.checkedAt || 0) > BILLING_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeBillingCache(entry: BillingCacheEntry) {
  sessionStorage.setItem(billingCacheKey(entry.userKey), JSON.stringify(entry));
}

function clearAllBillingCache() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(BILLING_CACHE_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, code: string): Promise<T> {
  let timeoutId: number | null = null;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(code)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  });
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const storedUser = readStoredUser();
  const storedCompanyId = localStorage.getItem(COMPANY_ID_STORAGE_KEY);
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  const hasStoredSession = Boolean(storedUser.email || storedUser.name);
  const [isLoggedIn, setIsLoggedIn] = useState(hasStoredSession);
  const [isAdmin, setIsAdmin] = useState(Boolean(storedUser.admin));
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [isCompanyReady, setIsCompanyReady] = useState(false);
  const [authSessionKey, setAuthSessionKey] = useState<string | null>(
    hasStoredSession ? sessionFingerprint(storedUser.email) : null,
  );
  const [username, setUsername] = useState<string | null>(storedUser.name);
  const [email, setEmail] = useState<string | null>(storedUser.email);
  const [niche, setNicheState] = useState<UserNiche | null>(storedUser.niche);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const [companyRefreshTick, setCompanyRefreshTick] = useState(0);
  const { detailLevel, setDetailLevel } = useDetailLevel();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    let cancelled = false;

    restoreAuthSession()
      .then((profile) => {
        if (cancelled) return;
        if (!profile) {
          setIsLoggedIn(false);
          setIsProfileReady(true);
          setIsCompanyReady(true);
          return;
        }

        setIsLoggedIn(true);
        setAuthSessionKey(sessionFingerprint(profile.email));
        setIsAdmin(Boolean(profile.admin));
        setUsername(profile.name || null);
        setEmail(profile.email || null);
        setNicheState((profile.niche as UserNiche | null) || null);
        writeStoredUser({
          name: profile.name || null,
          email: profile.email || null,
          admin: Boolean(profile.admin),
          niche: (profile.niche as UserNiche | null) || null,
        });
        setIsProfileReady(true);
        setIsCompanyReady(false);
      })
      .catch(() => {
        if (cancelled) return;
        setIsLoggedIn(false);
        setIsProfileReady(true);
        setIsCompanyReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setSelectedCompanyId = useCallback((value: string | null) => {
    setSelectedCompanyIdState(value);
    if (value) {
      localStorage.setItem(COMPANY_ID_STORAGE_KEY, value);
      return;
    }
    localStorage.removeItem(COMPANY_ID_STORAGE_KEY);
  }, []);

  const setNiche = useCallback((value: UserNiche | null) => {
    setNicheState(value);
    writeStoredUser({
      name: username,
      email,
      admin: isAdmin,
      niche: value,
    });
  }, [email, isAdmin, username]);

  const login = useCallback((user: { name?: string | null; email?: string | null; admin?: boolean; niche?: UserNiche | null }) => {
    clearAllBillingCache();
    const nextSessionKey = sessionFingerprint(user.email);
    setIsLoggedIn(true);
    setAuthSessionKey(nextSessionKey);
    setIsAdmin(Boolean(user.admin));
    setIsProfileReady(true);
    setIsCompanyReady(false);
    setSelectedCompanyId(null);
    setUsername(user.name || null);
    setEmail(user.email || null);
    setNicheState(user.niche || null);
    writeStoredUser({
      name: user.name || null,
      email: user.email || null,
      admin: Boolean(user.admin),
      niche: user.niche || null,
    });
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  }, [setSelectedCompanyId]);

  const logout = useCallback(() => {
    void api.post('/auth/logout', {}, { withCredentials: true }).catch(() => {
      // ignore logout API failure and clear local state anyway
    });

    clearAccessToken();
    clearAllBillingCache();
    setIsLoggedIn(false);
    setAuthSessionKey(null);
    setIsAdmin(false);
    setIsProfileReady(true);
    setIsCompanyReady(true);
    setUsername(null);
    setEmail(null);
    setNicheState(null);
    setSelectedCompanyId(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT));
  }, [setSelectedCompanyId]);

  useEffect(() => {
    const handleAuthChanged = () => {
      setAuthSessionKey(sessionFingerprint(email));
    };
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
  }, [email]);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsProfileReady(true);
      setIsCompanyReady(true);
      return;
    }
    getUserProfile()
      .then((profile) => {
        if (profile?.name) setUsername(profile.name);
        if (profile?.email) setEmail(profile.email);
        if (typeof profile?.admin === 'boolean') setIsAdmin(profile.admin);
        if (profile?.detailLevel) setDetailLevel(profile.detailLevel);
        if (profile?.theme) setTheme(profile.theme);
        setNicheState(profile?.niche || null);
        writeStoredUser({
          name: profile?.name || null,
          email: profile?.email || null,
          admin: Boolean(profile?.admin),
          niche: profile?.niche || null,
        });
      })
      .catch(() => {
        // ignore profile bootstrap errors to avoid blocking app load
      })
      .finally(() => {
        setIsProfileReady(true);
      });
  }, [isLoggedIn, setDetailLevel, setTheme]);

  useEffect(() => {
    const handleInvalidCompany = () => {
      setSelectedCompanyIdState(null);
      setCompanyRefreshTick((current) => current + 1);
    };
    window.addEventListener(COMPANY_ACCESS_INVALID_EVENT, handleInvalidCompany);
    return () => window.removeEventListener(COMPANY_ACCESS_INVALID_EVENT, handleInvalidCompany);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsCompanyReady(true);
      return;
    }
    setIsCompanyReady(false);
    getCompanies()
      .then((companies) => {
        const list = Array.isArray(companies) ? companies : [];
        if (!list.length) {
          setSelectedCompanyId(null);
          return;
        }

        const current = selectedCompanyId
          ? list.find((company) => getCompanyId(company) === selectedCompanyId)
          : null;
        const stored = storedCompanyId
          ? list.find((company) => getCompanyId(company) === storedCompanyId)
          : null;
        const fallback = list[0];

        const nextCompanyId = getCompanyId(current || stored || fallback);
        if (nextCompanyId !== selectedCompanyId) {
          setSelectedCompanyId(nextCompanyId);
        }
      })
      .catch(() => {
        // ignore company bootstrap errors to avoid blocking app load
      })
      .finally(() => setIsCompanyReady(true));
  }, [isLoggedIn, selectedCompanyId, storedCompanyId, companyRefreshTick]);

  const value = {
    isLoggedIn,
    isAdmin,
    isProfileReady,
    isCompanyReady,
    authSessionKey,
    username,
    email,
    niche,
    selectedCompanyId,
    detailLevel,
    theme,
    setSelectedCompanyId,
    setNiche,
    setDetailLevel,
    setTheme,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const BillingProvider = ({ children }: { children?: ReactNode }) => {
  const { isLoggedIn, isProfileReady, isCompanyReady, email, authSessionKey, selectedCompanyId } = useAuth();
  const userKey = billingUserKey(email, authSessionKey, selectedCompanyId);
  const cached = readBillingCache(userKey);
  const [billingStatus, setBillingStatus] = useState<BillingStatus>(cached?.status || "UNKNOWN");
  const [hasActiveSubscription, setHasActiveSubscription] = useState(Boolean(cached?.hasActiveSubscription));
  const [currentPlan, setCurrentPlan] = useState<string | null>(cached?.currentPlan || null);
  const [isBillingLoaded, setIsBillingLoaded] = useState(Boolean(cached));
  const [isBillingValidating, setIsBillingValidating] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(cached?.checkedAt || null);
  const [hasCachedBillingStatus, setHasCachedBillingStatus] = useState(Boolean(cached));
  const validationSeqRef = useRef(0);

  const clearBilling = () => {
    setBillingStatus("UNKNOWN");
    setHasActiveSubscription(false);
    setCurrentPlan(null);
    setIsBillingLoaded(false);
    setIsBillingValidating(false);
    setBillingError(null);
    setLastCheckedAt(null);
    setHasCachedBillingStatus(false);
  };

  const applyBilling = (entry: BillingCacheEntry, fromCache: boolean) => {
    setBillingStatus(entry.status);
    setHasActiveSubscription(entry.hasActiveSubscription);
    setCurrentPlan(entry.currentPlan);
    setIsBillingLoaded(true);
    setBillingError(null);
    setLastCheckedAt(entry.checkedAt);
    setHasCachedBillingStatus(fromCache);
  };

  const refreshBilling = async (force = false) => {
    if (!isLoggedIn || !isProfileReady || !isCompanyReady || !userKey) {
      clearBilling();
      return null;
    }

    const freshCached = readBillingCache(userKey);
    if (!force && freshCached) {
      applyBilling(freshCached, true);
      return freshCached;
    }

    const validationSeq = validationSeqRef.current + 1;
    validationSeqRef.current = validationSeq;
    setBillingError(null);
    setIsBillingValidating(true);
    try {
      const billing = await Promise.race([
        getBillingMe({ companyId: selectedCompanyId }),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("billing_validation_timeout")), BILLING_VALIDATION_TIMEOUT_MS);
        }),
      ]);
      if (validationSeq !== validationSeqRef.current) return null;
      const entry: BillingCacheEntry = {
        userKey,
        status: billing.hasActiveSubscription ? "ACTIVE" : "INACTIVE",
        hasActiveSubscription: Boolean(billing.hasActiveSubscription),
        currentPlan: billing.subscription?.planKey || billing.activePlan || null,
        checkedAt: Date.now(),
      };
      writeBillingCache(entry);
      applyBilling(entry, false);
      return entry;
    } catch (error) {
      if (validationSeq !== validationSeqRef.current) return null;
      const message =
        error instanceof Error && error.message === "billing_validation_timeout"
          ? "Tempo limite ao validar assinatura."
          : "Nao foi possivel validar sua assinatura agora.";
      setBillingError(message);
      if (!isBillingLoaded && !hasCachedBillingStatus) {
        setIsBillingLoaded(false);
        setBillingStatus("UNKNOWN");
        setHasActiveSubscription(false);
        setCurrentPlan(null);
      }
      return null;
    } finally {
      if (validationSeq === validationSeqRef.current) {
        setIsBillingValidating(false);
      }
    }
  };

  useEffect(() => {
    if (!isLoggedIn || !isProfileReady || !isCompanyReady || !userKey) {
      clearBilling();
      return;
    }

    const freshCached = readBillingCache(userKey);
    if (freshCached) {
      applyBilling(freshCached, true);
      return;
    }

    void refreshBilling(false);
  }, [isLoggedIn, isProfileReady, isCompanyReady, userKey]);

  useEffect(() => {
    const handleBillingInvalid = () => {
      clearAllBillingCache();
      clearBilling();
      void refreshBilling(true);
    };
    const handleAuthChanged = () => {
      clearBilling();
    };
    window.addEventListener(BILLING_ACCESS_INVALID_EVENT, handleBillingInvalid);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      window.removeEventListener(BILLING_ACCESS_INVALID_EVENT, handleBillingInvalid);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [refreshBilling]);

  return (
    <BillingContext.Provider
      value={{
        billingStatus,
        hasActiveSubscription,
        currentPlan,
        isBillingLoaded,
        isBillingValidating,
        billingError,
        lastCheckedAt,
        hasCachedBillingStatus,
        refreshBilling,
        clearBilling,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
};

const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const { isLoggedIn, isProfileReady } = useAuth();
  if (!isProfileReady) return <FullscreenLoading label="Validando acesso" />;
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }: { children?: ReactNode }) => {
  const { isLoggedIn, isAdmin, isProfileReady } = useAuth();
  if (!isProfileReady) return <FullscreenLoading label="Validando acesso" />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return isAdmin ? <>{children}</> : <Navigate to={DASHBOARD_ROUTE} replace />;
};

const FullscreenLoading = (_props?: { label?: string }) => (
  <SplashScreen isLoading={true} minDuration={3500} />
);

const BillingValidationError = ({
  onRetry,
  onLogout,
}: {
  onRetry: () => void;
  onLogout: () => void;
}) => (
  <div className="flex min-h-screen items-center justify-center bg-[#040507] px-5 text-zinc-100">
    <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-white/[0.04] p-7 text-center shadow-[0_0_70px_rgba(182,255,0,0.08)]">
      <h1 className="text-3xl font-black tracking-[0.24em] text-[#B6FF00]">NEXT LEVEL</h1>
      <p className="mt-4 text-sm font-bold text-zinc-200">Nao foi possivel validar sua assinatura agora.</p>
      <p className="mt-2 text-xs leading-6 text-zinc-500">Sua sessao continua protegida. Tente novamente ou saia para iniciar uma nova sessao.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-[16px] bg-lime-300 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-950"
        >
          Tentar novamente
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex-1 rounded-[16px] border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300"
        >
          Encerrar sessao
        </button>
      </div>
    </div>
  </div>
);

const OnboardingGate = ({ children }: { children?: ReactNode }) => {
  const location = useLocation();
  const { isLoggedIn, isProfileReady, isCompanyReady, selectedCompanyId } = useAuth();
  const cachedRedirect = readCachedOnboardingRedirect(selectedCompanyId);
  const [checking, setChecking] = useState(cachedRedirect === null);
  const [shouldRedirect, setShouldRedirect] = useState(Boolean(cachedRedirect));

  useEffect(() => {
    let cancelled = false;
    if (!isLoggedIn || !isProfileReady || !isCompanyReady) {
      setChecking(true);
      return () => {
        cancelled = true;
      };
    }

    if (!selectedCompanyId) {
      setChecking(false);
      setShouldRedirect(false);
      return () => {
        cancelled = true;
      };
    }

    const cached = readCachedOnboardingRedirect(selectedCompanyId);
    if (cached !== null) {
      setShouldRedirect(cached);
      setChecking(false);
    } else {
      setChecking(true);
    }
    getCompanyPersonalizationStatus({ companyId: selectedCompanyId })
      .then((status) => {
        if (!cancelled) {
          const nextRedirect = Boolean(status.shouldRedirectToOnboarding);
          writeCachedOnboardingRedirect(selectedCompanyId, nextRedirect);
          setShouldRedirect(nextRedirect);
        }
      })
      .catch(() => {
        if (!cancelled) setShouldRedirect(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isProfileReady, isCompanyReady, selectedCompanyId]);

  if (!isProfileReady || !isCompanyReady || checking) {
    return <FullscreenLoading />;
  }

  if (shouldRedirect && location.pathname !== "/onboarding/personalization") {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/onboarding/personalization?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
};

const BillingGate = ({ children }: { children?: ReactNode }) => {
  const location = useLocation();
  const { isLoggedIn, isProfileReady, isCompanyReady, selectedCompanyId, logout } = useAuth();
  const {
    hasActiveSubscription,
    isBillingLoaded,
    isBillingValidating,
    hasCachedBillingStatus,
    billingError,
    refreshBilling,
  } = useBilling();

  const shouldShowFullScreenValidation =
    isLoggedIn &&
    isProfileReady &&
    isCompanyReady &&
    !isBillingLoaded &&
    !hasCachedBillingStatus &&
    isBillingValidating;

  if (isLoggedIn && isProfileReady && !isCompanyReady) return <FullscreenLoading />;
  if (isLoggedIn && isProfileReady && isCompanyReady && !selectedCompanyId) {
    if (location.pathname === "/companies") return <>{children}</>;
    return <Navigate to="/companies" replace />;
  }
  if (shouldShowFullScreenValidation) return <FullscreenLoading label="Validando assinatura" />;
  if (isLoggedIn && isProfileReady && billingError && !isBillingLoaded) {
    return <BillingValidationError onRetry={() => void refreshBilling(true)} onLogout={logout} />;
  }
  if (isLoggedIn && isProfileReady && isBillingLoaded && !hasActiveSubscription && location.pathname !== "/planos") {
    return <Navigate to="/planos" replace />;
  }
  if (isLoggedIn && isProfileReady && !isBillingLoaded) {
    return <FullscreenLoading label="Validando assinatura" />;
  }
  return <>{children}</>;
};

const LockedFeature = ({
  requiredPlan,
  title = "Recurso bloqueado neste plano",
}: {
  requiredPlan: BillingPlanKey;
  title?: string;
}) => {
  const navigate = useNavigate();
  return (
    <div className="rounded-3xl border border-lime-400/20 bg-zinc-950 p-7 text-zinc-100">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">Upgrade disponivel</p>
      <h1 className="mt-3 text-3xl font-black tracking-tighter">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
        Este recurso esta disponivel a partir do plano {PLAN_LABELS[requiredPlan]}. Seu acesso ao restante do dashboard continua normal.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => navigate(`/planos?upgrade=true&required=${requiredPlan}`)}
          className="rounded-2xl bg-lime-400 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-950"
        >
          Ver planos
        </button>
        <button
          type="button"
          onClick={() => navigate(DASHBOARD_ROUTE)}
          className="rounded-2xl border border-zinc-800 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300"
        >
          Voltar ao dashboard
        </button>
      </div>
    </div>
  );
};

const PlanFeatureGate = ({
  children,
  requiredPlan,
  title,
}: {
  children?: ReactNode;
  requiredPlan: BillingPlanKey;
  title?: string;
}) => {
  const { currentPlan, hasActiveSubscription, isBillingLoaded } = useBilling();
  if (!isBillingLoaded) return <FullscreenLoading label="Validando plano" />;
  if (!hasActiveSubscription) return <LockedFeature requiredPlan="COMMON" title="Escolha um plano para continuar" />;
  if (!hasPlanLevel(currentPlan, requiredPlan)) {
    return <LockedFeature requiredPlan={requiredPlan} title={title} />;
  }
  return <>{children}</>;
};

const App = () => {
  return (
    <AuthProvider>
      <BillingProvider>
        <ToastProvider>
          <AppErrorBoundary>
            <AppContent />
          </AppErrorBoundary>
        </ToastProvider>
      </BillingProvider>
    </AuthProvider>
  );
};

const MetadataSync = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname === "*" ? "/404" : location.pathname;
    applyMetadata(resolveMetadata(pathname));
  }, [location.pathname]);

  return null;
};

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { login, logout, setSelectedCompanyId } = useAuth();
  const activeRunRef = useRef(0);
  const [retryKey, setRetryKey] = useState(0);
  const [callbackState, setCallbackState] = useState<AuthCallbackState>("callbackLoading");
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  useEffect(() => {
    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;
    let cancelled = false;

    const isCurrentRun = () => !cancelled && activeRunRef.current === runId;
    const fail = () => {
      if (!isCurrentRun()) return;
      setCallbackError("Não foi possível concluir seu login agora.");
      setCallbackState("error");
    };

    const completeAuthFlow = async () => {
      try {
        setCallbackState("callbackLoading");
        setCallbackError(null);

        const selectedPlan = readPendingSelectedPlan();
        const preferredCompanyId = localStorage.getItem(COMPANY_ID_STORAGE_KEY);

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.history.replaceState({}, document.title, window.location.pathname);

        const profile = await withTimeout(restoreAuthSession(), AUTH_CALLBACK_TIMEOUT_MS, "auth_restore_timeout");
        if (!profile) {
          navigate("/login", { replace: true });
          return;
        }
        if (!isCurrentRun()) return;
        login({
          name: profile?.name || null,
          email: profile?.email || null,
          admin: Boolean(profile?.admin),
          niche: profile?.niche || null,
        });

        if (!isCurrentRun()) return;
        setCallbackState("authResolved");

        const companies = await withTimeout(getCompanies(), AUTH_CALLBACK_TIMEOUT_MS, "company_resolution_timeout");
        if (!isCurrentRun()) return;
        const list = Array.isArray(companies) ? companies : [];
        if (!list.length) {
          setCallbackState("companyResolved");
          navigate('/companies', { replace: true });
          return;
        }

        const selectedCompany =
          list.find((company) => getCompanyId(company) === preferredCompanyId) || list[0];
        const companyId = getCompanyId(selectedCompany);
        if (!companyId) {
          setCallbackState("companyResolved");
          navigate('/companies', { replace: true });
          return;
        }

        setSelectedCompanyId(companyId);
        setCallbackState("companyResolved");

        const billing = await withTimeout(
          getBillingMe({ companyId }),
          AUTH_CALLBACK_TIMEOUT_MS,
          "billing_resolution_timeout",
        );
        if (!isCurrentRun()) return;
        setCallbackState("billingResolved");

        if (billing.hasActiveSubscription) {
          clearPendingSelectedPlan();
          setCallbackState("success");
          setTargetRoute(DASHBOARD_ROUTE);
          return;
        }
        setCallbackState("success");
        setTargetRoute(selectedPlan ? buildPlanosSubscribeUrl(selectedPlan) : '/planos');
      } catch {
        fail();
      }
    };

    const startTimer = window.setTimeout(() => {
      void completeAuthFlow();
    }, AUTH_CALLBACK_START_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
    };
  }, [login, navigate, retryKey, setSelectedCompanyId]);

  const handleSplashComplete = () => {
    if (targetRoute) {
      navigate(targetRoute, { replace: true });
    }
  };

  if (callbackState === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#040507] px-5 text-zinc-100">
        <div className="w-full max-w-md rounded-[24px] border border-white/10 bg-white/[0.04] p-7 text-center shadow-[0_0_70px_rgba(182,255,0,0.08)]">
          <h1 className="text-3xl font-black tracking-[0.24em] text-[#B6FF00]">NEXT LEVEL</h1>
          <p className="mt-4 text-sm font-bold text-zinc-200">{callbackError || "Não foi possível concluir seu login agora."}</p>
          <p className="mt-2 text-xs leading-6 text-zinc-500">Sua sessao nao ficou presa. Tente novamente ou volte para iniciar um novo login.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                setCallbackError(null);
                setCallbackState("callbackLoading");
                setRetryKey((current) => current + 1);
              }}
              className="flex-1 rounded-[16px] bg-lime-300 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-950"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              className="flex-1 rounded-[16px] border border-white/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300"
            >
              Voltar para login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SplashScreen 
      isLoading={callbackState !== "success"} 
      minDuration={3500} 
      onComplete={handleSplashComplete} 
    />
  );
};

const LoggedInLoginRedirect = () => {
  const [searchParams] = useSearchParams();
  const { isProfileReady, isCompanyReady, selectedCompanyId, logout } = useAuth();
  const {
    hasActiveSubscription,
    isBillingLoaded,
    isBillingValidating,
    billingError,
    refreshBilling,
  } = useBilling();
  const selectedPlan = readPlanSelectionFromSearch(searchParams) || readPendingSelectedPlan();

  if (!isProfileReady || !isCompanyReady) return <FullscreenLoading />;
  if (!selectedCompanyId) return <Navigate to="/companies" replace />;
  if (isBillingValidating || !isBillingLoaded) {
    if (billingError && !isBillingLoaded) {
      return <BillingValidationError onRetry={() => void refreshBilling(true)} onLogout={logout} />;
    }
    return <FullscreenLoading />;
  }
  if (hasActiveSubscription) {
    clearPendingSelectedPlan();
    return <Navigate to={DASHBOARD_ROUTE} replace />;
  }
  return <Navigate to={selectedPlan ? buildPlanosSubscribeUrl(selectedPlan) : "/planos"} replace />;
};

const AppContent = () => {
  const { isLoggedIn, isProfileReady } = useAuth();
  const [bootSplashDone, setBootSplashDone] = useState(false);
  const personalizedShell = (page: ReactNode) => (
    <ProtectedRoute>
      <BillingGate>
        <OnboardingGate>
          <Layout>
            {page}
          </Layout>
        </OnboardingGate>
      </BillingGate>
    </ProtectedRoute>
  );
  const plainShell = (page: ReactNode) => (
    <ProtectedRoute>
      <BillingGate>
        <Layout>
          {page}
        </Layout>
      </BillingGate>
    </ProtectedRoute>
  );
  const featureShell = (page: ReactNode, requiredPlan: BillingPlanKey, title: string) => (
    <ProtectedRoute>
      <BillingGate>
        <OnboardingGate>
          <Layout>
            <PlanFeatureGate requiredPlan={requiredPlan} title={title}>
              {page}
            </PlanFeatureGate>
          </Layout>
        </OnboardingGate>
      </BillingGate>
    </ProtectedRoute>
  );
  const dashboardShell = personalizedShell(<Dashboard />);

  return (
    <BrowserRouter>
      <MetadataSync />
      {!bootSplashDone && isLoggedIn && (
        <SplashScreen
          isLoading={!isProfileReady}
          minDuration={3500}
          onComplete={() => setBootSplashDone(true)}
        />
      )}
      <Suspense fallback={<FullscreenLoading />}>
        <Routes>
          <Route path="/auth/callback" element={<GoogleAuthCallback />} />
          <Route path="/login" element={isLoggedIn ? <LoggedInLoginRedirect /> : <LoginPage />} />
          <Route path="/planos" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
          <Route path="/billing/success" element={<ProtectedRoute><BillingSuccess /></ProtectedRoute>} />
          <Route path="/billing/cancel" element={<ProtectedRoute><BillingCancel /></ProtectedRoute>} />
          <Route path="/onboarding/personalization" element={<ProtectedRoute><OnboardingPersonalization /></ProtectedRoute>} />
          <Route path="/" element={isLoggedIn ? <Navigate to={DASHBOARD_ROUTE} replace /> : <LoginPage />} />
          <Route path="/inicio" element={<Navigate to={DASHBOARD_ROUTE} replace />} />
          <Route path="/home" element={<Navigate to={DASHBOARD_ROUTE} replace />} />
          <Route path="/painel" element={<Navigate to={DASHBOARD_ROUTE} replace />} />
          <Route
            path={DASHBOARD_ROUTE}
            element={dashboardShell}
          />
          <Route path="/reports" element={personalizedShell(<Reports />)} />
          <Route path="/chat" element={personalizedShell(<Chat />)} />
          <Route path="/help" element={plainShell(<Help />)} />
          <Route path="/alerts" element={plainShell(<Alerts />)} />
          <Route path="/settings" element={plainShell(<Settings />)} />
          <Route path="/profile" element={plainShell(<Profile />)} />
          <Route path="/integrations" element={featureShell(<Integrations />, "PREMIUM", "Integracoes automaticas exigem Premium")} />
          <Route path="/companies" element={<ProtectedRoute><Layout><Companies /></Layout></ProtectedRoute>} />
          <Route path="/insights" element={personalizedShell(<Insights />)} />
          <Route path="/financial-flow" element={personalizedShell(<FinancialFlow />)} />
          <Route path="/finance" element={personalizedShell(<FinancialFlow />)} />
          <Route path="/products" element={personalizedShell(<Products />)} />
          <Route path="/orders" element={personalizedShell(<Orders />)} />
          <Route path="/questions" element={<Navigate to={DASHBOARD_ROUTE} replace />} />
          <Route path="/customers" element={personalizedShell(<Customers />)} />
          <Route path="/costs" element={personalizedShell(<Costs />)} />
          <Route path="/add-data" element={personalizedShell(<AddData />)} />
          <Route path="/market-intel" element={featureShell(<MarketIntel />, "PRO_BUSINESS", "Market intelligence exige Pro Business")} />
          <Route path="/attendant" element={featureShell(<Attendant />, "PREMIUM", "Atendente IA exige Premium")} />
          <Route path="/admin/system-health" element={<AdminRoute><Layout><SystemHealth /></Layout></AdminRoute>} />
          <Route path="/command-center" element={featureShell(<CommandCenter />, "PRO_BUSINESS", "Automacoes avancadas exigem Pro Business")} />
          <Route path="/plans" element={<Navigate to="/planos" replace />} />
          <Route path="/usage" element={personalizedShell(<PlanUsage />)} />
          <Route path="/plan-usage" element={<Navigate to="/usage" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

