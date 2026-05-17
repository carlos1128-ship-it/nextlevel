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
  competitivo: { label: "Competitivo", tone: "text-[#B6FF00] bg-[#B6FF00]/10 border-[#B6FF00]/25" },
  acima: { label: "Acima do Mercado", tone: "text-amber-200 bg-amber-300/10 border-amber-300/25" },
  sem_dados: { label: "Sem dados", tone: "text-[#AEB8B4] bg-[#090C09] border-[#B6FF00]/15" },
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
  const avgGapLabel = `${stats.avgGap.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

  return (
    <div className="mx-auto max-w-[1360px] space-y-8">
      <header className="rounded-[24px] border border-[#B6FF00]/20 bg-[#080A08] p-8 text-[#F5F7F2] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-[#c2caad]">
              Marketing e inteligência de mercado
            </p>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-[#B6FF00]">Marketing</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#B7C0BA]">
              Monitore preços, encontre oportunidades e entenda quando seus produtos precisam de mais dados de mercado.
            </p>
            {lastRun ? (
              <p className="mt-3 text-xs text-[#6F7A72]">
                Última coleta: {new Date(lastRun).toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTrack}
              className="inline-flex items-center gap-2 rounded-xl border border-[#B6FF00]/25 bg-[#B6FF00]/10 px-4 py-2 text-sm font-bold text-[#DFFF8A] transition hover:border-[#B6FF00]/55 hover:bg-[#B6FF00]/15"
              disabled={refreshing}
            >
              <RadarIcon className="h-5 w-5" />
              {refreshing ? "Analisando..." : "Analisar produtos"}
            </button>
            <button
              type="button"
              onClick={handleRefreshTrends}
              className="inline-flex items-center gap-2 rounded-xl border border-[#B6FF00]/20 bg-[#090C09] px-4 py-2 text-sm font-bold text-[#F5F7F2] transition hover:border-[#B6FF00]/55 hover:text-[#B6FF00]"
              disabled={refreshing}
            >
              <LightbulbIcon className="h-5 w-5" />
              Atualizar sinais
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Produtos Competitivos"
          value={`${stats.competitive}/${comparisons.length || 0}`}
          helper="Com preço na faixa ou abaixo da média de mercado"
          icon={<BarChartIcon className="h-5 w-5" />}
        />
        <MetricCard
          title="Acima do Mercado"
          value={`${stats.above}`}
          helper="Itens com gap > 15% vs preço médio externo"
          icon={<ArrowUpRightIcon className="h-5 w-5" />}
        />
        <MetricCard
          title="Gap Médio"
          value={avgGapLabel}
          helper="Delta médio entre preço interno e média dos concorrentes"
          icon={<ArrowDownRightIcon className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Comparação de preços</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-[#6F7A72]">
              Empresa vs Mercado
            </span>
          </div>
          <div className="grid gap-3">
            {loading && !comparisons.length ? (
              <div className="grid min-h-[190px] place-items-center rounded-[20px] border border-[#B6FF00]/15 bg-[#080A08] p-6">
                <span className="text-sm font-black uppercase tracking-[0.24em] text-[#B6FF00]">Analisando mercado...</span>
              </div>
            ) : null}
            {!loading && !comparisons.length ? (
              <div className="min-h-[190px] rounded-[20px] border border-[#B6FF00]/15 bg-[#080A08] p-6 text-sm text-[#AEB8B4]">
                <p className="text-base font-bold text-[#F5F7F2]">Aguardando análise de produtos</p>
                <p className="mt-2 max-w-xl leading-6">Analise seus produtos para comparar preço interno, média de mercado e oportunidades de ajuste.</p>
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
                  className="rounded-[20px] border border-[#B6FF00]/15 bg-[#080A08] p-4 transition hover:border-[#B6FF00]/40 hover:bg-[#0D100D]"
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
                    <div className="relative h-3 rounded-full bg-[#121512]">
                      <div
                        className={`absolute left-0 top-0 h-3 rounded-full ${
                          item.badge === "acima" ? "bg-amber-300/80" : "bg-[#B6FF00]"
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
            <span className="text-xs text-[#6F7A72]">Última semana</span>
          </div>
          <div className="rounded-[20px] border border-[#B6FF00]/15 bg-[#080A08] p-5">
            {trends.length === 0 ? (
              <div className="text-sm text-[#AEB8B4]">
                <p className="font-bold text-[#F5F7F2]">Nenhum sinal externo confirmado no período.</p>
                <p className="mt-2 leading-6">Atualize os sinais para buscar novas oportunidades de mercado.</p>
              </div>
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
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-[20px] border border-[#B6FF00]/15 bg-[#080A08] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B6FF00]/45 hover:bg-[#0D100D]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c2caad]">{title}</p>
        <p className="mt-3 text-3xl font-black text-[#F5F7F2]">{value}</p>
        <p className="mt-2 text-xs leading-5 text-[#AEB8B4]">{helper}</p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#B6FF00]/15 bg-[#11170F] text-[#B6FF00]">
        {icon}
      </div>
    </div>
  </div>
);

export default MarketIntel;
