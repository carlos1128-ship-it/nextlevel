import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ActivityIcon, BuildingIcon, DollarSignIcon, RadarIcon, ShieldIcon } from "../components/icons";
import { useToast } from "../components/Toast";
import {
  getAdminAuditFeed,
  getAdminErrorLogs,
  getAdminHealth,
  getAdminQuotas,
  getAdminUsageStats,
  resetAdminQuota,
  updateAdminQuota,
} from "../src/services/endpoints";
import type {
  AdminErrorLog,
  AdminHealth,
  AdminQuota,
  AdminUsageStats,
  AuditFeedItem,
  SubscriptionTier,
} from "../src/types/domain";

const EMPTY_HEALTH: AdminHealth = {
  services: {
    database: { status: "unknown", latencyMs: 0 },
    redis: { status: "unknown", latencyMs: 0 },
    ai: { status: "unknown", avgLatencyMs: 0 },
  },
  providers: {
    meta: "unknown",
    mercadoLivre: "unknown",
    gemini: "missing",
    openai: "missing",
  },
  requestTimeline: [],
  successVsFailure: {
    success: 0,
    failure: 0,
    errorRateLastWindow: 0,
  },
};

const EMPTY_USAGE: AdminUsageStats = {
  totals: {
    totalTokens: 0,
    totalMessages: 0,
    monthlyRevenue: 0,
    aiCostEstimate: 0,
    estimatedProfit: 0,
  },
  companies: [],
};

const PIE_COLORS = ["#B6FF00", "#ef4444"];

const asCurrency = (value: number) =>
  `R$ ${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const asCompactNumber = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusClassName = (status: string) => {
  if (status === "up" || status === "configured") return "border-lime-400/30 bg-lime-400/10 text-lime-300";
  if (status === "degraded") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (status === "down" || status === "missing") return "border-red-500/30 bg-red-500/10 text-red-200";
  return "border-zinc-700 bg-zinc-900/70 text-zinc-300";
};

const SystemHealth = () => {
  const { addToast } = useToast();
  const [health, setHealth] = useState<AdminHealth>(EMPTY_HEALTH);
  const [usage, setUsage] = useState<AdminUsageStats>(EMPTY_USAGE);
  const [quotas, setQuotas] = useState<AdminQuota[]>([]);
  const [errorLogs, setErrorLogs] = useState<AdminErrorLog[]>([]);
  const [auditFeed, setAuditFeed] = useState<AuditFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyCompanyId, setBusyCompanyId] = useState<string | null>(null);

  const successFailureData = useMemo(
    () => [
      { name: "Sucesso", value: health.successVsFailure.success },
      { name: "Falha", value: health.successVsFailure.failure },
    ],
    [health.successVsFailure.failure, health.successVsFailure.success]
  );

  const loadOperations = useCallback(async (silent = false) => {
    try {
      const [nextHealth, nextUsage, nextQuotas, nextAuditFeed, nextErrorLogs] = await Promise.all([
        getAdminHealth(),
        getAdminUsageStats(),
        getAdminQuotas(),
        getAdminAuditFeed(),
        getAdminErrorLogs(),
      ]);
      setHealth(nextHealth);
      setUsage(nextUsage);
      setQuotas(nextQuotas);
      setAuditFeed(nextAuditFeed);
      setErrorLogs(nextErrorLogs);
    } catch (error) {
      if (!silent) {
        addToast("Não foi possível carregar o painel admin.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadOperations();
    const interval = window.setInterval(() => {
      void loadOperations(true);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadOperations]);

  const handleResetQuota = async (companyId: string) => {
    try {
      setBusyCompanyId(companyId);
      const updated = await resetAdminQuota(companyId);
      setQuotas((current) => current.map((item) => (item.companyId === companyId ? updated : item)));
      addToast("Cota resetada com sucesso.");
    } catch {
      addToast("Falha ao resetar quota.", "error");
    } finally {
      setBusyCompanyId(null);
    }
  };

  const handleQuotaBoost = async (
    quota: AdminQuota,
    update: Partial<{
      currentTier: SubscriptionTier;
      llmTokensUsed: number;
      whatsappMessagesSent: number;
    }>,
    message: string
  ) => {
    try {
      setBusyCompanyId(quota.companyId);
      const updated = await updateAdminQuota(quota.companyId, update);
      setQuotas((current) => current.map((item) => (item.companyId === quota.companyId ? updated : item)));
      addToast(message);
    } catch {
      addToast("Falha ao atualizar quota.", "error");
    } finally {
      setBusyCompanyId(null);
    }
  };

  return (
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Plataforma</p>
          <h1 className="nl-page-title">Saúde do Sistema</h1>
          <p className="nl-page-subtitle">
            Monitore a operação em tempo real, gerencie quotas e audite alterações críticas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOperations()}
          className="nl-button-primary"
        >
          Atualizar painel
        </button>
      </div>

      <section className="nl-card bg-gradient-to-br from-[rgba(182,255,0,0.05)] to-transparent border-[rgba(182,255,0,0.2)] p-6 md:p-8 mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="nl-badge-neon mb-3">SuperAdmin Activo</span>
            <h2 className="text-2xl md:text-3xl font-black text-[var(--nl-text-primary)]">
              Operação consolidada.
            </h2>
            <p className="mt-2 text-sm text-[var(--nl-text-secondary)] max-w-xl">
              Visão técnica do core: Banco, Redis, LLMs e conectores externos em uma única tela de auditoria.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)]">
            <span className="flex items-center gap-1.5 font-bold">
              <div className="h-2 w-2 rounded-full bg-[var(--nl-neon)] animate-pulse" />
              Sincronizado
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <MetricCard
          title="Faturamento Est."
          value={asCurrency(usage.totals.monthlyRevenue)}
          helper="Receita mensal projetada"
          icon={<DollarSignIcon />}
          isNeon
        />
        <MetricCard
          title="Tokens (30d)"
          value={asCompactNumber(usage.totals.totalTokens)}
          helper="Consumo de LLMs"
          icon={<RadarIcon />}
        />
        <MetricCard
          title="Mensagens"
          value={asCompactNumber(usage.totals.totalMessages)}
          helper="WhatsApp / Instagram"
          icon={<ActivityIcon />}
        />
        <MetricCard
          title="Lucro estimado"
          value={asCurrency(usage.totals.estimatedProfit)}
          helper={`Custo IA: ${asCurrency(usage.totals.aiCostEstimate)}`}
          icon={<ShieldIcon />}
          isNeon={usage.totals.estimatedProfit > 0}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr] mb-8">
        <Panel title="Saúde do Core" subtitle="Banco, Redis, IA e provedores">
          <div className="grid gap-3 md:grid-cols-3">
            <ServiceStatusCard title="Database" status={health.services.database.status} latency={health.services.database.latencyMs} />
            <ServiceStatusCard title="Redis" status={health.services.redis.status} latency={health.services.redis.latencyMs} />
            <ServiceStatusCard title="AI (Gemini)" status={health.services.ai.status} latency={health.services.ai.avgLatencyMs} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {Object.entries(health.providers as Record<string, string>).map(([provider, status]) => (
              <span key={provider} className={`nl-badge-${status === "up" || status === "configured" ? "success" : "muted"}`}>
                {provider}: {status}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="h-64 rounded-2xl border border-[var(--nl-border)] bg-[rgba(255,255,255,0.01)] p-5">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)] mb-4">Latência Média</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={health.requestTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#131517", borderColor: "#24282c", borderRadius: 12, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="avgResponseTime" stroke="var(--nl-neon)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-64 rounded-2xl border border-[var(--nl-border)] bg-[rgba(255,255,255,0.01)] p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">Sucesso vs Falha</h4>
                <span className="text-[10px] font-bold text-red-400">Err: {health.successVsFailure.errorRateLastWindow.toFixed(1)}%</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={successFailureData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={5} stroke="none">
                    {successFailureData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#131517", borderColor: "#24282c", borderRadius: 12, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>

        <Panel title="Audit Feed" subtitle="Trilha de segurança em tempo real">
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 nl-scrollbar">
            {auditFeed.length ? (
              auditFeed.slice(0, 10).map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-[var(--nl-border)] bg-[rgba(255,255,255,0.02)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[13px] font-bold text-[var(--nl-text-primary)]">{item.action}</p>
                      <p className="text-[11px] text-[var(--nl-text-muted)] mt-1">
                        {item.company?.name || "Global"} · {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <span className={`nl-badge-${item.actorType === "SYSTEM" ? "muted" : "neon"} text-[9px]`}>
                      {item.actorType}
                    </span>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-3 text-[10px] font-mono text-[var(--nl-text-secondary)] whitespace-pre-wrap">
                    {typeof item.details === "string" ? item.details : JSON.stringify(item.details || {}, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <EmptyState label="Sem trilha de auditoria recente." />
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] mb-8">
        <Panel title="Controle de Quotas" subtitle="Gestão manual de limites e faturamento">
          <div className="overflow-x-auto">
            <table className="nl-table">
              <thead>
                <tr>
                  <th>Empresa / Setor</th>
                  <th>Plano</th>
                  <th>Consumo</th>
                  <th>Ciclo</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {quotas.map((quota) => {
                  const isBusy = busyCompanyId === quota.companyId;
                  return (
                    <tr key={quota.id}>
                      <td>
                        <div className="font-bold text-[var(--nl-text-primary)]">{quota.company.name}</div>
                        <div className="text-[11px] text-[var(--nl-text-muted)]">{quota.company.sector || "Geral"}</div>
                      </td>
                      <td>
                        <span className={`nl-badge-${quota.currentTier === "ENTERPRISE" ? "neon" : quota.currentTier === "PRO" ? "success" : "muted"}`}>
                          {quota.currentTier}
                        </span>
                      </td>
                      <td>
                        <div className="text-[13px] text-[var(--nl-text-primary)]">
                          {asCompactNumber(quota.llmTokensUsed)} tokens
                        </div>
                        <div className="text-[11px] text-[var(--nl-text-muted)]">
                          {asCompactNumber(quota.whatsappMessagesSent)} msgs
                        </div>
                      </td>
                      <td className="text-[12px] text-[var(--nl-text-secondary)]">{formatDateTime(quota.billingCycleEnd)}</td>
                      <td className="text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <ActionButton disabled={isBusy} onClick={() => void handleResetQuota(quota.companyId)} label="Reset" />
                          <ActionButton
                            disabled={isBusy}
                            onClick={() => void handleQuotaBoost(quota, { llmTokensUsed: quota.llmTokensUsed + 50000 }, "+50k Tokens")}
                            label="+Tokens"
                          />
                          <ActionButton
                            disabled={isBusy}
                            onClick={() => void handleQuotaBoost(quota, { currentTier: "ENTERPRISE" }, "Upgrade Enterprise")}
                            label="UP"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Market Concentration" subtitle="Uso de recursos por tenant">
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usage.companies.slice(0, 6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="companyName" stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131517", borderColor: "#24282c", borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="llmTokensUsed" fill="var(--nl-neon)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {usage.companies.slice(0, 4).map((c) => (
              <div key={c.companyId} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--nl-border)]">
                <div>
                  <p className="text-[13px] font-bold text-[var(--nl-text-primary)]">{c.companyName}</p>
                  <p className="text-[10px] text-[var(--nl-text-muted)] uppercase tracking-widest">{c.currentTier}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-bold text-[var(--nl-neon)]">{asCurrency(c.profitEstimate)}</p>
                  <p className="text-[10px] text-[var(--nl-text-muted)]">Margem Est.</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Error Logs & Incidentes" subtitle="Rastreio granular das últimas exceções">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {errorLogs.length ? (
            errorLogs.slice(0, 12).map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-red-900/20 bg-red-950/10 flex flex-col justify-between min-h-[100px]">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-red-400 font-mono">{item.method} {item.statusCode}</span>
                    <span className="text-[10px] text-[var(--nl-text-muted)]">{item.responseTime}ms</span>
                  </div>
                  <p className="text-[13px] font-bold text-[var(--nl-text-primary)] truncate" title={item.path}>{item.path}</p>
                </div>
                <p className="text-[11px] text-[var(--nl-text-muted)] mt-2 italic">
                  {item.company?.name || "Sem Origem"} · {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <EmptyState label="Nenhum incidente registrado no momento." />
          )}
        </div>
      </Panel>
    </div>
  );
};

const Panel = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <section className="nl-card p-5 md:p-7">
    <div className="mb-6">
      <h2 className="text-[14px] font-bold uppercase tracking-[0.12em] text-[var(--nl-text-muted)]">{title}</h2>
      <p className="mt-1 text-[13px] text-[var(--nl-text-secondary)]">{subtitle}</p>
    </div>
    {children}
  </section>
);

const MetricCard = ({
  title,
  value,
  helper,
  icon,
  isNeon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  isNeon?: boolean;
}) => (
  <div className="nl-card relative overflow-hidden p-5 flex flex-col justify-between min-h-[140px]">
    {isNeon && <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--nl-neon)] opacity-[0.03] blur-3xl pointer-events-none" />}
    <div className="flex items-start justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] text-[var(--nl-text-muted)]">
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 font-bold" })}
      </div>
    </div>
    <div className="mt-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--nl-text-muted)]">{title}</p>
      <span className={`text-2xl font-black block mt-1 ${isNeon ? "text-[var(--nl-neon)]" : "text-[var(--nl-text-primary)]"}`}>{value}</span>
      <p className="text-[12px] text-[var(--nl-text-secondary)] mt-1">{helper}</p>
    </div>
  </div>
);

const ServiceStatusCard = ({
  title,
  status,
  latency,
}: {
  title: string;
  status: string;
  latency: number;
}) => (
  <div className="rounded-2xl border border-[var(--nl-border)] bg-[rgba(255,255,255,0.02)] p-5 transition hover:border-[var(--nl-border-active)]">
    <div className="flex items-center justify-between gap-3 mb-4">
      <span className="text-[13px] font-bold text-[var(--nl-text-primary)] uppercase tracking-tight">{title}</span>
      <span className={`nl-badge-${status === "up" || status === "configured" ? "success" : status === "down" ? "danger" : "muted"}`}>
        {status}
      </span>
    </div>
    <p className="text-3xl font-black text-[var(--nl-text-primary)] tracking-tight">{latency}ms</p>
    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--nl-text-muted)] mt-1">Latencia Core</p>
  </div>
);

const ActionButton = ({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="rounded-xl border border-[var(--nl-border)] bg-[rgba(255,255,255,0.02)] px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--nl-text-primary)] transition hover:border-[var(--nl-neon)] hover:text-[var(--nl-neon)] disabled:opacity-30 disabled:cursor-not-allowed"
  >
    {label}
  </button>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-dashed border-[var(--nl-border)] bg-[rgba(255,255,255,0.01)] p-8 text-center text-[13px] text-[var(--nl-text-muted)]">
    {label}
  </div>
);

export default SystemHealth;
