import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../services/api";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function parsePtBrNumber(value: string): number {
  return parseFloat(value.replace(",", ".")) || 0;
}
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─────────────────────────────────────────────────────────────
   Animated Counter
───────────────────────────────────────────────────────────── */
const AnimatedCounter: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1800 }) => {
  const [display, setDisplay] = useState("0");
  const hasRun = useRef(false);
  const numMatch = value.match(/([\d,.]+)/);
  const prefix = value.match(/^[^0-9]*/)?.[0] || "";
  const suffix = value.match(/[^0-9,.]+$/)?.[0] || "";

  useEffect(() => {
    if (hasRun.current || !numMatch) return;
    hasRun.current = true;
    const target = parseFloat(numMatch[1].replace(",", "."));
    const isFloat = numMatch[1].includes(",") || numMatch[1].includes(".");
    const steps = 60;
    let current = 0;
    const step = target / steps;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setDisplay(isFloat ? current.toFixed(1).replace(".", ",") : Math.floor(current).toLocaleString("pt-BR"));
    }, duration / steps);
  }, []);

  return <>{prefix}{display}{suffix}</>;
};

/* ─────────────────────────────────────────────────────────────
   Icons
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
const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24">
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
const BrainIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const WhatsAppIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const ChartIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const ShieldIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const ZapIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const TrendingUpIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const ArrowRight = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);
const CreditCardIcon = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   Static Data
───────────────────────────────────────────────────────────── */
const METRICS = [
  { value: "+18,4%", label: "Aumento médio de margem", icon: TrendingUpIcon },
  { value: "360°", label: "Visão operacional total", icon: ChartIcon },
  { value: "1 clique", label: "Para conectar canais", icon: ZapIcon },
  { value: "24/7", label: "IA trabalhando por você", icon: BrainIcon },
];

const PROOF_STATS = [
  { quote: "A Netflix economizou mais de US$ 1 bilhão por ano com análise de dados de comportamento do usuário.", source: "Harvard Business Review" },
  { quote: "Empresas que usam IA na gestão têm 25% mais chance de superar concorrentes em rentabilidade.", source: "McKinsey Global Institute" },
  { quote: "Pequenos negócios que adotam automação crescem até 3x mais rápido do que os que não adotam.", source: "Salesforce Research 2023" },
];

const FEATURES = [
  {
    icon: BrainIcon,
    title: "IA que analisa seu negócio",
    desc: "Insights automáticos sobre vendas, margem, horários de pico e tendências. Sem achismo. Só dados.",
    color: "from-lime-400/15 to-emerald-400/5",
    border: "border-lime-400/20",
  },
  {
    icon: WhatsAppIcon,
    title: "Atendimento automático",
    desc: "Agentes inteligentes no WhatsApp, Instagram e Mercado Livre. Venda enquanto você dorme.",
    color: "from-green-400/15 to-teal-400/5",
    border: "border-green-400/20",
  },
  {
    icon: ChartIcon,
    title: "Dashboard em tempo real",
    desc: "Tudo em um lugar: vendas, lucro, estoque e alertas. A foto da sua empresa a qualquer momento.",
    color: "from-cyan-400/15 to-blue-400/5",
    border: "border-cyan-400/20",
  },
  {
    icon: ShieldIcon,
    title: "Gestão multi-empresa",
    desc: "Gerencie várias empresas com um único acesso. Cada uma com seu painel, metas e dados.",
    color: "from-violet-400/15 to-purple-400/5",
    border: "border-violet-400/20",
  },
];

const INTEGRATIONS = [
  { name: "WhatsApp", color: "#25D366", bg: "bg-[#25D366]/10 border-[#25D366]/25" },
  { name: "Instagram", color: "#E1306C", bg: "bg-[#E1306C]/10 border-[#E1306C]/25" },
  { name: "Mercado Livre", color: "#FFE600", bg: "bg-[#FFE600]/10 border-[#FFE600]/25" },
  { name: "Shopee", color: "#FF5722", bg: "bg-[#FF5722]/10 border-[#FF5722]/25" },
  { name: "API própria", color: "#b6ff00", bg: "bg-[#b6ff00]/10 border-[#b6ff00]/25" },
];

const PRICING = [
  {
    name: "Common",
    monthlyPrice: "R$ 97", annualPrice: "R$ 1.067",
    summary: "A base para organizar sua operação e ter visibilidade real desde o primeiro acesso.",
    features: ["Calculadora de margem inteligente", "Até 2 empresas vinculadas", "Dashboard em tempo real", "IA básica de análise", "Suporte via e-mail"],
    cta: "Começar agora", recommended: false,
    microcopy: "Acesso imediato · Sem fidelidade",
  },
  {
    name: "Premium",
    monthlyPrice: "R$ 137", annualPrice: "R$ 1.507",
    summary: "A camada que organiza vendas, margem e atendimento no ritmo real da sua operação.",
    features: ["Até 10 empresas vinculadas", "WhatsApp + Instagram integrados", "Alertas inteligentes de margem", "Relatórios automáticos semanais", "Recomendações táticas da IA", "Suporte prioritário"],
    cta: "Ativar Premium", recommended: true,
    microcopy: "Pensado pra escalar sem queimar lucro",
  },
  {
    name: "Pro Business",
    monthlyPrice: "R$ 247", annualPrice: "R$ 2.717",
    summary: "Para operações em expansão que precisam de previsibilidade, velocidade e zero improviso.",
    features: ["Empresas ilimitadas", "Tudo do Premium", "Mercado Livre + Shopee + marketplaces", "Insights preditivos avançados", "Integrações via API customizada", "Acompanhamento dedicado"],
    cta: "Falar com consultor", recommended: false,
    microcopy: "Para quem opera em outro nível",
  },
];

/* ─────────────────────────────────────────────────────────────
   Margin Calculator
───────────────────────────────────────────────────────────── */
const MarginCalculator: React.FC = () => {
  const [tab, setTab] = useState<"lucro" | "preco">("lucro");
  const [cost, setCost] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [desiredMargin, setDesiredMargin] = useState("");

  const sale = parsePtBrNumber(salePrice);
  const c = parsePtBrNumber(cost);
  const dm = parsePtBrNumber(desiredMargin);
  const profit = sale - c;
  const margin = sale > 0 ? (profit / sale) * 100 : 0;
  const idealPrice = c > 0 && dm > 0 ? c / (1 - dm / 100) : 0;
  const idealProfit = idealPrice - c;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fieldCls = "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-50 outline-none placeholder:text-zinc-600 focus:border-lime-400/50 focus:bg-white/[0.06] transition";

  const marginColor = margin >= 20 ? "text-lime-400" : margin >= 10 ? "text-yellow-400" : "text-red-400";
  const marginLabel = margin >= 20 ? "Saudável ✓" : margin >= 10 ? "Atenção ⚠" : "Crítica ✗";

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#050709] overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-lime-300/70">Calculadora ao Vivo</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">Descubra seu lucro real agora</h3>
        </div>
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
          {(["lucro", "preco"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`rounded-[14px] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${tab === t ? "bg-lime-300 text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
              {t === "lucro" ? "Lucro" : "Preço Ideal"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        {/* Inputs */}
        <div className="p-6 space-y-4">
          {tab === "lucro" ? (
            <>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Preço de venda</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
                  <input value={salePrice} onChange={e => setSalePrice(e.target.value)} className={`${fieldCls} pl-10`} placeholder="0,00" inputMode="decimal" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Custo do produto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
                  <input value={cost} onChange={e => setCost(e.target.value)} className={`${fieldCls} pl-10`} placeholder="0,00" inputMode="decimal" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Custo do produto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
                  <input value={cost} onChange={e => setCost(e.target.value)} className={`${fieldCls} pl-10`} placeholder="0,00" inputMode="decimal" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Margem desejada</label>
                <div className="relative">
                  <input value={desiredMargin} onChange={e => setDesiredMargin(e.target.value)} className={`${fieldCls} pr-10`} placeholder="30" inputMode="decimal" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">%</span>
                </div>
              </div>
            </>
          )}
          <p className="text-xs text-zinc-600 pt-2">
            Esta é uma amostra gratuita. Na plataforma, você tem acesso a análises completas com frete, imposto e múltiplos produtos.
          </p>
        </div>

        {/* Result */}
        <div className="border-l border-white/[0.06] p-6 bg-[linear-gradient(160deg,rgba(182,255,0,0.04),transparent)] flex flex-col justify-center">
          {tab === "lucro" ? (
            sale > 0 && c > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Lucro por unidade</p>
                  <p className={`mt-2 text-5xl font-black tracking-tight ${profit >= 0 ? "text-lime-300" : "text-red-400"}`}>{fmt(profit)}</p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Margem</p>
                    <p className={`mt-1 text-xl font-black ${marginColor}`}>{margin.toFixed(1)}%</p>
                    <p className={`text-[10px] font-semibold ${marginColor}`}>{marginLabel}</p>
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-600">Custo</p>
                    <p className="mt-1 text-xl font-black text-white">{fmt(c)}</p>
                    <p className="text-[10px] text-zinc-500">{((c/sale)*100).toFixed(0)}% do preço</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-lime-400/10 mb-3">
                  <ChartIcon />
                </div>
                <p className="text-sm text-zinc-500">Preencha os campos ao lado para ver seu lucro real</p>
              </div>
            )
          ) : (
            idealPrice > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Preço ideal de venda</p>
                  <p className="mt-2 text-5xl font-black tracking-tight text-lime-300">{fmt(idealPrice)}</p>
                </div>
                <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-3">
                  <p className="text-sm text-lime-200/80">Lucro embutido: <span className="font-black text-lime-300">{fmt(idealProfit)}</span></p>
                  <p className="text-xs text-zinc-500 mt-1">Para margem de {dm.toFixed(1)}% com custo de {fmt(c)}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-lime-400/10 mb-3">
                  <ZapIcon />
                </div>
                <p className="text-sm text-zinc-500">Informe custo e margem desejada para gerar o preço ideal</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Auth Panel
───────────────────────────────────────────────────────────── */
const authFieldCls = "w-full rounded-[18px] border border-white/10 bg-[#070a0f] px-4 py-3 text-sm text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-lime-400/60 focus:bg-[#0a1020] focus:shadow-[0_0_20px_rgba(182,255,0,0.08),inset_0_0_0_1px_rgba(182,255,0,0.06)]";

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
  <aside id="auth-panel" className="sticky top-6 self-start">
    <div className="relative overflow-hidden rounded-[32px] border border-lime-400/[0.14] bg-[linear-gradient(200deg,rgba(14,20,28,0.99),rgba(6,8,12,0.99))] shadow-[0_32px_100px_rgba(0,0,0,0.6),0_0_0_1px_rgba(182,255,0,0.03),inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Glow top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(182,255,0,0.18),transparent_60%)]" />

      <div className="relative p-7">
        {/* Logo mark */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-lime-400 shadow-[0_0_20px_rgba(182,255,0,0.4)]">
            <span className="text-zinc-950 font-black text-sm tracking-tighter">NL</span>
          </div>
          <div>
            <p className="text-white font-black text-base tracking-tight">NEXT LEVEL</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Plataforma de Gestão IA</p>
          </div>
        </div>

        {/* Tab selector */}
        <div className="grid grid-cols-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-1 mb-5">
          <button type="button" onClick={() => { setIsRegisterView(false); setError(""); }}
            className={`rounded-[16px] px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] transition ${!isRegisterView ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"}`}>
            Entrar
          </button>
          <button type="button" onClick={() => { setIsRegisterView(true); setError(""); }}
            className={`rounded-[16px] px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] transition ${isRegisterView ? "bg-lime-300 text-zinc-950 shadow-[0_0_18px_rgba(182,255,0,0.3)]" : "text-zinc-400 hover:text-white"}`}>
            Cadastro
          </button>
        </div>

        {/* Google */}
        <button type="button"
          onClick={() => {
            const raw = String(import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
            const base = /\/api$/i.test(raw) ? raw : `${raw}/api`;
            window.location.href = `${base}/auth/google`;
          }}
          className="flex w-full items-center justify-center gap-3 rounded-[18px] border border-white/[0.1] bg-white/[0.04] py-3 text-sm font-black uppercase tracking-[0.12em] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] mb-4">
          <GoogleIcon /> Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-white/[0.07]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">ou email</span>
          <div className="h-px flex-1 bg-white/[0.07]" />
        </div>

        <form onSubmit={isRegisterView ? onRegister : onLogin} className="space-y-3">
          {isRegisterView && (
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Nome completo</label>
              <input value={name} onChange={e => setName(e.target.value)} className={authFieldCls} type="text" placeholder="Seu nome" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">E-mail</label>
            <input value={email} onChange={e => setEmail(e.target.value)} className={authFieldCls} type="email" placeholder="voce@empresa.com" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Senha</label>
              {!isRegisterView && <a href="/forgot-password" className="text-[10px] font-semibold text-zinc-500 hover:text-lime-300 transition">Esqueceu?</a>}
            </div>
            <div className="relative">
              <input value={password} onChange={e => setPassword(e.target.value)} className={`${authFieldCls} pr-12`}
                type={showPassword ? "text" : "password"} placeholder={isRegisterView ? "Crie uma senha forte" : "Sua senha"} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 transition">
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-[14px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-lime-300 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_30px_rgba(182,255,0,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:opacity-60 mt-1">
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> : null}
            {isRegisterView ? "Criar minha conta" : "Entrar no painel"}
            {!loading && <ArrowRight />}
          </button>
        </form>

        {/* Trust signals */}
        <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-2 text-center">
          {[
            { icon: "🔒", label: "SSL 256-bit" },
            { icon: "⚡", label: "Setup em 3 min" },
            { icon: "🤖", label: "IA ativa 24/7" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] py-2.5 px-1">
              <p className="text-base">{s.icon}</p>
              <p className="mt-1 text-[9px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </aside>
);

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [activeStat, setActiveStat] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActiveStat(p => (p + 1) % PROOF_STATS.length), 4000);
    return () => clearInterval(interval);
  }, []);

  const focusAuth = (register = false) => {
    setIsRegisterView(register);
    document.getElementById("auth-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data?.token || res.data?.data?.token;
      if (token) { login(token, res.data?.user || res.data?.data?.user); navigate("/dashboard"); }
      else setError("Resposta inesperada do servidor.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Credenciais inválidas.");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("Preencha todos os campos."); return; }
    if (password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const token = res.data?.token || res.data?.data?.token;
      if (token) { login(token, res.data?.user || res.data?.data?.user); navigate("/dashboard"); }
      else setError("Erro ao criar conta.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Erro ao criar conta.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#030508] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Grid bg pattern */}
      <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200h1v40H0zM0%200h40v1H0z%22%20fill%3D%22rgba(255%2C255%2C255%2C0.025)%22/%3E%3C/svg%3E')] opacity-60" />

      {/* Ambient top glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(182,255,0,0.07),transparent_60%)]" />

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-lime-400 shadow-[0_0_16px_rgba(182,255,0,0.4)]">
            <span className="text-zinc-950 font-black text-xs">NL</span>
          </div>
          <span className="font-black text-lg tracking-tight text-white">NEXT LEVEL</span>
          <span className="hidden sm:block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 border-l border-white/10 pl-3">Gestão com IA</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => scrollToSection("features")} className="hidden md:block text-xs font-semibold text-zinc-400 hover:text-white transition px-3">Funcionalidades</button>
          <button onClick={() => scrollToSection("pricing")} className="hidden md:block text-xs font-semibold text-zinc-400 hover:text-white transition px-3">Planos</button>
          <button onClick={() => focusAuth(false)} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-200 hover:bg-white/[0.1] transition">Entrar</button>
          <button onClick={() => focusAuth(true)} className="rounded-xl bg-lime-400 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_18px_rgba(182,255,0,0.3)] hover:brightness-105 transition">Começar grátis</button>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* ─── HERO ─── */}
        <section className="pt-10 pb-20 grid lg:grid-cols-[1fr_400px] gap-14 items-start">
          {/* Left */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-lime-400/25 bg-lime-400/8 px-4 py-2 mb-7">
              <span className="flex h-2 w-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_6px_rgba(182,255,0,0.8)]"></span>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">Plataforma de IA para negócios</span>
            </div>

            {/* Headline */}
            <h1 className="text-[clamp(2.6rem,6vw,4.8rem)] font-black leading-[0.92] tracking-[-0.04em] text-white">
              Seu negócio em<br />
              <span className="relative inline-block">
                <span className="relative z-10 text-lime-300">outro nível.</span>
                <span className="absolute -inset-x-2 inset-y-0 rounded-lg bg-lime-400/8 -z-0"></span>
              </span><br />
              Com IA real.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 font-light">
              Centralize vendas, automatize atendimento, analise margens e tome decisões baseadas em dados — não em achismo. A Next Level é o cérebro digital do seu negócio.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => focusAuth(true)}
                className="flex items-center gap-2.5 rounded-[18px] bg-lime-400 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_36px_rgba(182,255,0,0.25)] hover:-translate-y-0.5 hover:brightness-105 transition">
                Criar conta grátis <ArrowRight />
              </button>
              <button onClick={() => scrollToSection("calculator")}
                className="flex items-center gap-2.5 rounded-[18px] border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08] transition">
                Testar calculadora
              </button>
            </div>

            {/* Integrations row */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-600 mr-1">Integra com:</span>
              {INTEGRATIONS.map(i => (
                <span key={i.name} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold ${i.bg}`} style={{ color: i.color }}>
                  {i.name}
                </span>
              ))}
            </div>

            {/* Metrics */}
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {METRICS.map((m) => (
                <div key={m.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-lime-400/10 text-lime-400">
                      <m.icon />
                    </div>
                  </div>
                  <p className="text-2xl font-black tracking-tight text-white">
                    <AnimatedCounter value={m.value} />
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">{m.label}</p>
                </div>
              ))}
            </div>

            {/* Social proof carousel */}
            <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 relative overflow-hidden">
              <div className="flex items-start gap-3">
                <span className="text-lime-400 text-2xl font-serif leading-none">"</span>
                <div>
                  <p className="text-sm leading-6 text-zinc-300 transition-all duration-500">{PROOF_STATS[activeStat].quote}</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">— {PROOF_STATS[activeStat].source}</p>
                </div>
              </div>
              <div className="flex gap-1.5 mt-4">
                {PROOF_STATS.map((_, i) => (
                  <button key={i} onClick={() => setActiveStat(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${i === activeStat ? "w-6 bg-lime-400" : "w-2 bg-white/15"}`} />
                ))}
              </div>
            </div>
          </div>

          {/* Auth Panel */}
          <AuthPanel
            isRegisterView={isRegisterView} setIsRegisterView={setIsRegisterView}
            onLogin={handleLogin} onRegister={handleRegister}
            name={name} setName={setName} email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            showPassword={showPassword} setShowPassword={setShowPassword}
            error={error} loading={loading} setError={setError}
          />
        </section>

        {/* ─── FEATURES ─── */}
        <section id="features" className="py-20 scroll-mt-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">O que a Next Level entrega</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-[0.94] tracking-[-0.04em] text-white max-w-2xl mx-auto">
              Tudo que seu negócio precisa. <span className="text-lime-300">Em um lugar.</span>
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-sm leading-7 text-zinc-400">
              Não é só um painel bonito. É automação, inteligência e visibilidade operacional integradas.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className={`rounded-[24px] border ${f.border} bg-gradient-to-b ${f.color} p-6 group hover:-translate-y-1 transition duration-300`}>
                <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/[0.06] text-lime-300 mb-4 group-hover:bg-lime-400/15 transition">
                  <f.icon />
                </div>
                <h3 className="text-base font-black tracking-tight text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-6 text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Big value prop */}
          <div className="mt-8 rounded-[28px] border border-white/[0.08] bg-[linear-gradient(135deg,rgba(182,255,0,0.06),rgba(3,5,8,0.9)_50%)] p-8 sm:p-10 overflow-hidden relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.1),transparent_40%)]" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">Por que a Next Level</p>
                <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-[1.05]">
                  Menos achismo.<br />Mais <span className="text-lime-300">estratégia.</span>
                </h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  A IA da Next Level analisa seu histórico, prevê tendências e te entrega recomendações prontas para executar. Como ter um consultor de gestão disponível 24 horas por dia.
                </p>
                <button onClick={() => focusAuth(true)} className="mt-6 flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-lime-300 hover:text-lime-200 transition group">
                  Quero experimentar <ArrowRight />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Previsão de faturamento 30 dias", detail: "Algoritmos de média móvel com alertas de risco" },
                  { label: "Identifica desperdícios automaticamente", detail: "Gargalos de estoque, horários ociosos, margens comprimidas" },
                  { label: "Fecha vendas sem intervenção humana", detail: "Agentes IA no WhatsApp, Instagram e ML" },
                  { label: "Relatórios automáticos diários", detail: "Dashboard + e-mail + alertas em tempo real" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-lime-400 text-zinc-950 shrink-0 mt-0.5">
                      <CheckIcon />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── CALCULATOR ─── */}
        <section id="calculator" className="py-20 scroll-mt-20">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">Experimente agora</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white">
              Calcule seu lucro real.<br /><span className="text-lime-300">Agora, ao vivo.</span>
            </h2>
            <p className="mt-4 text-sm text-zinc-400 max-w-md mx-auto">Uma pequena amostra do que a plataforma faz com todos seus produtos e canais de venda.</p>
          </div>
          <MarginCalculator />
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" className="py-20 scroll-mt-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">Escolha seu nível</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white max-w-xl leading-[0.94]">
                Escolha seu plano.<br /><span className="text-lime-300">Escale com lucro.</span>
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-400 max-w-xs">Três níveis. Mesma experiência Next Level — focada em margem, clareza e execução.</p>
              <div className="flex items-center gap-3">
                <div className="flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                  <button type="button" onClick={() => setBillingAnnual(false)}
                    className={`rounded-[14px] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${!billingAnnual ? "bg-white text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
                    Mensal
                  </button>
                  <button type="button" onClick={() => setBillingAnnual(true)}
                    className={`rounded-[14px] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${billingAnnual ? "bg-lime-300 text-zinc-950" : "text-zinc-400 hover:text-white"}`}>
                    Anual
                  </button>
                </div>
                {billingAnnual && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                    1 mês grátis
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <div key={plan.name} className={`relative flex flex-col rounded-[28px] border p-6 transition hover:-translate-y-1 duration-300 ${
                plan.recommended
                  ? "border-lime-400/30 bg-[linear-gradient(160deg,rgba(182,255,0,0.09),rgba(5,7,11,1)_60%)] shadow-[0_0_50px_rgba(182,255,0,0.08)]"
                  : "border-white/[0.08] bg-white/[0.025]"
              }`}>
                {plan.recommended && (
                  <div className="absolute -top-3.5 right-6 rounded-full border border-lime-400/40 bg-lime-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 shadow-[0_0_14px_rgba(182,255,0,0.3)]">
                    Mais popular
                  </div>
                )}
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">{plan.name}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tight text-white">
                    {billingAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-sm text-zinc-500">{billingAnnual ? "/ano" : "/mês"}</span>
                </div>
                {billingAnnual && (
                  <p className="mt-1 text-[11px] text-lime-300/80">Equivale a {plan.monthlyPrice}/mês × 11</p>
                )}
                <p className="mt-3 text-sm leading-6 text-zinc-400 flex-1">{plan.summary}</p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        plan.recommended ? "bg-lime-300 text-zinc-950" : "border border-white/15 text-zinc-400"
                      }`}><CheckIcon /></span>
                      <span className="text-sm text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => focusAuth(true)}
                  className={`mt-6 w-full rounded-[18px] py-3.5 text-sm font-black uppercase tracking-[0.14em] transition hover:-translate-y-0.5 ${
                    plan.recommended
                      ? "bg-lime-300 text-zinc-950 shadow-[0_0_24px_rgba(182,255,0,0.2)] hover:brightness-105"
                      : "border border-white/10 bg-white/[0.04] text-zinc-100 hover:bg-white/[0.08]"
                  }`}>
                  {plan.cta}
                </button>
                <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-zinc-600">
                  <CreditCardIcon /> {plan.microcopy}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="py-10 pb-16">
          <div className="relative overflow-hidden rounded-[32px] border border-lime-400/[0.15] bg-[linear-gradient(135deg,rgba(182,255,0,0.14),rgba(8,11,16,0.97)_40%,rgba(3,5,7,1))] p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(182,255,0,0.18),transparent_25%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/80 mb-3">Você está pronto para o próximo nível?</p>
                <h2 className="text-4xl sm:text-5xl font-black leading-[0.94] tracking-[-0.04em] text-white">
                  Se a sua <span className="text-lime-300">margem de lucro</span> ainda depende de sorte, ela já está em risco.
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-300/80">
                  Assine agora e transforme crescimento bruto em lucro real — com visibilidade total desde o primeiro acesso.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row shrink-0">
                <button type="button" onClick={() => focusAuth(true)}
                  className="flex items-center justify-center gap-2 rounded-[22px] bg-lime-300 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_40px_rgba(182,255,0,0.25)] hover:-translate-y-0.5 hover:brightness-105 transition whitespace-nowrap">
                  Criar conta agora <ArrowRight />
                </button>
                <button type="button" onClick={() => focusAuth(false)}
                  className="flex items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/[0.08] transition whitespace-nowrap">
                  Já tenho conta
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pb-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-lime-400 shadow-[0_0_12px_rgba(182,255,0,0.3)]">
              <span className="text-zinc-950 font-black text-[10px]">NL</span>
            </div>
            <span className="font-black text-sm tracking-tight text-white">NEXT LEVEL</span>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-700">
            IA · Gestão · Automação · Análise · Resultados
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
