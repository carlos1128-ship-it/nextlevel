import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../services/api";
import { BillingCycle, BillingPlanKey, getBillingMe } from "../src/services/endpoints";
import {
  buildPlanosSubscribeUrl,
  clearPendingSelectedPlan,
  planSelectionLabel,
  PendingPlanSelection,
  readPendingSelectedPlan,
  readPlanSelectionFromSearch,
  savePendingSelectedPlan,
} from "../src/utils/billingSelection";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Helpers
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function parsePtBrNumber(value: string): number {
  return parseFloat(value.replace(",", ".")) || 0;
}
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Animated Counter
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Icons
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Static Data
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const METRICS = [
  { title: "Enxergue o invisível", label: "A Next Level mostra gargalos, perdas e oportunidades que antes passavam despercebidas.", icon: ChartIcon },
  { title: "Venda com mais clareza", label: "Entenda produtos, custos e clientes para encontrar oportunidades reais de lucro.", icon: TrendingUpIcon },
  { title: "Conecte sem dor", label: "Integrações que reduzem trabalho manual e facilitam a rotina da operação.", icon: ZapIcon },
  { title: "Inteligência em tudo", label: "A IA apoia relatórios, exemplos claros, atendimento e decisões dentro da plataforma.", icon: BrainIcon },
];

const PROOF_STATS = [
  {
    title: "Lucro escapando sem você perceber",
    quote: "Uma loja vende bastante, mas não sabe quais produtos realmente dão margem. A Next Level ajuda a enxergar onde o dinheiro entra, onde sai e quais produtos merecem mais atenção.",
    source: "Lucro real",
  },
  {
    title: "Atendimento virando venda perdida",
    quote: "Mensagens chegam pelo WhatsApp e Instagram, mas ficam espalhadas. A Next Level ajuda a organizar atendimentos, captar dados dos clientes e transformar conversas em oportunidades.",
    source: "Atendimento conectado",
  },
  {
    title: "Campanhas sem clareza de retorno",
    quote: "O empresário investe em divulgação, mas não sabe se o resultado compensou. A plataforma ajuda a cruzar vendas, custos e canais para entender o que realmente está trazendo retorno.",
    source: "Gestão clara",
  },
  {
    title: "Decisões feitas no achismo",
    quote: "Quando vendas, custos e atendimento ficam separados, o dono decide no escuro. A Next Level reúne as informações para mostrar o que precisa ser ajustado.",
    source: "Painel de decisão",
  },
  {
    title: "Clientes interessados sendo esquecidos",
    quote: "Um cliente chama no Instagram, outro no WhatsApp, outro vem pelo Mercado Livre. A plataforma ajuda a centralizar dados e dar mais contexto para o atendimento.",
    source: "Canais organizados",
  },
  {
    title: "Tempo perdido com tarefas manuais",
    quote: "Anotar vendas, conferir mensagens, olhar custos e montar relatórios manualmente consome tempo. A Next Level organiza esses dados para o empresário focar no crescimento.",
    source: "Rotina mais simples",
  },
];

const FEATURES = [
  {
    icon: ChartIcon,
    title: "Gestão de vendas",
    desc: "Acompanhe vendas, faturamento, produtos e desempenho em um painel claro.",
    color: "from-lime-400/15 to-emerald-400/5",
    border: "border-lime-400/20",
  },
  {
    icon: WhatsAppIcon,
    title: "Atendimento e canais",
    desc: "Centralize conversas do WhatsApp e Instagram, entenda dúvidas frequentes e transforme atendimentos em oportunidades.",
    color: "from-green-400/15 to-teal-400/5",
    border: "border-green-400/20",
  },
  {
    icon: ShieldIcon,
    title: "Relatórios automáticos",
    desc: "Receba análises sobre lucro, custos, margem, fluxo de caixa e pontos de atenção.",
    color: "from-cyan-400/15 to-blue-400/5",
    border: "border-cyan-400/20",
  },
  {
    icon: BrainIcon,
    title: "Inteligência aplicada",
    desc: "A IA ajuda a interpretar os dados e sugerir ações, sem tirar o controle do empresário.",
    color: "from-violet-400/15 to-purple-400/5",
    border: "border-violet-400/20",
  },
  {
    icon: TrendingUpIcon,
    title: "Produtos e custos",
    desc: "Entenda margem, preço, desperdícios e oportunidades de economia.",
    color: "from-yellow-400/15 to-lime-400/5",
    border: "border-yellow-400/20",
  },
  {
    icon: ZapIcon,
    title: "Alertas e recomendações",
    desc: "Identifique riscos e oportunidades antes que virem problema.",
    color: "from-emerald-400/15 to-cyan-400/5",
    border: "border-emerald-400/20",
  },
];

const INTEGRATIONS = [
  { name: "WhatsApp", color: "#25D366", bg: "bg-[#25D366]/10 border-[#25D366]/25" },
  { name: "Instagram", color: "#E1306C", bg: "bg-[#E1306C]/10 border-[#E1306C]/25" },
  { name: "Mercado Livre", color: "#FFE600", bg: "bg-[#FFE600]/10 border-[#FFE600]/25" },
  { name: "Utmify", color: "#B6FF00", bg: "bg-[#B6FF00]/10 border-[#B6FF00]/25" },
];

const PRICING = [
  {
    key: "COMMON" as BillingPlanKey,
    name: "Comum",
    monthlyPrice: "R$ 49,90", annualPrice: "R$ 499",
    summary: "A base para organizar sua operação e ter visibilidade real desde o primeiro acesso.",
    features: ["Calculadora de margem inteligente", "Até 2 empresas vinculadas", "Dashboard em tempo real", "IA básica de análise", "Suporte via e-mail"],
    cta: "Assinar agora", recommended: false,
    microcopy: "Checkout seguro via AbacatePay",
  },
  {
    key: "PREMIUM" as BillingPlanKey,
    name: "Premium",
    monthlyPrice: "R$ 97", annualPrice: "R$ 970",
    summary: "A camada que organiza vendas, margem e atendimento no ritmo real da sua operação.",
    features: ["Até 10 empresas vinculadas", "WhatsApp + Instagram integrados", "Alertas inteligentes de margem", "Relatórios automáticos semanais", "Recomendações táticas da IA", "Suporte prioritário"],
    cta: "Ativar Premium", recommended: true,
    microcopy: "Pensado pra escalar sem queimar lucro",
  },
  {
    key: "PRO_BUSINESS" as BillingPlanKey,
    name: "Pro Business",
    monthlyPrice: "R$ 197", annualPrice: "R$ 1.970",
    summary: "Para operações em expansão que precisam de previsibilidade, velocidade e zero improviso.",
    features: ["Empresas ilimitadas", "Tudo do Premium", "Mercado Livre + Utmify + marketplaces", "Previsões e alertas avançados", "Integrações guiadas", "Acompanhamento dedicado"],
    cta: "Assinar Pro Business", recommended: false,
    microcopy: "Para quem opera em outro nível",
  },
];

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Margin Calculator
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const MarginCalculator: React.FC = () => {
  const [tab, setTab] = useState<"lucro" | "preço">("lucro");
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
  const marginLabel = margin >= 20 ? "Saudável" : margin >= 10 ? "Atenção" : "Crítica";

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#050709] overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-6 py-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-lime-300/70">Calculadora ao Vivo</p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">Descubra seu lucro real agora</h3>
        </div>
        <div className="flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
          {(["lucro", "preço"] as const).map((t) => (
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
            Essa é apenas uma fração do que nossa plataforma faz pelo seu negócio.
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

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Auth Panel
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
  selectedPlanLabel?: string | null;
  subscribeIntent?: boolean;
  onGoogleLogin: () => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({
  isRegisterView, setIsRegisterView, onLogin, onRegister,
  name, setName, email, setEmail, password, setPassword,
  showPassword, setShowPassword, error, loading, setError,
  selectedPlanLabel, subscribeIntent, onGoogleLogin,
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

        {(subscribeIntent || selectedPlanLabel) && (
          <div className="mb-5 rounded-[18px] border border-lime-400/20 bg-lime-400/10 p-4">
            <p className="text-sm font-bold text-lime-100">
              Entre ou crie sua conta para continuar sua assinatura.
            </p>
            {selectedPlanLabel ? (
              <p className="mt-1 text-xs font-semibold text-lime-300">
                Você selecionou: {selectedPlanLabel}
              </p>
            ) : null}
          </div>
        )}

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
          onClick={onGoogleLogin}
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
            <input value={email} onChange={e => setEmail(e.target.value)} className={authFieldCls} type="email" placeholder="nome@empresa.com" />
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
            { label: "Dados protegidos" },
            { label: "Configuração guiada" },
            { label: "IA por empresa" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] py-2.5 px-1">
              <p className="mx-auto h-1.5 w-1.5 rounded-full bg-lime-300" />
              <p className="mt-1 text-[9px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </aside>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   MAIN PAGE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [isRegisterView, setIsRegisterView] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PendingPlanSelection | null>(null);
  const [activeStat, setActiveStat] = useState(0);
  const [isInsightPaused, setIsInsightPaused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: -400, y: -400 });
  const mouseFrameRef = useRef<number | null>(null);
  const mouseTargetRef = useRef({ x: -400, y: -400 });

  useEffect(() => {
    if (isInsightPaused) return;
    const interval = setInterval(() => setActiveStat(p => (p + 1) % PROOF_STATS.length), 7000);
    return () => clearInterval(interval);
  }, [isInsightPaused]);

  useEffect(() => {
    return () => {
      if (mouseFrameRef.current !== null) cancelAnimationFrame(mouseFrameRef.current);
    };
  }, []);

  const focusAuth = (register = false) => {
    setIsRegisterView(register);
    document.getElementById("auth-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    const nextSelection = readPlanSelectionFromSearch(searchParams) || readPendingSelectedPlan();
    if (!nextSelection) return;

    setSelectedPlan(nextSelection);
    setBillingAnnual(nextSelection.billingCycle === "ANNUAL");
    savePendingSelectedPlan(nextSelection);

    if (searchParams.get("intent") === "subscribe") {
      window.setTimeout(() => focusAuth(false), 120);
    }
  }, [searchParams]);

  const selectPlanAndLogin = (planKey: BillingPlanKey, register = true) => {
    const billingCycle: BillingCycle = billingAnnual ? "ANNUAL" : "MONTHLY";
    const selection = { planKey, billingCycle };
    savePendingSelectedPlan(selection);
    setSelectedPlan(selection);
    navigate(`/login?intent=subscribe&plan=${planKey}&cycle=${billingCycle}`, { replace: false });
    focusAuth(register);
  };

  const goAfterAuth = async (user: any) => {
    login(user);
    const pendingPlan = readPlanSelectionFromSearch(searchParams) || readPendingSelectedPlan();
    try {
      const billing = await getBillingMe();
      if (billing.hasActiveSubscription) {
        clearPendingSelectedPlan();
        navigate("/dashboard", { replace: true });
        return;
      }
      navigate(pendingPlan ? buildPlanosSubscribeUrl(pendingPlan) : "/planos", { replace: true });
    } catch {
      navigate(pendingPlan ? buildPlanosSubscribeUrl(pendingPlan) : "/planos", { replace: true });
    }
  };

  const handleGoogleLogin = () => {
    const pendingPlan = readPlanSelectionFromSearch(searchParams) || selectedPlan || readPendingSelectedPlan();
    if (pendingPlan) savePendingSelectedPlan(pendingPlan);

    const raw = String(import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    const base = /\/api$/i.test(raw) ? raw : `${raw}/api`;
    window.location.href = `${base}/auth/google`;
  };

  const scrollToWhatWeDo = () => {
    document.getElementById("o-que-fazemos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const nextExample = () => {
    setActiveStat((prev) => (prev + 1) % PROOF_STATS.length);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseTargetRef.current = { x: event.clientX, y: event.clientY };
    if (mouseFrameRef.current !== null) return;
    mouseFrameRef.current = requestAnimationFrame(() => {
      setMousePosition(mouseTargetRef.current);
      mouseFrameRef.current = null;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data?.access_token || res.data?.accessToken || res.data?.token || res.data?.data?.token;
      const refreshToken = res.data?.refresh_token || res.data?.refreshToken || res.data?.data?.refresh_token || res.data?.data?.refreshToken;
      if (token) {
        localStorage.setItem("access_token", token);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        await goAfterAuth(res.data?.user || res.data?.data?.user || {});
      }
      else setError("Resposta inesperada do servidor.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Credenciais inválidas.");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError("Preencha todos os campos."); return; }
    if (password.length < 8) { setError("Senha deve ter pelo menos 8 caracteres."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/auth/register", { name, email, password, companyName: name || "Minha Empresa" });
      const token = res.data?.access_token || res.data?.accessToken || res.data?.token || res.data?.data?.token;
      const refreshToken = res.data?.refresh_token || res.data?.refreshToken || res.data?.data?.refresh_token || res.data?.data?.refreshToken;
      if (token) {
        localStorage.setItem("access_token", token);
        if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
        await goAfterAuth(res.data?.user || res.data?.data?.user || {});
      }
      else setError("Erro ao criar conta.");
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Erro ao criar conta.");
    } finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-screen bg-[#030508] text-white"
      onMouseMove={handleMouseMove}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Grid bg pattern */}
      <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200h1v40H0zM0%200h40v1H0z%22%20fill%3D%22rgba(255%2C255%2C255%2C0.025)%22/%3E%3C/svg%3E')] opacity-60" />

      {/* Ambient top glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(182,255,0,0.07),transparent_60%)]" />

      <div
        className="pointer-events-none fixed inset-0 z-0 hidden opacity-60 blur-[1px] transition-opacity duration-300 md:block"
        style={{
          background: `radial-gradient(240px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(182,255,0,0.11), rgba(34,197,94,0.035) 34%, transparent 70%)`,
        }}
      />

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="font-black text-xl tracking-tight text-white">NEXT LEVEL</span>
          <span className="hidden border-l border-white/10 pl-3 sm:flex sm:flex-col sm:gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Gestão empresarial com IA</span>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-300/80">Tome as rédeas do seu negócio</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => scrollToSection("features")} className="hidden md:block text-xs font-semibold text-zinc-400 hover:text-white transition px-3">Funcionalidades</button>
          <button onClick={() => scrollToSection("pricing")} className="hidden md:block text-xs font-semibold text-zinc-400 hover:text-white transition px-3">Planos</button>
          <button onClick={() => focusAuth(false)} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-200 hover:bg-white/[0.1] transition">Entrar</button>
          <button onClick={() => focusAuth(true)} className="rounded-xl bg-lime-400 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_18px_rgba(182,255,0,0.3)] hover:brightness-105 transition">Assinar agora</button>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6">

        {/* â”€â”€â”€ HERO â”€â”€â”€ */}
        <section className="pt-8 pb-14 grid lg:grid-cols-[1fr_400px] gap-14 items-start">
          {/* Left */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-lime-400/25 bg-lime-400/8 px-4 py-2 mb-7">
              <span className="flex h-2 w-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_6px_rgba(182,255,0,0.8)]"></span>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-lime-300">Plataforma de gestão para negócios</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-black leading-[0.96] text-white sm:text-6xl xl:text-7xl">
              Gestão Empresarial com IA,<br />
              <span className="relative inline-block">
                <span className="relative z-10 text-lime-300">tome as rédeas</span>
                <span className="absolute -inset-x-2 inset-y-0 rounded-lg bg-lime-400/8 -z-0"></span>
              </span><br />
              do seu negócio.
            </h1>
            <p className="mt-4 max-w-2xl text-xl font-black leading-7 text-white sm:text-2xl">
              Seja administrador, vendedor e analista do seu negócio. <span className="text-lime-300">Seja Next Level.</span>
            </p>

            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400 font-light">
              Organize vendas, custos, atendimento, produtos e dados do seu negócio em uma plataforma feita para aumentar lucro, economizar tempo e revelar oportunidades que antes passavam despercebidas.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={() => focusAuth(true)}
                className="flex items-center gap-2.5 rounded-[18px] bg-lime-400 px-6 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_36px_rgba(182,255,0,0.25)] hover:-translate-y-0.5 hover:brightness-105 transition">
                Assinar agora <ArrowRight />
              </button>
              <button onClick={scrollToWhatWeDo}
                className="flex items-center gap-2.5 rounded-[18px] border border-white/10 bg-white/[0.04] px-6 py-4 text-sm font-semibold text-zinc-200 hover:bg-white/[0.08] transition">
                Entenda o que fazemos
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
                  <p className="text-base font-black tracking-tight text-white">
                    {m.title}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{m.label}</p>
                </div>
              ))}
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
            selectedPlanLabel={selectedPlan ? planSelectionLabel(selectedPlan) : null}
            subscribeIntent={searchParams.get("intent") === "subscribe"}
            onGoogleLogin={handleGoogleLogin}
          />
        </section>

        {/* â”€â”€â”€ FEATURES â”€â”€â”€ */}
        <section
          className="pb-16"
          onMouseEnter={() => setIsInsightPaused(true)}
          onMouseLeave={() => setIsInsightPaused(false)}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-lime-400/[0.18] bg-[linear-gradient(135deg,rgba(182,255,0,0.09),rgba(255,255,255,0.035)_35%,rgba(5,8,12,0.96))] p-6 pr-16 shadow-[0_0_60px_rgba(182,255,0,0.08)] sm:p-8 sm:pr-20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(182,255,0,0.16),transparent_32%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[240px_1fr] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">Exemplos claros</p>
                <h2 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">
                  Problemas reais que acontecem no dia a dia.
                </h2>
              </div>
              <div>
                <div key={activeStat} className="fade-in transition-opacity duration-500">
                  <h3 className="text-xl font-black leading-7 text-white">
                    {PROOF_STATS[activeStat].title}
                  </h3>
                  <p className="mt-2 text-base font-semibold leading-7 text-zinc-100 sm:text-lg sm:leading-8">
                    {PROOF_STATS[activeStat].quote}
                  </p>
                </div>
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                  {PROOF_STATS[activeStat].source}
                </p>
                <div className="mt-5 flex gap-2">
                  {PROOF_STATS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Mostrar exemplo ${i + 1}`}
                      onClick={() => setActiveStat(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === activeStat ? "w-10 bg-lime-400" : "w-3 bg-white/15 hover:bg-white/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Próximo exemplo"
              onClick={nextExample}
              className="absolute right-4 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-lime-300/20 bg-black/25 text-2xl font-light leading-none text-lime-200/70 shadow-[0_0_20px_rgba(0,0,0,0.22)] backdrop-blur-md transition duration-300 hover:border-lime-300/55 hover:bg-lime-300/10 hover:text-lime-200 hover:shadow-[0_0_24px_rgba(182,255,0,0.16)] active:scale-95 sm:right-6 sm:top-1/2 sm:h-12 sm:w-12 sm:-translate-y-1/2 sm:text-3xl"
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </section>

        <section id="o-que-fazemos" className="py-16 scroll-mt-20">
          <div className="relative overflow-hidden rounded-[28px] border border-lime-400/[0.14] bg-[linear-gradient(135deg,rgba(182,255,0,0.1),rgba(6,8,12,0.96)_42%,rgba(3,5,8,1))] p-8 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.18),transparent_34%)]" />
            <div className="relative">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/80 mb-3">O que fazemos</p>
                <h2 className="text-3xl sm:text-5xl font-black leading-[0.96] tracking-tight text-white">
                  O que a Next Level faz pelo seu negócio
                </h2>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300">
                  Uma plataforma criada para ajudar empreendedores a controlar melhor a operação, aumentar lucro, economizar tempo e tomar decisões com mais segurança. Além de organizar vendas e custos, a Next Level transforma atendimentos do WhatsApp e Instagram em dados úteis para o negócio.
                </p>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { title: "Controle do negócio", text: "Reúna vendas, custos, produtos, clientes, atendimento e indicadores em um só lugar." },
                  { title: "Clareza para decidir", text: "Veja o que está funcionando, onde existem perdas e quais ações podem melhorar seus resultados." },
                  { title: "Mais lucro e menos desperdício", text: "Identifique produtos com maior margem, custos escondidos, gargalos e oportunidades de crescimento." },
                  { title: "IA como apoio estratégico", text: "A inteligência artificial funciona como uma camada de análise dentro da plataforma, ajudando a interpretar dados, gerar exemplos claros e sugerir próximos passos." },
                  { title: "Feita para vários setores", text: "Serve para lojas físicas, e-commerces, prestadores de serviço, negócios locais, infoprodutores e empresas em crescimento." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="mb-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime-300 text-zinc-950">
                      <CheckIcon />
                    </div>
                    <h3 className="text-sm font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-zinc-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 scroll-mt-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">O que a Next Level entrega</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-[0.94] tracking-[-0.04em] text-white max-w-2xl mx-auto">
              Tudo que seu negócio precisa. <span className="text-lime-300">Em um lugar.</span>
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-sm leading-7 text-zinc-400">
              Veja em segundos as ferramentas que transformam vendas, custos, atendimento e gestão em decisões mais claras.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  Menos improviso.<br />Mais <span className="text-lime-300">estratégia.</span>
                </h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  A Next Level organiza os dados do seu negócio, mostra o que merece atenção e usa inteligência artificial para apoiar decisões mais rápidas, claras e estratégicas. Cada conversa pode virar informação: dúvidas dos clientes, produtos mais pedidos, objeções e oportunidades de venda.
                </p>
                <button onClick={() => focusAuth(true)} className="mt-6 flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-lime-300 hover:text-lime-200 transition group">
                  Quero experimentar <ArrowRight />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Painel de controle do negócio", detail: "Vendas, custos, clientes, produtos e atendimento no mesmo lugar" },
                  { label: "Perdas e oportunidades visíveis", detail: "Gargalos, margens apertadas e rotinas manuais ficam mais claros" },
                  { label: "Canais conectados", detail: "WhatsApp, Instagram, Mercado Livre e Utmify integrados à gestão" },
                  { label: "Recomendações práticas", detail: "A IA apoia a leitura dos dados e sugere próximos passos" },
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

        {/* â”€â”€â”€ CALCULATOR â”€â”€â”€ */}
        <section id="calculator" className="py-20 scroll-mt-20">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">Experimente agora</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white">
              Calcule seu lucro real.<br /><span className="text-lime-300">Agora, ao vivo.</span>
            </h2>
              <p className="mt-4 text-sm text-zinc-400 max-w-2xl mx-auto">
                Está calculadora é apenas uma pequena amostra do que a Next Level faz. Dentro da plataforma, você cruza vendas, custos, atendimento, canais e oportunidades para entender seu negócio com muito mais profundidade.
              </p>
          </div>
          <MarginCalculator />
        </section>

        {/* â”€â”€â”€ PRICING â”€â”€â”€ */}
        <section id="pricing" className="py-20 scroll-mt-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">Escolha seu nível</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white max-w-xl leading-[0.94]">
                Escolha seu plano.<br /><span className="text-lime-300">Escale com lucro.</span>
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-400 max-w-xs">Três níveis. Mesma experiência Next Level - focada em margem, clareza e execução.</p>
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
                  <p className="mt-1 text-[11px] text-lime-300/80">Equivale a {plan.monthlyPrice}/mês x 11</p>
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
                <button type="button" onClick={() => selectPlanAndLogin(plan.key, true)}
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

        {/* â”€â”€â”€ FINAL CTA â”€â”€â”€ */}
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
                  Assine agora e transforme crescimento bruto em lucro real - com visibilidade total desde o primeiro acesso.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row shrink-0">
                <button type="button" onClick={() => focusAuth(true)}
                  className="flex items-center justify-center gap-2 rounded-[22px] bg-lime-300 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_40px_rgba(182,255,0,0.25)] hover:-translate-y-0.5 hover:brightness-105 transition whitespace-nowrap">
                  Assinar agora <ArrowRight />
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
            IA - Gestão - Automação - Análise - Resultados
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
