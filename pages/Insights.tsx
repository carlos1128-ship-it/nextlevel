import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AxiosError } from "axios";
import { api } from "../services/api";
import { getErrorMessage } from "../src/services/error";
import { useToast } from "../components/Toast";
import { LoadingState } from "../components/AsyncState";
import { useAuth } from "../App";
import { analyzeData, getDashboardSummary, getFinancialReport } from "../src/services/endpoints";

interface InsightCardProps {
  title: string;
  description: string;
  category: string;
  color: "green" | "blue" | "purple" | "red";
}

function inferCategory(content: string): string {
  const text = content.toLowerCase();
  if (text.includes("risco") || text.includes("ameaca")) return "Risco";
  if (text.includes("oportunidade")) return "Oportunidade";
  if (text.includes("recomend")) return "Recomendacao";
  if (text.includes("padrao") || text.includes("tendencia")) return "Padrao";
  return "Sugestao da IA";
}

function inferColor(category: string): InsightCardProps["color"] {
  if (category === "Risco") return "red";
  if (category === "Oportunidade") return "green";
  if (category === "Recomendacao") return "purple";
  return "blue";
}

function compactText(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= 280) return clean;
  return `${clean.slice(0, 280)}...`;
}

function sanitizeInsight(value: string): string {
  let text = value || "";
  text = text.replace(/\*\*/g, "");
  const dadosIdx = text.toLowerCase().indexOf("dados:");
  if (dadosIdx >= 0) {
    text = text.slice(0, dadosIdx).trim();
  }
  text = text.replace(/\n{2,}/g, "\n");
  return text.trim();
}

function getAiErrorDetails(error: unknown) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as { message?: string; error?: string; detail?: string } | string | undefined;
    return {
      status: error.response?.status,
      message:
        typeof payload === "string"
          ? payload
          : payload?.message || payload?.error || payload?.detail || error.message,
    };
  }

  return {
    status: undefined,
    message: error instanceof Error ? error.message : "Erro desconhecido ao gerar insights.",
  };
}

const InsightCard: React.FC<InsightCardProps> = ({ title, description, category, color }) => {
  const colorClasses = {
    green: "border-green-500/40 bg-green-500/5",
    blue: "border-blue-500/40 bg-blue-500/5",
    purple: "border-purple-500/40 bg-purple-500/5",
    red: "border-red-500/40 bg-red-500/5",
  };

  const textColors = {
    green: "text-green-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    red: "text-red-400",
  };

  return (
    <div className={`rounded-2xl border p-5 ${colorClasses[color]}`}>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textColors[color]}`}>
        {category}
      </span>
      <h3 className="mt-2 text-lg font-black tracking-tight text-zinc-100 md:text-xl">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300">{description}</p>
    </div>
  );
};

const benchmarkData = [
  { name: "E-commerce", total: 18 },
  { name: "Industria", total: 7 },
  { name: "Servicos", total: 12 },
  { name: "Tecnologia", total: 25 },
];

const Insights = () => {
  const { addToast } = useToast();
  const { selectedCompanyId, detailLevel } = useAuth();
  const [historyInsights, setHistoryInsights] = useState<InsightCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingAi, setRefreshingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const isOfflineInsight = (text: string) =>
    text.toLowerCase().includes("modo offline") || text.toLowerCase().includes("heuristica");

  const generateFreshAiInsight = async (): Promise<InsightCardProps[]> => {
    if (!selectedCompanyId) return [];

    const [summary, financialReport] = await Promise.all([
      getDashboardSummary({ companyId: selectedCompanyId }),
      getFinancialReport(selectedCompanyId),
    ]);

    const response = await analyzeData(
      {
        companyId: selectedCompanyId,
        summary,
        financialData: {
          income: financialReport?.income || 0,
          expenses: financialReport?.expense || 0,
          balance: financialReport?.balance || 0,
        },
        goals: [],
      },
      detailLevel
    );

    const text =
      typeof response === "string"
        ? response
        : response.analysis || response.insight || response.message || JSON.stringify(response);

    const cleaned = compactText(sanitizeInsight(text));
    if (!cleaned) return [];

    const chunks = cleaned
      .split(/\n+/)
      .map((item) => item.replace(/^[-*•]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 4);

    return (chunks.length ? chunks : [cleaned]).map((item, index) => {
      const category = inferCategory(item);
      return {
        title: chunks.length > 1 ? `Insight Estrategico ${index + 1}` : "Insight da IA",
        description: compactText(item),
        category,
        color: inferColor(category),
      };
    });
  };

  const loadInsights = async (forceFreshAi = false) => {
    try {
      setLoading(true);
      setAiError(null);

      const aiHistory = forceFreshAi
        ? []
        : await api
            .get("/ai/history")
            .then((res) => (Array.isArray(res.data) ? res.data : []))
            .catch(() => []);

      const normalizedAi = aiHistory
        .map((item: any) => {
          const baseDescription = sanitizeInsight(String(item?.description ?? item?.content ?? ""));
          if (!baseDescription) return null;
          const category = item?.category || inferCategory(baseDescription);
          return {
            title: item?.title || "Insight da IA",
            description: compactText(baseDescription),
            category,
            color: inferColor(category),
          } as InsightCardProps;
        })
        .filter(Boolean) as InsightCardProps[];

      if (normalizedAi.length && normalizedAi.some((item) => !isOfflineInsight(item.description))) {
        setHistoryInsights(normalizedAi.slice(0, 4));
        return;
      }

      try {
        const freshAi = await generateFreshAiInsight();
        if (freshAi.length) {
          setHistoryInsights(freshAi);
          return;
        }
      } catch (error) {
        const details = getAiErrorDetails(error);
        const message = `Falha ao gerar insights com IA${details.status ? ` (${details.status})` : ""}: ${details.message}`;
        console.error("Strategic insights AI request failed", {
          status: details.status,
          message: details.message,
          companyId: selectedCompanyId,
          detailLevel,
        });
        setAiError(message);
      }

      const { data } = await api.get("/insights", {
        params: { companyId: selectedCompanyId || undefined },
      });

      const parsed = Array.isArray(data)
        ? data
            .map((item: any) => {
              const baseDescription = sanitizeInsight(String(item?.description ?? ""));
              if (!baseDescription) return null;
              const description =
                item?.value != null ? `${baseDescription} • ${item.value}` : baseDescription;
              const category =
                item?.type === "metric"
                  ? "Metrica"
                  : item?.type === "peak"
                    ? "Pico"
                    : item?.type === "product"
                      ? "Produto"
                      : item?.type === "growth"
                        ? "Crescimento"
                        : item?.type === "alert"
                          ? "Alerta"
                          : item?.type === "info"
                            ? "Info"
                            : inferCategory(baseDescription);

              const colorMap: Record<string, InsightCardProps["color"]> = {
                Metrica: "blue",
                Pico: "purple",
                Produto: "green",
                Crescimento: "green",
                Alerta: "red",
                Info: "blue",
              };

              return {
                title: item?.title ?? "Insight da IA",
                description: compactText(description),
                category,
                color: colorMap[category] || inferColor(category),
              };
            })
            .filter(Boolean) as InsightCardProps[]
        : [];

      setHistoryInsights(parsed);
    } catch (error) {
      setHistoryInsights([]);
      addToast(getErrorMessage(error, "Nao foi possivel carregar os insights."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInsights();
  }, [selectedCompanyId, detailLevel]);

  const cards = useMemo(() => historyInsights.slice(0, 4), [historyInsights]);

  const handleGenerateInsights = async () => {
    try {
      setRefreshingAi(true);
      await loadInsights(true);
      addToast("Insights atualizados.", "success");
    } finally {
      setRefreshingAi(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-100 md:text-4xl">Insights</h1>
          <p className="mt-2 text-sm text-zinc-400 md:text-base">Analise orientada por dados e monitoramento competitivo.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${aiError ? "bg-red-500/10 text-red-400" : "bg-lime-400/15 text-lime-400"}`}>
            {aiError ? "IA com erro" : "IA ativa"}
          </span>
          <button
            type="button"
            onClick={handleGenerateInsights}
            disabled={refreshingAi || loading}
            className="rounded-2xl bg-lime-400 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-900 transition hover:opacity-90 disabled:opacity-50"
          >
            {refreshingAi ? "Gerando..." : "Gerar Insights"}
          </button>
        </div>
      </header>

      {loading ? <LoadingState label="Carregando insights..." /> : null}

      {aiError ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-200">
          {aiError}
        </div>
      ) : null}

      {cards.length ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {cards.map((insight) => (
            <InsightCard key={`${insight.title}-${insight.category}`} {...insight} />
          ))}
        </div>
      ) : !loading ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-400">
          Nenhum insight dinamico foi retornado no momento. Gere novamente apos revisar a conectividade da IA e os dados financeiros da empresa.
        </div>
      ) : null}

      <div className="rounded-3xl border border-zinc-900 bg-zinc-950 p-8">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">Benchmark por Setor (30 dias)</h3>
          <span className="rounded-xl bg-lime-400/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-lime-400">
            Analise Global
          </span>
        </div>
        <div className="h-[360px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={260}>
            <BarChart layout="vertical" data={benchmarkData} margin={{ left: 20, right: 25 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#1f2937" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#52525b" />
              <YAxis type="category" dataKey="name" stroke="#a1a1aa" width={110} />
              <Tooltip />
              <Bar dataKey="total" fill="#B6FF00" radius={[6, 6, 6, 6]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-600">
          Os dados acima sao baseados em tendencias agregadas do ecossistema Next Level.
        </p>
      </div>
    </div>
  );
};

export default Insights;
