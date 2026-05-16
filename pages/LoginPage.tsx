import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../services/api";
import { BillingCycle, BillingPlanKey, getBillingMe, getCompanies } from "../src/services/endpoints";
import NextLevelLandingPage, { LandingPlan } from "../src/components/landing/NextLevelLandingPage";
import {
  buildPlanosSubscribeUrl,
  clearPendingSelectedPlan,
  planSelectionLabel,
  PendingPlanSelection,
  readPendingSelectedPlan,
  readPlanSelectionFromSearch,
  savePendingSelectedPlan,
} from "../src/utils/billingSelection";
import { getDisplayPlanPrice, PLAN_DISPLAY } from "../src/utils/planDisplay";

type AuthUserPayload = {
  name?: string | null;
  email?: string | null;
  admin?: boolean;
  niche?: null;
};

type ApiErrorLike = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const apiError = error as ApiErrorLike;
  return apiError.response?.data?.message || apiError.response?.data?.error || fallback;
}

const PRICING: LandingPlan[] = [
  {
    key: "COMMON",
    name: PLAN_DISPLAY.COMMON.publicName,
    monthlyPrice: getDisplayPlanPrice("COMMON", "MONTHLY"),
    annualPrice: getDisplayPlanPrice("COMMON", "ANNUAL"),
    summary: PLAN_DISPLAY.COMMON.summary,
    features: PLAN_DISPLAY.COMMON.features,
    cta: PLAN_DISPLAY.COMMON.cta,
    recommended: PLAN_DISPLAY.COMMON.recommended,
    microcopy: PLAN_DISPLAY.COMMON.microcopy,
    aiTier: PLAN_DISPLAY.COMMON.aiTier,
    aiLimitItems: PLAN_DISPLAY.COMMON.aiLimitItems,
    aiDescription: PLAN_DISPLAY.COMMON.aiDescription,
  },
  {
    key: "PREMIUM",
    name: PLAN_DISPLAY.PREMIUM.publicName,
    monthlyPrice: getDisplayPlanPrice("PREMIUM", "MONTHLY"),
    annualPrice: getDisplayPlanPrice("PREMIUM", "ANNUAL"),
    summary: PLAN_DISPLAY.PREMIUM.summary,
    features: PLAN_DISPLAY.PREMIUM.features,
    cta: PLAN_DISPLAY.PREMIUM.cta,
    recommended: PLAN_DISPLAY.PREMIUM.recommended,
    microcopy: PLAN_DISPLAY.PREMIUM.microcopy,
    aiTier: PLAN_DISPLAY.PREMIUM.aiTier,
    aiLimitItems: PLAN_DISPLAY.PREMIUM.aiLimitItems,
    aiDescription: PLAN_DISPLAY.PREMIUM.aiDescription,
  },
  {
    key: "PRO_BUSINESS",
    name: PLAN_DISPLAY.PRO_BUSINESS.publicName,
    monthlyPrice: getDisplayPlanPrice("PRO_BUSINESS", "MONTHLY"),
    annualPrice: getDisplayPlanPrice("PRO_BUSINESS", "ANNUAL"),
    summary: PLAN_DISPLAY.PRO_BUSINESS.summary,
    features: PLAN_DISPLAY.PRO_BUSINESS.features,
    cta: PLAN_DISPLAY.PRO_BUSINESS.cta,
    recommended: PLAN_DISPLAY.PRO_BUSINESS.recommended,
    microcopy: PLAN_DISPLAY.PRO_BUSINESS.microcopy,
    aiTier: PLAN_DISPLAY.PRO_BUSINESS.aiTier,
    aiLimitItems: PLAN_DISPLAY.PRO_BUSINESS.aiLimitItems,
    aiDescription: PLAN_DISPLAY.PRO_BUSINESS.aiDescription,
  },
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, setSelectedCompanyId } = useAuth();
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PendingPlanSelection | null>(null);

  const focusAuth = (register = false) => {
    setIsRegisterView(register);
    window.setTimeout(() => {
      document.getElementById("login")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 20);
  };

  useEffect(() => {
    const nextSelection = readPlanSelectionFromSearch(searchParams) || readPendingSelectedPlan();
    if (!nextSelection) return;

    setSelectedPlan(nextSelection);
    setBillingAnnual(nextSelection.billingCycle === "ANNUAL");
    savePendingSelectedPlan(nextSelection);

    if (searchParams.get("intent") === "subscribe") {
      window.setTimeout(() => focusAuth(true), 120);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("error") !== "google_auth_failed") return;
    setGoogleLoading(false);
    setError("Não foi possível concluir seu login agora.");
    window.setTimeout(() => focusAuth(false), 120);
  }, [searchParams]);

  const selectPlanAndLogin = (planKey: BillingPlanKey, register = true) => {
    const billingCycle: BillingCycle = billingAnnual ? "ANNUAL" : "MONTHLY";
    const selection = { planKey, billingCycle };
    savePendingSelectedPlan(selection);
    setSelectedPlan(selection);
    navigate(`/login?intent=subscribe&plan=${planKey}&cycle=${billingCycle}`, { replace: false });
    focusAuth(register);
  };

  const goAfterAuth = async (user: AuthUserPayload) => {
    login(user);
    const pendingPlan = readPlanSelectionFromSearch(searchParams) || readPendingSelectedPlan();
    try {
      const companies = await getCompanies();
      const storedCompanyId = localStorage.getItem("selectedCompanyId");
      const selectedCompany =
        companies.find((company) => {
          const id = (company as { id?: string; _id?: string }).id || (company as { id?: string; _id?: string })._id;
          return id === storedCompanyId;
        }) || companies[0];
      const companyId =
        (selectedCompany as { id?: string; _id?: string } | undefined)?.id ||
        (selectedCompany as { id?: string; _id?: string } | undefined)?._id ||
        null;

      if (!companyId) {
        navigate("/companies", { replace: true });
        return;
      }

      setSelectedCompanyId(companyId);
      const billing = await getBillingMe({ companyId });
      if (billing.hasActiveSubscription) {
        clearPendingSelectedPlan();
        navigate("/dashboard", { replace: true });
        return;
      }
      navigate(pendingPlan ? buildPlanosSubscribeUrl(pendingPlan) : "/planos", { replace: true });
    } catch {
      setError("Não foi possível validar seu acesso agora. Tente novamente em instantes.");
    }
  };

  const handleGoogleLogin = () => {
    const pendingPlan = readPlanSelectionFromSearch(searchParams) || selectedPlan || readPendingSelectedPlan();
    if (pendingPlan) savePendingSelectedPlan(pendingPlan);
    setError("");
    setGoogleLoading(true);

    const raw = String(import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "")
      .trim()
      .replace(/\/+$/, "");
    const base = /\/api$/i.test(raw) ? raw : `${raw}/api`;
    window.location.href = `${base}/auth/google`;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data?.access_token || res.data?.accessToken || res.data?.token || res.data?.data?.token;
      const refreshToken =
        res.data?.refresh_token || res.data?.refreshToken || res.data?.data?.refresh_token || res.data?.data?.refreshToken;
      if (token) {
        localStorage.setItem("access_token", token);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        await goAfterAuth(res.data?.user || res.data?.data?.user || {});
      } else {
        setError("Resposta inesperada do servidor.");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Credenciais inválidas."));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name || !email || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 8) {
      setError("Senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/register", { name, email, password, companyName: name || "Minha Empresa" });
      const token = res.data?.access_token || res.data?.accessToken || res.data?.token || res.data?.data?.token;
      const refreshToken =
        res.data?.refresh_token || res.data?.refreshToken || res.data?.data?.refresh_token || res.data?.data?.refreshToken;
      if (token) {
        localStorage.setItem("access_token", token);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        await goAfterAuth(res.data?.user || res.data?.data?.user || {});
      } else {
        setError("Erro ao criar conta.");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Erro ao criar conta."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <NextLevelLandingPage
      isRegisterView={isRegisterView}
      setIsRegisterView={setIsRegisterView}
      onLogin={handleLogin}
      onRegister={handleRegister}
      name={name}
      setName={setName}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      error={error}
      loading={loading}
      setError={setError}
      googleLoading={googleLoading}
      selectedPlanLabel={selectedPlan ? planSelectionLabel(selectedPlan) : null}
      subscribeIntent={searchParams.get("intent") === "subscribe"}
      onGoogleLogin={handleGoogleLogin}
      billingAnnual={billingAnnual}
      setBillingAnnual={setBillingAnnual}
      plans={PRICING}
      onSelectPlan={(planKey) => selectPlanAndLogin(planKey, true)}
    />
  );
};

export default LoginPage;
