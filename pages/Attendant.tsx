import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import {
  getAttendantLeads,
  getBotConfig,
  getAttendantRoi,
  interveneLead,
  updateBotConfig,
} from "../src/services/endpoints";
import type { BotConfig, Lead } from "../src/types/domain";
import { getErrorMessage } from "../src/services/error";
import { MessageSquareIcon, LightbulbIcon, SettingsIcon } from "../components/icons";

const defaultConfig: BotConfig = {
  id: "",
  companyId: "",
  botName: "Atendente IA",
  welcomeMessage: "Oi! Sou o assistente virtual da empresa, posso ajudar?",
  toneOfVoice: "amigavel",
  instructions: null,
  isActive: true,
};

type StatusBadgeProps = { status: Lead["status"]; score: number };
const StatusBadge = ({ status, score }: StatusBadgeProps) => {
  const map: Record<string, string> = {
    NEW: "bg-zinc-700/60 text-zinc-300 border-zinc-600/40",
    QUALIFIED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    CONVERTED: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    LOST: "bg-red-500/20 text-red-300 border-red-500/30",
  };
  const labels: Record<string, string> = {
    NEW: "Novo",
    QUALIFIED: "Qualificado",
    CONVERTED: "Convertido",
    LOST: "Perdido",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status] ?? map.NEW}`}>
      {labels[status] ?? status} · {score}pts
    </span>
  );
};

type ScoreBarProps = { score: number };
const ScoreBar = ({ score }: ScoreBarProps) => {
  const color = score >= 80 ? "bg-lime-400" : score >= 50 ? "bg-blue-400" : "bg-zinc-600";
  return (
    <div className="mt-2 h-1 w-full rounded-full bg-zinc-800">
      <div className={`h-1 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
};

const GlassCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-zinc-800/60 bg-zinc-950/70 shadow-xl backdrop-blur-xl dark:border-zinc-700/40 dark:bg-zinc-900/50 ${className}`}>
    {children}
  </div>
);

const Attendant = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [config, setConfig] = useState<BotConfig>(defaultConfig);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [roi, setRoi] = useState<{ iaSalesCount: number; iaRevenue: number } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const loadConfig = async () => {
    if (!selectedCompanyId) return;
    setLoadingConfig(true);
    try {
      const data = await getBotConfig(selectedCompanyId);
      setConfig(data);
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao carregar configuracao do agente"), "error");
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadLeads = async () => {
    if (!selectedCompanyId) return;
    setLoadingLeads(true);
    try {
      const data = await getAttendantLeads({ companyId: selectedCompanyId, limit: 20 });
      setLeads(data);
    } catch {
      // silently fail on poll
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadRoi = async () => {
    if (!selectedCompanyId) return;
    try {
      const data = await getAttendantRoi(selectedCompanyId);
      setRoi(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadConfig();
    void loadLeads();
    void loadRoi();
    const interval = setInterval(() => void loadLeads(), 10000);
    return () => clearInterval(interval);
  }, [selectedCompanyId]);

  const handleConfigSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCompanyId) return;
    setSavingConfig(true);
    try {
      const updated = await updateBotConfig(selectedCompanyId, config);
      setConfig(updated);
      addToast("Agente atualizado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Erro ao salvar"), "error");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleIntervene = async (lead: Lead) => {
    if (!selectedCompanyId) return;
    try {
      await interveneLead(lead.id, selectedCompanyId);
      addToast("Bot pausado para este lead por 24h.", "info");
      await loadLeads();
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel intervir"), "error");
    }
  };

  const liveFeed = useMemo(() => leads.slice(0, 10), [leads]);
  const hotLeads = useMemo(() => leads.filter((l) => l.score >= 80), [leads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-7 shadow-2xl dark:border-zinc-700/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(163,230,53,0.08)_0%,transparent_60%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-500">Omnichannel · WhatsApp & Instagram</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">
              Meus Agentes
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Configure a personalidade do bot, acompanhe leads em tempo real e assuma o controle quando necessário.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 md:items-end">
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${config.isActive ? "border-lime-500/40 bg-lime-500/10 text-lime-300" : "border-zinc-700/40 bg-zinc-900/60 text-zinc-400"}`}>
              <span className={`h-2 w-2 rounded-full ${config.isActive ? "animate-pulse bg-lime-400" : "bg-zinc-600"}`} />
              {config.isActive ? "Agente Online" : "Agente Offline"}
            </div>
            {hotLeads.length > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
                🔥 {hotLeads.length} lead{hotLeads.length > 1 ? "s" : ""} quente{hotLeads.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ROI Cards */}
      {roi && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Leads Ativos", value: leads.length, color: "text-blue-400" },
            { label: "Qualificados", value: leads.filter((l) => l.status === "QUALIFIED").length, color: "text-sky-400" },
            { label: "Convertidos pela IA", value: roi.iaSalesCount, color: "text-lime-400" },
            {
              label: "Receita via IA",
              value: roi.iaRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
              color: "text-lime-300",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-zinc-800/60 bg-zinc-950/70 p-4 shadow-xl backdrop-blur-xl dark:border-zinc-700/40 dark:bg-zinc-900/50">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{kpi.label}</p>
              <p className={`mt-1 text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Config Form */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SettingsIcon className="h-4 w-4 text-lime-400" />
              <h2 className="text-base font-bold text-white">Personalidade do Agente</h2>
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Identidade e Tom</span>
          </div>
          <form className="space-y-4" onSubmit={handleConfigSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Nome do Agente</span>
                <input
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-white placeholder-zinc-600 backdrop-blur transition focus:border-lime-400/70 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
                  value={config.botName}
                  onChange={(e) => setConfig((c) => ({ ...c, botName: e.target.value }))}
                  disabled={loadingConfig}
                  placeholder="Ex: Sara, Carlos, Max..."
                />
              </label>
              <label className="space-y-1.5 text-sm">
                <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Tom de Voz</span>
                <select
                  className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-white backdrop-blur transition focus:border-lime-400/70 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
                  value={config.toneOfVoice}
                  onChange={(e) => setConfig((c) => ({ ...c, toneOfVoice: e.target.value }))}
                  disabled={loadingConfig}
                >
                  <option value="amigavel">Amigável</option>
                  <option value="formal">Formal</option>
                  <option value="agressivo-vendas">Agressivo em Vendas</option>
                  <option value="consultivo">Consultivo</option>
                </select>
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Mensagem de Boas-Vindas</span>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-white placeholder-zinc-600 backdrop-blur transition focus:border-lime-400/70 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
                value={config.welcomeMessage || ""}
                onChange={(e) => setConfig((c) => ({ ...c, welcomeMessage: e.target.value }))}
                disabled={loadingConfig}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Instruções do Agente (Prompt)</span>
              <textarea
                rows={4}
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 py-2.5 text-sm text-white placeholder-zinc-600 backdrop-blur transition focus:border-lime-400/70 focus:outline-none focus:ring-1 focus:ring-lime-400/30"
                value={config.instructions || ""}
                onChange={(e) => setConfig((c) => ({ ...c, instructions: e.target.value }))}
                placeholder="Ex: Nunca dê desconto maior que 5% sem autorização. Sempre ofereça o plano premium primeiro."
                disabled={loadingConfig}
              />
            </label>
            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <div
                  onClick={() => setConfig((c) => ({ ...c, isActive: !c.isActive }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${config.isActive ? "bg-lime-400" : "bg-zinc-700"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${config.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className={`font-semibold ${config.isActive ? "text-lime-300" : "text-zinc-400"}`}>
                  {config.isActive ? "Agente Online" : "Agente Offline"}
                </span>
              </label>
              <button
                type="submit"
                disabled={savingConfig || loadingConfig}
                className="rounded-xl bg-lime-400 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-900 transition hover:bg-lime-300 active:scale-95 disabled:opacity-50"
              >
                {savingConfig ? "Salvando..." : "Salvar Agente"}
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Live Feed */}
        <GlassCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime-400" />
              <h2 className="text-base font-bold text-white">Live Feed</h2>
            </div>
            <span className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              {loadingLeads ? "Atualizando..." : "Tempo real"}
            </span>
          </div>
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 460 }}>
            {liveFeed.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquareIcon className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
                <p className="text-sm text-zinc-500">Nenhum chat ativo ainda.</p>
                <p className="mt-1 text-xs text-zinc-600">Conecte WhatsApp ou Instagram para começar.</p>
              </div>
            ) : (
              liveFeed.map((lead) => {
                const lastMsg = lead.conversations[0]?.content || "Sem mensagens ainda.";
                const isPaused = lead.botPausedUntil && new Date(lead.botPausedUntil) > new Date();
                return (
                  <div
                    key={lead.id}
                    className={`rounded-xl border p-3.5 transition-all ${isPaused ? "border-amber-500/30 bg-amber-500/5" : "border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-700/60"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold text-zinc-200">
                          {lead.name?.[0]?.toUpperCase() || lead.externalId.slice(-2)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{lead.name || lead.externalId}</p>
                          <StatusBadge status={lead.status} score={lead.score} />
                        </div>
                      </div>
                      {!isPaused && (
                        <button
                          className="shrink-0 rounded-lg border border-amber-500/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 transition hover:bg-amber-500/10 active:scale-95"
                          onClick={() => void handleIntervene(lead)}
                        >
                          Intervir
                        </button>
                      )}
                    </div>
                    <ScoreBar score={lead.score} />
                    <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{lastMsg}</p>
                    {isPaused && (
                      <p className="mt-1.5 text-[10px] text-amber-400">
                        ⏸ Pausado até {new Date(lead.botPausedUntil!).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>

      {/* Regras de Segurança */}
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center gap-2.5">
          <LightbulbIcon className="h-4 w-4 text-lime-400" />
          <h2 className="text-sm font-bold text-white">Regras de Segurança da IA</h2>
          <span className="ml-auto text-[10px] uppercase tracking-[0.22em] text-zinc-500">Transparência Ativa</span>
        </div>
        <ul className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
          <li className="flex gap-2 rounded-xl border border-zinc-800/40 bg-zinc-900/40 p-3">
            <span className="mt-0.5 text-lime-500">✓</span>
            A IA nunca inventa preços — se não houver valor no contexto, informa que vai confirmar com um humano.
          </li>
          <li className="flex gap-2 rounded-xl border border-zinc-800/40 bg-zinc-900/40 p-3">
            <span className="mt-0.5 text-lime-500">✓</span>
            Sempre se identifica como assistente virtual da empresa — nunca finge ser humano.
          </li>
          <li className="flex gap-2 rounded-xl border border-zinc-800/40 bg-zinc-900/40 p-3">
            <span className="mt-0.5 text-lime-500">✓</span>
            Detecta frustração e escala automaticamente para atendimento humano, pausando o bot por 24h.
          </li>
        </ul>
      </GlassCard>
    </div>
  );
};

export default Attendant;
