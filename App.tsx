import React, { useEffect, useState, createContext, useContext, ReactNode, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Integrations from './pages/Integrations';
import Companies from './pages/Companies';
import LoginPage from './pages/LoginPage';
import { ToastProvider } from './components/Toast';
import AppErrorBoundary from './src/components/AppErrorBoundary';
import { useDetailLevel } from './src/hooks/useDetailLevel';
import { useTheme } from './src/hooks/useTheme';
import type { Company, DetailLevel, UserNiche } from './src/types/domain';
import NotFound from './src/app/not-found';
import { applyMetadata, resolveMetadata } from './src/app/layout';
import { getCompanies, getUserProfile } from './src/services/endpoints';
import api from './src/services/api';

// Lazy load pages with heavy dependencies
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Reports = lazy(() => import('./pages/Reports'));
const Insights = lazy(() => import('./pages/Insights'));
const FinancialFlow = lazy(() => import('./pages/FinancialFlow'));
const Plans = lazy(() => import('./pages/Plans'));
const Products = lazy(() => import('./pages/Products'));
const Customers = lazy(() => import('./pages/Customers'));
const Costs = lazy(() => import('./pages/Costs'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const MarketIntel = lazy(() => import('./pages/MarketIntel'));
const Attendant = lazy(() => import('./pages/Attendant'));
const SystemHealth = lazy(() => import('./pages/SystemHealth'));

// Authentication Context
interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isProfileReady: boolean;
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
const COMPANY_ID_STORAGE_KEY = "selectedCompanyId";
const AUTH_USER_STORAGE_KEY = "auth_user";
const getCompanyId = (company: Partial<Company> | null | undefined) => company?.id || company?._id || null;

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const storedUser = readStoredUser();
  const storedCompanyId = localStorage.getItem(COMPANY_ID_STORAGE_KEY);
  const hasStoredToken = Boolean(localStorage.getItem('access_token'));
  const [isLoggedIn, setIsLoggedIn] = useState(hasStoredToken);
  const [isAdmin, setIsAdmin] = useState(Boolean(storedUser.admin));
  const [isProfileReady, setIsProfileReady] = useState(!hasStoredToken);
  const [username, setUsername] = useState<string | null>(storedUser.name);
  const [email, setEmail] = useState<string | null>(storedUser.email);
  const [niche, setNicheState] = useState<UserNiche | null>(storedUser.niche);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(null);
  const { detailLevel, setDetailLevel } = useDetailLevel();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
      return;
    }
    setIsProfileReady(true);
  }, []);

  const setSelectedCompanyId = (value: string | null) => {
    setSelectedCompanyIdState(value);
    if (value) {
      localStorage.setItem(COMPANY_ID_STORAGE_KEY, value);
      return;
    }
    localStorage.removeItem(COMPANY_ID_STORAGE_KEY);
  };

  const setNiche = (value: UserNiche | null) => {
    setNicheState(value);
    writeStoredUser({
      name: username,
      email,
      admin: isAdmin,
      niche: value,
    });
  };

  const login = (user: { name?: string | null; email?: string | null; admin?: boolean; niche?: UserNiche | null }) => {
    setIsLoggedIn(true);
    setIsAdmin(Boolean(user.admin));
    setIsProfileReady(true);
    setUsername(user.name || null);
    setEmail(user.email || null);
    setNicheState(user.niche || null);
    writeStoredUser({
      name: user.name || null,
      email: user.email || null,
      admin: Boolean(user.admin),
      niche: user.niche || null,
    });
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      void api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {
        // ignore logout API failure and clear local state anyway
      });
    }

    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsProfileReady(true);
    setUsername(null);
    setEmail(null);
    setNicheState(null);
    setSelectedCompanyId(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setIsProfileReady(true);
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
    if (!isLoggedIn) return;
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
      });
  }, [isLoggedIn, selectedCompanyId, storedCompanyId]);

  const value = {
    isLoggedIn,
    isAdmin,
    isProfileReady,
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

const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const token = localStorage.getItem('access_token');
  const { isLoggedIn, isProfileReady } = useAuth();
  if (!isProfileReady) return null;
  return isLoggedIn && token ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children?: ReactNode }) => {
  const token = localStorage.getItem('access_token');
  const { isLoggedIn, isAdmin, isProfileReady } = useAuth();
  if (!isProfileReady) return null;
  if (!isLoggedIn || !token) return <Navigate to="/login" />;
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppErrorBoundary>
          <AppContent />
        </AppErrorBoundary>
      </ToastProvider>
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh_token');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const admin = searchParams.get('admin') === 'true';

    if (token) {
      localStorage.setItem('access_token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      login({ name, email, admin, niche: null });
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=google_auth_failed', { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[#B6FF00] tracking-widest animate-pulse">
          NEXT LEVEL
        </h1>
        <p className="mt-2 text-zinc-400 text-xs tracking-widest uppercase">Autenticando com Google...</p>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { isLoggedIn } = useAuth();
  const dashboardShell = (
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <MetadataSync />
      <Suspense fallback={
        <div className="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#B6FF00] text-neon tracking-widest animate-pulse">
              NEXT LEVEL
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-xs tracking-widest uppercase">Pronto para avançar</p>
          </div>
        </div>
      }>
        <Routes>
          <Route path="/auth/callback" element={<GoogleAuthCallback />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/" element={isLoggedIn ? dashboardShell : <LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            }
          />
          <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/integrations" element={<ProtectedRoute><Layout><Integrations /></Layout></ProtectedRoute>} />
          <Route path="/companies" element={<ProtectedRoute><Layout><Companies /></Layout></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><Layout><Insights /></Layout></ProtectedRoute>} />
          <Route path="/financial-flow" element={<ProtectedRoute><Layout><FinancialFlow /></Layout></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><Layout><FinancialFlow /></Layout></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
          <Route path="/costs" element={<ProtectedRoute><Layout><Costs /></Layout></ProtectedRoute>} />
          <Route path="/market-intel" element={<ProtectedRoute><Layout><MarketIntel /></Layout></ProtectedRoute>} />
          <Route path="/attendant" element={<ProtectedRoute><Layout><Attendant /></Layout></ProtectedRoute>} />
          <Route path="/admin/system-health" element={<AdminRoute><Layout><SystemHealth /></Layout></AdminRoute>} />
          <Route path="/command-center" element={<ProtectedRoute><Layout><CommandCenter /></Layout></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><Layout><Plans /></Layout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

