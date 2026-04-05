import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useToast } from "../components/Toast";
import { LoadingState } from "../components/AsyncState";
import { useAuth } from "../App";
import { useStrategicInsights, type StrategicInsightCard } from "../src/hooks/useStrategicInsights";

const InsightCard: React.FC<StrategicInsightCard> = ({ title, description, category, color }) => {
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
    <div className={`rounded-2xl border p-4 ${colorClasses[color]}`}>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textColors[color]}`}>
        {category}
      </span>
      <h3 className="mt-1 text-base font-black tracking-tight text-zinc-100 md:text-lg">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm leading-5 text-zinc-300">
        <li className="ml-4 list-disc">{description}</li>
      </ul>
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
  const {
    cards,
    loading,
    refreshing,
    error,
    source,
    reload,
  } = useStrategicInsights({
    companyId: selectedCompanyId,
    detailLevel,
    enabled: Boolean(selectedCompanyId),
  });

  const handleGenerateInsights = async () => {
    if (refreshing || loading) return;
    const result = await reload({ forceFresh: true });
    if (!result) return;

    if (result.source === "ai") {
      addToast("Insights atualizados com IA.", "success");
      return;
    }

    if (result.source === "cache") {
      addToast("Cache recente reutilizado para evitar novas chamadas de IA.", "info");
      return;
    }

    addToast("Insights atualizados com dados analiticos. A IA segue protegida por cache/retry.", "info");
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-100 md:text-4xl">Insights</h1>
          <p className="mt-2 text-sm text-zinc-400 md:text-base">Analise orientada por dados e monitoramento competitivo.</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] ${
              error
                ? "bg-amber-500/10 text-amber-300"
                : source === "cache"
                  ? "bg-blue-500/10 text-blue-300"
                  : "bg-lime-400/15 text-lime-400"
            }`}
          >
            {error ? "IA em retry/fallback" : source === "cache" ? "Cache ativo" : "IA ativa"}
          </span>
          <button
            type="button"
            onClick={handleGenerateInsights}
            disabled={refreshing || loading}
            className="rounded-2xl bg-lime-400 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Gerando..." : "Gerar Insights"}
          </button>
        </div>
      </header>

      {loading ? <LoadingState label="Carregando insights..." /> : null}

      {error ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
          <span className="font-bold">Erro da IA: </span>{error}
          {source === "cache" ? " (exibindo cache recente)" : ""}
        </div>
      ) : null}

      {cards.length ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {cards.map((insight) => (
            <InsightCard key={`${insight.title}-${insight.category}-${insight.description}`} {...insight} />
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
