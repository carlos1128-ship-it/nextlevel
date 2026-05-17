import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BarChartIcon,
  LightbulbIcon,
  RadarIcon,
} from "../components/icons";
import { useAuth } from "../App";
import {
  getMarketIntelOverview,
  refreshMarketTrends,
  triggerMarketScan,
} from "../src/services/endpoints";
import type { MarketComparison, MarketTrend } from "../src/types/domain";

const badgeCopy: Record<MarketComparison["badge"], { label: string; tone: string }> = {
  competitivo: { label: "Competitivo", tone: "text-emerald-300 bg-emerald-900/40 border-emerald-500/50" },
  acima: { label: "Acima do Mercado", tone: "text-amber-200 bg-amber-900/40 border-amber-500/50" },
  sem_dados: { label: "Sem dados", tone: "text-zinc-200 bg-zinc-900/50 border-zinc-700" },
};

const MarketIntel = () => {
  const { selectedCompanyId } = useAuth();
  const [comparisons, setComparisons] = useState<MarketComparison[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const loadOverview = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMarketIntelOverview({ companyId: selectedCompanyId });
      setComparisons(data.comparison);
      setTrends(data.trends);
      setLastRun(data.refreshedAt || null);
    } catch (err: any) {
      setError(err?.message || "Falha ao carregar inteligência de mercado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  const handleTrack = async () => {
    if (!selectedCompanyId) return;
    setRefreshing(true);
    try {
      await triggerMarketScan({ companyId: selectedCompanyId });
      await loadOverview();
    } catch (err: any) {
      setError(err?.message || "Não foi possível rastrear agora");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefreshTrends = async () => {
    if (!selectedCompanyId) return;
    setRefreshing(true);
    try {
      await refreshMarketTrends(selectedCompanyId);
      await loadOverview();
    } catch (err: any) {
      setError(err?.message || "Não foi possível atualizar tendências");
    } finally {
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const total = comparisons.length || 1;
    const above = comparisons.filter((c) => c.badge === "acima").length;
    const competitive = comparisons.filter((c) => c.badge === "competitivo").length;
    const avgGap =
      comparisons.reduce((sum, item) => sum + (item.gapPct || 0), 0) / total;
    return { above, competitive, avgGap: Number(avgGap.toFixed(2)) };
  }, [comparisons]);

  return (
    <div className="nl-page space-y-8">
      <header className="nl-card relative overflow-hidden p-8 text-zinc-100">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-300/50 to-transparent" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="nl-eyebrow mb-2">Marketing e inteligência de mercado</p>
            <h1 className="nl-title">Marketing</h1>
            <p className="nl-subtitle">
              Monitore preços, identifique oportunidades e entenda quando seus produtos precisam de mais dados de mercado.
            </p>
            {lastRun ? (
              <p className="mt-2 text-xs text-zinc-500">
                Última coleta: {new Date(lastRun).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTrack}
              className="nl-button-primary inline-flex items-center gap-2"
              disabled={refreshing}
            >
              <RadarIcon className="h-5 w-5" />
              {refreshing ? "Analisando..." : "Analisar produtos"}
            </button>
            <button
              type="button"
              onClick={handleRefreshTrends}
              className="nl-button-secondary inline-flex items-center gap-2"
              disabled={refreshing}
            >
              <LightbulbIcon className="h-5 w-5" />
              Atualizar sinais
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="nl-card border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Produtos Competitivos"
          value={`${stats.competitive}/${comparisons.length || 0}`}
          helper="Com preço na faixa ou abaixo da média de mercado"
          tone="from-emerald-500/40 to-emerald-900/40"
          icon={<BarChartIcon className="h-5 w-5 text-emerald-200" />}
        />
        <MetricCard
          title="Acima do Mercado"
          value={`${stats.above}`}
          helper="Itens com gap > 15% vs preço médio externo"
          tone="from-amber-500/40 to-amber-900/40"
          icon={<ArrowUpRightIcon className="h-5 w-5 text-amber-200" />}
        />
        <MetricCard
          title="Gap Médio"
          value={`${stats.avgGap}%`}
          helper="Delta médio entre preço interno e média dos concorrentes"
          tone="from-cyan-500/40 to-cyan-900/40"
          icon={<ArrowDownRightIcon className="h-5 w-5 text-cyan-200" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Comparação de preços</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Empresa vs Mercado
            </span>
          </div>
          <div className="grid gap-3">
            {loading && !comparisons.length ? (
              <div className="nl-card grid min-h-[160px] place-items-center p-6">
                <span className="text-2xl font-black tracking-[0.24em] text-[#B6FF00]">NEXT LEVEL</span>
              </div>
            ) : null}
            {!loading && !comparisons.length ? (
              <div className="nl-card p-6 text-sm text-zinc-300">
                Dados de mercado ainda não disponíveis. Cadastre produtos, conecte canais ou importe dados para iniciar a análise.
              </div>
            ) : null}

            {comparisons.map((item) => {
              const badge = badgeCopy[item.badge] || badgeCopy.sem_dados;
              const marketAvg = item.marketAverage || 0;
              const gapLabel =
                item.badge === "acima"
                  ? `+${item.gapPct}%`
                  : item.badge === "competitivo"
                  ? `${item.gapPct}%`
                  : "--";

              return (
                <div
                  key={item.productId}
                  className="nl-card nl-card-interactive p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">{item.productName}</p>
                      <p className="text-xs text-zinc-500">Preço interno: R$ {item.internalPrice.toFixed(2)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge.tone}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Média do mercado</span>
                      <span>R$ {marketAvg.toFixed(2)}</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-[#1B211E]">
                      <div
                        className={`absolute left-0 top-0 h-3 rounded-full ${
                          item.badge === "acima" ? "bg-amber-400/80" : "bg-emerald-400/80"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(10, (item.internalPrice / (marketAvg || item.internalPrice || 1)) * 60))}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Gap</span>
                      <span className={item.badge === "acima" ? "text-amber-200" : "text-emerald-200"}>
                        {gapLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Sinais de mercado</h2>
            <span className="text-xs text-zinc-500">Última semana</span>
          </div>
          <div className="nl-card p-5">
            {trends.length === 0 ? (
              <p className="text-sm text-zinc-400">Nenhum sinal externo confirmado ainda. Cadastre produtos e atualize a análise para acompanhar tendências.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {trends.map((trend) => {
                  const weight = Math.min(2.2, 0.9 + trend.growthPercentage / 60);
                  const bg =
                    trend.growthPercentage > 25
                      ? "bg-lime-400/15 border-lime-500/30 text-lime-100"
                      : "bg-cyan-400/10 border-cyan-500/30 text-cyan-100";
                  return (
                    <div
                      key={`${trend.term}-${trend.createdAt}`}
                      className={`rounded-2xl border px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-cyan-500/20 ${bg}`}
                      style={{ fontSize: `${weight}rem` }}
                    >
                      <span className="block font-semibold">{trend.term}</span>
                      <span className="block text-xs opacity-80">
                        Volume {trend.volume} · Cresc. {trend.growthPercentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  helper,
  tone,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  tone: string;
  icon: React.ReactNode;
}) => (
  <div className={`nl-card relative overflow-hidden p-5 ${tone}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="nl-stat-label">{title}</p>
        <p className="nl-stat-value">{value}</p>
        <p className="mt-1 text-xs text-zinc-400">{helper}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/30 shadow-inner">
        {icon}
      </div>
    </div>
  </div>
);

export default MarketIntel;
