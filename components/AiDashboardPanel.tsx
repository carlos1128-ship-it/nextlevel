import React from "react";
import { LightbulbIcon, BarChartIcon, MessageSquareIcon, DollarSignIcon } from "./icons";
import { AppCard, FeatureCard } from "./ui/Card";
import type { AiBusinessCard, AiDashboardIntelligence } from "../src/types/domain";

const priorityClass: Record<AiBusinessCard["priority"], string> = {
  low: "border-zinc-800 text-zinc-300",
  medium: "border-lime-400/25 text-lime-300",
  high: "border-amber-400/30 text-amber-300",
  critical: "border-red-400/30 text-red-300",
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
    <FeatureCard interactive className="min-h-[160px]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 text-lime-400">
            <Icon className="h-4 w-4" />
          </div>
          <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</p>
        </div>
        {card ? (
          <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${priorityClass[card.priority]}`}>
            {card.priority}
          </span>
        ) : null}
      </div>
      <h3 className="text-lg font-black tracking-tight text-zinc-100">{card?.title || "Aguardando dados suficientes"}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        {card?.summary || "Conecte uma integracao ou adicione dados para liberar esta analise."}
      </p>
      {card?.recommendation ? (
        <p className="mt-3 text-sm font-semibold leading-6 text-lime-200">{card.recommendation}</p>
      ) : null}
    </FeatureCard>
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
      <AppCard className="grid min-h-[140px] place-items-center p-7">
        <p className="text-2xl font-black tracking-[0.24em] text-[#B6FF00]">NEXT LEVEL</p>
      </AppCard>
    );
  }

  return (
    <AppCard className="space-y-5 p-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">Camada inteligente</p>
          <h2 className="mt-2 text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">
            NEXT LEVEL entende o negocio inteiro
          </h2>
        </div>
        <span className="rounded-full border border-zinc-800 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
          Em analise continua
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <MiniCard title="Insight de hoje" card={data?.mainInsight || null} icon={LightbulbIcon} />
        <MiniCard title="Risco principal" card={data?.mainRisk || null} icon={BarChartIcon} />
        <MiniCard title="Oportunidade" card={data?.growthOpportunity || null} icon={DollarSignIcon} />
        <MiniCard title="WhatsApp" card={data?.whatsappSignal || null} icon={MessageSquareIcon} />
      </div>

      {data?.nextBestActions?.length ? (
        <FeatureCard>
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Proximas acoes</p>
          <div className="grid gap-3 md:grid-cols-3">
            {data.nextBestActions.map((action) => (
              <div key={`${action.type}-${action.title}`} className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 p-4 transition hover:border-lime-400/25">
                <p className="text-sm font-black text-zinc-100">{action.title}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{action.summary}</p>
              </div>
            ))}
          </div>
        </FeatureCard>
      ) : null}

      {data?.missingData?.length ? (
        <p className="text-xs leading-5 text-zinc-500">
          Para melhorar a precisao: {data.missingData.join(", ")}.
        </p>
      ) : null}
    </AppCard>
  );
}
