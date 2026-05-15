import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../services/api";
import { BillingCycle, BillingPlanKey, getBillingMe, getCompanies } from "../src/services/endpoints";
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
import AnimatedHeroBackground from "../components/AnimatedHeroBackground";
import RevealOnScroll from "../components/RevealOnScroll";

/* Helpers */
function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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

/* Icons */
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

/* Static data */
const METRICS = [
  { title: "Operação visível", label: "Vendas, custos, clientes e produtos em uma leitura simples.", icon: ChartIcon },
  { title: "Lucro real", label: "Faturamento separado de margem, desperdício e risco de caixa.", icon: TrendingUpIcon },
  { title: "Próximo passo", label: "Alertas práticos para agir antes que a perda apareça no caixa.", icon: BrainIcon },
];

const HERO_GROWTH_FRAMES = [
  "/hero-growth/chart-frame-01.webp",
  "/hero-growth/chart-frame-02.webp",
  "/hero-growth/chart-frame-03.webp",
  "/hero-growth/chart-frame-04.webp",
  "/hero-growth/chart-frame-05.webp",
];

const TARGET_SEGMENTS = [
  { title: "Comércios com venda diária", text: "Veja o que vende, o que dá margem e onde o dinheiro fica parado." },
  { title: "Serviços com atendimento intenso", text: "Organize retornos, pedidos e oportunidades antes que bons clientes esfriem." },
  { title: "E-commerces e marketplaces", text: "Entenda pedidos, canais e produtos para crescer sem queimar lucro." },
  { title: "Empresas saindo do improviso", text: "Troque planilhas soltas por uma rotina de decisão mais previsível." },
];

const PROBLEMS = [
  { title: "Venda entra, lucro não aparece", text: "O caixa movimenta, mas margem, custo e desperdício continuam difíceis de provar." },
  { title: "Cliente quente fica sem retorno", text: "Mensagens se espalham entre WhatsApp, Instagram e rotina da equipe." },
  { title: "Custo não chega na decisão", text: "Despesa, produto e operação ficam longe de preço, estoque e campanha." },
  { title: "O sinal chega tarde", text: "Sem alerta claro, o empresário só percebe o problema quando ele já custou caro." },
];

const SOLUTIONS = [
  { title: "Une dados que hoje ficam espalhados", text: "Vendas, clientes, custos, produtos e canais entram na mesma leitura." },
  { title: "Mostra a margem por trás da venda", text: "Separa faturamento, custo, desperdício e lucro para revelar o resultado real." },
  { title: "Aponta oportunidades no atendimento", text: "Conversas com intenção de compra deixam de depender da memória da equipe." },
  { title: "Recomenda a próxima ação", text: "A IA transforma sinal do negócio em decisão prática para proteger caixa." },
  { title: "Gera leitura executiva", text: "Relatórios saem simples, objetivos e prontos para orientar o dia." },
  { title: "Liga operação a ROI", text: "Cada insight precisa mostrar impacto em margem, venda ou tempo economizado." },
];

const FEATURES = [
  {
    icon: ChartIcon,
    title: "Vendas com margem",
    desc: "Mostre quais vendas realmente ajudam o caixa e quais só aumentam movimento.",
    color: "from-lime-400/15 to-emerald-400/5",
    border: "border-lime-400/20",
  },
  {
    icon: ShieldIcon,
    title: "Custos sob controle",
    desc: "Traga custo e despesa para a decisão antes de ajustar preço ou campanha.",
    color: "from-green-400/15 to-teal-400/5",
    border: "border-green-400/20",
  },
  {
    icon: TrendingUpIcon,
    title: "Produtos que merecem foco",
    desc: "Veja o que escalar, ajustar ou pausar com base em preço, custo e margem.",
    color: "from-cyan-400/15 to-blue-400/5",
    border: "border-cyan-400/20",
  },
  {
    icon: WhatsAppIcon,
    title: "Atendimento que não deixa dinheiro parado",
    desc: "Priorize conversas com intenção de compra em WhatsApp e Instagram.",
    color: "from-violet-400/15 to-purple-400/5",
    border: "border-violet-400/20",
  },
  {
    icon: ZapIcon,
    title: "Relatórios que dizem o que fazer",
    desc: "Receba leituras curtas sobre vendas, custos, produtos e pontos de atenção.",
    color: "from-violet-400/15 to-purple-400/5",
    border: "border-violet-400/20",
  },
  {
    icon: BrainIcon,
    title: "IA que prioriza ação",
    desc: "Transforme sinais do negócio em próximos passos com foco em resultado.",
    color: "from-emerald-400/15 to-cyan-400/5",
    border: "border-emerald-400/20",
  },
];

const HOW_IT_WORKS = [
  { title: "Conecte ou cadastre os dados", text: "Vendas, custos, clientes, produtos e canais entram sem expor complexidade." },
  { title: "A Next Level organiza a operação", text: "Dados brutos viram indicadores que o dono entende rápido." },
  { title: "A IA encontra sinais importantes", text: "Riscos, oportunidades e padrões aparecem antes da urgência." },
  { title: "Você decide com prioridade", text: "Cada ação vem ligada a impacto, margem e próximo passo." },
];

const INTELLIGENCE_CARDS = [
  { label: "Margem baixa detectada", value: "Produto vendendo bem, mas com lucro frágil", tone: "text-lime-300" },
  { label: "Cliente aguardando resposta", value: "Oportunidade quente no WhatsApp", tone: "text-cyan-200" },
  { label: "Próxima ação recomendada", value: "Revisar preço antes de escalar anúncio", tone: "text-emerald-200" },
  { label: "Relatório gerado pela IA", value: "Vendas, custos e pontos de atenção", tone: "text-zinc-100" },
];

const FAQS = [
  { question: "A Next Level substitui meu sistema de gestão?", answer: "Não precisa substituir. Ela funciona como camada de inteligência para centralizar sinais, apoiar decisões e complementar ferramentas que o negócio já usa." },
  { question: "Preciso saber usar IA?", answer: "Não. A plataforma entrega análises, recomendações e automações em linguagem simples, sem exigir conhecimento técnico." },
  { question: "Funciona com WhatsApp e Instagram?", answer: "Sim, conforme o plano e as integrações disponíveis. A ideia é aproximar atendimento, cliente e oportunidade da decisão de gestão." },
  { question: "Serve para negócio pequeno?", answer: "Sim. Foi pensada para quem precisa de mais controle sem montar uma equipe grande de análise, tecnologia ou atendimento." },
  { question: "Qual plano devo escolher?", answer: "Essencial para organizar a base. Premium para IA, relatórios e atendimento conectado. Business para escala, integrações e análise avançada." },
  { question: "Escolho o plano antes ou depois da conta?", answer: "Você pode escolher agora. A seleção fica salva e a assinatura continua após criar conta ou entrar." },
];

type FooterInfoKey =
  | "gestao-de-vendas"
  | "atendimento-com-ia"
  | "relatorios-automaticos"
  | "lucro-real"
  | "produtos-e-custos"
  | "whatsapp"
  | "instagram"
  | "mercado-livre"
  | "alertas-e-recomendacoes"
  | "sobre"
  | "contato"
  | "termos"
  | "privacidade";

const FOOTER_DETAILS: Record<FooterInfoKey, { title: string; text: string; how: string; image: string }> = {
  "gestao-de-vendas": {
    title: "Gestão de vendas",
    text: "Veja desempenho, períodos de maior movimento, produtos relevantes e oportunidades de resultado em uma única leitura.",
    how: "Dentro da Next Level, vendas viram indicadores para cruzar margem, clientes, produtos e ações prioritárias.",
    image: "/login-features/gestao-vendas.png",
  },
  "atendimento-com-ia": {
    title: "Atendimento com IA",
    text: "Organize mensagens, identifique intenção de compra e apoie respostas em canais como WhatsApp e Instagram.",
    how: "A IA prioriza conversas relevantes para reduzir tempo de resposta e oportunidades esquecidas.",
    image: "/login-features/atendimento-ia.png",
  },
  "relatorios-automaticos": {
    title: "Relatórios automáticos",
    text: "Transforme dados soltos em relatórios claros sobre vendas, custos, margem, produtos e pontos de atenção.",
    how: "Os relatórios conectam operação e decisão para mostrar o que merece ação agora.",
    image: "/login-features/relatorios.png",
  },
  "lucro-real": {
    title: "Lucro real",
    text: "Entenda a diferença entre faturamento e lucro acompanhando custos, margem e desperdícios que afetam o caixa.",
    how: "A plataforma mostra onde existe margem, perda ou risco antes de o empresário decidir no escuro.",
    image: "/login-features/lucro-real.png",
  },
  "produtos-e-custos": {
    title: "Produtos e custos",
    text: "Acompanhe produtos, preços, custos e margem para saber o que vale vender, ajustar ou pausar.",
    how: "A Next Level aproxima estoque, precificação e resultado para revelar oportunidades de ajuste.",
    image: "/login-features/produtos-custos.png",
  },
  whatsapp: {
    title: "WhatsApp",
    text: "Centralize oportunidades e atendimentos vindos do WhatsApp para não perder clientes no meio da rotina.",
    how: "O canal entra na visão operacional sem expor tokens ou complexidade ao usuário final.",
    image: "/login-features/atendimento-ia.png",
  },
  instagram: {
    title: "Instagram",
    text: "Organize mensagens, leads e interações vindas do Instagram com apoio da inteligência artificial.",
    how: "A Next Level organiza sinais de atendimento e intenção para reduzir oportunidades esquecidas.",
    image: "/login-features/atendimento-ia.png",
  },
  "mercado-livre": {
    title: "Mercado Livre",
    text: "Conecte dados comerciais do marketplace para acompanhar vendas, produtos e desempenho dentro da Next Level.",
    how: "Os dados do canal entram na visão de gestão para apoiar margem, estoque e decisões estratégicas.",
    image: "/login-features/produtos-custos.png",
  },
  "alertas-e-recomendacoes": {
    title: "Alertas e recomendações",
    text: "A IA aponta riscos, oportunidades e próximos passos para o empresário agir antes do problema crescer.",
    how: "Alertas aproximam o empresário da ação concreta: ajustar preço, revisar custo, responder cliente ou investigar queda.",
    image: "/login-features/alertas-recomendacoes.png",
  },
  sobre: {
    title: "Sobre a Next Level",
    text: "A Next Level AI é um SaaS brasileiro para empresários que precisam transformar operação, atendimento e números em decisões melhores.",
    how: "O produto foi desenhado para esconder complexidade técnica e entregar clareza de gestão no dia a dia.",
    image: "/login-features/sobre.png",
  },
  contato: {
    title: "Contato",
    text: "Para falar com a Next Level, use os canais oficiais informados pela empresa durante onboarding, suporte ou contratação.",
    how: "No produto, o foco é manter atendimento e gestão no mesmo fluxo para reduzir perda de informação.",
    image: "/login-features/contato.png",
  },
  termos: {
    title: "Termos",
    text: "Os termos explicam regras de uso da plataforma, responsabilidades, limites do serviço e condições comerciais aplicáveis.",
    how: "A Next Level prioriza segurança, previsibilidade e transparência para negócios que dependem da plataforma.",
    image: "/login-features/termos.png",
  },
  privacidade: {
    title: "Privacidade",
    text: "A privacidade orienta como dados de usuários, empresas e operações devem ser protegidos e tratados dentro do ecossistema.",
    how: "Dados sensíveis não devem aparecer em interfaces públicas, logs desnecessários ou fluxos sem proteção.",
    image: "/login-features/privacidade.png",
  },
};

const FOOTER_COLUMNS: Array<{ title: string; links: Array<{ label: string; key: FooterInfoKey }> }> = [
  {
    title: "Produto",
    links: [
      { label: "Gestão de vendas", key: "gestao-de-vendas" },
      { label: "Atendimento com IA", key: "atendimento-com-ia" },
      { label: "Relatórios automáticos", key: "relatorios-automaticos" },
      { label: "Lucro real", key: "lucro-real" },
      { label: "Produtos e custos", key: "produtos-e-custos" },
    ],
  },
  {
    title: "Plataforma",
    links: [
      { label: "WhatsApp", key: "whatsapp" },
      { label: "Instagram", key: "instagram" },
      { label: "Mercado Livre", key: "mercado-livre" },
      { label: "Alertas e recomendações", key: "alertas-e-recomendacoes" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre a Next Level", key: "sobre" },
      { label: "Contato", key: "contato" },
      { label: "Termos", key: "termos" },
      { label: "Privacidade", key: "privacidade" },
    ],
  },
];

const PRICING = [
  {
    key: "COMMON" as BillingPlanKey,
    name: PLAN_DISPLAY.COMMON.publicName,
    monthlyPrice: getDisplayPlanPrice("COMMON", "MONTHLY"), annualPrice: getDisplayPlanPrice("COMMON", "ANNUAL"),
    summary: PLAN_DISPLAY.COMMON.summary,
    features: PLAN_DISPLAY.COMMON.features,
    cta: PLAN_DISPLAY.COMMON.cta, recommended: PLAN_DISPLAY.COMMON.recommended,
    microcopy: PLAN_DISPLAY.COMMON.microcopy,
  },
  {
    key: "PREMIUM" as BillingPlanKey,
    name: PLAN_DISPLAY.PREMIUM.publicName,
    monthlyPrice: getDisplayPlanPrice("PREMIUM", "MONTHLY"), annualPrice: getDisplayPlanPrice("PREMIUM", "ANNUAL"),
    summary: PLAN_DISPLAY.PREMIUM.summary,
    features: PLAN_DISPLAY.PREMIUM.features,
    cta: PLAN_DISPLAY.PREMIUM.cta, recommended: PLAN_DISPLAY.PREMIUM.recommended,
    microcopy: PLAN_DISPLAY.PREMIUM.microcopy,
  },
  {
    key: "PRO_BUSINESS" as BillingPlanKey,
    name: PLAN_DISPLAY.PRO_BUSINESS.publicName,
    monthlyPrice: getDisplayPlanPrice("PRO_BUSINESS", "MONTHLY"), annualPrice: getDisplayPlanPrice("PRO_BUSINESS", "ANNUAL"),
    summary: PLAN_DISPLAY.PRO_BUSINESS.summary,
    features: PLAN_DISPLAY.PRO_BUSINESS.features,
    cta: PLAN_DISPLAY.PRO_BUSINESS.cta, recommended: PLAN_DISPLAY.PRO_BUSINESS.recommended,
    microcopy: PLAN_DISPLAY.PRO_BUSINESS.microcopy,
  },
];

/* Visual effects */
const UPDATED_PRICING = PRICING;

type NeonParticle = {
  baseX: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  drift: number;
  driftSpeed: number;
  driftPhase: number;
};

const NeonSnowBackground: React.FC<{ className?: string; fixed?: boolean; intensity?: number }> = ({
  className = "",
  fixed = true,
  intensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let lastTime = performance.now();
    let particles: NeonParticle[] = [];

    const createParticle = (startY = Math.random() * height): NeonParticle => ({
      baseX: Math.random() * width,
      y: startY,
      radius: Math.random() * 1.6 + 0.8,
      speed: (prefersReducedMotion ? 10 : 34) + Math.random() * (prefersReducedMotion ? 12 : 58),
      opacity: Math.random() * 0.28 + 0.12,
      drift: Math.random() * 18 + 5,
      driftSpeed: Math.random() * 0.9 + 0.35,
      driftPhase: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const baseCount = width < 768 ? 30 : width < 1280 ? 48 : 68;
      const count = Math.max(12, Math.round(baseCount * intensity));
      particles = Array.from({ length: count }, () => createParticle());
    };

    const draw = (time = performance.now()) => {
      const delta = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      particles.forEach((particle) => {
        particle.y += particle.speed * delta;
        particle.driftPhase += particle.driftSpeed * delta;

        if (particle.y > height + 18) {
          const reset = createParticle(-18 - Math.random() * 80);
          Object.assign(particle, reset);
        }

        const x = particle.baseX + Math.sin(particle.driftPhase) * particle.drift;
        const glowRadius = particle.radius * 5.5;
        const glow = ctx.createRadialGradient(x, particle.y, 0, x, particle.y, glowRadius);
        glow.addColorStop(0, `rgba(182,255,0,${particle.opacity})`);
        glow.addColorStop(0.45, `rgba(34,197,94,${particle.opacity * 0.18})`);
        glow.addColorStop(1, "rgba(182,255,0,0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, particle.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(217,255,112,${Math.min(particle.opacity + 0.2, 0.62)})`;
        ctx.beginPath();
        ctx.arc(x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      frame = requestAnimationFrame(draw);
    };

    resize();
    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none ${fixed ? "fixed" : "absolute"} inset-0 z-0 opacity-70 ${className}`}
    />
  );
};

const LandingMotionStyles = () => (
  <style>{`
    @keyframes nlRevealUp {
      from { opacity: 0; transform: translate3d(0, 22px, 0) scale(.99); }
      to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    }
    @keyframes nlFloatSoft {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50% { transform: translate3d(0, -10px, 0); }
    }
    @keyframes nlGlowShift {
      0%, 100% { opacity: .55; transform: translateX(-8%); }
      50% { opacity: .9; transform: translateX(8%); }
    }
    .nl-reveal { animation: nlRevealUp .75s cubic-bezier(.16,1,.3,1) both; }
    .nl-delay-1 { animation-delay: .08s; }
    .nl-delay-2 { animation-delay: .16s; }
    .nl-delay-3 { animation-delay: .24s; }
    .nl-delay-4 { animation-delay: .32s; }
    .nl-float { animation: nlFloatSoft 6s ease-in-out infinite; }
    .nl-glow-shift { animation: nlGlowShift 9s ease-in-out infinite; }
    .nl-card-hover { transition: transform .28s ease, border-color .28s ease, background .28s ease, box-shadow .28s ease; }
    .nl-card-hover:hover { transform: translateY(-5px); border-color: rgba(182,255,0,.28); box-shadow: 0 24px 90px rgba(0,0,0,.28), 0 0 38px rgba(182,255,0,.08); }
    .nl-reveal-scroll {
      opacity: 0;
      transform: translate3d(var(--nl-reveal-x, 0), var(--nl-reveal-y, 24px), 0);
      filter: blur(4px);
      transition:
        opacity var(--nl-reveal-duration, 650ms) cubic-bezier(.16,1,.3,1),
        transform var(--nl-reveal-duration, 650ms) cubic-bezier(.16,1,.3,1),
        filter var(--nl-reveal-duration, 650ms) cubic-bezier(.16,1,.3,1);
      transition-delay: var(--nl-reveal-delay, 0ms);
      will-change: opacity, transform, filter;
    }
    .nl-reveal-scroll.is-visible {
      opacity: 1;
      transform: translate3d(0, 0, 0);
      filter: blur(0);
    }
    .nl-reveal-stagger {
      opacity: 1;
      transform: none;
      filter: none;
      transition: none;
    }
    .nl-reveal-stagger > * {
      opacity: 0;
      transform: translate3d(0, 18px, 0);
      filter: blur(4px);
      transition:
        opacity var(--nl-reveal-duration, 650ms) cubic-bezier(.16,1,.3,1),
        transform var(--nl-reveal-duration, 650ms) cubic-bezier(.16,1,.3,1),
        filter var(--nl-reveal-duration, 650ms) cubic-bezier(.16,1,.3,1);
      transition-delay: calc(var(--nl-reveal-delay, 0ms) + (var(--nl-reveal-index, 0) * var(--nl-stagger, 70ms)));
      will-change: opacity, transform, filter;
    }
    .nl-reveal-stagger.is-visible > * {
      opacity: 1;
      transform: translate3d(0, 0, 0);
      filter: blur(0);
    }
    @media (prefers-reduced-motion: reduce) {
      .nl-reveal, .nl-reveal-scroll, .nl-reveal-stagger > *, .nl-float, .nl-glow-shift {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
        filter: none !important;
        transition: none !important;
      }
      .nl-card-hover, .nl-card-hover:hover {
        transition: none !important;
        transform: none !important;
      }
    }
  `}</style>
);

const FeatureScreenshot: React.FC<{ detail: { title: string; image: string } }> = ({ detail }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[24px] border border-dashed border-lime-300/25 bg-[linear-gradient(135deg,rgba(182,255,0,0.1),rgba(255,255,255,0.025))] p-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-300 text-zinc-950">
            <ChartIcon />
          </div>
          <p className="text-sm font-black text-white">Visão de gestão pronta para dados reais</p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Conecte dados ou importe uma planilha para ver indicadores, alertas e recomendações da IA em {detail.title}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/[0.1] bg-[#05070a] shadow-[0_28px_90px_rgba(0,0,0,0.38),0_0_0_1px_rgba(182,255,0,0.06)]">
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.035] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-lime-300" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300/75">Preview da plataforma</span>
      </div>
      <img
        src={detail.image}
        alt={`Prévia de ${detail.title}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className="mx-auto h-auto w-full bg-white/[0.03] object-contain"
      />
    </div>
  );
};

/* Auth panel */
const authFieldCls = "min-h-[50px] w-full rounded-[18px] border border-white/10 bg-[#070a0f] px-4 py-3.5 text-base text-zinc-50 outline-none transition placeholder:text-zinc-600 focus:border-lime-400/60 focus:bg-[#0a1020] focus:shadow-[0_0_20px_rgba(182,255,0,0.08),inset_0_0_0_1px_rgba(182,255,0,0.06)]";

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
  googleLoading: boolean;
  selectedPlanLabel?: string | null;
  subscribeIntent?: boolean;
  onGoogleLogin: () => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({
  isRegisterView, setIsRegisterView, onLogin, onRegister,
  name, setName, email, setEmail, password, setPassword,
  showPassword, setShowPassword, error, loading, setError,
  googleLoading, selectedPlanLabel, subscribeIntent, onGoogleLogin,
}) => (
  <aside id="auth-panel" className="w-full min-w-0">
    <div className="relative max-w-full overflow-hidden rounded-[34px] border border-lime-400/[0.16] bg-[linear-gradient(200deg,rgba(16,23,32,0.99),rgba(6,8,12,0.99))] shadow-[0_36px_120px_rgba(0,0,0,0.66),0_0_0_1px_rgba(182,255,0,0.04),inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(182,255,0,0.18),transparent_60%)]" />

      <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8 lg:p-8">
        <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(182,255,0,0.11),rgba(255,255,255,0.035)_34%,rgba(3,5,8,0.72))] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-lime-300/15 blur-3xl nl-glow-shift" />
          <div className="relative">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400 shadow-[0_0_24px_rgba(182,255,0,0.45)]">
                <span className="text-zinc-950 font-black text-sm tracking-tighter">NL</span>
              </div>
              <div>
                <p className="text-white font-black text-lg tracking-tight">NEXT LEVEL</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Central inteligente</p>
              </div>
            </div>

            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-lime-300/80">Acesso ao produto</p>
            <h2 className="mt-3 max-w-md text-3xl font-black leading-tight text-white sm:text-4xl">
              Acesse sua central de gestão.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-300">
              Entre para acompanhar vendas, custos, clientes, relatórios e recomendações da IA em uma operação conectada.
            </p>

            {(subscribeIntent || selectedPlanLabel) && (
              <div className="mt-6 rounded-[18px] border border-lime-400/20 bg-lime-400/10 p-4">
                <p className="text-sm font-bold text-lime-100">
                  {isRegisterView ? "Crie sua conta para continuar sua assinatura." : "Entre para continuar sua assinatura."}
                </p>
                {selectedPlanLabel ? (
                  <p className="mt-1 text-xs font-semibold text-lime-300">
                    Você selecionou: {selectedPlanLabel}
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { label: "Dados protegidos", detail: "Acesso seguro" },
                { label: "Configuração guiada", detail: "Sem complexidade" },
                { label: "IA para empresas", detail: "Contexto por negócio" },
              ].map((signal) => (
                <div key={signal.label} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 nl-card-hover">
                  <p className="mb-3 h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(182,255,0,0.8)]" />
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-white">{signal.label}</p>
                  <p className="mt-2 text-xs text-zinc-500">{signal.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/[0.08] bg-[#070a0f]/95 p-5 sm:p-6 lg:p-7">
          <div className="mb-5">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-lime-300/80">
              {isRegisterView ? "Novo usuário" : "Já sou cliente"}
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight text-white">
              {isRegisterView ? "Crie sua conta Next Level" : "Entre no painel"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {isRegisterView
                ? "Comece agora e continue a escolha do plano em seguida."
                : "Continue de onde parou na sua operação."}
            </p>
          </div>

          <div className="grid grid-cols-2 rounded-[20px] border border-white/10 bg-white/[0.03] p-1 mb-5">
            <button type="button" onClick={() => { setIsRegisterView(false); setError(""); }}
              className={`rounded-[16px] px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] transition ${!isRegisterView ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-400 hover:text-white"}`}>
              Já sou cliente
            </button>
            <button type="button" onClick={() => { setIsRegisterView(true); setError(""); }}
              className={`rounded-[16px] px-4 py-2.5 text-sm font-black uppercase tracking-[0.12em] transition ${isRegisterView ? "bg-lime-300 text-zinc-950 shadow-[0_0_18px_rgba(182,255,0,0.3)]" : "text-zinc-400 hover:text-white"}`}>
              Criar conta
            </button>
          </div>

          <button type="button"
            onClick={onGoogleLogin}
            disabled={loading || googleLoading}
            className="flex min-h-[50px] w-full items-center justify-center gap-3 rounded-[18px] border border-white/[0.1] bg-white/[0.04] py-3 text-sm font-black uppercase tracking-[0.12em] text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-lime-300/60 disabled:cursor-not-allowed disabled:opacity-60 mb-4">
            {googleLoading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-lime-300/25 border-t-lime-300" /> : <GoogleIcon />}
            {googleLoading ? "Conectando..." : "Google"}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/[0.07]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">ou email</span>
            <div className="h-px flex-1 bg-white/[0.07]" />
          </div>

          <form onSubmit={isRegisterView ? onRegister : onLogin} className="space-y-3">
            {isRegisterView && (
              <div>
                <label htmlFor="login-name" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Nome completo</label>
                <input id="login-name" value={name} onChange={e => setName(e.target.value)} className={authFieldCls} type="text" placeholder="Seu nome" autoComplete="name" />
              </div>
            )}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">E-mail</label>
              <input id="login-email" value={email} onChange={e => setEmail(e.target.value)} className={authFieldCls} type="email" placeholder="nome@empresa.com" autoComplete="email" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Senha</label>
                {!isRegisterView && <span className="text-[10px] font-semibold text-zinc-600">Acesso seguro</span>}
              </div>
              <div className="relative">
                <input id="login-password" value={password} onChange={e => setPassword(e.target.value)} className={`${authFieldCls} pr-12`}
                  type={showPassword ? "text" : "password"} placeholder={isRegisterView ? "Crie uma senha forte" : "Sua senha"} autoComplete={isRegisterView ? "new-password" : "current-password"} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-lime-300/50">
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-[14px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-[18px] bg-lime-300 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_30px_rgba(182,255,0,0.2)] transition hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-lime-300/60 disabled:opacity-60 mt-1">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> : null}
              {isRegisterView ? "Criar minha conta" : "Entrar no painel"}
              {!loading && <ArrowRight />}
            </button>
          </form>
        </div>
      </div>
    </div>
  </aside>
);

/* Main page */
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
  const [activeFooterInfo, setActiveFooterInfo] = useState<FooterInfoKey | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: -400, y: -400 });
  const mouseFrameRef = useRef<number | null>(null);
  const mouseTargetRef = useRef({ x: -400, y: -400 });

  useEffect(() => {
    return () => {
      if (mouseFrameRef.current !== null) cancelAnimationFrame(mouseFrameRef.current);
    };
  }, []);

  const focusAuth = (register = false) => {
    setIsRegisterView(register);
    document.getElementById("login")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      const selectedCompany = companies.find((company) => {
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

    const raw = String(import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
    const base = /\/api$/i.test(raw) ? raw : `${raw}/api`;
    window.location.href = `${base}/auth/google`;
  };

  const openFooterInfo = (key: FooterInfoKey) => {
    setActiveFooterInfo(key);
    window.setTimeout(() => scrollToSection("footer-info"), 30);
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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Credenciais inválidas."));
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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Erro ao criar conta."));
    } finally { setLoading(false); }
  };

  return (
    <div
      className="min-h-screen overflow-x-clip bg-[#030508] text-white"
      onMouseMove={handleMouseMove}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <LandingMotionStyles />
        <NeonSnowBackground className="opacity-35" intensity={0.62} />

      {/* Grid bg pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200h1v40H0zM0%200h40v1H0z%22%20fill%3D%22rgba(255%2C255%2C255%2C0.022)%22/%3E%3C/svg%3E')] opacity-55" />

      {/* Ambient top glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[720px] bg-[radial-gradient(ellipse_at_top,rgba(182,255,0,0.08),transparent_64%)]" />

      <div
        className="pointer-events-none fixed inset-0 z-0 hidden opacity-60 blur-[1px] transition-opacity duration-300 md:block"
        style={{
          background: `radial-gradient(240px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(182,255,0,0.11), rgba(34,197,94,0.035) 34%, transparent 70%)`,
        }}
      />

      <nav className="relative z-10 mx-auto flex max-w-[1680px] items-center justify-between gap-3 px-4 py-5 sm:px-8 lg:px-12 2xl:px-16">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 font-black text-lg tracking-tight text-white sm:text-xl">NEXT LEVEL</span>
          <span className="hidden border-l border-white/10 pl-3 sm:flex sm:flex-col sm:gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Gestão, atendimento e dados</span>
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-lime-300/80">IA para vender com margem</span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-3 max-[480px]:hidden">
          <button onClick={() => scrollToSection("features")} className="hidden md:block text-xs font-semibold text-zinc-400 hover:text-white transition px-3">Funcionalidades</button>
          <button onClick={() => scrollToSection("como-funciona")} className="hidden md:block text-xs font-semibold text-zinc-400 hover:text-white transition px-3">Como funciona</button>
          <button onClick={() => scrollToSection("pricing")} className="hidden md:block text-xs font-semibold text-zinc-400 hover:text-white transition px-3">Planos</button>
          <button onClick={() => focusAuth(false)} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-zinc-200 transition hover:bg-white/[0.1] sm:px-4 sm:tracking-[0.14em]">Entrar</button>
          <button onClick={() => focusAuth(true)} className="hidden rounded-xl bg-lime-400 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_18px_rgba(182,255,0,0.3)] transition hover:brightness-105 sm:block">Começar agora</button>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-[1680px] px-4 sm:px-8 lg:px-12 2xl:px-16">

        {/* Hero wrapper - tall to give scroll space for frame animation */}
        <section
          data-hero-wrapper
          className="relative left-1/2 w-screen -translate-x-1/2 bg-[#030508]"
          style={{ height: "160vh" }}
        >
          <div className="sticky top-0 flex h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#030508] text-center">
            {/* Layer 1: particles integrated into the hero stack */}
            <NeonSnowBackground
              fixed={false}
              intensity={0.92}
              className="z-[1] opacity-75 [mask-image:linear-gradient(180deg,transparent_0%,black_14%,black_84%,transparent_100%)]"
            />

            {/* Layer 2: Animated hero background frames (scroll-controlled) */}
            <AnimatedHeroBackground
              images={HERO_GROWTH_FRAMES}
              className="z-[2]"
              imageOpacity={0.88}
              imageClassName="object-[center_74%] md:object-[center_68%]"
            />

            {/* Layer 3: dark blend overlays for readability and seamless edges */}
            <div className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_at_50%_38%,rgba(3,5,8,0.34)_0%,rgba(3,5,8,0.24)_34%,rgba(3,5,8,0.64)_78%,rgba(3,5,8,0.9)_100%)]" />
            <div className="pointer-events-none absolute inset-0 z-[4] bg-[linear-gradient(180deg,rgba(3,5,8,0.84)_0%,rgba(3,5,8,0.28)_24%,rgba(3,5,8,0.22)_56%,rgba(3,5,8,0.88)_100%)]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 z-[4] w-1/4 bg-[linear-gradient(90deg,rgba(3,5,8,0.9),transparent)]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[4] w-1/4 bg-[linear-gradient(270deg,rgba(3,5,8,0.9),transparent)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-1/3 bg-[linear-gradient(180deg,transparent,rgba(3,5,8,0.98))]" />

            {/* Layer 4: Hero content */}
            <div className="relative z-[5] mx-auto flex w-full max-w-[1320px] flex-col items-center px-4 sm:px-8 lg:px-12">
              <div className="nl-reveal mb-7 inline-flex max-w-full items-center gap-2.5 rounded-full border border-lime-400/25 bg-lime-400/8 px-4 py-2 shadow-[0_0_36px_rgba(182,255,0,0.08)]">
                <span className="flex h-2 w-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_6px_rgba(182,255,0,0.8)]"></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-lime-300 sm:text-[11px] sm:tracking-[0.22em]">IA para vender mais sem perder margem</span>
              </div>

              <h1 className="nl-reveal nl-delay-1 mx-auto max-w-[1240px] text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-6xl lg:text-7xl xl:text-[5.8rem] xl:leading-[0.94]">
                Transforme vendas, custos e atendimento em <span className="text-lime-300">lucro real.</span>
              </h1>

              <p className="nl-reveal nl-delay-2 mt-7 max-w-3xl text-base leading-8 text-zinc-300 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)] sm:text-xl sm:leading-9">
                A Next Level reúne vendas, custos, clientes e atendimento para mostrar onde a margem escapa e qual ação tomar antes que o problema vire prejuízo.
              </p>

              <div className="nl-reveal nl-delay-2 mt-5 flex flex-wrap justify-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
                {["Vendas", "Financeiro", "Atendimento", "Relatórios", "IA"].map((item) => (
                  <span key={item} className="rounded-full border border-white/[0.08] bg-black/40 px-3 py-2 backdrop-blur-sm">{item}</span>
                ))}
              </div>

              <div className="nl-reveal nl-delay-3 mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
                <button onClick={() => focusAuth(true)}
                  className="flex min-h-[54px] w-full items-center justify-center gap-2.5 rounded-full bg-lime-400 px-8 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_42px_rgba(182,255,0,0.25)] transition hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-lime-300/70 sm:w-auto">
                  Criar minha conta <ArrowRight />
                </button>
                <button onClick={() => scrollToSection("como-funciona")} className="min-h-[54px] w-full rounded-full border border-white/10 bg-white/[0.035] px-7 py-4 text-sm font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 sm:w-auto">
                  Ver como funciona
                </button>
              </div>

              <div className="nl-reveal nl-delay-4 mt-12 grid w-full grid-cols-1 gap-5 text-left md:grid-cols-3">
                {METRICS.map((m) => (
                  <div key={m.label} className="nl-card-hover rounded-[24px] border border-white/[0.07] bg-black/30 backdrop-blur-sm p-5">
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
          </div>
        </section>

        <RevealOnScroll as="section" className="pb-12 lg:pb-16">
          <div className="grid gap-4 rounded-[32px] border border-lime-400/15 bg-[linear-gradient(135deg,rgba(182,255,0,0.08),rgba(255,255,255,0.025),rgba(3,5,8,0.95))] p-4 md:grid-cols-[1.1fr_0.9fr] lg:p-6">
              <div className="rounded-[22px] border border-white/[0.07] bg-[#060a0d] p-5">
                <div className="mb-5 flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300/80">Visão do negócio</p>
                    <p className="mt-1 text-sm text-zinc-500">Dados organizados para agir melhor</p>
                  </div>
                  <span className="rounded-full bg-lime-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-950">IA ativa</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { title: "Lucro real", value: "Margem visível" },
                    { title: "Custos", value: "Risco detectado" },
                    { title: "Vendas", value: "Oportunidade ativa" },
                  ].map((item, index) => (
                    <div key={item.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">{item.title}</p>
                      <p className="mt-2 text-lg font-black text-white">{item.value}</p>
                      <div className="mt-3 h-1.5 rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full bg-lime-300" style={{ width: `${index === 1 ? 46 : 72}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[22px] border border-lime-400/15 bg-lime-400/[0.045] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300/80">Recomendação da IA</p>
                <h3 className="mt-3 text-2xl font-black leading-tight text-white">Revise produtos de baixa margem antes de colocar mais dinheiro em anúncio.</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">
                  A proposta é simples: mostrar onde existe lucro, onde existe vazamento e qual decisão merece prioridade.
                </p>
              </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" className="py-16 scroll-mt-20">
          <div className="mb-9 max-w-4xl">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">Para quem é?</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
                Para donos que precisam enxergar lucro, atendimento e operação sem virar analista.
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                A Next Level foi criada para empresas que vendem, atendem clientes e precisam decidir rápido com base em margem, não em achismo.
              </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <RevealOnScroll className="grid gap-4 sm:grid-cols-2" stagger={70} duration={620}>
              {TARGET_SEGMENTS.map((item) => (
                <div key={item.title} className="nl-card-hover rounded-[24px] border border-white/[0.08] bg-white/[0.025] p-5">
                  <div className="mb-4 h-1.5 w-10 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(182,255,0,0.45)]" />
                  <h3 className="text-base font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
                </div>
              ))}
              {INTELLIGENCE_CARDS.slice(1).map((item) => (
                <div key={item.label} className="nl-card-hover rounded-[24px] border border-lime-300/[0.12] bg-lime-300/[0.035] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{item.label}</p>
                  <h3 className={`mt-3 text-lg font-black leading-tight ${item.tone}`}>{item.value}</h3>
                </div>
              ))}
            </RevealOnScroll>
            <FeatureScreenshot detail={{ title: "Visão geral da operação", image: "/login-features/gestao-vendas.png" }} />
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="problemas" className="py-16 scroll-mt-20">
          <div className="mb-8 max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">O problema</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
                O problema não é falta de esforço. É falta de sinal confiável.
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-400">
                Quando vendas, atendimento, custos e clientes ficam espalhados, o empresário trabalha muito, mas decide tarde.
              </p>
          </div>
          <RevealOnScroll className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={75} duration={620}>
            {PROBLEMS.map((item) => (
              <div key={item.title} className="nl-card-hover rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-6">
                <h3 className="text-base font-black text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
              </div>
            ))}
          </RevealOnScroll>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="o-que-fazemos" className="py-16 scroll-mt-20">
          <div className="relative overflow-hidden rounded-[28px] border border-lime-400/[0.14] bg-[linear-gradient(135deg,rgba(182,255,0,0.1),rgba(6,8,12,0.96)_42%,rgba(3,5,8,1))] p-8 sm:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.18),transparent_34%)]" />
            <div className="relative">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/80 mb-3">O que a Next Level faz</p>
                <h2 className="text-3xl sm:text-5xl font-black leading-[0.96] tracking-tight text-white">
                  Transforma dados soltos em decisões que protegem caixa e aumentam margem.
                </h2>
                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-300">
                  A plataforma centraliza vendas, custos, clientes e canais digitais. Depois usa IA para apontar risco, oportunidade e próxima ação em linguagem de dono.
                </p>
              </div>
              <RevealOnScroll className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={70} duration={620}>
                {SOLUTIONS.map((item) => (
                  <div key={item.title} className="nl-card-hover rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-6">
                    <h3 className="text-sm font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-zinc-400">{item.text}</p>
                  </div>
                ))}
              </RevealOnScroll>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="features" className="py-16 scroll-mt-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">O que a Next Level entrega</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-[0.94] tracking-[-0.04em] text-white max-w-2xl mx-auto">
              O que muda na rotina do dono.
            </h2>
            <p className="mt-4 max-w-lg mx-auto text-sm leading-7 text-zinc-400">
              Cada recurso responde uma pergunta simples: onde ganhar, onde parar perda e qual ação vem agora.
            </p>
          </div>

          <RevealOnScroll className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={80} duration={650}>
            {FEATURES.map((f) => (
              <div key={f.title} className={`nl-card-hover rounded-[28px] border ${f.border} bg-gradient-to-b ${f.color} p-7 group`}>
                <h3 className="text-base font-black tracking-tight text-white mb-2">{f.title}</h3>
                <p className="text-sm leading-6 text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </RevealOnScroll>

        </RevealOnScroll>

        <RevealOnScroll as="section" className="py-16">
          <div className="relative overflow-hidden rounded-[32px] border border-lime-400/[0.14] bg-[linear-gradient(135deg,rgba(182,255,0,0.08),rgba(7,10,15,0.98)_48%,rgba(3,5,8,1))] p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-20 top-8 h-56 w-56 rounded-full bg-lime-300/10 blur-3xl nl-float" />
            <div className="relative grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">Gestão completa</p>
                <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
                  Não é só financeiro. É a operação inteira falando a mesma língua.
                </h2>
              </div>
              <p className="text-sm leading-7 text-zinc-300">
                A Next Level conecta visão financeira, comercial e operacional para o empresário entender causa, impacto e próxima ação sem depender de cinco ferramentas abertas.
              </p>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="como-funciona" className="py-16 scroll-mt-20">
          <div className="mb-10 max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">Como funciona</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-[0.96]">
              Do dado solto ao próximo passo.
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">Um fluxo simples para transformar informação espalhada em decisão prática, sem sobrecarregar a equipe.</p>
          </div>
          <RevealOnScroll className="grid gap-4 lg:grid-cols-4" stagger={85} duration={650}>
            {HOW_IT_WORKS.map((step) => (
              <div key={step.title} className="relative border-t border-white/[0.1] pt-5">
                <h3 className="text-base font-black text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{step.text}</p>
              </div>
            ))}
          </RevealOnScroll>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="pricing" className="py-16 scroll-mt-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">Planos</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] text-white max-w-xl leading-[0.94]">
                Escolha o plano para o momento da sua operação.
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-zinc-400 max-w-sm">Comece organizando a operação. Avance quando precisar de IA, automação e canais conectados.</p>
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
                    Economia no anual
                  </span>
                )}
              </div>
            </div>
          </div>

          <RevealOnScroll className="grid gap-4 lg:grid-cols-3" stagger={90} duration={680}>
            {UPDATED_PRICING.map((plan) => (
              <div key={plan.name} className={`relative flex flex-col rounded-[28px] border p-6 transition hover:-translate-y-1 duration-300 ${
                plan.recommended
                  ? "border-lime-400/30 bg-[linear-gradient(160deg,rgba(182,255,0,0.09),rgba(5,7,11,1)_60%)] shadow-[0_0_50px_rgba(182,255,0,0.08)]"
                  : "border-white/[0.08] bg-white/[0.025]"
              }`}>
                {plan.recommended && (
                  <div className="absolute -top-3.5 right-6 rounded-full border border-lime-400/40 bg-lime-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 shadow-[0_0_14px_rgba(182,255,0,0.3)]">
                    Mais escolhido
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
                  <p className="mt-1 text-[11px] text-lime-300/80">Equivale a {plan.monthlyPrice}/mês x 10</p>
                )}
                <p className="mt-3 text-sm leading-6 text-zinc-400 flex-1">{plan.summary}</p>
                <div className="mt-5 rounded-[18px] border border-lime-300/[0.16] bg-lime-300/[0.055] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">{PLAN_DISPLAY[plan.key].aiTier}</p>
                  <ul className="mt-3 space-y-1.5">
                    {PLAN_DISPLAY[plan.key].aiLimitItems.map((item) => (
                      <li key={item} className="text-sm font-bold leading-5 text-zinc-100">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{PLAN_DISPLAY[plan.key].aiDescription}</p>
                </div>
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
          </RevealOnScroll>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="login" className="py-16 scroll-mt-20 lg:py-20">
          <div className="mx-auto max-w-[1240px]">
            <div className="mb-8 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">Acesso à plataforma</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
                Entre para transformar clareza em resultado.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                Crie sua conta ou acesse sua central para acompanhar vendas, custos, clientes, relatórios e recomendações da IA em um só lugar.
              </p>
            </div>
            <AuthPanel
              isRegisterView={isRegisterView} setIsRegisterView={setIsRegisterView}
              onLogin={handleLogin} onRegister={handleRegister}
              name={name} setName={setName} email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              error={error} loading={loading} setError={setError}
              googleLoading={googleLoading}
              selectedPlanLabel={selectedPlan ? planSelectionLabel(selectedPlan) : null}
              subscribeIntent={searchParams.get("intent") === "subscribe"}
              onGoogleLogin={handleGoogleLogin}
            />
            <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
              Leva menos de 1 minuto para começar. A escolha do plano continua depois do acesso.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll as="section" id="faq" className="py-20 scroll-mt-20">
          <div className="mb-10 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/70 mb-3">Dúvidas comuns</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white">Perguntas frequentes</h2>
          </div>
          <RevealOnScroll className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2" stagger={70} duration={620}>
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-5">
                <h3 className="text-base font-black text-white">{faq.question}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{faq.answer}</p>
              </div>
            ))}
          </RevealOnScroll>
        </RevealOnScroll>

        <RevealOnScroll as="section" className="py-10 pb-16">
          <div className="relative overflow-hidden rounded-[32px] border border-lime-400/[0.15] bg-[linear-gradient(135deg,rgba(182,255,0,0.14),rgba(8,11,16,0.97)_40%,rgba(3,5,7,1))] p-8 sm:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(182,255,0,0.18),transparent_25%)]" />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-2xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-lime-300/80 mb-3">Comece com clareza</p>
                <h2 className="text-4xl sm:text-5xl font-black leading-[0.94] tracking-tight text-white">
                  Veja onde o lucro pode crescer. Comece hoje.
                </h2>
                <p className="mt-4 text-sm leading-7 text-zinc-300/80">
                  Organize seus dados e descubra onde vender melhor, perder menos e crescer com margem.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row shrink-0">
                <button type="button" onClick={() => scrollToSection("pricing")}
                  className="flex items-center justify-center gap-2 rounded-[22px] bg-lime-300 px-7 py-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 shadow-[0_0_40px_rgba(182,255,0,0.25)] hover:-translate-y-0.5 hover:brightness-105 transition whitespace-nowrap">
                  Assinar agora <ArrowRight />
                </button>
                <button type="button" onClick={() => focusAuth(false)}
                  className="flex items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-zinc-100 hover:bg-white/[0.08] transition whitespace-nowrap">
                  Entrar na minha conta
                </button>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {activeFooterInfo ? (
          <RevealOnScroll as="section" id="footer-info" className="scroll-mt-20 pb-10">
            <div className="relative overflow-hidden rounded-[32px] border border-lime-400/[0.16] bg-[linear-gradient(135deg,rgba(182,255,0,0.09),rgba(7,10,15,0.98)_44%,rgba(3,5,8,1))] p-6 sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(182,255,0,0.14),transparent_34%)]" />
              <div className="relative mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300/80">Recurso da plataforma</p>
                  <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">{FOOTER_DETAILS[activeFooterInfo].title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveFooterInfo(null)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  Fechar
                </button>
              </div>
              <div className="relative grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
                <div>
                  <p className="text-sm leading-7 text-zinc-300">{FOOTER_DETAILS[activeFooterInfo].text}</p>
                  <p className="mt-4 rounded-[18px] border border-white/[0.08] bg-black/20 p-4 text-sm leading-7 text-zinc-400">
                    {FOOTER_DETAILS[activeFooterInfo].how}
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button type="button" onClick={() => scrollToSection("pricing")}
                      className="rounded-[18px] bg-lime-300 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-950 transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-lime-300/70">
                      Ver planos
                    </button>
                    <button type="button" onClick={() => focusAuth(true)}
                      className="rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-200 transition hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/30">
                      Criar conta
                    </button>
                  </div>
                </div>
                <FeatureScreenshot detail={FOOTER_DETAILS[activeFooterInfo]} />
              </div>
            </div>
          </RevealOnScroll>
        ) : null}

        <footer className="border-t border-white/[0.08] py-10">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 shadow-[0_0_12px_rgba(182,255,0,0.3)]">
                <span className="text-zinc-950 font-black text-[10px]">NL</span>
              </div>
              <span className="font-black text-sm tracking-tight text-white">NEXT LEVEL</span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-700">
              IA - Gestão - Automação - Análise - Resultados
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-black uppercase tracking-[0.22em] text-lime-300/80">{column.title}</h3>
                <ul className="mt-4 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <button
                        type="button"
                        onClick={() => openFooterInfo(link.key)}
                        className="text-left text-sm text-zinc-500 transition hover:text-zinc-200 focus:outline-none focus:text-lime-300"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 text-xs leading-6 text-zinc-700">
            NEXT LEVEL AI. Gestão, inteligência operacional e atendimento para empresários brasileiros.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;
