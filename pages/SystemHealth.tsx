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
        addToast("Nao foi possivel carregar o painel admin.", "error");
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
      addToast("Quota resetada com sucesso.");
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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_right,_rgba(182,255,0,0.12),_transparent_35%),linear-gradient(135deg,#0a0d12_0%,#131822_55%,#0a0d12_100%)] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-lime-400/25 bg-lime-400/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-lime-300">
              <ShieldIcon className="h-4 w-4" />
              Central do SuperAdmin
            </div>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
              Operacao, custos e incidentes em uma unica visao.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400">
              Monitoramos banco, Redis, LLMs, quotas e trilha de auditoria em tempo quase real.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOperations()}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm font-bold text-zinc-100 transition hover:border-lime-400 hover:text-lime-300"
          >
            Atualizar agora
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Tokens na plataforma"
          value={asCompactNumber(usage.totals.totalTokens)}
          subtitle="Consumo mensal agregado"
          icon={<RadarIcon className="h-5 w-5 text-lime-300" />}
        />
        <MetricCard
          title="Mensagens WhatsApp"
          value={asCompactNumber(usage.totals.totalMessages)}
          subtitle="Volume consolidado"
          icon={<ActivityIcon className="h-5 w-5 text-sky-300" />}
        />
        <MetricCard
          title="Receita mensal"
          value={asCurrency(usage.totals.monthlyRevenue)}
          subtitle="Mensalidades estimadas"
          icon={<DollarSignIcon className="h-5 w-5 text-emerald-300" />}
        />
        <MetricCard
          title="Lucro estimado"
          value={asCurrency(usage.totals.estimatedProfit)}
          subtitle={`Custo IA ${asCurrency(usage.totals.aiCostEstimate)}`}
          icon={<BuildingIcon className="h-5 w-5 text-amber-200" />}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Panel title="Saude do core" subtitle="Banco, Redis, IA e provedores">
          <div className="grid gap-3 md:grid-cols-3">
            <ServiceStatusCard title="Database" status={health.services.database.status} latency={health.services.database.latencyMs} />
            <ServiceStatusCard title="Redis" status={health.services.redis.status} latency={health.services.redis.latencyMs} />
            <ServiceStatusCard title="AI" status={health.services.ai.status} latency={health.services.ai.avgLatencyMs} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(health.providers as Record<string, string>).map(([provider, status]) => (
              <span key={provider} className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusClassName(status)}`}>
                {provider}: {status}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="h-72 rounded-3xl border border-zinc-800 bg-black/20 p-4">
              <div className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Tempo de resposta medio</div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={health.requestTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#3f3f46",
                      borderRadius: 16,
                      color: "#fafafa",
                    }}
                  />
                  <Line type="monotone" dataKey="avgResponseTime" stroke="#B6FF00" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 rounded-3xl border border-zinc-800 bg-black/20 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">Sucesso vs falha</div>
                <div className="text-xs font-semibold text-zinc-400">
                  Erro 10min: {health.successVsFailure.errorRateLastWindow.toFixed(2)}%
                </div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={successFailureData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                    {successFailureData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090b",
                      borderColor: "#3f3f46",
                      borderRadius: 16,
                      color: "#fafafa",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>

        <Panel title="Live audit feed" subtitle="Polling automatico das alteracoes criticas">
          <div className="space-y-3">
            {auditFeed.length ? (
              auditFeed.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{item.action}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.company?.name || "Plataforma"} · {item.actorType} · {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusClassName(item.actorType === "SYSTEM" ? "configured" : "up")}`}>
                      {item.actorType}
                    </span>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/30 p-3 text-xs text-zinc-400">
                    {typeof item.details === "string"
                      ? item.details
                      : JSON.stringify(item.details || {}, null, 2)}
                  </pre>
                </div>
              ))
            ) : (
              <EmptyState label="Sem trilhas recentes de auditoria." />
            )}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Quota management" subtitle="Reset manual, boost de tokens e ajuste de plano">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  <th className="px-3 py-3">Empresa</th>
                  <th className="px-3 py-3">Plano</th>
                  <th className="px-3 py-3">Tokens</th>
                  <th className="px-3 py-3">Msgs</th>
                  <th className="px-3 py-3">Ciclo</th>
                  <th className="px-3 py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {quotas.map((quota) => {
                  const isBusy = busyCompanyId === quota.companyId;
                  return (
                    <tr key={quota.id} className="border-b border-zinc-900/80 align-top">
                      <td className="px-3 py-4">
                        <div className="font-bold text-zinc-100">{quota.company.name}</div>
                        <div className="text-xs text-zinc-500">{quota.company.sector || "Sem setor"}</div>
                      </td>
                      <td className="px-3 py-4">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusClassName(quota.currentTier === "ENTERPRISE" ? "configured" : quota.currentTier === "PRO" ? "up" : "unknown")}`}>
                          {quota.currentTier}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-zinc-200">{asCompactNumber(quota.llmTokensUsed)}</td>
                      <td className="px-3 py-4 text-sm text-zinc-200">{asCompactNumber(quota.whatsappMessagesSent)}</td>
                      <td className="px-3 py-4 text-xs text-zinc-400">{formatDateTime(quota.billingCycleEnd)}</td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <ActionButton disabled={isBusy} onClick={() => void handleResetQuota(quota.companyId)} label="Resetar" />
                          <ActionButton
                            disabled={isBusy}
                            onClick={() =>
                              void handleQuotaBoost(
                                quota,
                                { llmTokensUsed: quota.llmTokensUsed + 10000 },
                                "Bonus de 10k tokens aplicado."
                              )
                            }
                            label="+10k tokens"
                          />
                          <ActionButton
                            disabled={isBusy}
                            onClick={() =>
                              void handleQuotaBoost(
                                quota,
                                { whatsappMessagesSent: Math.max(0, quota.whatsappMessagesSent - 500) },
                                "Quota de mensagens ajustada."
                              )
                            }
                            label="+500 msgs"
                          />
                          <ActionButton
                            disabled={isBusy}
                            onClick={() => void handleQuotaBoost(quota, { currentTier: "PRO" }, "Plano ajustado para PRO.")}
                            label="PRO"
                          />
                          <ActionButton
                            disabled={isBusy}
                            onClick={() =>
                              void handleQuotaBoost(quota, { currentTier: "ENTERPRISE" }, "Plano ajustado para ENTERPRISE.")
                            }
                            label="Enterprise"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!quotas.length && !isLoading ? <EmptyState label="Nenhuma quota encontrada." /> : null}
          </div>
        </Panel>

        <Panel title="Consumo por empresa" subtitle="Quem puxa custo e quem deixa margem">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usage.companies.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="companyName" stroke="#71717a" fontSize={11} interval={0} angle={-18} textAnchor="end" height={64} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#3f3f46",
                    borderRadius: 16,
                    color: "#fafafa",
                  }}
                />
                <Bar dataKey="llmTokensUsed" fill="#B6FF00" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {usage.companies.slice(0, 5).map((company) => (
              <div key={company.companyId} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-zinc-100">{company.companyName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{company.currentTier}</p>
                  </div>
                  <div className="text-right text-xs text-zinc-400">
                    <p>Margem: {asCurrency(company.profitEstimate)}</p>
                    <p>Custo IA: {asCurrency(company.aiCostEstimate)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel title="Error logs" subtitle="Ultimos 50 erros para debug rapido">
        <div className="grid gap-3">
          {errorLogs.length ? (
            errorLogs.slice(0, 12).map((item) => (
              <div key={item.id} className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">
                      {item.method} {item.path}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.company?.name || "Sem empresa"} · {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-300">{item.statusCode}</p>
                    <p className="text-xs text-zinc-400">{item.responseTime} ms</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState label="Nenhum erro recente registrado." />
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
  <section className="rounded-[28px] border border-zinc-800 bg-[#0b0d11] p-5 md:p-6">
    <div className="mb-5">
      <h2 className="text-lg font-black tracking-tight text-zinc-100">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
    </div>
    {children}
  </section>
);

const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) => (
  <div className="rounded-[28px] border border-zinc-800 bg-[#0b0d11] p-5">
    <div className="mb-4 flex items-center justify-between">
      <span className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{title}</span>
      <div className="rounded-2xl border border-zinc-800 bg-black/40 p-2">{icon}</div>
    </div>
    <p className="text-2xl font-black tracking-tight text-zinc-100">{value}</p>
    <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
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
  <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-4">
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-bold text-zinc-100">{title}</span>
      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusClassName(status)}`}>
        {status}
      </span>
    </div>
    <p className="mt-4 text-3xl font-black tracking-tight text-zinc-100">{latency} ms</p>
    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">Latencia atual</p>
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
    className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200 transition hover:border-lime-400 hover:text-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {label}
  </button>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5 text-sm text-zinc-500">
    {label}
  </div>
);

export default SystemHealth;
