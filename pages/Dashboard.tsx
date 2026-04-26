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
  getDashboardSummary,
  getForecast,
  getAttendantRoi,
  getTransactions,
} from "../src/services/endpoints";
import { useStrategicInsights } from "../src/hooks/useStrategicInsights";
import type { DashboardPeriod, DashboardSummary, ForecastResponse, AttendantRoi, TransactionItem } from "../src/types/domain";
import { getTransactionDateValue } from "../src/utils/datetime";

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
  { label: "Semana", value: "week" },
  { label: "Mes", value: "month" },
  { label: "Ano", value: "year" },
];
const FORECAST_HORIZONS: Array<7 | 15 | 30> = [7, 15, 30];

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

const isSameCalendarDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const isTransactionInPeriod = (value: string | undefined, period: DashboardPeriod) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (period === "today") return isSameCalendarDay(target, today);
  if (period === "yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return isSameCalendarDay(target, yesterday);
  }
  if (period === "week") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    return target >= weekStart && target <= today;
  }
  if (period === "month") {
    return target.getFullYear() === today.getFullYear() && target.getMonth() === today.getMonth();
  }
  return target.getFullYear() === today.getFullYear();
};

const buildLineDataFromTransactions = (transactions: TransactionItem[], period: DashboardPeriod) => {
  const grouped = new Map<string, { name: string; Receitas: number; Saidas: number }>();

  transactions.forEach((tx, index) => {
    const txDate = new Date(getTransactionDateValue(tx));
    if (Number.isNaN(txDate.getTime())) return;

    let key = "";
    if (period === "today" || period === "yesterday") {
      key = `${String(txDate.getHours()).padStart(2, "0")}:00`;
    } else if (period === "year") {
      key = txDate.toLocaleDateString("pt-BR", { month: "short" });
    } else {
      key = txDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }

    if (!grouped.has(key)) {
      grouped.set(key, { name: key || `Ponto ${index + 1}`, Receitas: 0, Saidas: 0 });
    }

    const row = grouped.get(key);
    if (!row) return;
    if (tx.type === "income") row.Receitas += Number(tx.amount || 0);
    if (tx.type === "expense") row.Saidas += Number(tx.amount || 0);
  });

  return Array.from(grouped.values());
};

const buildSummaryFromTransactions = (
  transactions: TransactionItem[],
  period: DashboardPeriod,
  currentSummary: DashboardSummary
): DashboardSummary => {
  const filtered = transactions.filter((tx) => isTransactionInPeriod(getTransactionDateValue(tx), period));
  const revenue = filtered
    .filter((tx) => tx.type === "income")
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  const losses = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  const profit = revenue - losses;

  return {
    ...currentSummary,
    revenue,
    losses,
    profit,
    cashflow: profit,
    period,
    lineData: buildLineDataFromTransactions(filtered, period),
    pieData:
      revenue > 0 || losses > 0
        ? [
            { name: "RECEITA", value: revenue },
            { name: "SAIDAS", value: losses },
          ]
        : [],
  };
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
  KpiCardProps & { iconAccent?: string }
> = ({ title, value, change, changeType, icon: Icon, color, iconAccent }) => {
  return (
    <div className="flex min-w-[260px] flex-col rounded-3xl border border-zinc-800/90 bg-zinc-950 p-6 transition-all duration-300 hover:border-lime-400/40">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
          {title}
        </span>
        <div className="rounded-xl border border-zinc-800 bg-black/60 p-2">
          <Icon className={`h-5 w-5 ${iconAccent || color}`} />
        </div>
      </div>
      <p className="text-[clamp(22px,2.4vw,32px)] md:text-[clamp(24px,2.2vw,36px)] font-black leading-none tracking-tighter text-zinc-100 whitespace-normal break-words">
        {value}
      </p>
      <div
        className={`mt-2 flex items-center text-[11px] font-black ${
          changeType === "increase" ? "text-lime-400" : "text-red-500"
        }`}
      >
        {changeType === "increase" ? (
          <ArrowUpRightIcon className="mr-1 h-3.5 w-3.5" />
        ) : (
          <ArrowDownRightIcon className="mr-1 h-3.5 w-3.5" />
        )}
        {change} <span className="ml-1 font-medium text-zinc-500">no periodo selecionado</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Growth Metrics — placeholder cards
   Keys are stable for future backend integration.
   Replace placeholder values with real API data when available:
   { ltv, averageTicket, cpc, cpa, conversionRate, cac }
───────────────────────────────────────────────────────────── */
const GROWTH_METRICS: Array<{
  key: "ltv" | "averageTicket" | "cpc" | "cpa" | "conversionRate" | "cac";
  title: string;
  description: string;
  placeholder: string;
  accentColor: string;
}> = [
  {
    key: "ltv",
    title: "LTV",
    description: "Valor médio estimado que um cliente gera ao longo do relacionamento.",
    placeholder: "Aguardando histórico",
    accentColor: "text-lime-400",
  },
  {
    key: "averageTicket",
    title: "Ticket Médio",
    description: "Valor médio por venda no período selecionado.",
    placeholder: "Dados insuficientes",
    accentColor: "text-cyan-400",
  },
  {
    key: "cpc",
    title: "CPC",
    description: "Custo médio por clique nas campanhas conectadas.",
    placeholder: "Aguardando campanhas",
    accentColor: "text-purple-400",
  },
  {
    key: "cpa",
    title: "CPA",
    description: "Custo médio para adquirir uma ação ou conversão.",
    placeholder: "Aguardando integrações",
    accentColor: "text-amber-400",
  },
  {
    key: "conversionRate",
    title: "Taxa de Conversão",
    description: "Percentual de visitantes ou leads que viraram venda.",
    placeholder: "Em breve",
    accentColor: "text-blue-400",
  },
  {
    key: "cac",
    title: "CAC",
    description: "Custo médio para adquirir um novo cliente.",
    placeholder: "Conecte campanhas",
    accentColor: "text-rose-400",
  },
];

const GrowthMetricCard: React.FC<{
  title: string;
  description: string;
  placeholder: string;
  accentColor: string;
}> = ({ title, description, placeholder, accentColor }) => (
  <div className="flex flex-col rounded-3xl border border-zinc-800/90 bg-zinc-950 p-5 transition-all duration-300 hover:border-lime-400/25">
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">{title}</span>
      <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600">
        Em config.
      </span>
    </div>
    <p className={`mt-4 text-2xl font-black tracking-tight ${accentColor}`}>{placeholder}</p>
    <p className="mt-2 text-[11px] leading-5 text-zinc-500">{description}</p>
  </div>
);

const Dashboard = () => {
  const { username, detailLevel, selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activePeriod, setActivePeriod] = useState<DashboardPeriod>("today");
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [forecastHorizon, setForecastHorizon] = useState<7 | 15 | 30>(30);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [attendantRoi, setAttendantRoi] = useState<AttendantRoi>({ iaSalesCount: 0, iaRevenue: 0 });
  const shouldLoadStrategicInsights = selectedCompanyId !== null && hasUsefulSummaryData(summary);
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
    if (!summary.lineData.length) {
      return [
        { name: "00:00", Receitas: 0, Saidas: 0 },
        { name: "04:00", Receitas: 0, Saidas: 0 },
        { name: "08:00", Receitas: 0, Saidas: 0 },
        { name: "12:00", Receitas: 0, Saidas: 0 },
        { name: "16:00", Receitas: 0, Saidas: 0 },
        { name: "20:00", Receitas: 0, Saidas: 0 },
      ];
    }
    return summary.lineData.map((item) => ({
      name: item.name,
      Receitas: Number(item.Receitas || 0),
      Saidas: Number(item.Saidas || 0),
    }));
  }, [summary.lineData]);

  const pieData = useMemo(() => {
    if (!summary.pieData.length) {
      return [
        { name: "RECEITA", value: 1 },
      ];
    }
    return summary.pieData;
  }, [summary.pieData]);

  const hasChartData = summary.lineData.length > 0 || summary.pieData.length > 0;

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
    if (!forecast) return "Carregando previsões...";
    if (forecast.status === "insufficient_data") {
      return forecast.message || "Dados insuficientes para gerar previsão.";
    }
    if (
      forecast.confidenceInterval &&
      typeof forecast.confidenceInterval.margin === "number" &&
      typeof forecast.confidenceInterval.lower === "number" &&
      typeof forecast.confidenceInterval.upper === "number"
    ) {
      return `Margem estimada ±${forecast.confidenceInterval.margin.toFixed(2)} | Confiança entre ${forecast.confidenceInterval.lower.toFixed(2)} e ${forecast.confidenceInterval.upper.toFixed(2)}`;
    }
    return "Previsão pronta";
  }, [forecast]);

  const loadSummary = async () => {
    setIsUpdating(true);
    try {
      const data = await getDashboardSummary({
        companyId: selectedCompanyId,
        period: activePeriod,
      });
      const normalized: DashboardSummary = {
        ...EMPTY_SUMMARY,
        ...data,
        period: data?.period || activePeriod,
        lineData: Array.isArray(data?.lineData) ? data.lineData : [],
        pieData: Array.isArray(data?.pieData) ? data.pieData : [],
      };
      setSummary(normalized);
    } catch (error) {
      setSummary(EMPTY_SUMMARY);
      addToast(getErrorMessage(error, "Nao foi possivel carregar o dashboard."), "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const loadForecast = async (horizonOverride?: 7 | 15 | 30) => {
    if (!selectedCompanyId) {
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

  const refreshSummaryFromTransactions = async () => {
    if (!selectedCompanyId) {
      setSummary(EMPTY_SUMMARY);
      return;
    }

    try {
      const transactions = await getTransactions(selectedCompanyId);
      setSummary((current) => buildSummaryFromTransactions(transactions, activePeriod, current));
    } catch {
      // Keep the last rendered dashboard state and let the canonical summary request reconcile.
    }
  };

  useEffect(() => {
    void loadSummary();
  }, [detailLevel, selectedCompanyId, activePeriod]);

  useEffect(() => {
    void loadForecast(forecastHorizon);
  }, [selectedCompanyId]);

  useEffect(() => {
    const onTransactionsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<TransactionsUpdatedDetail>).detail;
      if (detail?.companyId && selectedCompanyId && detail.companyId !== selectedCompanyId) {
        return;
      }

      void refreshSummaryFromTransactions();
      void loadSummary();
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
      if (!selectedCompanyId) {
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
    void loadRoi();
  }, [selectedCompanyId]);

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
          <button
            onClick={handleExport}
            className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950 px-7 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-100 transition hover:bg-zinc-900 md:flex-none"
          >
            Exportar Dados
          </button>
          <button
            onClick={() => void loadSummary()}
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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-6">
        <KpiCard
          title="Faturamento"
          value={asCurrency(summary.revenue)}
          change="Entradas consolidadas"
          changeType="increase"
          icon={DollarSignIcon}
          color="text-lime-400"
        />
        <KpiCard
          title="Perdas"
          value={asCurrency(summary.losses)}
          change="Saidas e custos"
          changeType="decrease"
          icon={DollarSignIcon}
          color="text-red-500"
        />
        <KpiCard
          title="Lucro"
          value={asCurrency(summary.profit)}
          change={summary.profit >= 0 ? "Margem positiva" : "Margem pressionada"}
          changeType={marginDirection}
          icon={BarChartIcon}
          color="text-blue-400"
        />
        <KpiCard
          title="Fluxo de Caixa"
          value={asCurrency(summary.cashflow)}
          change={summary.cashflow >= 0 ? "Caixa saudavel" : "Caixa negativo"}
          changeType={summary.cashflow >= 0 ? "increase" : "decrease"}
          icon={BarChartIcon}
          color="text-purple-400"
        />
        <KpiCard
          title="Empresas"
          value={String(summary.companyCount || 0)}
          change="Base vinculada"
          changeType="increase"
          icon={BuildingIcon}
          color="text-amber-400"
        />
        <KpiCard
          title="ROI da IA"
          value={`${attendantRoi.iaSalesCount} vendas`}
          change={`Gerado pela IA: ${asCurrency(attendantRoi.iaRevenue)}`}
          changeType="increase"
          icon={MessageSquareIcon}
          color="text-cyan-400"
          iconAccent="text-cyan-300"
        />
      </div>

      {/* ── Métricas de Crescimento (placeholders — prontos para backend) ── */}
      <section aria-label="Métricas de Crescimento">
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
          {GROWTH_METRICS.map((metric) => (
            <GrowthMetricCard
              key={metric.key}
              title={metric.title}
              description={metric.description}
              placeholder={metric.placeholder}
              accentColor={metric.accentColor}
            />
          ))}
        </div>
      </section>

      {!hasChartData ? (
        <div className="grid place-items-center rounded-3xl border border-zinc-900 bg-zinc-950 p-10 text-zinc-500">
          Nenhum dado disponivel ainda para este periodo.
        </div>
      ) : (
        <div className="grid min-h-0 grid-cols-1 gap-5 xl:grid-cols-3">
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
        </div>
      )}

      <div className="rounded-3xl border border-zinc-900 bg-zinc-950 p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Modo Futuro</p>
            <h3 className="text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">
              Previsão de Receita
            </h3>
            <p className="text-sm text-zinc-500">
              Projeção diária para os próximos {forecastHorizon} dias, com margem de confiança.
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
              Calculando previsões...
            </div>
          ) : forecast?.status === "insufficient_data" ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
              {forecastStatusMessage}
            </div>
          ) : !hasForecast ? (
            <div className="grid place-items-center rounded-2xl border border-zinc-800 px-6 py-12 text-zinc-500">
              Forecast indisponível no momento.
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
    </div>
  );
};

export default Dashboard;
