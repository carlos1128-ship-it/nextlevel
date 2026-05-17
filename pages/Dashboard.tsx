import React, { useEffect, useMemo, useRef, useState } from "react";
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
  SettingsIcon,
  ActivityIcon,
} from "../components/icons";
import { useToast } from "../components/Toast";
import AiDashboardPanel from "../components/AiDashboardPanel";
import { getErrorMessage } from "../src/services/error";
import {
  getAiDashboardInsights,
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
  AiDashboardIntelligence,
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
  { label: "Mês", value: "month" },
  { label: "Ano", value: "year" },
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

const translateMetricReason = (reason?: string | null) => {
  if (!reason) return "";
  const normalized = reason.toLowerCase();

  if (normalized.includes("delivery cost")) return "Ainda faltam dados de custos de entrega.";
  if (normalized.includes("marketplace order fee")) return "Ainda faltam dados de taxas do marketplace.";
  if (normalized.includes("shipping cost")) return "Ainda faltam dados de custos de frete.";
  if (normalized.includes("appointment") || normalized.includes("booking") || normalized.includes("scheduling")) {
    return "Ainda faltam dados de agendamentos.";
  }
  if (normalized.includes("patient") || normalized.includes("consultation")) return "Ainda faltam dados de clientes e atendimentos.";
  if (normalized.includes("lead-source") || normalized.includes("funnel") || normalized.includes("conversion")) {
    return "Ainda faltam dados de clientes e conversões.";
  }
  if (normalized.includes("purchase history") || normalized.includes("customer-to-sale")) {
    return "Ainda faltam dados de histórico de compras.";
  }
  if (normalized.includes("paid media") || normalized.includes("ad-attributed")) {
    return "Ainda faltam dados confiáveis de mídia paga para este cálculo.";
  }
  if (normalized.includes("investment cost") || normalized.includes("roi is not roas")) {
    return "Ainda faltam dados de investimento para calcular ROI com segurança.";
  }
  if (normalized.includes("refund") || normalized.includes("order status")) return "Ainda faltam dados de pedidos e reembolsos.";
  if (normalized.includes("inventory movement")) return "Ainda faltam dados de movimentação de estoque.";
  if (normalized.includes("legal pipeline") || normalized.includes("case model")) return "Ainda faltam dados de acompanhamento de atendimentos.";
  if (normalized.includes("task") || normalized.includes("follow-up")) return "Ainda faltam dados de tarefas e follow-ups.";
  if (normalized.includes("subscription") || normalized.includes("billing")) return "Ainda faltam dados de assinaturas e faturamento.";
  if (normalized.includes("missing")) return "Dados insuficientes para calcular este indicador.";

  return reason;
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
      <p className="font-bold text-red-400">Saídas: {asCurrency(Number(values.Saidas || 0))}</p>
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
    highlighted?: boolean;
  }
> = ({ title, value, change, changeType, icon: Icon, color, iconAccent, status = "ok", reason, sourceLabel, highlighted }) => {
  const isMuted = status !== "ok";
  return (
    <div
      className={`card-base p-6 flex flex-col justify-between transition-all duration-300 ${
        highlighted ? "border-l-4 border-l-[#B6FF00]" : ""
      } ${isMuted ? "opacity-90" : "hover:border-white/20 active:scale-[0.98]"}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlighted ? "bg-lime-300/10" : "bg-white/5"}`}>
          <Icon className={`h-5 w-5 ${highlighted ? "text-[#B6FF00]" : iconAccent || color || "text-zinc-400"}`} />
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-tight ${
          changeType === "increase" ? "bg-lime-300/10 text-lime-400" :
          changeType === "decrease" ? "bg-red-500/10 text-red-400" :
          "bg-white/5 text-zinc-500"
        }`}>
          {changeType === "increase" ? (
            <ArrowUpRightIcon className="h-3 w-3" />
          ) : changeType === "decrease" ? (
            <ArrowDownRightIcon className="h-3 w-3" />
          ) : null}
          {change}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 mb-1">
          {title}
        </p>
        <h3 className={`text-3xl font-black tracking-tighter leading-none ${isMuted ? "text-amber-200/80" : "text-white"}`}>
          {value}
        </h3>
        {reason && <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">{translateMetricReason(reason)}</p>}
        {sourceLabel && <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#B6FF00]/80">{sourceLabel}</p>}
      </div>
    </div>
  );
};

const GrowthMetricCard: React.FC<{
  title: string;
  description: string;
  legacyText: string;
  accentColor: string;
}> = ({ title, description, legacyText, accentColor }) => (
  <div className="card-base p-5 flex flex-col justify-between transition-all hover:border-white/10">
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{title}</span>
      <span className="shrink-0 rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[8px] font-bold text-zinc-600">
        CONFIG
      </span>
    </div>
    <div className="mt-4">
      <p className={`text-2xl font-black tracking-tight ${accentColor}`}>{legacyText}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{description}</p>
    </div>
  </div>
);

const ADVANCED_METRICS: Array<{
  key: string;
  title: string;
  description: string;
  accentColor: string;
}> = [
  { key: "income_revenue", title: "Rendas/Receitas", description: "Entradas reais de vendas e transações de receita no período.", accentColor: "text-lime-300" },
  { key: "sales_count", title: "Vendas", description: "Quantidade real de vendas e entradas comerciais registradas no período.", accentColor: "text-lime-400" },
  { key: "average_ticket", title: "Ticket Médio", description: "Valor médio por venda no período selecionado.", accentColor: "text-cyan-400" },
  { key: "customers_acquired", title: "Clientes adquiridos", description: "Clientes criados no período selecionado.", accentColor: "text-purple-400" },
  { key: "operational_costs", title: "Custos operacionais", description: "Custos operacionais cadastrados no período.", accentColor: "text-amber-400" },
  { key: "margin", title: "Margem", description: "Lucro líquido dividido pela receita, quando há receita no período.", accentColor: "text-blue-400" },
  { key: "waste_inefficiency", title: "Desperdício", description: "Custos operacionais como percentual da receita real.", accentColor: "text-rose-400" },
  { key: "conversion_rate", title: "Taxa de conversão", description: "Percentual de visitantes ou leads que viraram venda.", accentColor: "text-blue-400" },
  { key: "cac", title: "CAC", description: "Custo médio para adquirir um novo cliente.", accentColor: "text-rose-400" },
  { key: "roi", title: "ROI", description: "Retorno sobre investimento, sem confundir com ROAS.", accentColor: "text-lime-300" },
  { key: "roas", title: "ROAS", description: "Retorno de receita atribuída a anúncios.", accentColor: "text-sky-300" },
  { key: "ltv", title: "LTV", description: "Valor médio de cliente baseado em histórico de compras.", accentColor: "text-emerald-300" },
  { key: "repeat_customers", title: "Clientes recorrentes", description: "Clientes com mais de uma compra vinculada.", accentColor: "text-orange-300" },
  { key: "best_selling_products", title: "Mais vendidos", description: "Produtos agrupados por receita registrada.", accentColor: "text-fuchsia-300" },
  { key: "peak_sales_hours", title: "Pico de vendas", description: "Vendas agrupadas por horário real.", accentColor: "text-teal-300" },
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
  <div className="card-base p-5 flex flex-col justify-between transition-all hover:border-white/10">
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{title}</span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${
        metric?.status === "ok" ? "bg-lime-900/20 text-lime-400 border border-lime-400/20" : "bg-amber-900/20 text-amber-400 border border-amber-400/20"
      }`}>
        {metric?.status === "ok" ? "Real" : "Honesto"}
      </span>
    </div>
    <div className="mt-4">
      <p className={`text-2xl font-black tracking-tighter ${metric?.status === "ok" ? accentColor : "text-amber-200"}`}>
        {metric?.formatted || "NEXT LEVEL"}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{description}</p>
      {metric?.reason && <p className="mt-2 text-[11px] leading-relaxed text-zinc-600 italic">{translateMetricReason(metric.reason)}</p>}
      {metric?.sourceLabel && <p className="mt-2 text-[10px] font-black uppercase tracking-[0.12em] text-[#B6FF00]/60">{metric.sourceLabel}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const { username, detailLevel, selectedCompanyId, isCompanyReady } = useAuth();
  const { addToast } = useToast();
  const dashboardExportRef = useRef<HTMLDivElement>(null);
  const [metricsData, setMetricsData] = useState<DashboardMetricsResponse | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [layout, setLayout] = useState<DashboardResolvedLayoutItem[]>([]);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<DashboardPeriod>("today");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<7 | 15 | 30>(30);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [aiDashboard, setAiDashboard] = useState<AiDashboardIntelligence | null>(null);
  const [isAiDashboardLoading, setIsAiDashboardLoading] = useState(false);
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
    if (!forecast) return "NEXT LEVEL";
    if (forecast.status === "insufficient_data" || forecast.status === "not_enough_data") {
      return forecast.message || "Histórico insuficiente para prever receita";
    }
    if (
      forecast.confidenceInterval &&
      typeof forecast.confidenceInterval.margin === "number" &&
      typeof forecast.confidenceInterval.lower === "number" &&
      typeof forecast.confidenceInterval.upper === "number"
    ) {
      return `Margem estimada +/-${forecast.confidenceInterval.margin.toFixed(2)} | Confiança ${forecast.qualityLabel || "low"}`;
    }
    return `Projeção simples pronta${forecast.qualityLabel ? ` - confiança ${forecast.qualityLabel}` : ""}`;
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
      addToast(getErrorMessage(error, "Não foi possível carregar sua personalização."), "error");
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
      addToast(getErrorMessage(error, "Não foi possível carregar o dashboard."), "error");
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

  const loadAiDashboard = async () => {
    if (!selectedCompanyId) {
      setAiDashboard(null);
      return;
    }
    setIsAiDashboardLoading(true);
    try {
      const data = await getAiDashboardInsights({
        companyId: selectedCompanyId,
        period: activePeriod,
      });
      setAiDashboard(data);
    } catch (error) {
      setAiDashboard(null);
      addToast(getErrorMessage(error, "Não foi possível carregar a inteligência do dashboard."), "error");
    } finally {
      setIsAiDashboardLoading(false);
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
    if (!isCompanyReady) return;
    if (isLayoutLoading) return;
    void loadAiDashboard();
  }, [selectedCompanyId, activePeriod, isCompanyReady, isLayoutLoading]);

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
    if (!dashboardExportRef.current) {
      addToast("Relatório ainda não está pronto para exportar.", "info");
      return;
    }

    try {
      setIsExporting(true);
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(dashboardExportRef.current, {
        backgroundColor: "#040507",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let position = 0;
      let remaining = imgH;

      while (remaining > 0) {
        pdf.setFillColor(4, 5, 7);
        pdf.rect(0, 0, pageW, pageH, "F");
        pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
        remaining -= pageH;
        if (remaining > 0) {
          pdf.addPage();
          position -= pageH;
        }
      }

      const label = PERIODS.find((item) => item.value === activePeriod)?.label || activePeriod;
      const date = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
      pdf.save(`dashboard-next-level-${label.toLowerCase()}-${date}.pdf`);
      addToast("Relatorio visual exportado com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao exportar relatório."), "error");
    } finally {
      setIsExporting(false);
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
      return { text: item?.status === "not_enough_data" ? "Dados insuficientes" : "Sem dados", type: "flat" as const };
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
    <div ref={dashboardExportRef} className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#B6FF00] mb-2 px-0.5">Painel Executivo</p>
          <h1 className="text-4xl font-black tracking-tighter text-white leading-tight">Painel de Controle</h1>
          <p className="mt-2 text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Visão estratégica consolidada. Gerencie vendas, analise o lucro real e acompanhe as recomendações da inteligência operacional.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/settings#dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-zinc-300 transition-all hover:bg-white/5 active:scale-[0.98]"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Personalizar</span>
          </Link>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-zinc-300 transition-all hover:bg-white/5 disabled:opacity-50 active:scale-[0.98]"
          >
            <BarChartIcon className="h-4 w-4" />
            <span>{isExporting ? "Gerando PDF..." : "Exportar relatório"}</span>
          </button>
          <button
            onClick={() => void loadMetrics()}
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#B6FF00] text-sm font-black text-[#050706] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <ActivityIcon className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
            <span>{isUpdating ? "Sincronizando..." : "Sincronizar"}</span>
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-6 p-1 bg-[#111613] rounded-2xl border border-white/[0.06] w-fit">
        {PERIODS.map((period) => (
          <button
            key={period.value}
            onClick={() => setActivePeriod(period.value)}
            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activePeriod === period.value
                ? "bg-[#B6FF00] text-[#050706] shadow-lg shadow-lime-300/10"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {isCompanyReady && !selectedCompanyId ? (
        <div className="card-base nl-card-empty border-dashed p-8 text-center flex flex-col items-center">
          <h2 className="text-2xl font-black tracking-tighter text-zinc-100">Selecione uma empresa</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400">
            O dashboard carrega quando uma empresa ativa estiver definida para esta sessão.
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
        <div className="card-base nl-card-empty border-dashed border-[#B6FF00]/30 bg-lime-400/5 p-8 text-center flex flex-col items-center">
          <h2 className="text-2xl font-black tracking-tighter text-zinc-100">Painel sem widgets ativos</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-400">
            Escolha os indicadores que fazem sentido para esta empresa e salve uma visão mais limpa.
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
              value={metric("revenue")?.formatted || "NEXT LEVEL"}
              change={metricChange(metric("revenue")).text}
              changeType={metricChange(metric("revenue")).type}
              icon={DollarSignIcon}
              color="text-lime-400"
              status={metric("revenue")?.status}
              reason={metric("revenue")?.reason}
              sourceLabel={metric("revenue")?.sourceLabel}
              highlighted
            />
          ) : null}
          {isMetricEnabled("losses") ? (
            <KpiCard
              title="Perdas"
              value={metric("losses")?.formatted || "NEXT LEVEL"}
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
              title={isMetricEnabled("net_profit") ? "Lucro líquido" : "Lucro"}
              value={(metric("net_profit") || metric("profit"))?.formatted || "NEXT LEVEL"}
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
              title="Fluxo de caixa"
              value={metric("cash_flow")?.formatted || "NEXT LEVEL"}
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
              value={metric("company_count")?.formatted || "NEXT LEVEL"}
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

      {selectedCompanyId ? (
        <AiDashboardPanel data={aiDashboard} loading={isAiDashboardLoading} />
      ) : null}

      {isMetricEnabled("alerts_insights") ? (
        <div className="card-base flex flex-col items-start gap-6 p-7 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="rounded-xl bg-[#B6FF00]/10 p-2 text-[#B6FF00]">
                <LightbulbIcon className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-white md:text-3xl">Insights Estratégicos</h3>
              {strategicInsightError ? (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-300">
                  Fallback Ativo
                </span>
              ) : null}
            </div>
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-zinc-300 md:text-base">
              {formattedInsight || "Ainda não há volume suficiente para um diagnóstico automático robusto. Analisando dados..."}
            </p>
          </div>
          <Link
            to="/insights"
            className="rounded-xl border border-white/10 bg-white/5 px-8 py-3 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-white/10"
          >
            Relatório Completo
          </Link>
        </div>
      ) : null}

      {visibleGrowthMetrics.length > 0 ? (
      <section aria-label="Métricas de crescimento" className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Métricas Avançadas</p>
            <h2 className="mt-1 text-2xl font-black tracking-tighter text-white md:text-3xl"> Performance de Negócio </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500">
            <ActivityIcon className="h-3 w-3" />
            Em Tempo Real
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

      {(isMetricEnabled("cash_flow_summary") || isMetricEnabled("category_mix")) && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {isMetricEnabled("cash_flow_summary") && (
            <div className="card-base xl:col-span-2 p-6 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white leading-none">Fluxo por Faixa</h3>
                  <p className="text-xs text-zinc-500 mt-1">Análise temporal de receitas e saídas</p>
                </div>
              </div>
              <div className="h-[320px] w-full">
                {hasChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#52525b"
                        fontSize={10}
                        fontWeight="700"
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        stroke="#52525b"
                        fontSize={10}
                        fontWeight="700"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `R$${v/1000}k`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="Saidas" stroke="#EF4444" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="Receitas" stroke="#B6FF00" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full grid place-items-center text-zinc-600 text-sm italic">Aguardando dados...</div>
                )}
              </div>
            </div>
          )}

          {isMetricEnabled("category_mix") && (
            <div className="card-base p-6 flex flex-col">
              <h3 className="text-xl font-black tracking-tight text-white mb-6">Mix de Pedidos</h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                {hasChartData ? (
                  <>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={85}
                            paddingAngle={5} dataKey="value" stroke="none"
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full mt-6 grid grid-cols-2 gap-3">
                      {pieData.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="text-[10px] font-bold text-zinc-400 truncate uppercase">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full grid place-items-center text-zinc-600 text-sm italic">Aguardando dados...</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isMetricEnabled("revenue_forecast") && (
        <div className="card-base p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
             <ActivityIcon className="h-40 w-40" />
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div className="max-w-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#38bdf8] mb-1">Visão Preditiva</p>
              <h3 className="text-2xl font-black tracking-tighter text-white md:text-3xl">Projeção Inteligente</h3>
              <p className="text-sm text-zinc-500 mt-2">Simulação baseada em registros históricos. Previsão de faturamento bruto para o curto prazo.</p>
            </div>
            <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
              {FORECAST_HORIZONS.map((value) => (
                <button
                  key={value}
                  onClick={() => handleHorizonChange(value)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    forecastHorizon === value
                      ? "bg-white/10 text-white shadow-inner"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {value} Dias
                </button>
              ))}
            </div>
          </div>

          <div className="h-[320px] w-full">
            {isForecastLoading ? (
              <div className="h-full grid place-items-center font-black text-lime-400 tracking-widest animate-pulse transition">SINCRONIZANDO...</div>
            ) : hasForecast ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={10} fontWeight="700" axisLine={false} tickLine={false} tickFormatter={formatDateLabel} />
                  <YAxis stroke="#52525b" fontSize={10} fontWeight="700" axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => asCurrency(v)} labelFormatter={(l: any) => formatDateLabel(l)} />
                  <Line type="monotone" dataKey="Real" stroke="#B6FF00" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Forecast" stroke="#38bdf8" strokeWidth={3} dot={false} strokeDasharray="6 6" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="h-full grid place-items-center text-zinc-600 text-sm italic">{forecastStatusMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
