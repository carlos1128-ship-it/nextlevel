import React, { useEffect, useMemo, useState } from "react";
import { getDashboardPreferences, resetDashboardPreferences, saveDashboardPreferences } from "../../services/endpoints";
import { getErrorMessage } from "../../services/error";
import type {
  DashboardMetricCategory,
  DashboardMetricDefinition,
  DashboardPreference,
} from "../../types/domain";

const CATEGORY_LABELS: Record<DashboardMetricCategory | "all", string> = {
  all: "Todas",
  finance: "Financeiro",
  sales: "Vendas",
  marketing: "Marketing",
  products: "Produtos",
  customers: "Clientes",
  operations: "Operacao",
  ai_insights: "IA/Insights",
};

const CATEGORIES: Array<DashboardMetricCategory | "all"> = [
  "all",
  "finance",
  "sales",
  "marketing",
  "products",
  "customers",
  "operations",
  "ai_insights",
];

type Props = {
  companyId?: string | null;
  onToast: (message: string, type: "success" | "error" | "info") => void;
};

function sortPreferences(preferences: DashboardPreference[]) {
  return [...preferences].sort((a, b) => a.order - b.order);
}

function normalizePreference(metric: DashboardMetricDefinition, index: number): DashboardPreference {
  return {
    metricKey: metric.key,
    enabled: metric.defaultEnabled,
    order: index,
    size: null,
  };
}

const DashboardPersonalizationPanel = ({ companyId, onToast }: Props) => {
  const [availableMetrics, setAvailableMetrics] = useState<DashboardMetricDefinition[]>([]);
  const [preferences, setPreferences] = useState<DashboardPreference[]>([]);
  const [category, setCategory] = useState<DashboardMetricCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const metricByKey = useMemo(
    () => new Map(availableMetrics.map((metric) => [metric.key, metric])),
    [availableMetrics],
  );

  const visiblePreferences = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sortPreferences(preferences).filter((preference) => {
      const metric = metricByKey.get(preference.metricKey);
      if (!metric) return false;
      const matchesCategory = category === "all" || metric.category === category;
      const matchesSearch =
        !query ||
        metric.label.toLowerCase().includes(query) ||
        metric.description.toLowerCase().includes(query) ||
        metric.key.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, metricByKey, preferences, search]);

  const enabledCount = preferences.filter((preference) => preference.enabled).length;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardPreferences({ companyId });
      const metrics = Array.isArray(data.availableMetrics) ? data.availableMetrics : [];
      const prefs = Array.isArray(data.preferences)
        ? data.preferences
        : metrics.map(normalizePreference);
      setAvailableMetrics(metrics);
      setPreferences(sortPreferences(prefs));
    } catch (err) {
      setError(getErrorMessage(err, "Nao foi possivel carregar as preferencias."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [companyId]);

  const updatePreference = (metricKey: string, patch: Partial<DashboardPreference>) => {
    setPreferences((current) =>
      current.map((preference) =>
        preference.metricKey === metricKey ? { ...preference, ...patch } : preference,
      ),
    );
  };

  const moveMetric = (metricKey: string, direction: -1 | 1) => {
    setPreferences((current) => {
      const ordered = sortPreferences(current);
      const index = ordered.findIndex((preference) => preference.metricKey === metricKey);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= ordered.length) return current;
      const next = [...ordered];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next.map((preference, order) => ({ ...preference, order }));
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const ordered = sortPreferences(preferences).map((preference, order) => ({
        ...preference,
        order,
      }));
      const data = await saveDashboardPreferences(ordered, { companyId });
      setAvailableMetrics(data.availableMetrics || []);
      setPreferences(sortPreferences(data.preferences || []));
      window.dispatchEvent(new Event("dashboard:preferences-updated"));
      onToast("Dashboard personalizado salvo.", "success");
    } catch (err) {
      onToast(getErrorMessage(err, "Falha ao salvar personalizacao."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const data = await resetDashboardPreferences({ companyId });
      setAvailableMetrics(data.availableMetrics || []);
      setPreferences(sortPreferences(data.preferences || []));
      window.dispatchEvent(new Event("dashboard:preferences-updated"));
      onToast("Layout recomendado restaurado.", "success");
    } catch (err) {
      onToast(getErrorMessage(err, "Falha ao restaurar layout recomendado."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="dashboard" className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-600 dark:text-lime-300">
            Personalizacao
          </p>
          <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
            Dashboard
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Escolha quais indicadores aparecem para esta empresa. A preferencia fica salva por empresa, nao apenas neste navegador.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving || loading}
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Resetar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="rounded-xl bg-lime-300 px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-zinc-950 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar metrica, KPI ou widget..."
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-lime-300 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />
        <span className="rounded-xl border border-zinc-200 px-4 py-2.5 text-center text-xs font-black uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800">
          {enabledCount} ativos
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition ${
              category === item
                ? "bg-lime-300 text-zinc-950"
                : "border border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {CATEGORY_LABELS[item]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
          Carregando metricas...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : (
        <div className="grid gap-3">
          {visiblePreferences.map((preference) => {
            const metric = metricByKey.get(preference.metricKey);
            if (!metric) return null;
            return (
              <article
                key={preference.metricKey}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">{metric.label}</h3>
                      <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 dark:border-zinc-700">
                        {CATEGORY_LABELS[metric.category]}
                      </span>
                      <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500 dark:border-zinc-700">
                        {metric.displayType}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{metric.description}</p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
                      Dados: {metric.requiredData.join(", ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveMetric(preference.metricKey, -1)}
                      disabled={saving}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMetric(preference.metricKey, 1)}
                      disabled={saving}
                      className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      Descer
                    </button>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={preference.enabled}
                      onClick={() => updatePreference(preference.metricKey, { enabled: !preference.enabled })}
                      disabled={saving}
                      className={`relative h-8 w-14 rounded-full transition disabled:opacity-50 ${
                        preference.enabled ? "bg-lime-300" : "bg-zinc-300 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${
                          preference.enabled ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {visiblePreferences.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
              Nenhuma metrica encontrada com estes filtros.
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default DashboardPersonalizationPanel;
