import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { KpiCardProps } from "../types";
import { useAuth } from "../App";
import {
  DollarSignIcon,
  BarChartIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  LightbulbIcon,
  BuildingIcon,
  MessageSquareIcon,
} from "../components/icons";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../src/services/error";
import {
  exportFinancialCsv,
  getDashboardMetrics,
  getDashboardPreferences,
  getForecast,
  getAttendantRoi,
} from "../src/services/endpoints";
import { useStrategicInsights } from "../src/hooks/useStrategicInsights";
import type {
  DashboardPeriod,
  DashboardSummary,
  DashboardMetricsResponse,
  DashboardMetricResult,
  ForecastResponse,
  AttendantRoi,
  TransactionItem,
  DashboardResolvedLayoutItem,
} from "../src/types/domain";

const EMPTY_SUMMARY: DashboardSummary = {
  revenue: 0,
  losses: 0,
  profit: 0,
  cashflow: 0,
  companyCount: 0,
  period: "today",
  lineData: [],
  pieData: [],
};

const PIE_COLORS = ["#B6FF00", "#87B900", "#6D9200", "#547100"];
const PERIODS: Array<{ label: string; value: DashboardPeriod }> = [
  { label: "Hoje", value: "today" },
  { label: "Ontem", value: "yesterday" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Mes", value: "month" },
];
const FORECAST_HORIZONS: Array<7 | 15 | 30> = [7, 15, 30];
const DEFAULT_VISIBLE_METRICS = new Set([
  "revenue",
  "losses",
  "net_profit",
  "cash_flow",
  "company_count",
  "ai_roi",
  "income_revenue",
  "average_ticket",
  "operational_costs",
  "margin",
  "waste_inefficiency",
  "cash_flow_summary",
  "category_mix",
]);

const asCurrency = (value: number) =>
  `R$ ${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDateLabel = (value?: string) => {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

const normalizeAiText = (raw: string) => {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(lines));
  return unique.join("\n");
};

type TransactionsUpdatedDetail = {
  companyId?: string;
  transaction?: TransactionItem;
  totalIncome?: number;
  totalExpense?: number;
  balance?: number;
  transactionsCount?: number;
};

const hasUsefulSummaryData = (summary: DashboardSummary) => {
  if ((summary.revenue || 0) > 0) return true;
  if ((summary.losses || 0) > 0) return true;
  if ((summary.profit || 0) !== 0) return true;
  if ((summary.cashflow || 0) !== 0) return true;
  if ((summary.companyCount || 0) > 0) return true;
  if (Array.isArray(summary.lineData) && summary.lineData.length > 0) return true;
  if (Array.isArray(summary.pieData) && summary.pieData.length > 0) return true;
  return false;
};

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const values = Object.fromEntries(payload.map((entry) => [entry.dataKey, entry.value]));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-200 shadow-2xl">
      <p className="mb-1 text-zinc-400">{label}</p>
      <p className="font-bold text-lime-400">Receitas: {asCurrency(Number(values.Receitas || 0))}</p>
      <p className="font-bold text-red-400">Saidas: {asCurrency(Number(values.Saidas || 0))}</p>
    </div>
  );
};

const KpiCard: React.FC<
  Omit<KpiCardProps, "changeType"> & {
    changeType: "increase" | "decrease" | "flat";
    iconAccent?: string;
    status?: DashboardMetricResult["status"];
    reason?: string;
    sourceLabel?: string;
  }
> = ({ title, value, change, changeType, icon: Icon, color, iconAccent, status = "ok", reason, sourceLabel }) => {
  const isMuted = status !== "ok";
  return (
    <div className={`flex min-w-[260px] flex-col rounded-3xl border bg-zinc-950 p-6 transition-all duration-300 hover:border-lime-400/40 ${isMuted ? "border-amber-500/25" : "border-zinc-800/90"}`}>
      <div className="mb-4 flex items-start justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
          {title}
        </span>
        <div className="rounded-xl border border-zinc-800 bg-black/60 p-2">
          <Icon className={`h-5 w-5 ${iconAccent || color}`} />
        </div>
      </div>
      <p className={`text-[clamp(22px,2.4vw,32px)] md:text-[clamp(24px,2.2vw,36px)] font-black leading-none tracking-tighter whitespace-normal break-words ${isMuted ? "text-amber-200" : "text-zinc-100"}`}>
        {value}
      </p>
      <div
        className={`mt-2 flex items-center text-[11px] font-black ${
          changeType === "increase" ? "text-lime-400" : changeType === "decrease" ? "text-red-500" : "text-zinc-500"
        }`}
      >
        {changeType === "increase" ? (
          <ArrowUpRightIcon className="mr-1 h-3.5 w-3.5" />
        ) : changeType === "decrease" ? (
          <ArrowDownRightIcon className="mr-1 h-3.5 w-3.5" />
        ) : null}
        {change} <span className="ml-1 font-medium text-zinc-500">no periodo selecionado</span>
      </div>
      {reason ? <p className="mt-3 text-[11px] leading-5 text-zinc-500">{reason}</p> : null}
      {sourceLabel ? <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">{sourceLabel}</p> : null}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Legacy growth metric notes, kept out of the rendered dashboard.
   Keys are stable for future backend integration.
   Production values now come from /api/dashboard/metrics:
   { ltv, averageTicket, cpc, cpa, conversionRate, cac }
───────────────────────────────────────────────────────────── */
const LEGACY_GROWTH_METRICS: Array<{
  key: "ltv" | "averageTicket" | "cpc" | "cpa" | "conversionRate" | "cac";
  title: string;
  description: string;
  legacyText: string;
  accentColor: string;
}> = [
  {
    key: "ltv",
    title: "LTV",
    description: "Valor médio estimado que um cliente gera ao longo do relacionamento.",
    legacyText: "Aguardando histórico",
    accentColor: "text-lime-400",
  },
  {
    key: "averageTicket",
    title: "Ticket Médio",
    description: "Valor médio por venda no período selecionado.",
    legacyText: "Dados insuficientes",
    accentColor: "text-cyan-400",
  },
  {
    key: "cpc",
    title: "CPC",
    description: "Custo médio por clique nas campanhas conectadas.",
    legacyText: "Aguardando campanhas",
    accentColor: "text-purple-400",
  },
  {
    key: "cpa",
    title: "CPA",
    description: "Custo médio para adquirir uma ação ou conversão.",
    legacyText: "Aguardando integrações",
    accentColor: "text-amber-400",
  },
  {
    key: "conversionRate",
    title: "Taxa de Conversão",
    description: "Percentual de visitantes ou leads que viraram venda.",
    legacyText: "Em breve",
    accentColor: "text-blue-400",
  },
  {
    key: "cac",
    title: "CAC",
    description: "Custo médio para adquirir um novo cliente.",
    legacyText: "Conecte campanhas",
    accentColor: "text-rose-400",
  },
];

const GrowthMetricCard: React.FC<{
  title: string;
  description: string;
  legacyText: string;
  accentColor: string;
}> = ({ title, description, legacyText, accentColor }) => (
  <div className="flex flex-col rounded-3xl border border-zinc-800/90 bg-zinc-950 p-5 transition-all duration-300 hover:border-lime-400/25">
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{title}</span>
      <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">
        Em config.
      </span>
    </div>
    <p className={`mt-4 text-2xl font-black tracking-tight ${accentColor}`}>{legacyText}</p>
    <p className="mt-2 text-[11px] leading-5 text-zinc-500">{description}</p>
  </div>
);

const ADVANCED_METRICS: Array<{
  key: string;
  title: string;
  description: string;
  accentColor: string;
}> = [
  { key: "income_revenue", title: "Rendas/Receitas", description: "Entradas reais de vendas e transacoes de receita no periodo.", accentColor: "text-lime-300" },
  { key: "sales_count", title: "Vendas", description: "Quantidade real de vendas e entradas comerciais registradas no periodo.", accentColor: "text-lime-400" },
  { key: "average_ticket", title: "Ticket Medio", description: "Valor medio por venda no periodo selecionado.", accentColor: "text-cyan-400" },
  { key: "customers_acquired", title: "Clientes adquiridos", description: "Clientes criados no periodo selecionado.", accentColor: "text-purple-400" },
  { key: "operational_costs", title: "Custos operacionais", description: "Custos operacionais cadastrados no periodo.", accentColor: "text-amber-400" },
  { key: "margin", title: "Margem", description: "Lucro liquido dividido pela receita, quando ha receita no periodo.", accentColor: "text-blue-400" },
  { key: "waste_inefficiency", title: "Desperdicio", description: "Custos operacionais como percentual da receita real.", accentColor: "text-rose-400" },
  { key: "conversion_rate", title: "Taxa de Conversao", description: "Percentual de visitantes ou leads que viraram venda.", accentColor: "text-blue-400" },
  { key: "cac", title: "CAC", description: "Custo medio para adquirir um novo cliente.", accentColor: "text-rose-400" },
  { key: "roi", title: "ROI", description: "Retorno sobre investimento, sem confundir com ROAS.", accentColor: "text-lime-300" },
  { key: "roas", title: "ROAS", description: "Retorno de receita atribuida a anuncios.", accentColor: "text-sky-300" },
  { key: "ltv", title: "LTV", description: "Valor medio de cliente baseado em historico de compras.", accentColor: "text-emerald-300" },
  { key: "repeat_customers", title: "Clientes recorrentes", description: "Clientes com mais de uma compra vinculada.", accentColor: "text-orange-300" },
  { key: "best_selling_products", title: "Mais vendidos", description: "Produtos agrupados por receita registrada.", accentColor: "text-fuchsia-300" },
  { key: "peak_sales_hours", title: "Pico de vendas", description: "Vendas agrupadas por horario real.", accentColor: "text-teal-300" },
];

const DIRECT_RENDERED_METRIC_KEYS = new Set([
  "revenue",
  "losses",
  "profit",
  "net_profit",
  "cash_flow",
  "company_count",
  "ai_roi",
  "cash_flow_summary",
  "category_mix",
  "revenue_forecast",
  "alerts_insights",
]);

const ADVANCED_METRIC_KEYS = new Set(ADVANCED_METRICS.map((item) => item.key));

const RealMetricCard: React.FC<{
  title: string;
  description: string;
  accentColor: string;
  metric?: DashboardMetricResult;
}> = ({ title, description, accentColor, metric }) => (
  <div className="flex flex-col rounded-3xl border border-zinc-800/90 bg-zinc-950 p-5 transition-all duration-300 hover:border-lime-400/25">
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{title}</span>
      <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">
        {metric?.status === "ok" ? "Real" : "Honesto"}
      </span>
    </div>
    <p className={`mt-4 text-2xl font-black tracking-tight ${metric?.status === "ok" ? accentColor : "text-amber-200"}`}>
      {metric?.formatted || "Carregando"}
    </p>
    <p className="mt-2 text-[11px] leading-5 text-zinc-500">{description}</p>
    {metric?.reason ? <p className="mt-2 text-[11px] leading-5 text-zinc-600">{metric.reason}</p> : null}
    {metric?.sourceLabel ? <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">{metric.sourceLabel}</p> : null}
  </div>
);

const Dashboard = () => {
  const { username, detailLevel, selectedCompanyId, isCompanyReady } = useAuth();
  const { addToast } = useToast();
  const [metricsData, setMetricsData] = useState<DashboardMetricsResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [layout, setLayout] = useState<DashboardResolvedLayoutItem[]>([]);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<DashboardPeriod>("today");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<7 | 15 | 30>(30);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [attendantRoi, setAttendantRoi] = useState<AttendantRoi>({ iaSalesCount: 0, iaRevenue: 0 });
  const enabledMetricKeys = useMemo(
    () => (isLayoutLoading ? Array.from(DEFAULT_VISIBLE_METRICS) : layout.map((item) => item.metricKey)),
    [isLayoutLoading, layout],
  );
  const enabledMetricSet = useMemo(() => new Set(enabledMetricKeys), [enabledMetricKeys]);
  const isMetricEnabled = (metricKey: string) => enabledMetricSet.has(metricKey);
  const hasSelectedMetrics = enabledMetricKeys.length > 0;
  const metric = (metricKey: string) => metricsData?.metrics?.[metricKey];
  const metricNumber = (metricKey: string) => {
    const item = metric(metricKey);
    return item?.status === "ok" && typeof item.value === "number" ? item.value : 0;
  };
  const summary: DashboardSummary = useMemo(
    () => ({
      ...EMPTY_SUMMARY,
      revenue: metricNumber("revenue"),
      losses: metricNumber("losses"),
      profit: metricNumber("profit") || metricNumber("net_profit"),
      cashflow: metricNumber("cash_flow"),
      companyCount: metricNumber("company_count"),
      period: activePeriod,
      lineData: (metricsData?.charts?.revenueByDay || []).map((item) => ({
        name: String(item.name || ""),
        Receitas: Number(item.Receitas || 0),
        Saidas: Number(item.Saidas || 0),
      })),
      pieData: (metricsData?.charts?.costsByCategory || []).map((item) => ({
        name: String(item.name || ""),
        value: Number(item.value || 0),
      })),
    }),
    [metricsData, activePeriod],
  );
  const shouldLoadStrategicInsights =
    selectedCompanyId !== null &&
    isMetricEnabled("alerts_insights") &&
    hasUsefulSummaryData(summary);
  const {
    rawText: sharedInsightText,
    error: strategicInsightError,
  } = useStrategicInsights({
    companyId: selectedCompanyId,
    detailLevel,
    enabled: shouldLoadStrategicInsights,
    summary,
  });

  const formattedInsight = useMemo(() => normalizeAiText(sharedInsightText), [sharedInsightText]);

  const chartData = useMemo(() => {
    return summary.lineData.map((item) => ({
      name: item.name,
      Receitas: Number(item.Receitas || 0),
      Saidas: Number(item.Saidas || 0),
    }));
  }, [summary.lineData]);

  const pieData = useMemo(() => {
    const salesByProduct = metricsData?.charts?.salesByProduct || [];
    if (salesByProduct.length) {
      return salesByProduct.map((item) => ({
        name: String(item.name || ""),
        value: Number(item.revenue || item.value || 0),
      }));
    }
    return summary.pieData;
  }, [metricsData, summary.pieData]);

  const hasChartData = chartData.length > 0 || pieData.length > 0;

  const forecastChartData = useMemo(() => {
    if (!forecast || forecast.status !== "ok") return [];
    const historical = forecast.historicalData || [];
    const predicted = forecast.predictedData || [];
    const combined = [...historical, ...predicted];

    return combined.map((point, index) => {
      const isFuture = index >= historical.length;
      return {
        date: point.date,
        Real: isFuture ? null : point.value,
        Forecast: isFuture ? point.value : null,
      };
    });
  }, [forecast]);

  const hasForecast = forecast?.status === "ok" && forecastChartData.length > 0;

  const forecastStatusMessage = useMemo(() => {
    if (!forecast) return "Carregando projecao...";
    if (forecast.status === "insufficient_data" || forecast.status === "not_enough_data") {
      return forecast.message || "Historico insuficiente para prever receita";
    }
    if (
      forecast.confidenceInterval &&
      typeof forecast.confidenceInterval.margin === "number" &&
      typeof forecast.confidenceInterval.lower === "number" &&
      typeof forecast.confidenceInterval.upper === "number"
    ) {
      return `Margem estimada +/-${forecast.confidenceInterval.margin.toFixed(2)} | Confianca ${forecast.qualityLabel || "low"}`;
    }
    return `Projecao simples pronta${forecast.qualityLabel ? ` - confianca ${forecast.qualityLabel}` : ""}`;
  }, [forecast]);

  const loadLayout = async () => {
    if (!isCompanyReady) return;
    if (!selectedCompanyId) {
      setLayout([]);
      setMetricsData(null);
      setForecast(null);
      setAttendantRoi({ iaSalesCount: 0, iaRevenue: 0 });
      setIsLayoutLoading(false);
      return;
    }
    setIsLayoutLoading(true);
    try {
      const data = await getDashboardPreferences({ companyId: selectedCompanyId });
      setLayout(Array.isArray(data?.resolvedLayout) ? data.resolvedLayout : []);
    } catch (error) {
      setLayout([]);
      addToast(getErrorMessage(error, "Nao foi possivel carregar sua personalizacao."), "error");
    } finally {
      setIsLayoutLoading(false);
    }
  };

  const loadMetrics = async () => {
    if (!selectedCompanyId) {
      setMetricsData(null);
      return;
    }
    if (!hasSelectedMetrics && !isLayoutLoading) {
      setMetricsData(null);
      return;
    }
    setIsUpdating(true);
    try {
      const data = await getDashboardMetrics({
        companyId: selectedCompanyId,
        period: activePeriod,
        metrics: enabledMetricKeys,
        comparePrevious: true,
      });
      setMetricsData(data);
    } catch (error) {
      setMetricsData(null);
      addToast(getErrorMessage(error, "Nao foi possivel carregar o dashboard."), "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const loadForecast = async (horizonOverride?: 7 | 15 | 30) => {
    if (!selectedCompanyId || !isMetricEnabled("revenue_forecast")) {
      setForecast(null);
      return;
    }
    const horizon = horizonOverride || forecastHorizon;
    setIsForecastLoading(true);
    try {
      const data = await getForecast({
        companyId: selectedCompanyId,
        type: "REVENUE",
        horizon,
      });
      setForecast(data);
    } catch (error) {
      setForecast(null);
      addToast(getErrorMessage(error, "Não foi possível carregar o forecast."), "error");
    } finally {
      setIsForecastLoading(false);
    }
  };

  useEffect(() => {
    if (!isCompanyReady) return;
    void loadLayout();
  }, [isCompanyReady, selectedCompanyId]);

  useEffect(() => {
    const onPreferencesUpdated = () => {
      void loadLayout();
    };
    window.addEventListener("dashboard:preferences-updated", onPreferencesUpdated);
    return () => window.removeEventListener("dashboard:preferences-updated", onPreferencesUpdated);
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!isCompanyReady) return;
    if (isLayoutLoading) return;
    void loadMetrics();
  }, [detailLevel, selectedCompanyId, activePeriod, isCompanyReady, isLayoutLoading, enabledMetricKeys.join(",")]);

  useEffect(() => {
    if (!isCompanyReady) return;
    if (isLayoutLoading) return;
    void loadForecast(forecastHorizon);
  }, [selectedCompanyId, isCompanyReady, isLayoutLoading, enabledMetricKeys.join(",")]);

  useEffect(() => {
    const onTransactionsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<TransactionsUpdatedDetail>).detail;
      if (detail?.companyId && selectedCompanyId && detail.companyId !== selectedCompanyId) {
        return;
      }

      void loadMetrics();
      void loadForecast(forecastHorizon);
    };
    window.addEventListener("transactions:updated", onTransactionsUpdated);
    window.addEventListener("companies:updated", onTransactionsUpdated);
    return () => {
      window.removeEventListener("transactions:updated", onTransactionsUpdated);
      window.removeEventListener("companies:updated", onTransactionsUpdated);
    };
  }, [selectedCompanyId, activePeriod, forecastHorizon]);

  useEffect(() => {
    const loadRoi = async () => {
      if (!selectedCompanyId || !isMetricEnabled("ai_roi")) {
        setAttendantRoi({ iaSalesCount: 0, iaRevenue: 0 });
        return;
      }
      try {
        const roi = await getAttendantRoi(selectedCompanyId);
        setAttendantRoi(roi);
      } catch (error) {
        setAttendantRoi({ iaSalesCount: 0, iaRevenue: 0 });
      }
    };
    if (isLayoutLoading) return;
    void loadRoi();
  }, [selectedCompanyId, isLayoutLoading, enabledMetricKeys.join(",")]);

  const handleExport = async () => {
    try {
      const blob = await exportFinancialCsv({ companyId: selectedCompanyId });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "financial-export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      addToast("CSV exportado com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao exportar CSV."), "error");
    }
  };

  const handleHorizonChange = (value: 7 | 15 | 30) => {
    setForecastHorizon(value);
    void loadForecast(value);
  };

  const marginDirection = summary.profit >= 0 ? "increase" : "decrease";
  const dynamicGrowthMetrics = layout
    .filter(
      (item) =>
        item.enabled &&
        !DIRECT_RENDERED_METRIC_KEYS.has(item.metricKey) &&
        !ADVANCED_METRIC_KEYS.has(item.metricKey),
    )
    .map((item, index) => ({
      key: item.metricKey,
      title: item.label,
      description: item.description,
      accentColor: ["text-lime-300", "text-cyan-300", "text-amber-300", "text-fuchsia-300"][index % 4],
    }));
  const visibleGrowthMetrics = [
    ...ADVANCED_METRICS.filter((item) => isMetricEnabled(item.key)),
    ...dynamicGrowthMetrics,
  ];
  const metricChange = (item?: DashboardMetricResult) => {
    if (!item || item.status !== "ok") {
      return { text: item?.status === "not_enough_data" ? "Dado insuficiente" : "Sem dados", type: "flat" as const };
    }
    const comparison = item.comparison;
    if (!comparison) {
      return { text: "Valor real", type: "flat" as const };
    }
    const prefix = comparison.changePercent > 0 ? "+" : "";
    return {
      text: `${prefix}${comparison.changePercent.toFixed(2)}%`,
      type:
        comparison.direction === "up"
          ? ("increase" as const)
          : comparison.direction === "down"
            ? ("decrease" as const)
            : ("flat" as const),
    };
  };

  return (
    <div className="space-y-7 overflow-x-hidden">
      <header className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-zinc-100 md:text-5xl">Visao Geral</h1>
          <p className="mt-2 text-base font-medium text-zinc-400 md:text-lg">
            Ola, {username || "Usuario"}. Aqui esta o panorama estrategico do periodo selecionado.
          </p>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <Link
            to="/settings#dashboard"
            className="flex-1 rounded-2xl border border-lime-400/30 bg-lime-400/10 px-7 py-3 text-center text-[11px] font-black uppercase tracking-[0.2em] text-lime-300 transition hover:border-lime-400/60 md:flex-none"
          >
            Personalizar
          </Link>
          <button
            onClick={handleExport}
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-7 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-100 transition hover:bg-zinc-900 md:flex-none"
          >
            Exportar Dados
          </button>
          <button
            onClick={() => void loadMetrics()}
            disabled={isUpdating}
            className={`flex-1 rounded-2xl bg-lime-400 px-7 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 transition ${
              isUpdating ? "opacity-50" : "hover:opacity-90"
            } md:flex-none`}
          >
            {isUpdating ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => setActivePeriod(period.value)}
            className={`rounded-2xl px-6 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition ${
              activePeriod === period.value
                ? "bg-lime-400 text-zinc-900"
                : "border border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {isCompanyReady && !selectedCompanyId ? (
        <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center">
          <h2 className="text-2xl font-black tracking-tighter text-zinc-100">Selecione uma empresa</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400">
            O dashboard carrega quando uma empresa ativa estiver definida para esta sessao.
          </p>
          <Link
            to="/companies"
            className="mt-5 inline-flex rounded-2xl bg-lime-400 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-950"
          >
            Abrir empresas
          </Link>
        </div>
      ) : null}

      {!isLayoutLoading && !!selectedCompanyId && !hasSelectedMetrics ? (
        <div className="rounded-3xl border border-dashed border-lime-400/30 bg-lime-400/10 p-8 text-center">
          <h2 className="text-2xl font-black tracking-tighter text-zinc-100">Dashboard sem widgets ativos</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400">
            Escolha os indicadores que fazem sentido para esta empresa e salve uma visao mais limpa.
          </p>
          <Link
            to="/settings#dashboard"
            className="mt-5 inline-flex rounded-2xl bg-lime-400 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-950"
          >
            Personalizar dashboard
          </Link>
        </div>
      ) : null}

      {selectedCompanyId && hasSelectedMetrics ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
          {isMetricEnabled("revenue") ? (
            <KpiCard
              title="Faturamento"
              value={metric("revenue")?.formatted || "Carregando"}
              change={metricChange(metric("revenue")).text}
              changeType={metricChange(metric("revenue")).type}
              icon={DollarSignIcon}
              color="text-lime-400"
              status={metric("revenue")?.status}
              reason={metric("revenue")?.reason}
              sourceLabel={metric("revenue")?.sourceLabel}
            />
          ) : null}
          {isMetricEnabled("losses") ? (
            <KpiCard
              title="Perdas"
              value={metric("losses")?.formatted || "Carregando"}
              change={metricChange(metric("losses")).text}
              changeType={metricChange(metric("losses")).type}
              icon={DollarSignIcon}
              color="text-red-500"
              status={metric("losses")?.status}
              reason={metric("losses")?.reason}
              sourceLabel={metric("losses")?.sourceLabel}
            />
          ) : null}
          {isMetricEnabled("profit") || isMetricEnabled("net_profit") ? (
            <KpiCard
              title={isMetricEnabled("net_profit") ? "Lucro liquido" : "Lucro"}
              value={(metric("net_profit") || metric("profit"))?.formatted || "Carregando"}
              change={metricChange(metric("net_profit") || metric("profit")).text}
              changeType={metricChange(metric("net_profit") || metric("profit")).type || marginDirection}
              icon={BarChartIcon}
              color="text-blue-400"
              status={(metric("net_profit") || metric("profit"))?.status}
              reason={(metric("net_profit") || metric("profit"))?.reason}
              sourceLabel={(metric("net_profit") || metric("profit"))?.sourceLabel}
            />
          ) : null}
          {isMetricEnabled("cash_flow") ? (
            <KpiCard
              title="Fluxo de Caixa"
              value={metric("cash_flow")?.formatted || "Carregando"}
              change={metricChange(metric("cash_flow")).text}
              changeType={metricChange(metric("cash_flow")).type}
              icon={BarChartIcon}
              color="text-purple-400"
              status={metric("cash_flow")?.status}
              reason={metric("cash_flow")?.reason}
              sourceLabel={metric("cash_flow")?.sourceLabel}
            />
          ) : null}
          {isMetricEnabled("company_count") ? (
            <KpiCard
              title="Empresas"
              value={metric("company_count")?.formatted || "Carregando"}
              change="Base vinculada"
              changeType="flat"
              icon={BuildingIcon}
              color="text-amber-400"
              status={metric("company_count")?.status}
              reason={metric("company_count")?.reason}
            />
          ) : null}
          {isMetricEnabled("ai_roi") ? (
            <KpiCard
              title="ROI da IA"
              value={`${attendantRoi.iaSalesCount} vendas`}
              change={`Gerado pela IA: ${asCurrency(attendantRoi.iaRevenue)}`}
              changeType="increase"
              icon={MessageSquareIcon}
              color="text-cyan-400"
              iconAccent="text-cyan-300"
            />
          ) : null}
        </div>
      ) : null}

      {/* ── Metricas de crescimento vindas do backend ── */}
      {visibleGrowthMetrics.length > 0 ? (
      <section aria-label="Metricas de Crescimento">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">LEITURA AVANÇADA</p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">
              Métricas de Crescimento
            </h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-500">
              Indicadores preparados para cruzar vendas, clientes e campanhas quando as integrações estiverem ativas.
            </p>
          </div>
          <span className="mt-3 inline-flex w-max items-center gap-2 rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.22em] text-lime-300 sm:mt-0">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400"></span>
            Preparado para integrações
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleGrowthMetrics.map((item) => (
            <RealMetricCard
              key={item.key}
              title={item.title}
              description={item.description}
              accentColor={item.accentColor}
              metric={metric(item.key)}
            />
          ))}
        </div>
      </section>
      ) : null}

      {(isMetricEnabled("cash_flow_summary") || isMetricEnabled("category_mix")) && !hasChartData ? (
        <div className="grid place-items-center rounded-3xl border border-zinc-900 bg-zinc-950 p-10 text-zinc-500">
          Nenhum dado disponivel ainda para este periodo.
        </div>
      ) : (isMetricEnabled("cash_flow_summary") || isMetricEnabled("category_mix")) ? (
        <div className="grid min-h-0 grid-cols-1 gap-5 xl:grid-cols-3">
          {isMetricEnabled("cash_flow_summary") ? (
          <div className="relative min-h-0 overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 p-7 xl:col-span-2">
            <div className="relative z-10 mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">Fluxo por Faixa</h3>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">
                Filtro ativo
              </span>
            </div>
            <div className="relative z-10 min-h-0 min-w-0">
              <ResponsiveContainer width="100%" minWidth={280} minHeight={260} height={320}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="5 5" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#52525b"
                    fontSize={11}
                    fontWeight="800"
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={11}
                    fontWeight="800"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#B6FF00", strokeDasharray: "4 4" }} />
                  <Line
                    type="monotone"
                    dataKey="Saidas"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="4 6"
                  />
                  <Line
                    type="monotone"
                    dataKey="Receitas"
                    stroke="#B6FF00"
                    strokeWidth={4}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          ) : null}

          {isMetricEnabled("category_mix") ? (
          <div className="flex flex-col items-center rounded-3xl border border-zinc-900 bg-zinc-950 p-7">
            <h3 className="mb-8 text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">Mix do Periodo</h3>
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" minWidth={240} minHeight={220} height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={7}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid w-full grid-cols-2 gap-y-2 text-xs font-bold uppercase tracking-[0.1em] text-zinc-300">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          ) : null}
        </div>
      ) : null}

      {isMetricEnabled("revenue_forecast") ? (
      <div className="rounded-3xl border border-zinc-900 bg-zinc-950 p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Modo Futuro</p>
            <h3 className="text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">
              Projecao simples de receita
            </h3>
            <p className="text-sm text-zinc-500">
              Media movel dos ultimos registros reais para os proximos {forecastHorizon} dias.
            </p>
          </div>
          <div className="flex gap-2">
            {FORECAST_HORIZONS.map((value) => (
              <button
                key={value}
                onClick={() => handleHorizonChange(value)}
                className={`rounded-2xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] transition ${
                  forecastHorizon === value
                    ? "bg-lime-400 text-zinc-900"
                    : "border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Próx {value}d
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {isForecastLoading ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-zinc-500">
              Calculando projecao...
            </div>
          ) : forecast?.status === "insufficient_data" || forecast?.status === "not_enough_data" ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
              {forecastStatusMessage}
            </div>
          ) : !hasForecast ? (
            <div className="grid place-items-center rounded-2xl border border-zinc-800 px-6 py-12 text-zinc-500">
              Projecao indisponivel no momento.
            </div>
          ) : (
            <>
              <div className="relative z-10 min-h-0 min-w-0">
                <ResponsiveContainer width="100%" minWidth={280} minHeight={260} height={320}>
                  <LineChart data={forecastChartData}>
                    <CartesianGrid strokeDasharray="5 5" stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#52525b"
                      fontSize={11}
                      fontWeight="800"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatDateLabel}
                      dy={10}
                    />
                    <YAxis
                      stroke="#52525b"
                      fontSize={11}
                      fontWeight="800"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => asCurrency(Number(value || 0))}
                      labelFormatter={(label) => `Data: ${formatDateLabel(String(label))}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="Real"
                      stroke="#B6FF00"
                      strokeWidth={3}
                      dot={false}
                      name="Histórico"
                    />
                    <Line
                      type="monotone"
                      dataKey="Forecast"
                      stroke="#38bdf8"
                      strokeWidth={3}
                      dot={false}
                      strokeDasharray="6 6"
                      name="Previsto"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] text-zinc-300">
                  {forecastStatusMessage}
                </span>
                {forecast?.accuracyScore !== undefined && (
                  <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] text-zinc-300">
                    Acurácia estimada: {(forecast.accuracyScore * 100).toFixed(1)}%
                  </span>
                )}
                {forecast?.generatedAt && (
                  <span className="text-[11px] text-zinc-500">
                    Atualizado em {formatDateLabel(forecast.generatedAt)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      ) : null}

      {isMetricEnabled("alerts_insights") ? (
      <div className="flex flex-col items-start gap-6 rounded-3xl border border-zinc-900 bg-zinc-950 p-7 md:flex-row md:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-lime-400/15 p-2 text-lime-400">
              <LightbulbIcon className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">Insight Estrategico</h3>
            {strategicInsightError ? (
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
                Cache/Retry ativo
              </span>
            ) : null}
          </div>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300 md:text-base">
            {formattedInsight || "Ainda nao ha volume suficiente para um diagnostico automatico robusto. Cadastre movimentacoes financeiras, vendas e custos para liberar analises mais profundas."}
          </p>
        </div>
        <Link
          to="/insights"
          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-8 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-100 transition hover:border-lime-400/40"
        >
          Ver Insights Completos
        </Link>
      </div>
      ) : null}
    </div>
  );
};

export default Dashboard;
