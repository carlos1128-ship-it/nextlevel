import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ActivityIcon, CreditCardIcon } from "../components/icons";
import { useAuth } from "../App";
import { getCurrentAIUsage } from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { AIUsageCurrentResponse, AIUsageFeatureSummary } from "../src/types/domain";

const planLabels: Record<string, string> = {
  free: "Teste",
  test: "Teste",
  common: "Common",
  basic: "Common",
  premium: "Premium",
  pro_business: "Pro Business",
  business: "Pro Business",
};

const statusLabel: Record<AIUsageFeatureSummary["status"], string> = {
  ok: "ok",
  near_limit: "perto do limite",
  exceeded: "excedido",
};

const statusClass: Record<AIUsageFeatureSummary["status"], string> = {
  ok: "border-lime-400/30 bg-lime-400/10 text-lime-300",
  near_limit: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
  exceeded: "border-red-400/40 bg-red-500/10 text-red-200",
};

function formatLimit(item: AIUsageFeatureSummary) {
  const used = item.requestCount.toLocaleString("pt-BR");
  if (!item.monthlyRequestLimit) {
    return `${used} ${item.unit}`;
  }
  return `${used} / ${item.monthlyRequestLimit.toLocaleString("pt-BR")} ${item.unit}`;
}

const UsageRow = ({ item }: { item: AIUsageFeatureSummary; key?: React.Key }) => {
  const exceeded = item.status === "exceeded";
  const barColor = exceeded ? "bg-red-400" : item.status === "near_limit" ? "bg-yellow-300" : "bg-lime-400";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">{item.label}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{formatLimit(item)}</p>
        </div>
        <span className={`w-max rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${statusClass[item.status]}`}>
          {statusLabel[item.status]}
        </span>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-500">
        <span>{item.progressPercent}% usado</span>
        <span>{item.tokenCount.toLocaleString("pt-BR")} tokens</span>
      </div>
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-28 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
        <div className="grid gap-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-900" />
          ))}
        </div>
      </div>
    );
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
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-900 dark:bg-zinc-950">
        <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Selecione uma empresa</h1>
        <p className="mt-2 text-sm text-zinc-500">O uso de IA e calculado por empresa ativa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-lime-500 dark:text-lime-400">Uso do plano</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Plano {planLabels[usage.planKey] || usage.planKey}
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {usage.currentMonth}. {usage.resetMessage}
            </p>
          </div>
          <Link
            to="/plans"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-zinc-950 transition hover:opacity-90"
          >
            <CreditCardIcon className="h-4 w-4" />
            Ver planos
          </Link>
        </div>
      </header>

      {exceeded ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm font-semibold text-red-100">
          Você atingiu o limite de IA deste mês. Faça upgrade de plano para continuar.
        </div>
      ) : null}

      <div className="grid gap-4">
        {usage.features.map((item) => (
          <UsageRow key={item.feature} item={item} />
        ))}
      </div>

      <footer className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-900 dark:bg-zinc-950/70 dark:text-zinc-400">
        <ActivityIcon className="mt-0.5 h-5 w-5 shrink-0 text-lime-500" />
        <p>
          O painel considera chamadas de Chat IA, Atendente WhatsApp e Importação Inteligente. Custos internos ficam disponíveis apenas no painel admin.
        </p>
      </footer>
    </div>
  );
};

export default PlanUsage;
