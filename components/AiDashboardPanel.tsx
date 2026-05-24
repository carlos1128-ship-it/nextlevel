import React from "react";
import { LightbulbIcon, BarChartIcon, MessageSquareIcon, DollarSignIcon } from "./icons";
import type { AiBusinessCard, AiDashboardIntelligence } from "../src/types/domain";

const priorityClass: Record<AiBusinessCard["priority"], string> = {
  low: "border-white/[0.08] bg-white/[0.035] text-[#94a3b8]",
  medium: "border-[#c5ff1a]/18 bg-[#c5ff1a]/10 text-[#c5ff1a]",
  high: "border-amber-400/24 bg-amber-400/10 text-amber-200",
  critical: "border-red-400/24 bg-red-400/10 text-red-200",
};

const priorityLabel: Record<AiBusinessCard["priority"], string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

function MiniCard({
  title,
  card,
  icon: Icon,
}: {
  title: string;
  card: AiBusinessCard | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group flex min-h-[188px] flex-col gap-3 border-b border-white/[0.04] p-5 transition-colors hover:bg-white/[0.018] md:border-b-0 md:border-r md:last:border-r-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-[#c5ff1a]" />
          <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-[#64748b]">{title}</p>
        </div>
        {card ? (
          <span className={`shrink-0 rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${priorityClass[card.priority]}`}>
            {priorityLabel[card.priority]}
          </span>
        ) : null}
      </div>
      <h3 className="text-base font-bold tracking-tight text-[#f8fafc]">{card?.title || "Aguardando dados"}</h3>
      <p className="text-sm leading-6 text-[#94a3b8]">
        {card?.summary || "Conecte uma integração ou adicione dados para liberar esta análise."}
      </p>
      {card?.recommendation ? (
        <p className="mt-auto text-sm font-semibold leading-6 text-lime-200">{card.recommendation}</p>
      ) : null}
    </div>
  );
}

export default function AiDashboardPanel({
  data,
  loading,
}: {
  data: AiDashboardIntelligence | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="min-h-[244px] animate-pulse overflow-hidden rounded-2xl border border-[#c5ff1a]/10 bg-[radial-gradient(circle_at_0%_0%,rgba(197,255,26,0.05),rgba(18,20,26,0.72)_58%)] p-7">
        <div className="h-4 w-44 rounded bg-[#c5ff1a]/12" />
        <div className="mt-4 h-8 w-80 max-w-full rounded bg-white/[0.055]" />
        <div className="mt-8 grid gap-0 rounded-2xl border border-white/[0.045] md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`ai-skeleton-${index}`} className="min-h-[150px] border-b border-white/[0.04] p-5 md:border-b-0 md:border-r md:last:border-r-0">
              <div className="h-3 w-28 rounded bg-white/[0.055]" />
              <div className="mt-5 h-5 w-36 rounded bg-white/[0.045]" />
              <div className="mt-4 h-3 rounded bg-white/[0.035]" />
              <div className="mt-2 h-3 w-4/5 rounded bg-white/[0.035]" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#c5ff1a]/10 bg-[radial-gradient(circle_at_0%_0%,rgba(197,255,26,0.055),rgba(18,20,26,0.78)_58%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_70px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c5ff1a]/45 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#c5ff1a]/[0.045] blur-3xl" />
      <div className="relative flex flex-col justify-between gap-4 p-7 md:flex-row md:items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#c5ff1a]">NEXT LEVEL Intelligence</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#f8fafc] md:text-3xl">
            A IA entende o negócio inteiro.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94a3b8]">
            Recomendações reais geradas a partir das métricas e sinais disponíveis nesta empresa.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c5ff1a] shadow-[0_0_12px_rgba(197,255,26,0.55)]" />
          Em análise contínua
        </span>
      </div>

      <div className="relative grid border-y border-white/[0.04] md:grid-cols-4">
        <MiniCard title="Insight de hoje" card={data?.mainInsight || null} icon={LightbulbIcon} />
        <MiniCard title="Risco principal" card={data?.mainRisk || null} icon={BarChartIcon} />
        <MiniCard title="Oportunidade" card={data?.growthOpportunity || null} icon={DollarSignIcon} />
        <MiniCard title="WhatsApp" card={data?.whatsappSignal || null} icon={MessageSquareIcon} />
      </div>

      {data?.nextBestActions?.length ? (
        <div className="p-7">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748b]">Próximas ações</p>
          <div className="grid gap-3 md:grid-cols-3">
            {data.nextBestActions.map((action) => (
              <div key={`${action.type}-${action.title}`} className="rounded-xl border border-white/[0.055] bg-white/[0.025] p-4 transition hover:border-[#c5ff1a]/20 hover:bg-white/[0.04]">
                <p className="text-sm font-black text-zinc-100">{action.title}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{action.summary}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {data?.missingData?.length ? (
        <p className="border-t border-white/[0.04] px-7 py-4 text-xs leading-5 text-[#64748b]">
          Para melhorar a precisão: {data.missingData.join(", ")}.
        </p>
      ) : null}
    </section>
  );
}
