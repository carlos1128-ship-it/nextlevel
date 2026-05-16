import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActivityIcon, CreditCardIcon } from "../components/icons";
import NextLevelLoader from "../components/NextLevelLoader";
import { useAuth } from "../App";
import { getCurrentAIUsage } from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { AIUsageCurrentResponse, AIUsageFeatureSummary } from "../src/types/domain";

const planLabels: Record<string, string> = {
  free: "Teste",
  test: "Teste",
  common: "Essencial",
  basic: "Essencial",
  premium: "Premium",
  pro_business: "Business",
  business: "Business",
};

const statusLabel: Record<AIUsageFeatureSummary["status"], string> = {
  ok: "ok",
  near_limit: "perto do limite",
  exceeded: "excedido",
  blocked: "bloqueado",
};

const statusClass: Record<AIUsageFeatureSummary["status"], string> = {
  ok: "border-lime-400/30 bg-lime-400/10 text-lime-300",
  near_limit: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
  exceeded: "border-red-400/40 bg-red-500/10 text-red-200",
  blocked: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

function formatLimit(item: AIUsageFeatureSummary) {
  if (!item.enabled) {
    return `Disponível no ${item.feature === "whatsapp_agent" || item.feature === "instagram_agent" ? "Premium" : "plano superior"}`;
  }
  const used = item.requestCount.toLocaleString("pt-BR");
  if (item.monthlyRequestLimit === null) {
    return `${used} ${item.unit} / ilimitado`;
  }
  return `${used} / ${item.monthlyRequestLimit.toLocaleString("pt-BR")} ${item.unit}`;
}

const UsageRow = ({ item }: { item: AIUsageFeatureSummary; key?: React.Key }) => {
  const exceeded = item.status === "exceeded";
  const blocked = item.status === "blocked" || !item.enabled;
  const barColor = blocked 
    ? "bg-zinc-800" 
    : exceeded 
      ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]" 
      : item.status === "near_limit" 
        ? "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)]" 
        : "bg-[var(--nl-neon)] shadow-[0_0_12px_rgba(182,255,0,0.3)]";

  return (
    <section className="nl-card-glass p-6 group hover:border-white/10 transition-all">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">{item.label}</h2>
          <p className="mt-1 text-xs font-bold text-[var(--nl-text-muted)] uppercase tracking-widest">{formatLimit(item)}</p>
        </div>
        <span className={`w-max rounded px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] border ${statusClass[item.status]}`}>
          {statusLabel[item.status]}
        </span>
      </div>

      <div className="mt-8">
        <div className="relative h-2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/5">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: `${blocked ? 0 : Math.min(100, Math.max(0, item.progressPercent))}%` }}
          />
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <span className={`text-xl font-black ${exceeded ? "text-red-400" : "text-white"}`}>
               {blocked ? "0%" : `${item.progressPercent}%`}
             </span>
             <span className="text-[10px] font-black text-[var(--nl-text-muted)] uppercase tracking-widest">Utilizado</span>
          </div>
          <div className="text-right">
             <span className="block text-xs font-black text-white">{item.tokenCount.toLocaleString("pt-BR")} tokens</span>
             <span className="text-[9px] font-bold text-[var(--nl-text-muted)] uppercase tracking-tighter">Volume de Processamento</span>
          </div>
        </div>
      </div>

      {item.status === "near_limit" && (
        <p className="mt-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] font-bold text-amber-200 text-center animate-pulse">
          Alerta de Escassez: O volume residual deste recurso está abaixo da margem de segurança.
        </p>
      )}
      {item.status === "exceeded" && (
        <p className="mt-6 p-4 rounded-lg bg-red-400/5 border border-red-500/10 text-[11px] font-bold text-red-200 text-center">
          Recurso Esgotado: Limite operacional atingido. Efetue upgrade para restaurar processamento.
        </p>
      )}
    </section>
  );
};

const PlanUsage = () => {
  const { selectedCompanyId } = useAuth();
  const [usage, setUsage] = useState<AIUsageCurrentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!selectedCompanyId) {
      setUsage(null);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);
    getCurrentAIUsage({ companyId: selectedCompanyId })
      .then((data) => {
        if (!cancelled) setUsage(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Não foi possível carregar o uso do plano."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  const exceeded = useMemo(
    () => usage?.features.some((item) => item.status === "exceeded") || false,
    [usage],
  );
  const nearLimit = useMemo(
    () => usage?.features.some((item) => item.status === "near_limit") || false,
    [usage],
  );

  if (loading) {
    return <NextLevelLoader fullscreen={false} />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-red-100">
        <h1 className="text-xl font-black">Uso do plano indisponível</h1>
        <p className="mt-2 text-sm text-red-200">{error}</p>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="nl-card p-8">
        <h1 className="text-xl font-black text-zinc-100">Selecione uma empresa</h1>
        <p className="mt-2 text-sm text-zinc-500">O uso de IA é calculado por empresa ativa.</p>
      </div>
    );
  }

  return (
    <div className="nl-page max-w-5xl mx-auto">
      <header className="nl-page-header border-b border-white/5 pb-10 mb-10 items-end">
        <div className="nl-page-meta flex-1">
          <p className="nl-eyebrow text-[var(--nl-neon)] mb-2">Relatório de Consumo</p>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Nível <span className="text-[var(--nl-neon)] italic">{planLabels[usage.planKey] || usage.planKey}</span>
          </h1>
          <p className="mt-4 text-[13px] font-bold text-[var(--nl-text-secondary)]">
            Ciclo de {usage.currentMonth} • {usage.resetMessage}
          </p>
        </div>
        <Link
          to="/plans"
          className="nl-button-primary bg-white text-black px-8 py-3.5 hover:bg-zinc-200"
        >
          Expandir Quotas
        </Link>
      </header>
 
      {exceeded && (
        <div className="mb-8 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 text-xs font-black uppercase tracking-widest text-red-400 text-center animate-pulse">
          ALERTA CRÍTICO: Limite de processamento excedido. Algumas funções foram suspensas.
        </div>
      )}
 
      {!exceeded && nearLimit && (
        <div className="mb-8 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs font-black uppercase tracking-widest text-amber-400 text-center">
          Notificação Proativa: Consumo acima de 80% em recursos estratégicos.
        </div>
      )}
 
      <div className="grid gap-6 md:grid-cols-2">
        {usage.features.map((item) => (
          <UsageRow key={item.feature} item={item} />
        ))}
      </div>
 
      <footer className="mt-12 group">
        <div className="nl-card bg-white/[0.01] border-white/5 p-8 rounded-3xl flex items-start gap-6 group-hover:border-white/10 transition-all">
          <div className="h-12 w-12 rounded-2xl bg-[var(--nl-neon)]/5 border border-[var(--nl-neon)]/20 flex items-center justify-center shrink-0">
             <ActivityIcon className="h-6 w-6 text-[var(--nl-neon)]" />
          </div>
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Notas de Processamento</h4>
             <p className="text-[13px] text-[var(--nl-text-secondary)] leading-relaxed font-medium">
               A metrificação do ecossistema Next Intelligence é consolidada a cada 15 minutos, abrangendo disparos de WhatsApp/IG, inferências cognitivas de Chat e processos de OCR para leitura de faturas.
             </p>
             <p className="text-[11px] font-black uppercase tracking-widest text-[var(--nl-neon)] opacity-60">
               * O consumo é reiniciado automaticamente no 1º dia de cada mês.
             </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PlanUsage;
