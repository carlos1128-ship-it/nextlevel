import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  ArrowUpRightIcon,
  BarChartIcon,
  DollarSignIcon,
  EyeIcon,
  EyeOffIcon,
  LightbulbIcon,
  MessageSquareIcon,
  PuzzleIcon,
} from "../components/icons";
import { api } from "../services/api";
import PricingCard, { type PricingPlan } from "../src/components/pricing/PricingCard";
import type { UserNiche } from "../src/types/domain";

function getFirstString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

const featureItems: Array<{
  title: string;
  description: string;
  eyebrow: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    title: "Automacao de WhatsApp",
    description:
      "Responda mais rapido, distribua atendimento e capture vendas sem virar refem do celular.",
    eyebrow: "Conversa que vira caixa",
    icon: MessageSquareIcon,
  },
  {
    title: "Calculadora Inteligente",
    description:
      "Descubra lucro, margem e preco de equilibrio antes de subir campanha ou dar desconto no escuro.",
    eyebrow: "ROI antes da promocao",
    icon: DollarSignIcon,
  },
  {
    title: "Integracoes One-Click",
    description:
      "Conecte Instagram, Mercado Livre e pagamentos com poucos cliques e menos friccao operacional.",
    eyebrow: "Sem token na mao",
    icon: PuzzleIcon,
  },
  {
    title: "Radar de Crescimento",
    description:
      "Receba sinais de margem, gargalo e oportunidade para vender melhor sem aumentar a bagunca.",
    eyebrow: "Acao orientada a lucro",
    icon: LightbulbIcon,
  },
];

const pricingPlans: PricingPlan[] = [
  {
    name: "Start",
    eyebrow: "Plano Start",
    priceDisplay: "R$ 0,00 - 7 Dias Gratis",
    summary: "Perfeito para validar a operacao com onboarding rapido e risco quase zero.",
    features: [
      "Calculadora de margem",
      "1 canal conectado",
      "Painel financeiro essencial",
      "Suporte por base de conhecimento",
    ],
    cta: "Ativar trial gratis",
    recommended: false,
    microcopy:
      "Cartao obrigatorio para validacao. Cobranca apenas apos o 7o dia. Cancele com um clique.",
  },
  {
    name: "Pro",
    eyebrow: "Plano Pro",
    priceDisplay: "R$ 147/mes",
    summary: "Plano para quem quer automatizar vendas e enxergar ROI de verdade.",
    features: [
      "WhatsApp e Instagram automatizados",
      "Calculadora inteligente com alertas",
      "Integracoes one-click",
      "Insights e recomendacoes de lucro",
    ],
    cta: "Assinar agora",
    recommended: true,
  },
  {
    name: "Scale",
    eyebrow: "Plano Scale",
    priceDisplay: "R$ 297/mes",
    summary: "Escala com mais controle, mais canais e menos operacao manual.",
    features: [
      "Tudo do plano Pro",
      "Mercado Livre e Mercado Pago",
      "Camadas extras de equipe",
      "Prioridade em suporte e expansao",
    ],
    cta: "Falar com vendas",
    recommended: false,
  },
];

const providerPills = ["WhatsApp", "Instagram", "Mercado Livre", "Mercado Pago"];

const metricCards = [
  {
    label: "ROI visivel",
    value: "Lucro por produto",
    helper: "Veja o impacto do preco antes de ligar o trafego.",
  },
  {
    label: "Atendimento mais rapido",
    value: "Menos fila manual",
    helper: "Centralize resposta, follow-up e proximo passo de venda.",
  },
  {
    label: "Operacao simples",
    value: "Tudo em uma tela",
    helper: "Mais decisao, menos copia e cola entre abas.",
  },
];

const fieldClassName =
  "w-full rounded-2xl border border-zinc-800 bg-[#090d18] px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-lime-400 focus:bg-[#0c1220]";

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
    <div className="min-h-screen bg-[#050816] text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(181,255,0,0.16),_transparent_28%),radial-gradient(circle_at_85%_10%,_rgba(34,197,94,0.12),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.14),_transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,rgba(9,9,11,0)_0%,rgba(5,8,22,0.92)_84%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <nav className="rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-400 font-black text-zinc-950 shadow-[0_0_28px_rgba(163,230,53,0.35)]">
                N
              </div>
              <div>
                <p className="text-sm font-black tracking-[0.22em] text-zinc-100">NEXT LEVEL</p>
                <p className="text-xs text-zinc-500">SaaS de automacao de vendas</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="rounded-full px-4 py-2 text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Recursos
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("pricing")}
                className="rounded-full px-4 py-2 text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                Planos
              </button>
              <button
                type="button"
                onClick={focusLogin}
                className="rounded-full border border-white/10 px-4 py-2 font-semibold text-zinc-100 transition hover:border-lime-400/40 hover:text-lime-200"
              >
                Entrar
              </button>
            </div>
          </div>
        </nav>

        <section className="grid gap-10 pb-12 pt-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:items-start">
          <div className="space-y-8">
            <div className="inline-flex items-center rounded-full border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-lime-200">
              Plataforma premium para vender com margem de verdade
            </div>

            <div>
              <h1 className="hero-display max-w-4xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Domine Seu Negocio com um Clique
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                A Next Level e o Cerebro Tatico que conecta suas vendas a margem real,
                automatiza atendimento e transforma rotina operacional em decisao rapida.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={focusRegister}
                className="inline-flex animate-pulse items-center justify-center gap-3 rounded-2xl bg-lime-400 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 shadow-[0_0_34px_rgba(163,230,53,0.32)] transition hover:-translate-y-0.5 hover:brightness-105"
              >
                Ativar 7 Dias Gratis
                <ArrowUpRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("features")}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-zinc-100 transition hover:border-lime-400/30 hover:bg-white/10"
              >
                Ver Demonstracao
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {metricCards.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-xl font-black text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.helper}</p>
                </article>
              ))}
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Ecossistema pronto para vender
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {providerPills.map((provider) => (
                  <span
                    key={provider}
                    className="rounded-full border border-white/10 bg-zinc-950/80 px-4 py-2 text-sm font-semibold text-zinc-200"
                  >
                    {provider}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside
            id="auth-panel"
            className="sales-float relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(9,9,11,0.98))] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.38)]"
          >
            <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(181,255,0,0.18),_transparent_55%)]" />

            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lime-200/80">
                    Comece agora
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    {isRegisterView ? "Ative sua conta de vendas" : "Entre e volte a vender rapido"}
                  </h2>
                </div>
                <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-3 py-2 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-lime-200/70">
                    ROI primeiro
                  </p>
                  <p className="mt-1 text-sm font-black text-lime-100">Setup sem friccao</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterView(false);
                    setError("");
                  }}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    !isRegisterView ? "bg-lime-400 text-zinc-950" : "text-zinc-300 hover:text-white"
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
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    isRegisterView ? "bg-lime-400 text-zinc-950" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  Criar conta
                </button>
              </div>

              <form
                onSubmit={isRegisterView ? handleRegister : handleLogin}
                className="mt-6 space-y-4"
              >
                {isRegisterView ? (
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
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
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
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
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
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
                  <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </p>
                ) : null}

                <button
                  className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-lime-400 px-4 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:-translate-y-0.5 hover:brightness-105"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
                  ) : null}
                  {loading
                    ? "Processando"
                    : isRegisterView
                      ? "Criar conta e iniciar trial"
                      : "Entrar no painel"}
                </button>
              </form>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Sem misterio
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-100">
                    Dashboard, lucro e canais no mesmo lugar.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Time pequeno
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-100">
                    Menos clique operacional, mais energia em vender.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section id="features" className="scroll-mt-24 pt-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-200/70">
                Recursos que mexem no caixa
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                Menos atrito operacional. Mais clareza para vender.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              Cada bloco foi pensado para reduzir adivinhacao e empurrar a operacao para a proxima
              venda lucrativa.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group rounded-[30px] border border-white/10 bg-white/5 p-6 transition duration-200 hover:-translate-y-1 hover:border-lime-400/25 hover:bg-white/10"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-400/10 text-lime-300">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {item.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 pt-16">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-200/70">
                Pricing pensado para conversao
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                Escolha o plano e avance sem enrolacao
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              O plano do meio vira o protagonista porque e nele que a maioria das operacoes
              desbloqueia lucro, automacao e velocidade no mesmo pacote.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} onSelect={focusRegister} />
            ))}
          </div>
        </section>

        <section className="pt-16">
          <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(163,230,53,0.12),rgba(9,9,11,0.92))] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-200/70">
                  Ultimo empurrao
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                  Pare de vender no improviso e comece a operar com margem, automacao e clareza.
                </h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={focusRegister}
                  className="rounded-2xl bg-lime-400 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:-translate-y-0.5 hover:brightness-105"
                >
                  Assine Agora
                </button>
                <button
                  type="button"
                  onClick={focusLogin}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
                >
                  Ja tenho conta
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-10 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
          SaaS, automacao de vendas e inteligencia para decidir melhor todo dia
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
