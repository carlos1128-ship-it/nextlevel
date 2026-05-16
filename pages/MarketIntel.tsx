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
    <div className="nl-page">
      <div className="nl-page-header border-b border-white/5 pb-10 mb-8 items-start">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow text-blue-400">Inteligência de Sinais Externos</p>
          <h1 className="nl-page-title">Radar de Mercado</h1>
          <p className="nl-page-subtitle">
            Varredura em tempo real dos canais de venda e tendências de busca para otimização de <span className="text-[var(--nl-text-primary)] font-bold italic">Margem vs. Volume</span>.
          </p>
          {lastRun && (
            <div className="mt-4 flex items-center gap-2">
               <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5">
                 <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
                 <span className="text-[9px] uppercase font-black tracking-widest text-[var(--nl-text-muted)]">
                   Ponto de Restauração: {new Date(lastRun).toLocaleString()}
                 </span>
               </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTrack}
            className="nl-button-primary bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:bg-blue-500 flex items-center gap-2 px-6"
            disabled={refreshing}
          >
            <RadarIcon className="h-4 w-4" />
            {refreshing ? "Escaneando..." : "Iniciar Varredura"}
          </button>
          <button
            type="button"
            onClick={handleRefreshTrends}
            className="nl-button-secondary border-blue-500/20 text-blue-400 hover:bg-blue-500/5 flex items-center gap-2"
            disabled={refreshing}
          >
            <LightbulbIcon className="h-4 w-4" />
            Capturar Trends
          </button>
        </div>
      </div>

      {error && (
        <div className="nl-card-elevated border-red-900/30 bg-red-950/20 p-4 text-sm text-red-200 mb-6 font-bold">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Produtos Competitivos"
          value={`${stats.competitive}`}
          suffix={`/ ${comparisons.length || 0}`}
          helper="Preço alinhado ao mercado"
          icon={<BarChartIcon />}
          isNeon
        />
        <MetricCard
          title="Acima do Mercado"
          value={`${stats.above}`}
          helper="Itens com gap significativo"
          icon={<ArrowUpRightIcon />}
          isDanger={stats.above > 0}
        />
        <MetricCard
          title="Gap Médio"
          value={`${stats.avgGap}%`}
          helper="Delta vs concorrentes"
          icon={<ArrowDownRightIcon />}
        />
      </section>

      <section className="grid gap-8 lg:grid-cols-3 mt-12 mb-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)]">
              Relatório de Calibragem de Preços
            </h2>
          </div>

          <div className="grid gap-4">
            {loading && !comparisons.length && (
              <div className="nl-card-glass flex flex-col items-center justify-center py-24 border-dashed border-white/10">
                <div className="w-16 h-16 border-4 border-[var(--nl-neon)]/20 border-t-[var(--nl-neon)] rounded-full animate-spin mb-6" />
                <span className="text-[12px] font-black uppercase tracking-[0.4em] text-[var(--nl-neon)] animate-pulse">
                  Descriptografando Sinais de Concorrentes...
                </span>
              </div>
            )}
            
            {!loading && !comparisons.length && (
              <div className="nl-card border-dashed p-12 text-center bg-white/[0.01]">
                <p className="text-sm text-[var(--nl-text-muted)] font-bold italic opacity-40">
                  Radar limpo. Nenhum sinal externo detectado no perímetro atual.
                </p>
              </div>
            )}

            {comparisons.map((item) => {
              const badge = badgeCopy[item.badge] || badgeCopy.sem_dados;
              const marketAvg = item.marketAverage || 0;
              const gapLabel =
                item.badge === "acima"
                  ? `+${item.gapPercentage || item.gapPct}%`
                  : item.badge === "competitivo"
                  ? `${item.gapPercentage || item.gapPct}%`
                  : "--";

              return (
                <div
                  key={item.productId}
                  className="nl-card-glass p-6 hover:translate-x-1 transition-transform group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <h3 className="text-base font-black text-white group-hover:text-[var(--nl-neon)] transition-colors">{item.productName}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                         <p className="text-[11px] font-bold text-[var(--nl-text-muted)] uppercase tracking-widest">
                           Custo Interno: <span className="text-white">R$ {item.internalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                         </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border transition-colors ${
                      item.badge === "competitivo" 
                        ? "text-[var(--nl-neon)] border-[var(--nl-neon)]/30 bg-[var(--nl-neon)]/5" 
                        : item.badge === "acima"
                        ? "text-red-400 border-red-500/30 bg-red-500/5"
                        : "text-zinc-500 border-white/10"
                    }`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-[var(--nl-text-muted)] opacity-60">
                      <span>Média Global Mercado</span>
                      <span className={item.badge === "acima" ? "text-red-400" : "text-[var(--nl-neon)]"}>{gapLabel} Divergência</span>
                    </div>
                    
                    <div className="relative h-1.5 rounded-full bg-white/5 overflow-hidden ring-1 ring-white/5">
                      <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                          item.badge === "acima" ? "bg-red-500" : "bg-[var(--nl-neon)]"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(10, (item.internalPrice / (marketAvg || item.internalPrice || 1)) * 60))}%`,
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-black text-white/50 tracking-tight">R$ {marketAvg.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <div className="flex items-center gap-1.5">
                         {item.badge === "acima" ? <ArrowUpRightIcon className="w-3 h-3 text-red-400" /> : <ArrowDownRightIcon className="w-3 h-3 text-[var(--nl-neon)]" />}
                         <span className={`text-sm font-black tracking-widest ${item.badge === "acima" ? "text-red-400" : "text-[var(--nl-neon)]"}`}>
                           {gapLabel}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)] px-2">
            Voz do Ecossistema
          </h2>
          <div className="nl-card-glass p-8 min-h-[400px] border-blue-500/10">
            {trends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                 <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4">
                    <RadarIcon className="w-6 h-6" />
                 </div>
                 <p className="text-[11px] font-bold uppercase tracking-widest max-w-[200px]">
                   Calibrando Sensores de Tendência...
                 </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 content-start">
                {trends.map((trend) => {
                  const weight = Math.min(1.4, 0.8 + trend.growthPercentage / 100);
                  return (
                    <div
                      key={`${trend.term}-${trend.createdAt}`}
                      className="group relative flex flex-col p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-default"
                    >
                      <div className="flex justify-between items-start mb-1 overflow-hidden">
                         <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 opacity-60">Capturado</span>
                         {trend.growthPercentage > 0 && <div className="h-1 w-1 rounded-full bg-[var(--nl-neon)] animate-ping" />}
                      </div>
                      <span 
                        className="font-black text-white group-hover:text-[var(--nl-neon)] transition-colors tracking-tight leading-tight"
                        style={{ fontSize: `${weight}rem` }}
                      >
                        {trend.term}
                      </span>
                      <div className="mt-4 flex items-center justify-between">
                         <div className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-bold text-white/40 border border-white/5 uppercase">
                           Vol. {itemVolumeFormat(trend.volume)}
                         </div>
                         <span className="text-[11px] font-black text-[var(--nl-neon)]">+{trend.growthPercentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="nl-card bg-blue-600/5 border-blue-500/20 p-6">
             <div className="flex gap-4 items-start">
                <LightbulbIcon className="w-8 h-8 text-blue-400 shrink-0" />
                <div>
                   <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Dica Estratégica</h4>
                   <p className="text-xs text-blue-400/70 leading-relaxed font-bold">
                     O aumento repentino em <span className="text-white italic">"{trends[0]?.term || "termos de busca"}"</span> sugere que você deve reavaliar seus preços de entrada em 24h.
                   </p>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const itemVolumeFormat = (vol: number | string) => {
  const v = typeof vol === "string" ? parseInt(vol) : vol;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return v;
};

const MetricCard = ({
  title,
  value,
  helper,
  suffix,
  icon,
  isNeon,
  isDanger,
}: {
  title: string;
  value: string;
  helper: string;
  suffix?: string;
  icon: React.ReactNode;
  isNeon?: boolean;
  isDanger?: boolean;
}) => (
  <div className="nl-card-glass relative overflow-hidden p-8 flex flex-col justify-between min-h-[180px] group hover:border-white/20 transition-all">
    {isNeon && <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--nl-neon)] opacity-[0.05] blur-[80px] pointer-events-none group-hover:opacity-[0.08] transition-opacity" />}
    <div className="flex items-start justify-between">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[var(--nl-text-muted)] group-hover:bg-white/[0.05] group-hover:text-white transition-all">
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
    </div>
    <div className="mt-8">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--nl-text-muted)]">{title}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <span className={`text-4xl font-black tracking-tighter ${isNeon ? "text-[var(--nl-neon)]" : isDanger ? "text-red-400" : "text-white"}`}>
          {value}
        </span>
        {suffix && <span className="text-sm font-black text-[var(--nl-text-muted)] tracking-widest">{suffix}</span>}
      </div>
      <p className="text-[11px] font-bold text-[var(--nl-text-secondary)] mt-2 opacity-60 uppercase tracking-wider">{helper}</p>
    </div>
  </div>
);

export default MarketIntel;
