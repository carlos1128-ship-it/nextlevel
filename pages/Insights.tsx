import React from "react";
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
    <div className={`rounded-2xl border p-5 md:p-6 ${colorClasses[color]}`}>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${textColors[color]}`}>
        {category}
      </span>
      <h3 className="mt-2 text-lg font-black tracking-tight text-zinc-100 md:text-xl">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-300">{description}</p>
    </div>
  );
};

const Insights = () => {
  const { addToast } = useToast();
  const { selectedCompanyId, detailLevel } = useAuth();
  const { cards, loading, refreshing, error, source, reload } = useStrategicInsights({
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

    addToast("Insights atualizados com dados analiticos.", "info");
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-100 md:text-4xl">Insights</h1>
          <p className="mt-2 text-sm text-zinc-400 md:text-base">
            Analises praticas geradas a partir dos dados reais da empresa.
          </p>
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
            {refreshing ? "Gerando..." : "Gerar insights"}
          </button>
        </div>
      </header>

      {loading ? <LoadingState label="Carregando insights..." /> : null}

      {error ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">
          <span className="font-bold">IA em modo seguro: </span>
          {error}
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
          Nenhum insight dinamico foi retornado ainda. Conecte dados, importe vendas ou gere novamente depois de atualizar o financeiro.
        </div>
      ) : null}
    </div>
  );
};

export default Insights;
