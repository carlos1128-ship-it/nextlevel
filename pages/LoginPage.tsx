import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  EyeIcon,
  EyeOffIcon,
  MessageSquareIcon,
  PackageIcon,
  PuzzleIcon,
  ReceiptIcon,
} from "../components/icons";
import MarginCalculator from "../components/MarginCalculator";
import { api } from "../services/api";
import PricingCard, { type PricingPlan } from "../src/components/pricing/PricingCard";
import ChromeShieldStage from "../src/components/marketing/ChromeShieldStage";
import TacticalScenario from "../src/components/marketing/TacticalScenario";
import type { UserNiche } from "../src/types/domain";

function getFirstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

const tacticalCards: Array<{
  title: string;
  description: string;
  eyebrow: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    title: "Sua operacao simples como um brinquedo.",
    description:
      "A calculadora transforma preco, custo, frete e imposto em uma leitura que qualquer pessoa entende em segundos.",
    eyebrow: "Simplificacao infantil",
    icon: PackageIcon,
    accent: "from-lime-300/18 via-lime-400/10 to-transparent",
  },
  {
    title: "Gestao tao clara que voce nao consegue parar de olhar.",
    description:
      "Quando a margem aparece viva na tela, a rotina deixa de ser loteria e vira comando tatico.",
    eyebrow: "Clareza viciante",
    icon: ActivityIcon,
    accent: "from-emerald-300/18 via-emerald-400/10 to-transparent",
  },
  {
    title: "Sincronize Mercado Livre, Shopee, WhatsApp em 1 clique.",
    description:
      "A operacao fica centralizada sem token manual, sem planilha quebrada e sem staff perdendo tempo com remendo.",
    eyebrow: "Integracao sem atrito",
    icon: PuzzleIcon,
    accent: "from-cyan-300/18 via-cyan-400/10 to-transparent",
  },
];

const pricingPlans: PricingPlan[] = [
  {
    name: "Start Free",
    eyebrow: "Start Free",
    priceDisplay: "7 dias gratis",
    summary:
      "Entre, conecte canais e valide sua margem real antes de qualquer desconto acontecer.",
    features: [
      "Trial de 7 dias com acesso ao painel",
      "Calculadora de margem e preco ideal",
      "1 operacao conectada para validar o fluxo",
      "Onboarding tatico ja no primeiro acesso",
    ],
    cta: "Ativar trial gratis",
    recommended: false,
    microcopy:
      "Cartao obrigatorio para validacao, mas o desconto so ocorre apos o 7o dia. Cancele com um clique no painel.",
  },
  {
    name: "Pro",
    eyebrow: "Plano Tatico",
    priceDisplay: "R$ 147/mes",
    summary:
      "A camada que organiza vendas, margem e atendimento no ritmo real da operacao.",
    features: [
      "WhatsApp, Instagram e alertas de margem",
      "Visao de lucro real por produto e canal",
      "Recomendacoes praticas da IA tatica",
      "Automacao pronta para operar sem atrito",
    ],
    cta: "Entrar no lucro real",
    recommended: true,
    microcopy: "Pensado para quem nao quer escalar faturamento queimando lucro no processo.",
  },
  {
    name: "Scale",
    eyebrow: "Operacao de Escala",
    priceDisplay: "R$ 297/mes",
    summary:
      "Para quando a empresa precisa de mais previsibilidade, mais canais e menos improviso no comando.",
    features: [
      "Tudo do Pro com operacao multicanal",
      "Mercado Livre, Mercado Pago e camadas extras",
      "Mais contexto para time e rotinas de decisao",
      "Acompanhamento prioritario para expansao",
    ],
    cta: "Falar com vendas",
    recommended: false,
  },
];

const providerPills = ["WhatsApp", "Instagram", "Mercado Livre", "Shopee", "Mercado Pago"];

const heroSignals = [
  {
    label: "Linha da vida",
    value: "+18,4%",
    helper: "Margem protegida apos ajuste de preco e frete.",
  },
  {
    label: "Atrito removido",
    value: "1 clique",
    helper: "Conexoes criticas prontas sem ritual tecnico cansativo.",
  },
  {
    label: "Campo visual",
    value: "360°",
    helper: "Venda, custo e lucro no mesmo radar decisorio.",
  },
];

const fieldClassName =
  "w-full rounded-[22px] border border-white/10 bg-[#060911] px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-lime-400/60 focus:bg-[#090f18]";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const LoginPage = () => {
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post<{
        accessToken?: string;
        access_token?: string;
        refreshToken?: string;
        refresh_token?: string;
        user?: { name?: string; admin?: boolean; niche?: UserNiche | null };
      }>("/auth/login", {
        email,
        password,
      });

      const payload = response.data as Record<string, unknown>;
      const nestedData = (payload.data || payload.result || payload.tokens || {}) as Record<string, unknown>;
      const token = getFirstString([
        payload.access_token,
        payload.accessToken,
        payload.token,
        nestedData.access_token,
        nestedData.accessToken,
        nestedData.token,
      ]);
      const refreshToken = getFirstString([
        payload.refresh_token,
        payload.refreshToken,
        nestedData.refresh_token,
        nestedData.refreshToken,
      ]);

      if (!token) {
        throw new Error("Token nao retornado no login.");
      }

      localStorage.setItem("access_token", token);
      if (refreshToken) {
        localStorage.setItem("refresh_token", refreshToken);
      } else {
        localStorage.removeItem("refresh_token");
      }

      login({
        name: response.data.user?.name || email,
        email,
        admin: Boolean(response.data.user?.admin),
        niche: response.data.user?.niche || null,
      });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: Record<string, unknown> } }).response;
        const message =
          response?.data?.message ||
          response?.data?.error ||
          response?.data?.detail ||
          "Erro ao fazer login";
        setError(String(message));
      } else {
        setError(err instanceof Error ? err.message : "Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register", {
        email,
        password,
        name: name.trim(),
        companyName: name.trim(),
      });
      alert("Conta criada com sucesso. Faca login.");
      setIsRegisterView(false);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao registrar");
    } finally {
      setLoading(false);
    }
  };

  const focusRegister = () => {
    setIsRegisterView(true);
    scrollToSection("auth-panel");
  };

  const focusLogin = () => {
    setIsRegisterView(false);
    scrollToSection("auth-panel");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030507] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,255,0,0.08),transparent_18%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.1),transparent_16%),radial-gradient(circle_at_50%_0%,rgba(18,68,44,0.22),transparent_36%),linear-gradient(180deg,#030507_0%,#05070b_36%,#040608_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(4,6,8,0))]" />

      <div className="relative mx-auto max-w-[1480px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <nav className="rounded-full border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-lime-300/25 bg-lime-300/10 shadow-[0_0_34px_rgba(182,255,0,0.18)]">
                <span className="text-lg font-black tracking-[-0.08em] text-lime-200">NL</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.34em] text-zinc-500">Next Level</p>
                <p className="mt-1 text-sm font-semibold text-zinc-200">
                  Operacao tatica, margem real, sobrevivencia inteligente.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => scrollToSection("tactical-content")}
                className="rounded-full px-4 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                O que fazemos
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("pricing")}
                className="rounded-full px-4 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Planos
              </button>
              <button
                type="button"
                onClick={focusLogin}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-semibold text-zinc-100 transition hover:border-lime-400/30 hover:text-lime-100"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={focusRegister}
                className="rounded-full border border-lime-400/20 bg-lime-400/10 px-4 py-2 font-black uppercase tracking-[0.18em] text-lime-100 shadow-[0_0_30px_rgba(182,255,0,0.12)] transition hover:brightness-110"
              >
                Trial de 7 dias
              </button>
            </div>
          </div>
        </nav>

        <section className="grid gap-10 pb-16 pt-14 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-start">
          <div className="space-y-8 pt-4">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-300">
              Presenting: O Cerebro Tatico do seu Negocio
            </div>

            <div className="max-w-4xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-zinc-500">
                A batalha pela sobrevivencia
              </p>
              <h1 className="tactical-display mt-4 text-5xl leading-[0.88] text-white sm:text-6xl lg:text-7xl xl:text-[5.4rem]">
                <span className="block">A linha que separa sua empresa</span>
                <span className="mt-2 block text-lime-200 text-shadow-neon">
                  do lucro real ou do colapso.
                </span>
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
                Sem a Next Level, voce opera cego. Automatize vendas, conecte canais e
                enxergue margem verdadeira antes de perder dinheiro. A escolha e sua.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={focusRegister}
                className="inline-flex items-center justify-center gap-3 rounded-[24px] border border-lime-300/20 bg-lime-300 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 shadow-[0_0_34px_rgba(182,255,0,0.24),0_26px_70px_rgba(182,255,0,0.1)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(182,255,0,0.36),0_32px_80px_rgba(182,255,0,0.14)]"
              >
                Ativar Trial Gratis (7 Dias)
                <ArrowUpRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("life-demo")}
                className="inline-flex items-center justify-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-zinc-100 transition hover:border-lime-400/25 hover:bg-white/[0.08]"
              >
                Ver Demonstracao Tatica
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {providerPills.map((provider) => (
                <span
                  key={provider}
                  className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300"
                >
                  {provider}
                </span>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {heroSignals.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.helper}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <ChromeShieldStage />
            <aside
            id="auth-panel"
            className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,24,0.98),rgba(7,9,13,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.4)]"
          >
            <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(182,255,0,0.18),transparent_54%)]" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-lime-200/75">
                    Ponto de entrada
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
                    {isRegisterView ? "Ative o trial e assuma o controle" : "Entre e recupere a visao"}
                  </h2>
                </div>
                <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-3 py-2 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-lime-200/70">
                    validacao
                  </p>
                  <p className="mt-1 text-sm font-black text-lime-100">7 dias</p>
                </div>
              </div>

              <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  Trial com cartao validado
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  O desconto so acontece depois do 7o dia. Se nao fizer sentido, cancele com um clique.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 rounded-[24px] border border-white/10 bg-white/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterView(false);
                    setError("");
                  }}
                  className={`rounded-[20px] px-4 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${
                    !isRegisterView ? "bg-white text-zinc-950" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterView(true);
                    setError("");
                  }}
                  className={`rounded-[20px] px-4 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${
                    isRegisterView ? "bg-lime-300 text-zinc-950" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  Trial
                </button>
              </div>

              <form
                onSubmit={isRegisterView ? handleRegister : handleLogin}
                className="mt-6 space-y-4"
              >
                {isRegisterView ? (
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                      Nome
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={fieldClassName}
                      type="text"
                      placeholder="Ex.: Ana Oliveira"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    E-mail
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClassName}
                    type="email"
                    placeholder="voce@empresa.com"
                  />
                </div>

                <div className="relative">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                    Senha
                  </label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={fieldClassName}
                    type={showPassword ? "text" : "password"}
                    placeholder={isRegisterView ? "Crie uma senha forte" : "Sua senha"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-4 top-[42px] text-zinc-500 transition hover:text-zinc-200"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {error ? (
                  <p className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </p>
                ) : null}

                <button
                  className="inline-flex w-full items-center justify-center gap-3 rounded-[24px] border border-lime-300/10 bg-lime-300 px-4 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition duration-300 hover:-translate-y-0.5 hover:brightness-105"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
                  ) : null}
                  {loading
                    ? "Processando"
                    : isRegisterView
                      ? "Ativar Trial Gratis"
                      : "Entrar no Painel"}
                </button>
              </form>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                    Operacao cega
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-100">
                    Faturamento sem margem e desconto sem criterio.
                  </p>
                </div>
                <div className="rounded-[22px] border border-lime-400/15 bg-lime-400/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-100/70">
                    Operacao assistida
                  </p>
                  <p className="mt-2 text-sm font-semibold text-lime-50">
                    Venda, custo e decisao no mesmo radar.
                  </p>
                </div>
              </div>
            </div>
          </aside>
          </div>
        </section>

        <section id="tactical-content" className="scroll-mt-24 pt-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-200/70">
                O que nos fazemos
              </p>
              <h2 className="tactical-display mt-3 max-w-4xl text-4xl leading-[0.94] text-white sm:text-5xl">
                Clareza operacional suficiente para mexer no seu caixa no mesmo dia.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              Nao e dashboard decorativo. E leitura de vida ou morte para uma operacao que precisa
              parar de crescer no prejuizo.
            </p>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {tacticalCards.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-lime-400/20 hover:bg-white/[0.06]"
                >
                  <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${item.accent}`} />
                  <div className="relative">
                    <div className="inline-flex rounded-2xl border border-white/10 bg-black/30 p-3 text-lime-200">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                      {item.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-400">{item.description}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-8">
            <MarginCalculator className="border-white/10 bg-[#05070b]" />
          </div>
        </section>

        <section id="life-demo" className="scroll-mt-24 pt-16">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Graficos vida ou morte
              </p>
              <h2 className="tactical-display mt-3 max-w-4xl text-4xl leading-[0.94] text-white sm:text-5xl">
                A Next Level enxerga a margem que seus funcionarios, ou voce, queimam sem saber.
              </h2>
            </div>
            <div className="max-w-xl rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
                leitura tatico-financeira
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-400">
                Primeiro a venda sobe. Depois o prejuizo vem escondido. A plataforma mostra esse
                ponto antes do caixa sentir.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            <TacticalScenario
              eyebrow="Cenario 1"
              title="Sem Next Level: vendas sobem, lucro entra no vermelho."
              tone="danger"
              helper="Faturamento acelera, mas frete, imposto e desconto mordem a margem ate virar um grafico bonito com caixa fragil."
              positive={false}
            />
            <TacticalScenario
              eyebrow="Cenario 2"
              title="Com Next Level: a calculadora ajusta a margem e o lucro dispara."
              tone="safe"
              helper="Preco ideal, integracao organizada e margem viva em neon. O crescimento deixa de parecer sucesso e passa a ser sucesso."
              positive={true}
            />
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 pt-16">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-200/70">
                Novo funil de entrada
              </p>
              <h2 className="tactical-display mt-3 max-w-4xl text-4xl leading-[0.94] text-white sm:text-5xl">
                Entre no trial, valide a margem e avance para a camada de lucro real.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              Estrutura de tres planos, mas com uma promessa clara: o trial vira decisao real sem
              pegadinha escondida.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} onSelect={focusRegister} />
            ))}
          </div>
        </section>

        <section className="pt-16">
          <div className="relative overflow-hidden rounded-[36px] border border-lime-400/18 bg-[linear-gradient(135deg,rgba(182,255,0,0.16),rgba(8,11,16,0.98)_40%,rgba(3,5,7,1)_100%)] p-7 sm:p-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(182,255,0,0.16),transparent_22%)]" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-100/70">
                  Ultima chamada
                </p>
                <h2 className="tactical-display mt-3 text-4xl leading-[0.94] text-white sm:text-5xl">
                  Se a sua linha de lucro ainda depende de sorte, ela ja esta em risco.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-200/80 sm:text-base">
                  Entre agora, valide com 7 dias de trial e transforme crescimento bruto em lucro
                  verdadeiro.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={focusRegister}
                  className="rounded-[24px] bg-lime-300 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 shadow-[0_0_36px_rgba(182,255,0,0.24)] transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Entrar para o Lucro Real
                </button>
                <button
                  type="button"
                  onClick={focusLogin}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]"
                >
                  Ja tenho conta
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-10 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
          Next Level Platform · margem verdadeira · automacao tatica · operacao viva
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
