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
  const barColor = blocked ? "bg-zinc-500" : exceeded ? "bg-red-400" : item.status === "near_limit" ? "bg-yellow-300" : "bg-lime-400";

  return (
    <section className="nl-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-black text-zinc-100">{item.label}</h2>
          <p className="mt-1 text-sm text-zinc-400">{formatLimit(item)}</p>
        </div>
        <span className={`w-max rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusClass[item.status]}`}>
          {statusLabel[item.status]}
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#1B211E]">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${blocked ? 0 : Math.min(100, Math.max(0, item.progressPercent))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-semibold text-zinc-500">
        <span>{blocked ? "Bloqueado neste plano" : `${item.progressPercent}% usado`}</span>
        <span>{item.tokenCount.toLocaleString("pt-BR")} tokens</span>
      </div>
      {item.status === "near_limit" ? (
        <p className="mt-3 text-sm font-semibold text-yellow-200">
          Você está perto do limite do seu plano.
        </p>
      ) : null}
      {item.status === "exceeded" ? (
        <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-200">
          Você atingiu o limite mensal de IA do seu plano. Faça upgrade para continuar usando este recurso.
        </p>
      ) : null}
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
      <div className="nl-card border-red-500/30 bg-red-500/10 p-8 text-red-100">
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
    <div className="nl-page space-y-6">
      <header className="nl-card p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="nl-eyebrow">Uso do plano</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-100">
              Plano {planLabels[usage.planKey] || usage.planKey}
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              {usage.currentMonth}. {usage.resetMessage}
            </p>
          </div>
          <Link
            to="/plans"
            className="nl-button-primary inline-flex items-center justify-center gap-2"
          >
            <CreditCardIcon className="h-4 w-4" />
            Ver planos
          </Link>
        </div>
      </header>

      {exceeded ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm font-semibold text-red-100">
          Você atingiu o limite mensal de IA do seu plano. Faça upgrade para continuar usando este recurso.
        </div>
      ) : null}

      {!exceeded && nearLimit ? (
        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-sm font-semibold text-yellow-100">
          Você está perto do limite do seu plano.
        </div>
      ) : null}

      <div className="grid gap-4">
        {usage.features.map((item) => (
          <UsageRow key={item.feature} item={item} />
        ))}
      </div>

      <footer className="nl-card flex items-start gap-3 p-5 text-sm text-zinc-400">
        <ActivityIcon className="mt-0.5 h-5 w-5 shrink-0 text-lime-500" />
        <p>
          O painel considera chamadas de Chat IA, Atendente WhatsApp e Importação Inteligente. Custos internos ficam disponíveis apenas no painel admin.
        </p>
        <p>
          Também considera Atendente Instagram.
        </p>
      </footer>
    </div>
  );
};

export default PlanUsage;
