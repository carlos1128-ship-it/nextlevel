import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../services/api";
import type { UserNiche } from "../src/types/domain";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function getFirstString(values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─────────────────────────────────────────────────────────────
   Inline SVG Icons
───────────────────────────────────────────────────────────── */
const EyeIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const EyeOffIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 012.042-3.366M6.26 6.26A9.952 9.952 0 0112 4c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411M3 3l18 18" />
  </svg>
);
const ArrowUpRight = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
  </svg>
);
const PackageIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
  </svg>
);
const ActivityIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <polyline strokeLinecap="round" strokeLinejoin="round" points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const PuzzleIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
  </svg>
);
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const CheckIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const CreditCardIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="10" x2="23" y2="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────────── */
const providerPills = ["WhatsApp", "Instagram", "Mercado Livre", "Shopee", "Mercado Pago"];

const heroSignals = [
  { label: "Linha da vida", value: "+18,4%", helper: "Margem protegida apos ajuste de preco e frete." },
  { label: "Atrito removido", value: "1 clique", helper: "Conexoes criticas prontas sem ritual tecnico cansativo." },
  { label: "Campo visual", value: "360°", helper: "Venda, custo e lucro no mesmo radar decisorio." },
];

const tacticalCards = [
  { eyebrow: "Simplificacao infantil", title: "Sua operacao simples como um brinquedo.", description: "A calculadora transforma preco, custo, frete e imposto em uma leitura que qualquer pessoa entende em segundos.", Icon: PackageIcon, accent: "rgba(182,255,0,0.10)" },
  { eyebrow: "Clareza viciante", title: "Gestao tao clara que voce nao consegue parar de olhar.", description: "Quando a margem aparece viva na tela, a rotina deixa de ser loteria e vira comando tatico.", Icon: ActivityIcon, accent: "rgba(52,211,153,0.10)" },
  { eyebrow: "Integracao sem atrito", title: "Sincronize Mercado Livre, Shopee, WhatsApp em 1 clique.", description: "A operacao fica centralizada sem token manual, sem planilha quebrada e sem staff perdendo tempo com remendo.", Icon: PuzzleIcon, accent: "rgba(34,211,238,0.10)" },
];

const pricingPlans = [
  {
    eyebrow: "Plano Common", price: "R$ 97/mes",
    summary: "A base para organizar sua operacao, conectar canais e enxergar margem real desde o primeiro acesso.",
    features: ["Calculadora de margem e preco ideal", "1 operacao conectada para validar o fluxo", "Painel tatico com leitura de lucro real", "Onboarding pratico para entrar operando"],
    cta: "Assinar agora", recommended: false, isContact: false,
    microcopy: "Assinatura mensal com acesso imediato ao painel e configuracao inicial guiada.",
  },
  {
    eyebrow: "Plano Premium", price: "R$ 137/mes",
    summary: "A camada que organiza vendas, margem e atendimento no ritmo real da operacao.",
    features: ["WhatsApp, Instagram e alertas de margem", "Visao de lucro real por produto e canal", "Recomendacoes praticas da IA tatica", "Automacao pronta para operar sem atrito"],
    cta: "Assinar agora", recommended: true, isContact: false,
    microcopy: "Pensado para quem nao quer escalar faturamento queimando lucro no processo.",
  },
  {
    eyebrow: "Plano Pro", price: "R$ 247/mes",
    summary: "Para quando a empresa precisa de mais previsibilidade, mais canais e menos improviso no comando.",
    features: ["Tudo do Premium com operacao multicanal", "Mercado Livre, Mercado Pago e camadas extras", "Mais contexto para time e rotinas de decisao", "Acompanhamento prioritario para expansao"],
    cta: "Comecar agora", recommended: false, isContact: false,
    microcopy: "Acesso completo para operacoes em expansao que precisam de visibilidade e velocidade.",
  },
];

/* ─────────────────────────────────────────────────────────────
   Margin Calculator
───────────────────────────────────────────────────────────── */
const MarginCalculatorSection: React.FC = () => {
  const [tab, setTab] = useState<"lucro" | "preco">("lucro");
  const [productName, setProductName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [cost, setCost] = useState("");

  const sale = parseFloat(salePrice.replace(",", ".")) || 0;
  const c = parseFloat(cost.replace(",", ".")) || 0;
  const profit = sale - c;
  const margin = sale > 0 ? (profit / sale) * 100 : 0;
  const hasResult = sale > 0 && c > 0;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const fieldCls = "w-full rounded-2xl border border-white/10 bg-[#060911] px-4 py-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-600 focus:border-lime-400/50 transition";

  return (
    <div className="rounded-[32px] border border-white/10 bg-[#05070b] p-6 md:p-8">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-lime-200/80">
            ⬡ Calculadora minimalista
          </div>
          <h3 className="mt-5 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
            Descubra o lucro ideal sem ruido
          </h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Digite so o essencial. A resposta aparece na hora, com foco em lucro real e precificacao inteligente.
          </p>

          <div className="mt-6 flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {(["lucro", "preco"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`flex-1 rounded-[14px] py-2.5 text-sm font-bold uppercase tracking-[0.14em] transition ${tab === t ? "bg-lime-300 text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
                {t === "lucro" ? "Lucro do Produto" : "Gerador de Preco Ideal"}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Nome do produto</p>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} className={fieldCls} placeholder="Ex.: Kit Premium" />
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Preco de venda</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
                <input value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className={`${fieldCls} pl-10`} placeholder="149,90" inputMode="decimal" />
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Custo do produto</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
                <input value={cost} onChange={(e) => setCost(e.target.value)} className={`${fieldCls} pl-10`} placeholder="89,90" inputMode="decimal" />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Preco de venda", value: sale > 0 ? fmt(sale) : "R$ 0,00" },
              { label: "Custo do produto", value: c > 0 ? fmt(c) : "R$ 0,00" },
              { label: "Margem atual", value: `${margin.toFixed(1)}%` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                <p className="mt-2 text-lg font-black tracking-tight text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-[260px] rounded-[28px] border border-lime-400/15 bg-[linear-gradient(160deg,rgba(182,255,0,0.06),transparent_60%)] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-lime-200/70">Resultado ao vivo</p>
          {hasResult ? (
            <>
              <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">{productName || "Produto"}</p>
              <p className="mt-2 text-sm text-zinc-400">Lucro por unidade vendida</p>
              <p className={`mt-6 text-5xl font-black tracking-[-0.04em] ${profit >= 0 ? "text-lime-300" : "text-red-400"}`}>{fmt(profit)}</p>
              <p className={`mt-2 text-sm font-semibold ${margin >= 20 ? "text-lime-400" : margin >= 10 ? "text-yellow-400" : "text-red-400"}`}>
                Margem: {margin.toFixed(1)}% {margin >= 20 ? "✓ Saudavel" : margin >= 10 ? "⚠ Atencao" : "✗ Critica"}
              </p>
            </>
          ) : (
            <p className="mt-6 text-sm leading-7 text-zinc-500">
              Preencha nome, preco de venda e custo para ver o lucro por produto com clareza.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Scenario Chart
───────────────────────────────────────────────────────────── */
const ScenarioChart: React.FC<{ positive: boolean }> = ({ positive }) => {
  const salesPath = "M 30 130 C 80 120 120 100 160 80 C 200 60 230 55 270 50 C 290 48 310 46 340 44";
  const profitPathBad = "M 30 140 C 80 135 120 140 160 150 C 200 162 230 175 270 188 C 290 194 310 200 340 208";
  const profitPathGood = "M 30 150 C 80 140 120 120 160 100 C 200 80 230 65 270 50 C 290 43 310 38 340 34";
  const id = positive ? "good" : "bad";
  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-[#060911] p-4">
      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-600">
        <span>Vendas</span><span>Lucro Real</span>
      </div>
      <svg viewBox="0 0 370 230" className="w-full" style={{ height: 160 }}>
        <defs>
          <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)"/><stop offset="100%" stopColor="rgba(255,255,255,0.7)"/>
          </linearGradient>
          <linearGradient id={`pg-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={positive ? "rgba(182,255,0,0.5)" : "rgba(239,68,68,0.5)"}/>
            <stop offset="100%" stopColor={positive ? "#b6ff00" : "#ef4444"}/>
          </linearGradient>
        </defs>
        <path d={salesPath} fill="none" stroke={`url(#sg-${id})`} strokeWidth="2.5" strokeLinecap="round"/>
        <path d={positive ? profitPathGood : profitPathBad} fill="none" stroke={`url(#pg-${id})`} strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="340" cy="44" r="5" fill="rgba(255,255,255,0.8)"/>
        <circle cx="340" cy={positive ? 34 : 208} r="5" fill={positive ? "#b6ff00" : "#ef4444"}/>
      </svg>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Auth Panel
───────────────────────────────────────────────────────────── */
const fieldCls = "w-full rounded-[20px] border border-white/10 bg-[#060911] px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-lime-400/50 focus:bg-[#090f18]";

interface AuthPanelProps {
  isRegisterView: boolean;
  setIsRegisterView: (v: boolean) => void;
  onLogin: (e: React.FormEvent) => void;
  onRegister: (e: React.FormEvent) => void;
  name: string; setName: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  error: string; loading: boolean; setError: (v: string) => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({
  isRegisterView, setIsRegisterView, onLogin, onRegister,
  name, setName, email, setEmail, password, setPassword,
  showPassword, setShowPassword, error, loading, setError,
}) => (
  <aside id="auth-panel" className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,18,24,0.98),rgba(7,9,13,0.98))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.4)]">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(182,255,0,0.18),transparent_54%)]" />
    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-lime-200/75">Ponto de entrada</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
            {isRegisterView ? "Crie sua conta e assuma o controle" : "Entre e recupere a visao"}
          </h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-3 py-2 text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-lime-200/70">Acesso</p>
          <p className="mt-1 text-sm font-black text-lime-100">Pago</p>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Assinatura com acesso imediato</p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">Escolha seu plano, conclua a assinatura e entre direto no painel com a configuracao inicial pronta.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 rounded-[22px] border border-white/10 bg-white/[0.04] p-1">
        <button type="button" onClick={() => { setIsRegisterView(false); setError(""); }}
          className={`rounded-[18px] px-4 py-2.5 text-sm font-black uppercase tracking-[0.14em] transition ${!isRegisterView ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
          Entrar
        </button>
        <button type="button" onClick={() => { setIsRegisterView(true); setError(""); }}
          className={`rounded-[18px] px-4 py-2.5 text-sm font-black uppercase tracking-[0.14em] transition ${isRegisterView ? "bg-lime-300 text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
          Assinar
        </button>
      </div>

      {/* Google OAuth */}
      <button type="button"
        onClick={() => {
          const raw = String(import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
          const base = /\/api$/i.test(raw) ? raw : `${raw}/api`;
          window.location.href = `${base}/auth/google`;
        }}
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08]">
        <GoogleIcon /> Continuar com Google
      </button>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">ou</span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form onSubmit={isRegisterView ? onRegister : onLogin} className="space-y-4">
        {isRegisterView && (
          <div>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={fieldCls} type="text" placeholder="Ex.: Ana Oliveira" />
          </div>
        )}
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} type="email" placeholder="voce@empresa.com" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Senha</label>
            {!isRegisterView && (
              <a href="/forgot-password" className="text-[10px] font-semibold text-zinc-500 transition hover:text-lime-300">Esqueceu a senha?</a>
            )}
          </div>
          <div className="relative">
            <input value={password} onChange={(e) => setPassword(e.target.value)} className={`${fieldCls} pr-12`}
              type={showPassword ? "text" : "password"} placeholder={isRegisterView ? "Crie uma senha forte" : "Sua senha"} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-200"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {error && <p className="rounded-[18px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

        <button type="submit" disabled={loading}
          className="inline-flex w-full items-center justify-center gap-3 rounded-[22px] border border-lime-300/10 bg-lime-300 px-4 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition duration-300 hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60">
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />}
          {loading ? "Processando..." : isRegisterView ? "Assinar agora" : "Entrar no Painel"}
        </button>
      </form>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Operacao cega</p>
          <p className="mt-2 text-sm font-semibold text-zinc-100">Faturamento sem margem e desconto sem criterio.</p>
        </div>
        <div className="rounded-[20px] border border-lime-400/15 bg-lime-400/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-100/70">Operacao assistida</p>
          <p className="mt-2 text-sm font-semibold text-lime-50">Venda, custo e decisao no mesmo radar.</p>
        </div>
      </div>
    </div>
  </aside>
);

/* ─────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────── */
const LoginPage: React.FC = () => {
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => { setName(""); setEmail(""); setPassword(""); setError(""); setLoading(false); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) { setError("Preencha e-mail e senha."); return; }
    try {
      setLoading(true);
      const response = await api.post<{
        accessToken?: string; access_token?: string;
        refreshToken?: string; refresh_token?: string;
        user?: { name?: string; admin?: boolean; niche?: UserNiche | null };
      }>("/auth/login", { email, password });
      const payload = response.data as Record<string, unknown>;
      const nestedData = (payload.data || payload.result || payload.tokens || {}) as Record<string, unknown>;
      const token = getFirstString([payload.access_token, payload.accessToken, payload.token, nestedData.access_token, nestedData.accessToken, nestedData.token]);
      const refreshToken = getFirstString([payload.refresh_token, payload.refreshToken, nestedData.refresh_token, nestedData.refreshToken]);
      if (!token) throw new Error("Token nao retornado no login.");
      localStorage.setItem("access_token", token);
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
      else localStorage.removeItem("refresh_token");
      login({ name: response.data.user?.name || email, email, admin: Boolean(response.data.user?.admin), niche: response.data.user?.niche || null });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const r = (err as { response?: { data?: Record<string, unknown> } }).response;
        setError(String(r?.data?.message || r?.data?.error || r?.data?.detail || "Erro ao fazer login"));
      } else {
        setError(err instanceof Error ? err.message : "Erro ao fazer login");
      }
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password.trim()) { setError("Preencha todos os campos."); return; }
    try {
      setLoading(true);
      await api.post("/auth/register", { email, password, name: name.trim(), companyName: name.trim() });
      alert("Conta criada com sucesso. Faca login.");
      setIsRegisterView(false);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao registrar");
    } finally { setLoading(false); }
  };

  const focusRegister = () => { setIsRegisterView(true); scrollToSection("auth-panel"); };
  const focusLogin = () => { setIsRegisterView(false); scrollToSection("auth-panel"); };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030507] text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,255,0,0.08),transparent_18%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.1),transparent_16%),radial-gradient(circle_at_50%_0%,rgba(18,68,44,0.22),transparent_36%),linear-gradient(180deg,#030507_0%,#05070b_36%,#040608_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(4,6,8,0))]" />

      <div className="relative mx-auto max-w-[1480px] px-4 pb-24 pt-6 sm:px-6 lg:px-8">

        {/* NAV */}
        <nav className="rounded-full border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-lime-300/25 bg-lime-300/10 shadow-[0_0_34px_rgba(182,255,0,0.18)]">
                <span className="text-lg font-black tracking-[-0.08em] text-lime-200">NL</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.34em] text-zinc-500">Next Level</p>
                <p className="mt-1 text-sm font-semibold text-zinc-200">Operacao tatica, margem real, sobrevivencia inteligente.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button type="button" onClick={() => scrollToSection("tactical-content")} className="rounded-full px-4 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white">O que fazemos</button>
              <button type="button" onClick={() => scrollToSection("pricing")} className="rounded-full px-4 py-2 text-zinc-400 transition hover:bg-white/5 hover:text-white">Planos</button>
              <button type="button" onClick={focusLogin} className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 font-semibold text-zinc-100 transition hover:border-lime-400/30 hover:text-lime-100">Entrar</button>
              <button type="button" onClick={focusRegister} className="rounded-full border border-lime-400/20 bg-lime-400/10 px-4 py-2 font-black uppercase tracking-[0.18em] text-lime-100 shadow-[0_0_30px_rgba(182,255,0,0.12)] transition hover:brightness-110">Assinar agora</button>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="grid gap-10 pb-16 pt-14 xl:grid-cols-[1fr_420px] xl:items-start">
          <div className="space-y-8 pt-4">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-300">
              Presenting: O Cerebro Tatico do seu Negocio
            </div>
            <div className="max-w-4xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.34em] text-zinc-500">A batalha pela sobrevivencia</p>
              <h1 className="mt-4 text-5xl font-black leading-[0.88] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                <span className="block">A linha que separa sua empresa</span>
                <span className="mt-2 block text-lime-200">do lucro real ou do colapso.</span>
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-300 sm:text-lg">
                Sem a Next Level, voce opera cego. Automatize vendas, conecte canais e enxergue margem verdadeira antes de perder dinheiro. A escolha e sua.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={focusRegister} className="inline-flex items-center justify-center gap-3 rounded-[24px] border border-lime-300/20 bg-lime-300 px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-zinc-950 shadow-[0_0_34px_rgba(182,255,0,0.24)] transition hover:-translate-y-0.5 hover:brightness-105">
                Assinar Agora <ArrowUpRight />
              </button>
              <button type="button" onClick={() => scrollToSection("life-demo")} className="inline-flex items-center justify-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]">
                Ver Demonstracao Tatica
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {providerPills.map((p) => (
                <span key={p} className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-300">{p}</span>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {heroSignals.map((item) => (
                <article key={item.label} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.helper}</p>
                </article>
              ))}
            </div>
          </div>

          <AuthPanel
            isRegisterView={isRegisterView} setIsRegisterView={setIsRegisterView}
            onLogin={handleLogin} onRegister={handleRegister}
            name={name} setName={setName} email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPassword={showPassword} setShowPassword={setShowPassword}
            error={error} loading={loading} setError={setError}
          />
        </section>

        {/* O QUE FAZEMOS */}
        <section id="tactical-content" className="scroll-mt-24 pt-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-200/70">O que nos fazemos</p>
              <h2 className="mt-3 max-w-4xl text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
                Clareza operacional suficiente para mexer no seu caixa no mesmo dia.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              Nao e dashboard decorativo. E leitura de vida ou morte para uma operacao que precisa parar de crescer no prejuizo.
            </p>
          </div>
          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            {tacticalCards.map((item) => (
              <article key={item.title} className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-lime-400/20 hover:bg-white/[0.06]">
                <div className="absolute inset-x-0 top-0 h-28" style={{ background: `linear-gradient(to bottom, ${item.accent}, transparent)` }} />
                <div className="relative">
                  <div className="inline-flex rounded-2xl border border-white/10 bg-black/30 p-3 text-lime-200"><item.Icon /></div>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">{item.eyebrow}</p>
                  <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8"><MarginCalculatorSection /></div>
        </section>

        {/* GRAFICOS */}
        <section id="life-demo" className="scroll-mt-24 pt-16">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-zinc-500">Graficos vida ou morte</p>
              <h2 className="mt-3 max-w-4xl text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
                A Next Level enxerga a margem que seus funcionarios, ou voce, queimam sem saber.
              </h2>
            </div>
            <div className="max-w-xl rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">Leitura tatico-financeira</p>
              <p className="mt-2 text-sm leading-7 text-zinc-400">Primeiro a venda sobe. Depois o prejuizo vem escondido. A plataforma mostra esse ponto antes do caixa sentir.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {[
              { eyebrow: "Cenario 1", title: "Sem Next Level: vendas sobem, lucro entra no vermelho.", helper: "Faturamento acelera, mas frete, imposto e desconto mordem a margem ate virar um grafico bonito com caixa fragil.", positive: false },
              { eyebrow: "Cenario 2", title: "Com Next Level: a calculadora ajusta a margem e o lucro dispara.", helper: "Preco ideal, integracao organizada e margem viva em neon. O crescimento deixa de parecer sucesso e passa a ser sucesso.", positive: true },
            ].map((s) => (
              <div key={s.eyebrow} className={`rounded-[32px] border p-6 ${s.positive ? "border-lime-400/15 bg-[linear-gradient(160deg,rgba(182,255,0,0.06),transparent_60%)]" : "border-red-500/15 bg-[linear-gradient(160deg,rgba(239,68,68,0.06),transparent_60%)]"}`}>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">{s.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">{s.title}</h3>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{s.helper}</p>
                <ScenarioChart positive={s.positive} />
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="scroll-mt-24 pt-16">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-200/70">Novo funil de entrada</p>
              <h2 className="mt-3 max-w-4xl text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
                Escolha seu plano, entre no painel e avance para a camada de lucro real.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-zinc-400">
              Estrutura de tres planos pagos com a mesma experiencia Next Level, focada em margem, clareza e execucao imediata.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.eyebrow} className={`relative flex flex-col rounded-[32px] border p-6 ${plan.recommended ? "border-lime-400/25 bg-[linear-gradient(160deg,rgba(182,255,0,0.08),rgba(5,7,11,1)_60%)]" : "border-white/10 bg-white/[0.04]"}`}>
                {plan.recommended && (
                  <div className="absolute -top-3 right-6 rounded-full border border-lime-400/30 bg-lime-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950">Recomendado</div>
                )}
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">{plan.eyebrow}</p>
                <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">{plan.price}</p>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{plan.summary}</p>
                <ul className="mt-5 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${plan.recommended ? "bg-lime-300 text-zinc-950" : "border border-white/20 text-zinc-400"}`}><CheckIcon /></span>
                      <span className="text-sm text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={plan.isContact ? undefined : focusRegister}
                  className={`mt-6 w-full rounded-[20px] py-4 text-sm font-black uppercase tracking-[0.16em] transition hover:-translate-y-0.5 ${plan.recommended ? "bg-lime-300 text-zinc-950 shadow-[0_0_30px_rgba(182,255,0,0.2)] hover:brightness-105" : "border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]"}`}>
                  {plan.cta}
                </button>
                {plan.microcopy && (
                  <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-600"><CreditCardIcon /> {plan.microcopy}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="pt-16">
          <div className="relative overflow-hidden rounded-[36px] border border-lime-400/[0.18] bg-[linear-gradient(135deg,rgba(182,255,0,0.16),rgba(8,11,16,0.98)_40%,rgba(3,5,7,1)_100%)] p-7 sm:p-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(182,255,0,0.16),transparent_22%)]" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-100/70">Ultima chamada</p>
                <h2 className="mt-3 text-4xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-5xl">
                  Se a sua linha de lucro ainda depende de sorte, ela ja esta em risco.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-200/80 sm:text-base">
                  Assine agora e transforme crescimento bruto em lucro verdadeiro com visibilidade tatico-financeira desde o primeiro acesso.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={focusRegister} className="rounded-[24px] bg-lime-300 px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 shadow-[0_0_36px_rgba(182,255,0,0.24)] transition hover:-translate-y-0.5 hover:brightness-105">
                  Entrar para o Lucro Real
                </button>
                <button type="button" onClick={focusLogin} className="rounded-[24px] border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/[0.08]">
                  Ja tenho conta
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pt-10 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
          Next Level Platform · margem verdadeira · automacao tatica · operacao viva
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
