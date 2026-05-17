import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  LineChart,
  LockKeyhole,
  Mail,
  Menu,
  MessageCircleMore,
  MessageSquare,
  Package,
  ShoppingCart,
  Smartphone,
  TrendingUp,
  User,
  Users,
  X,
} from "lucide-react";
import "../../styles/landing-page-styles.css";
import "../../styles/animations.css";
import { useLandingReveal } from "../../hooks/useLandingReveal";

export type LandingPlanKey = "COMMON" | "PREMIUM" | "PRO_BUSINESS";

export type LandingPlan = {
  key: LandingPlanKey;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  summary: string;
  features: string[];
  cta: string;
  recommended: boolean;
  microcopy: string;
  aiTier: string;
  aiLimitItems: string[];
  aiDescription: string;
};

type NextLevelLandingPageProps = {
  isRegisterView: boolean;
  setIsRegisterView: (value: boolean) => void;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  onRegister: (event: React.FormEvent<HTMLFormElement>) => void;
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  error: string;
  loading: boolean;
  setError: (value: string) => void;
  googleLoading: boolean;
  selectedPlanLabel?: string | null;
  subscribeIntent?: boolean;
  onGoogleLogin: () => void;
  billingAnnual: boolean;
  setBillingAnnual: (value: boolean) => void;
  plans: LandingPlan[];
  onSelectPlan: (planKey: LandingPlanKey) => void;
};

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const authFieldCls =
  "min-h-[52px] w-full rounded-2xl border border-[#2E3935] bg-[#080D0B] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#6B7470] focus:border-[#B6FF00]/70 focus:bg-[#0D1210] focus:shadow-[inset_0_0_0_1px_rgba(182,255,0,0.1)]";

function AuthAccessSection({
  isRegisterView,
  setIsRegisterView,
  onLogin,
  onRegister,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  loading,
  setError,
  googleLoading,
  selectedPlanLabel,
  subscribeIntent,
  onGoogleLogin,
}: Pick<
  NextLevelLandingPageProps,
  | "isRegisterView"
  | "setIsRegisterView"
  | "onLogin"
  | "onRegister"
  | "name"
  | "setName"
  | "email"
  | "setEmail"
  | "password"
  | "setPassword"
  | "showPassword"
  | "setShowPassword"
  | "error"
  | "loading"
  | "setError"
  | "googleLoading"
  | "selectedPlanLabel"
  | "subscribeIntent"
  | "onGoogleLogin"
>) {
  const selectAuthMode = (register: boolean) => {
    setIsRegisterView(register);
    setError("");
  };

  return (
    <section id="login" className="scroll-mt-24 bg-[#080D0B] px-4 py-24 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="reveal">
          <span className="nl-eyebrow mb-5 block text-[#B6FF00] reveal-delay-1">ACESSO À PLATAFORMA</span>
          <h2 className="nl-h2 mb-6 text-white reveal-delay-2">Entre na sua central de gestão</h2>
          <p className="nl-body max-w-xl text-[#AEB8B4] reveal-delay-3">
            Acesse sua conta para acompanhar vendas, financeiro, clientes, produtos, relatórios e recomendações da IA.
          </p>

          {(subscribeIntent || selectedPlanLabel) && (
            <div className="mt-8 rounded-3xl border border-[#B6FF00]/25 bg-[#B6FF00]/10 p-5 reveal-delay-4">
              <p className="text-sm font-bold text-white">
                {isRegisterView ? "Crie sua conta para continuar sua assinatura." : "Entre para continuar sua assinatura."}
              </p>
              {selectedPlanLabel && <p className="mt-2 text-sm font-semibold text-[#B6FF00]">Você selecionou: {selectedPlanLabel}</p>}
            </div>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-3 reveal-delay-5">
            {[
              { label: "Dados protegidos", value: "Sessão segura" },
              { label: "Operação guiada", value: "Sem complexidade" },
              { label: "Plano preservado", value: "Assinatura segura" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#2E3935] bg-[#0D1210] p-4 group hover:border-[#B6FF00]/30 transition-colors">
                <div className="mb-4 h-2 w-2 rounded-full bg-[#B6FF00]" />
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white">{item.label}</p>
                <p className="mt-2 text-xs text-[#6B7470]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[34px] border border-[#2E3935] bg-[#0D1210] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-8">
          <div className="rounded-[26px] border border-[#2E3935] bg-[#141B18] p-5 md:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B6FF00]">Acesse sua conta</p>
                <h3 className="mt-2 text-2xl font-bold text-white">{isRegisterView ? "Criar conta" : "Entrar no painel"}</h3>
                <p className="mt-2 text-sm leading-6 text-[#AEB8B4]">
                  {isRegisterView ? "Crie sua conta para continuar sua operação." : "Entre para continuar sua operação de onde parou."}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#1C3F3A] text-[#B6FF00]">
                <LockKeyhole size={20} />
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-2xl border border-[#2E3935] bg-[#080D0B] p-1">
              <button
                type="button"
                onClick={() => selectAuthMode(false)}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  !isRegisterView ? "bg-white text-[#080D0B]" : "text-[#AEB8B4] hover:text-white"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => selectAuthMode(true)}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  isRegisterView ? "bg-[#B6FF00] text-[#080D0B]" : "text-[#AEB8B4] hover:text-white"
                }`}
              >
                Criar conta
              </button>
            </div>

            <button
              type="button"
              onClick={onGoogleLogin}
              disabled={loading || googleLoading}
              className="mb-5 flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-[#2E3935] bg-[#080D0B] text-sm font-bold text-white transition hover:border-[#B6FF00]/40 hover:bg-[#1A221F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {googleLoading ? "Conectando..." : "Continuar com Google"}
            </button>

            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#2E3935]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7470]">ou email</span>
              <div className="h-px flex-1 bg-[#2E3935]" />
            </div>

            <form onSubmit={isRegisterView ? onRegister : onLogin} className="space-y-4">
              {isRegisterView && (
                <div>
                  <label htmlFor="login-name" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#AEB8B4]">
                    <User size={14} />
                    Nome completo
                  </label>
                  <input id="login-name" value={name} onChange={(event) => setName(event.target.value)} className={authFieldCls} type="text" placeholder="Seu nome" autoComplete="name" />
                </div>
              )}

              <div>
                <label htmlFor="login-email" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#AEB8B4]">
                  <Mail size={14} />
                  E-mail
                </label>
                <input id="login-email" value={email} onChange={(event) => setEmail(event.target.value)} className={authFieldCls} type="email" placeholder="nome@empresa.com" autoComplete="email" />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#AEB8B4]">
                  <LockKeyhole size={14} />
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${authFieldCls} pr-12`}
                    type={showPassword ? "text" : "password"}
                    placeholder={isRegisterView ? "Crie uma senha forte" : "Sua senha"}
                    autoComplete={isRegisterView ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-[#AEB8B4] transition hover:bg-white/5 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-2xl bg-[#B6FF00] px-6 py-4 text-sm font-bold text-[#080D0B] transition hover:bg-[#9BE600] hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (isRegisterView ? "Criando conta..." : "Entrando...") : isRegisterView ? "Criar minha conta" : "Entrar no painel"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function NextLevelLandingPage({
  isRegisterView,
  setIsRegisterView,
  onLogin,
  onRegister,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  loading,
  setError,
  googleLoading,
  selectedPlanLabel,
  subscribeIntent,
  onGoogleLogin,
  billingAnnual,
  setBillingAnnual,
  plans,
  onSelectPlan,
}: NextLevelLandingPageProps) {
  useLandingReveal();
  const [mobileOpen, setMobileOpen] = useState(false);

  const focusAuth = (register: boolean) => {
    setIsRegisterView(register);
    setError("");
    setMobileOpen(false);
    window.setTimeout(() => scrollToSection("login"), 20);
  };

  const runNavAction = (action: () => void) => {
    setMobileOpen(false);
    action();
  };

  const navItems = [
    { label: "Produto", action: () => scrollToSection("produto") },
    { label: "Funcionalidades", action: () => scrollToSection("funcionalidades") },
    { label: "Integrações", action: () => scrollToSection("integracoes") },
    { label: "Planos", action: () => scrollToSection("planos") },
    { label: "Contato", action: () => focusAuth(false) },
  ];

  return (
    <div className="font-inter bg-[#080D0B] text-white min-h-screen overflow-x-hidden selection:bg-[#B6FF00] selection:text-black">
      {/* ─── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 h-[76px] z-50 nl-glass-panel flex items-center px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <button type="button" onClick={() => scrollToSection("topo")} className="flex items-center gap-2 cursor-pointer group">
            <div className="w-3 h-3 rounded-full bg-[#B6FF00] shadow-[0_0_12px_rgba(182,255,0,0.6)] group-hover:scale-110 transition-transform" />
            <span className="font-bold tracking-tight text-lg text-white">NEXT LEVEL</span>
          </button>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button key={item.label} type="button" onClick={() => runNavAction(item.action)} className="text-[#FAFAF5] text-sm hover:text-[#B6FF00] transition-colors">
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => focusAuth(false)} className="hidden md:flex text-[#AEB8B4] text-sm font-medium hover:text-white transition-colors">
              Entrar
            </button>
            <button type="button" onClick={() => focusAuth(true)} className="hidden md:flex bg-[#B6FF00] text-[#080D0B] font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-[#9BE600] transition-all hover:scale-[1.02] active:scale-[0.98]">
              Começar agora
            </button>
            <button type="button" onClick={() => setMobileOpen((v) => !v)} className="md:hidden text-white">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="absolute left-4 right-4 top-[84px] rounded-3xl border border-[#2E3935] bg-[#0D1210] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.45)] md:hidden">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <button key={item.label} type="button" onClick={() => runNavAction(item.action)} className="rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#FAFAF5] hover:bg-[#1A221F] hover:text-[#B6FF00]">
                  {item.label}
                </button>
              ))}
              <button type="button" onClick={() => focusAuth(true)} className="mt-2 rounded-2xl bg-[#B6FF00] px-4 py-3 text-sm font-bold text-[#080D0B]">
                Começar agora
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── SECTION 1 — HERO (full-bleed, full-height) ─────────────── */}
      <section id="topo" className="relative min-h-screen flex items-center pt-24 pb-16 px-6 md:px-12 bg-[#080D0B] overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[900px] h-[900px] rounded-full bg-[#1C3F3A] blur-[220px] opacity-[0.18]" />
          <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full bg-[#B6FF00] blur-[220px] opacity-[0.04]" />
        </div>

        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center relative z-10">
          {/* LEFT — Copy */}
          <div className="flex flex-col items-start nl-reveal-left">
            <div className="inline-flex items-center gap-2 bg-[#1A221F] border border-[#2E3935] px-4 py-1.5 rounded-full mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#B6FF00] animate-pulse-neon" />
              <span className="nl-eyebrow text-[#B6FF00]">ERP COM IA PARA O SEU NEGÓCIO</span>
            </div>

            <h1 className="nl-h1 text-white mb-7">
              O sistema de gestão com IA para controlar vendas, atendimento e financeiro em um só lugar
            </h1>

            <p className="nl-body text-[#AEB8B4] mb-10 max-w-[560px]">
              A NEXT LEVEL centraliza vendas, clientes, produtos, custos, atendimento e relatórios em
              uma plataforma inteligente. Veja o lucro real e receba recomendações da IA para decidir
              melhor todos os dias.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
              <button type="button" onClick={() => focusAuth(true)} className="bg-[#B6FF00] text-[#080D0B] font-semibold px-8 py-4 rounded-full hover:bg-[#9BE600] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(182,255,0,0.25)]">
                Começar agora <ArrowRight size={18} />
              </button>
              <button type="button" onClick={() => scrollToSection("funcionalidades")} className="bg-transparent text-white border border-[#2E3935] font-semibold px-8 py-4 rounded-full hover:bg-[#1A221F] transition-all flex items-center justify-center">
                Ver como funciona
              </button>
            </div>

            <p className="text-xs text-[#6B7470] tracking-wide font-medium">
              Vendas · Financeiro · Clientes · Produtos · Custos · Atendimento · Relatórios · IA
            </p>
          </div>

          {/* RIGHT — Dashboard mockup */}
          <div className="relative w-full nl-reveal-scale" style={{ perspective: "1000px" }}>
            <div className="animate-dashboard-drop">
              <div className="relative w-full" style={{ transform: "rotateY(-4deg) rotateX(2deg)", transformStyle: "preserve-3d" }}>

                {/* Main dashboard */}
                <div className="bg-[#080D0B] rounded-[24px] border border-[#2E3935] nl-shadow-floating flex overflow-hidden lg:min-h-[580px]">

                  {/* Sidebar */}
                  <div className="w-[180px] bg-[#0D1210] border-r border-[#2E3935] p-4 hidden lg:flex flex-col gap-1 shrink-0">
                    <div className="flex items-center gap-2 mb-6 px-2 py-1 text-left">
                      <div className="w-2 h-2 rounded-full bg-[#B6FF00]" />
                      <span className="font-bold text-[11px] tracking-wide text-white">NEXT LEVEL</span>
                    </div>
                    {[
                      { icon: Activity,      label: "Início",          active: true },
                      { icon: ShoppingCart,  label: "Vendas" },
                      { icon: DollarSign,    label: "Financeiro" },
                      { icon: Users,         label: "Clientes" },
                      { icon: Package,       label: "Produtos" },
                      { icon: CreditCard,    label: "Custos" },
                      { icon: MessageSquare, label: "Atendimento IA" },
                      { icon: BarChart3,     label: "Relatórios" },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                        item.active ? "bg-[#1A221F] text-[#B6FF00]" : "text-[#6B7470] hover:text-white"
                      }`}>
                        <item.icon size={14} />
                        {item.label}
                      </div>
                    ))}
                  </div>

                  {/* Dashboard content */}
                  <div className="flex-1 bg-[#141B18] p-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-white font-semibold text-sm">Visão Geral</h3>
                      <span className="text-[10px] bg-[#1A221F] px-2 py-1 rounded-full text-[#AEB8B4]">Hoje</span>
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white rounded-xl p-4 nl-shadow-soft">
                        <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider text-left">Lucro real</p>
                        <p className="text-2xl font-bold text-gray-900 mb-2 text-left">R$ 47.320</p>
                        <div className="flex gap-0.5 h-8 items-end">
                          {[40, 60, 45, 80, 55, 90, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-[#B6FF00] rounded-t-sm" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 nl-shadow-soft flex flex-col justify-between">
                        <div className="text-left">
                          <p className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Vendas do mês</p>
                          <p className="text-2xl font-bold text-gray-900">1.847</p>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-semibold">
                          <TrendingUp size={12} /><span>+12,4% no mês</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#1A221F] rounded-xl p-4 border border-[#2E3935] text-left">
                        <p className="text-[10px] text-[#6B7470] font-semibold mb-1 uppercase tracking-wider">Margem</p>
                        <p className="text-2xl font-bold text-white mb-2">34%</p>
                        <div className="w-full bg-[#080D0B] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#B6FF00] h-full rounded-full" style={{ width: "34%" }} />
                        </div>
                      </div>
                      <div className="bg-[#1A221F] rounded-xl p-4 border border-[#2E3935] text-left">
                        <p className="text-[10px] text-[#6B7470] font-semibold mb-1 uppercase tracking-wider">Clientes atendidos</p>
                        <p className="text-2xl font-bold text-white mb-2">329</p>
                        <div className="flex -space-x-2">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-[#222C28] border-2 border-[#1A221F]" />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mini chart */}
                    <div className="bg-[#1A221F] rounded-xl p-4 border border-[#2E3935] text-left">
                      <p className="text-[10px] text-[#6B7470] font-bold uppercase mb-3">Vendas — últimos 7 dias</p>
                      <div className="flex gap-1.5 h-16 items-end">
                        {[30, 50, 40, 70, 55, 85, 100].map((h, i) => (
                          <div key={i} className="chart-bar flex-1 bg-[#2A3830] rounded-t" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating: AI insight */}
                <div className="absolute -left-16 top-[30%] bg-[#0D1210] border border-[#B6FF00]/40 p-4 rounded-2xl nl-shadow-neon w-[260px] animate-float z-20 hidden lg:block text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#1C3F3A] flex items-center justify-center text-[#B6FF00]">
                      <Bot size={12} />
                    </div>
                    <span className="text-xs font-semibold text-[#B6FF00]">Recomendação da IA</span>
                  </div>
                  <p className="text-xs text-[#E6EAE4] leading-relaxed">
                    Queda de margem em Produto Y detectada. Revise preço antes de escalar anúncios.
                  </p>
                </div>

                {/* Floating: WhatsApp chat */}
                <div className="absolute -right-12 bottom-16 bg-white p-3 rounded-2xl nl-shadow-floating w-[210px] animate-float-delayed z-20 hidden lg:block text-left">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-gray-700 uppercase leading-none">Atendimento Ativo</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="bg-gray-100 p-2 rounded-lg rounded-tl-none text-[10px] text-gray-600 self-start max-w-[85%]">
                      Qual o prazo para SP?
                    </div>
                    <div className="bg-[#1C3F3A] p-2 rounded-lg rounded-tr-none text-[10px] text-white self-end max-w-[85%]">
                      1 a 2 dias úteis. Quer ver o catálogo? 😉
                    </div>
                  </div>
                </div>

                {/* Floating: Channels */}
                <div className="absolute -right-8 top-6 bg-[#1A221F] border border-[#2E3935] p-3 rounded-xl nl-shadow-floating flex-col gap-2 z-10 hidden lg:flex animate-float text-left" style={{ animationDelay: "2s" }}>
                  <div className="text-[9px] text-[#6B7470] font-bold uppercase tracking-wider mb-1">Canais conectados</div>
                  {["WhatsApp", "Instagram", "Mercado Livre"].map((plat) => (
                    <div key={plat} className="flex items-center gap-2 text-xs text-white">
                      <div className="w-3 h-3 rounded-full bg-[#B6FF00] flex items-center justify-center">
                        <Check size={8} className="text-[#080D0B]" />
                      </div>
                      {plat}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="produto" className="bg-white px-4 py-24 text-[#080D0B] md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="nl-eyebrow mb-4 block text-[#6B7470]">SISTEMA DE GESTÃO EMPRESARIAL</span>
            <h2 className="nl-h2 mb-6">A NEXT LEVEL é um ERP simples, inteligente e conectado</h2>
            <p className="nl-body text-[#6B7470]">
              Controle financeiro, vendas, clientes, produtos, custos e atendimento em uma central feita para empresários que precisam de clareza sem depender de planilhas.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: BarChart3, title: "Controle vendas e financeiro", desc: "Acompanhe faturamento, lucro real, custos, margem e movimentações importantes em dashboards claros e atualizados." },
              { icon: Users, title: "Organize clientes e atendimento", desc: "Centralize conversas, oportunidades e dados de clientes para não perder vendas no meio da rotina." },
              { icon: Bot, title: "Decida com apoio da IA", desc: "Receba alertas, relatórios e recomendações práticas para ajustar preços, reduzir perdas e priorizar as ações certas." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-[28px] border border-gray-100 bg-white p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] transition-transform duration-300 hover:-translate-y-2">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#080D0B] text-[#B6FF00]">
                  <feature.icon size={24} />
                </div>
                <h3 className="mb-4 text-xl font-bold">{feature.title}</h3>
                <p className="leading-relaxed text-[#6B7470]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="relative overflow-hidden bg-[#080D0B] px-4 py-24 md:px-8">
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="nl-eyebrow mb-4 block text-[#B6FF00]">GESTÃO DE PONTA A PONTA</span>
            <h2 className="nl-h2 mb-6">Da venda ao relatório: sua operação conectada em uma única plataforma</h2>
            <p className="nl-body text-[#AEB8B4]">
              A NEXT LEVEL organiza os dados do negócio, cruza informações de vendas, custos, produtos e atendimento, e transforma tudo em indicadores, relatórios e próximos passos.
            </p>
          </div>

          <div className="relative mx-auto max-w-5xl">
            <div className="overflow-hidden rounded-b-[16px] rounded-t-[32px] border border-[#2E3935] bg-[#0D1210] shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
              <div className="flex h-16 items-center justify-between border-b border-[#2E3935] bg-[#141B18] px-4 md:px-6">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full border border-[#B6FF00]/30 bg-[#1C3F3A]" />
                  <div>
                    <div className="text-sm font-semibold">Empresa Demo Ltda</div>
                    <div className="text-[10px] text-[#6B7470]">Última atualização: agora mesmo</div>
                  </div>
                </div>
                <div className="hidden gap-2 sm:flex">
                  {["Hoje", "7 Dias", "30 Dias"].map((label) => (
                    <div key={label} className="rounded-md border border-[#2E3935] bg-[#1A221F] px-3 py-1.5 text-xs">
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-6 p-4 md:p-8 lg:flex-row">
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                      { label: "Faturamento", value: "R$ 148.920", color: "text-white" },
                      { label: "Lucro real", value: "R$ 42.180", color: "text-[#B6FF00]" },
                      { label: "Ticket médio", value: "R$ 52,31", color: "text-white" },
                      { label: "Margem", value: "34%", color: "text-[#B6FF00]" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="rounded-xl border border-[#2E3935] bg-[#1A221F] p-4">
                        <div className="mb-2 text-[10px] font-bold uppercase text-[#6B7470]">{kpi.label}</div>
                        <div className={`text-xl font-bold md:text-2xl ${kpi.color}`}>{kpi.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex h-[240px] flex-col justify-end gap-2 rounded-xl border border-[#2E3935] bg-[#1A221F] p-6">
                    <div className="mb-3 text-xs font-bold uppercase text-[#6B7470]">Vendas · últimos 7 dias</div>
                    <div className="flex h-full items-end gap-2">
                      {[30, 45, 60, 50, 75, 65, 90].map((height, index) => (
                        <div key={index} className="group relative flex-1 cursor-pointer rounded-t-md bg-[#222C28] transition-colors hover:bg-[#B6FF00]" style={{ height: `${height}%` }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-white px-2 py-1 text-[10px] font-bold text-black opacity-0 transition-opacity group-hover:opacity-100">
                            {height * 120}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] font-bold text-[#6B7470]">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full space-y-6 lg:w-[320px]">
                  <div className="rounded-xl border border-[#1C3F3A] bg-[#1C3F3A]/20 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Bot size={16} className="text-[#B6FF00]" />
                      <span className="text-sm font-semibold text-white">Recomendações da IA</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        "Aumente o preço do Produto Y em 5% para recuperar margem.",
                        "Campanha com ROI abaixo do esperado. Considere pausar.",
                        "Estoque do Produto Z acabará em 4 dias no ritmo atual.",
                      ].map((recommendation, index) => (
                        <div key={recommendation} className={`border-l-2 py-1 pl-4 text-xs text-[#AEB8B4] ${index === 0 ? "border-[#B6FF00]" : "border-[#2E3935]"}`}>
                          {recommendation}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#2E3935] bg-[#1A221F] p-5">
                    <h4 className="mb-4 text-xs font-bold uppercase text-[#6B7470]">Status dos Canais</h4>
                    <div className="space-y-3">
                      {["WhatsApp", "Instagram", "Mercado Livre"].map((channel) => (
                        <div key={channel} className="flex items-center justify-between text-xs">
                          <span className="text-[#E6EAE4]">{channel}</span>
                          <span className="rounded bg-[#B6FF00]/10 px-2 py-0.5 text-[10px] font-bold text-[#B6FF00]">ATIVO</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="nl-shadow-floating nl-float absolute -left-16 top-32 z-20 hidden items-center gap-3 rounded-lg border border-[#2E3935] bg-[#0D1210] p-3 md:flex">
              <AlertTriangle size={16} className="text-yellow-500" />
              <span className="text-xs font-medium text-white">Produto com baixa margem detectado</span>
            </div>
            <div className="nl-shadow-floating nl-float-delayed absolute -right-12 top-48 z-20 hidden items-center gap-3 rounded-lg border border-[#2E3935] bg-[#0D1210] p-3 md:flex">
              <BarChart3 size={16} className="text-[#B6FF00]" />
              <span className="text-xs font-medium text-white">Pico de vendas: 18h às 21h</span>
            </div>
            <div className="nl-shadow-floating nl-float absolute -left-8 bottom-24 z-20 hidden items-center gap-3 rounded-lg border border-[#2E3935] bg-[#0D1210] p-3 sm:flex">
              <MessageCircleMore size={16} className="text-blue-400" />
              <span className="text-xs font-medium text-white">Cliente pediu orçamento no WhatsApp</span>
            </div>
            <div className="nl-shadow-floating nl-float-delayed absolute -right-4 bottom-12 z-20 hidden items-center gap-3 rounded-lg border border-[#2E3935] bg-[#0D1210] p-3 sm:flex">
              <Check size={16} className="text-green-500" />
              <span className="text-xs font-medium text-white">Relatório inteligente pronto</span>
            </div>
          </div>
        </div>
      </section>

      <section id="chat-ia" className="bg-gradient-to-b from-[#1C3F3A] to-[#0F2420] px-4 py-24 md:px-8">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <span className="nl-eyebrow mb-4 block text-[#B6FF00]/70">ASSISTENTE DE GESTÃO COM IA</span>
          <h2 className="nl-h2 mb-6 text-white">Um analista de negócios dentro do seu ERP</h2>
          <p className="nl-body mx-auto max-w-2xl text-[#AEB8B4]">
            Pergunte sobre vendas, custos, clientes, produtos, margem e atendimento. A IA responde com base nos dados da operação e mostra o que merece atenção.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="nl-shadow-neon overflow-hidden rounded-[24px] border border-[#1C3F3A] bg-[#0D1210]">
            <div className="flex items-center justify-between border-b border-[#2E3935] bg-[#141B18] p-4">
              <div className="flex items-center gap-3">
                <Bot size={20} className="text-[#B6FF00]" />
                <span className="text-sm font-semibold text-white">Chat IA · NEXT LEVEL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="nl-pulse-neon h-2 w-2 rounded-full bg-[#B6FF00]" />
                <span className="text-[10px] font-bold uppercase text-[#B6FF00]">Ativo</span>
              </div>
            </div>

            <div className="flex min-h-[300px] flex-col justify-end p-6 md:p-8">
              <div className="mb-8 flex flex-wrap gap-2">
                {[
                  "Qual produto está dando menos lucro?",
                  "Quanto vendi esta semana?",
                  "Onde estou perdendo margem?",
                  "Quais clientes estão sem retorno?",
                  "Qual ação devo priorizar hoje?",
                  "Existe algum custo fora do padrão?",
                ].map((prompt) => (
                  <div key={prompt} className="rounded-full border border-[#2E3935] bg-[#1A221F] px-4 py-2 text-xs text-[#E6EAE4] transition-all hover:-translate-y-1 hover:border-[#B6FF00] hover:text-[#B6FF00]">
                    {prompt}
                  </div>
                ))}
              </div>

              <div className="relative">
                <input readOnly type="text" placeholder="Pergunte qualquer coisa sobre sua empresa..." className="w-full rounded-xl border border-[#2E3935] bg-[#1A221F] py-4 pl-4 pr-16 text-white outline-none placeholder:text-[#6B7470]" />
                <button type="button" onClick={() => focusAuth(true)} className="absolute bottom-2 right-2 top-2 flex items-center justify-center rounded-lg bg-[#B6FF00] px-4 font-bold text-[#080D0B] transition-colors hover:bg-[#9BE600]" aria-label="Criar conta para usar o chat IA">
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="integracoes" className="bg-white px-4 py-24 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 lg:flex-row">
          <div className="lg:w-1/3">
            <span className="nl-eyebrow mb-4 block text-[#6B7470]">INTEGRAÇÕES</span>
            <h2 className="nl-h2 mb-6 text-[#080D0B]">Conecte os canais que movem sua operação</h2>
            <p className="nl-body mb-8 text-[#6B7470]">
              Traga dados de atendimento, mensagens e vendas para dentro da NEXT LEVEL AI e acompanhe tudo em uma visão centralizada.
            </p>
            <button type="button" onClick={() => focusAuth(true)} className="inline-flex items-center gap-2 border-b-2 border-[#B6FF00] pb-1 font-bold text-[#080D0B] transition-colors hover:text-[#1C3F3A]">
              Ver integrações disponíveis <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:w-2/3">
            {[
              { name: "WhatsApp", label: "Atendimento e oportunidades", icon: MessageSquare },
              { name: "Instagram", label: "Mensagens e clientes", icon: Smartphone },
              { name: "Mercado Livre", label: "Marketplace e vendas", icon: Package },
            ].map((integration) => (
              <div key={integration.name} className="group flex h-32 flex-col justify-between rounded-2xl border border-[#1A221F] bg-[#0D1210] p-5 transition-transform hover:-translate-y-1">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1A221F] text-white transition-colors group-hover:text-[#B6FF00]">
                    <integration.icon size={20} />
                  </div>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{integration.name}</h4>
                  <p className="text-xs text-[#6B7470]">{integration.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D1210] px-4 py-24 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <span className="nl-eyebrow mb-4 block text-[#B6FF00]">INTELIGÊNCIA OPERACIONAL</span>
            <h2 className="nl-h2 mb-6 text-white">Além de registrar dados, a NEXT LEVEL mostra o que fazer com eles</h2>
            <p className="nl-body text-[#AEB8B4]">
              A plataforma identifica padrões, riscos e oportunidades na operação para ajudar o empresário a vender melhor, controlar custos e proteger margem.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { icon: TrendingUp, title: "Previsão de vendas", desc: "Antecipe períodos fortes e fracos com base no histórico de vendas e no comportamento da operação." },
              { icon: LineChart, title: "Análise de margem", desc: "Veja quais produtos vendem bem, mas deixam pouco lucro, e ajuste antes de escalar campanhas." },
              { icon: AlertTriangle, title: "Alertas proativos", desc: "Receba avisos sobre queda de margem, aumento de custos, baixa conversão ou clientes sem retorno." },
              { icon: BarChart3, title: "Relatórios inteligentes", desc: "Gere análises visuais com explicações claras sobre vendas, custos, clientes e pontos de atenção." },
            ].map((card) => (
              <div key={card.title} className="rounded-3xl border border-[#2E3935] bg-[#141B18] p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#1C3F3A]">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#2E3935] bg-[#080D0B] text-[#B6FF00]">
                  <card.icon size={20} />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{card.title}</h3>
                <p className="leading-relaxed text-[#AEB8B4]">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="seguranca" className="nl-noise bg-[#EBE8D8] px-4 py-24 text-[#080D0B] md:px-8">
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 md:flex-row">
          <div className="md:w-1/2">
            <span className="nl-eyebrow mb-4 block text-[#1C3F3A]">SEGURANÇA E CONFIANÇA</span>
            <h2 className="nl-h2 mb-6">Gestão empresarial exige dados bem protegidos</h2>
            <p className="nl-body text-[#4A5450]">
              A NEXT LEVEL organiza informações sensíveis da empresa com foco em segurança, controle de acesso e clareza para tomada de decisão.
            </p>
          </div>

          <div className="space-y-4 md:w-1/2">
            {[
              "Dados separados por empresa em estrutura multi-tenant",
              "Acesso protegido por autenticação e sessões seguras",
              "Integrações com controle e rastreabilidade",
              "Relatórios e análises voltados para decisão empresarial",
            ].map((item) => (
              <div key={item} className="flex items-center gap-4 rounded-2xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-sm transition-colors hover:bg-white">
                <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1C3F3A] text-[#B6FF00]">
                  <Check size={12} />
                </div>
                <span className="font-semibold text-[#1C3F3A]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="scroll-mt-24 bg-[#080D0B] px-4 py-24 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="nl-eyebrow mb-4 block text-[#B6FF00]">PLANOS</span>
              <h2 className="nl-h2 mb-5 text-white">Escolha o plano ideal para o momento da sua empresa</h2>
              <p className="nl-body text-[#AEB8B4]">
                Comece com a base de gestão e avance conforme precisar de IA, automação, relatórios e canais conectados.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex rounded-2xl border border-[#2E3935] bg-[#0D1210] p-1">
                <button type="button" onClick={() => setBillingAnnual(false)} className={`rounded-xl px-5 py-3 text-sm font-bold transition ${!billingAnnual ? "bg-white text-[#080D0B]" : "text-[#AEB8B4] hover:text-white"}`}>
                  Mensal
                </button>
                <button type="button" onClick={() => setBillingAnnual(true)} className={`rounded-xl px-5 py-3 text-sm font-bold transition ${billingAnnual ? "bg-[#B6FF00] text-[#080D0B]" : "text-[#AEB8B4] hover:text-white"}`}>
                  Anual
                </button>
              </div>
              {billingAnnual && <span className="rounded-full border border-[#B6FF00]/25 bg-[#B6FF00]/10 px-4 py-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#B6FF00]">Economize no anual</span>}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.key} className={`relative flex flex-col rounded-[30px] border p-6 transition-transform duration-300 hover:-translate-y-2 ${plan.recommended ? "border-[#B6FF00]/40 bg-[#0D1210] nl-shadow-neon" : "border-[#2E3935] bg-[#0D1210]"}`}>
                {plan.recommended && (
                  <div className="absolute -top-4 right-6 rounded-full bg-[#B6FF00] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#080D0B]">
                    Mais escolhido
                  </div>
                )}
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B7470]">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{billingAnnual ? plan.annualPrice : plan.monthlyPrice}</span>
                  <span className="text-sm text-[#6B7470]">{billingAnnual ? "/ano" : "/mês"}</span>
                </div>
                {billingAnnual && <p className="mt-2 text-xs font-semibold text-[#B6FF00]">Equivale a {plan.monthlyPrice}/mês x 10</p>}
                <p className="mt-5 min-h-[72px] text-sm leading-6 text-[#AEB8B4]">{plan.summary}</p>

                <div className="mt-5 rounded-2xl border border-[#B6FF00]/15 bg-[#B6FF00]/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B6FF00]">{plan.aiTier}</p>
                  <ul className="mt-3 space-y-2">
                    {plan.aiLimitItems.map((item) => (
                      <li key={item} className="text-sm font-semibold leading-5 text-white">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs leading-5 text-[#AEB8B4]">{plan.aiDescription}</p>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm leading-5 text-[#E6EAE4]">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${plan.recommended ? "bg-[#B6FF00] text-[#080D0B]" : "border border-[#2E3935] text-[#B6FF00]"}`}>
                        <Check size={12} />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button type="button" onClick={() => onSelectPlan(plan.key)} className={`mt-7 rounded-2xl px-5 py-4 text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.98] ${plan.recommended ? "bg-[#B6FF00] text-[#080D0B] hover:bg-[#9BE600]" : "border border-[#2E3935] bg-[#141B18] text-white hover:border-[#B6FF00]/40"}`}>
                  {plan.cta}
                </button>
                <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#6B7470]">
                  <CreditCard size={14} className="mt-0.5 shrink-0" />
                  {plan.microcopy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AuthAccessSection
        isRegisterView={isRegisterView}
        setIsRegisterView={setIsRegisterView}
        onLogin={onLogin}
        onRegister={onRegister}
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
        selectedPlanLabel={selectedPlanLabel}
        subscribeIntent={subscribeIntent}
        onGoogleLogin={onGoogleLogin}
      />

      <section id="comece" className="relative overflow-hidden bg-[#080D0B] px-4 py-32 md:px-8">
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="nl-shadow-neon relative overflow-hidden rounded-[48px] border border-[#1C3F3A] bg-[#0D1210] p-10 text-center md:p-20">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B6FF00]/5 blur-[120px]" />

            <span className="nl-eyebrow relative z-10 mb-6 block text-[#B6FF00]/70">COMECE COM CONTROLE</span>
            <h2 className="nl-h2 relative z-10 mb-6 text-white">Tire sua empresa do improviso e leve a gestão para o próximo nível</h2>
            <p className="nl-body relative z-10 mx-auto mb-10 max-w-2xl text-[#AEB8B4]">
              Organize vendas, financeiro, clientes, produtos e atendimento em uma central inteligente com relatórios, automações e IA para apoiar suas decisões.
            </p>

            <div className="relative z-10 mx-auto mb-12 flex max-w-3xl flex-col justify-center gap-8 text-left md:flex-row">
              <div className="space-y-4">
                {["Controle vendas, custos e lucro real", "Organize clientes, produtos e atendimento"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check size={18} className="shrink-0 text-[#B6FF00]" />
                    <span className="text-sm text-[#E6EAE4]">{item}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                {["Receba relatórios e alertas da IA", "Conecte WhatsApp, Instagram e Mercado Livre"].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check size={18} className="shrink-0 text-[#B6FF00]" />
                    <span className="text-sm text-[#E6EAE4]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex flex-col justify-center gap-4 sm:flex-row">
              <button type="button" onClick={() => focusAuth(true)} className="flex items-center justify-center gap-2 rounded-full bg-[#B6FF00] px-10 py-5 text-lg font-bold text-[#080D0B] shadow-[0_0_30px_rgba(182,255,0,0.3)] transition-all hover:scale-[1.02] hover:bg-[#9BE600]">
                Começar agora <ArrowRight size={20} />
              </button>
              <button type="button" onClick={() => focusAuth(false)} className="flex items-center justify-center rounded-full border border-[#2E3935] bg-transparent px-10 py-5 text-lg font-bold text-white transition-all hover:bg-[#1A221F]">
                Entrar na minha conta
              </button>
            </div>
          </div>
        </div>

        {[
          { text: "Margem analisada", rotate: "-rotate-12", position: "top-20 left-10" },
          { text: "Cliente capturado", rotate: "rotate-6", position: "bottom-40 right-20" },
          { text: "Relatório pronto", rotate: "rotate-12", position: "top-1/2 left-20" },
          { text: "Custo controlado", rotate: "-rotate-6", position: "top-32 right-10" },
        ].map(({ text, rotate, position }) => (
          <div key={text} className={`absolute ${position} ${rotate} hidden rounded-lg bg-white px-4 py-2 text-sm font-bold text-black opacity-10 blur-[1px] md:block`}>
            {text}
          </div>
        ))}
      </section>

      <footer className="border-t border-[#2E3935] bg-[#080D0B] px-4 pb-10 pt-20 md:px-8">
        <div className="mx-auto mb-16 flex max-w-7xl flex-col justify-between gap-12 md:flex-row">
          <div className="md:w-1/3">
            <div className="mb-6 flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-[#B6FF00]" />
              <span className="text-xl font-bold tracking-tight text-white">NEXT LEVEL</span>
            </div>
            <p className="max-w-xs text-sm text-[#6B7470]">ERP, inteligência operacional e automação para empresas brasileiras.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 md:w-2/3">
            {[
              { heading: "Produto", links: [{ label: "Gestão de vendas", action: () => scrollToSection("funcionalidades") }, { label: "Financeiro", action: () => scrollToSection("produto") }, { label: "Clientes", action: () => scrollToSection("produto") }, { label: "Produtos e custos", action: () => scrollToSection("funcionalidades") }, { label: "Relatórios", action: () => scrollToSection("chat-ia") }] },
              { heading: "Plataforma", links: [{ label: "Atendimento com IA", action: () => scrollToSection("chat-ia") }, { label: "Integrações", action: () => scrollToSection("integracoes") }, { label: "Alertas e recomendações", action: () => scrollToSection("funcionalidades") }, { label: "Chat IA", action: () => scrollToSection("chat-ia") }] },
              { heading: "Empresa", links: [{ label: "Sobre a Next Level", action: () => scrollToSection("produto") }, { label: "Contato", action: () => focusAuth(false) }, { label: "Termos de Uso", action: () => scrollToSection("seguranca") }, { label: "Política de Privacidade", action: () => scrollToSection("seguranca") }] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h4 className="mb-4 text-sm font-bold text-white">{heading}</h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <button type="button" onClick={link.action} className="text-left text-sm text-[#6B7470] transition-colors hover:text-[#B6FF00]">
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-[#1A221F] pt-8 md:flex-row">
          <p className="text-xs text-[#6B7470]">© 2026 NEXT LEVEL. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            {["Política de Privacidade", "Termos de Uso"].map((label) => (
              <button key={label} type="button" onClick={() => scrollToSection("seguranca")} className="text-xs text-[#6B7470] transition-colors hover:text-[#B6FF00]">
                {label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default NextLevelLandingPage;
