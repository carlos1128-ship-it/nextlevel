import React, { useEffect, useState } from "react";
import {
  getCompanyPersonalization,
  resetCompanyRecommendations,
  updateCompanyPersonalizationProfile,
} from "../../services/endpoints";
import { getErrorMessage } from "../../services/error";
import type { BusinessType, CompanyOnboardingPayload, CompanyPersonalizationResponse } from "../../types/domain";

const BUSINESS_TYPES: Array<{ value: BusinessType; label: string }> = [
  { value: "ecommerce_physical", label: "E-commerce fisico" },
  { value: "ecommerce_digital", label: "Produto digital / infoproduto" },
  { value: "saas", label: "SaaS / software" },
  { value: "agency", label: "Agencia / marketing" },
  { value: "medical_clinic", label: "Clinica / saude" },
  { value: "law_office", label: "Advocacia" },
  { value: "local_services", label: "Servicos locais" },
  { value: "retail_store", label: "Loja fisica / varejo" },
  { value: "restaurant", label: "Restaurante / delivery" },
  { value: "marketplace_seller", label: "Marketplace seller" },
  { value: "other", label: "Outro" },
];

const EMPTY_FORM: CompanyOnboardingPayload = {
  businessType: "other",
  mainGoal: "",
  companySize: "",
  monthlyRevenueRange: "",
  dataMaturity: "",
  usesPaidTraffic: false,
  hasPhysicalProducts: false,
  hasDigitalProducts: false,
  hasServices: false,
  usesWhatsAppForSales: false,
  usesMarketplace: false,
  hasSupportTeam: false,
  hasOperationalCosts: false,
  wantsAutomation: false,
  wantsMarketAnalysis: false,
};

const TOGGLES: Array<{ key: keyof CompanyOnboardingPayload; label: string }> = [
  { key: "usesPaidTraffic", label: "Usa trafego pago" },
  { key: "hasPhysicalProducts", label: "Produtos fisicos" },
  { key: "hasDigitalProducts", label: "Produtos digitais" },
  { key: "hasServices", label: "Servicos" },
  { key: "usesWhatsAppForSales", label: "WhatsApp em vendas/atendimento" },
  { key: "usesMarketplace", label: "Marketplace" },
  { key: "hasSupportTeam", label: "Equipe de atendimento" },
  { key: "hasOperationalCosts", label: "Custos operacionais relevantes" },
  { key: "wantsAutomation", label: "Quer automacao" },
  { key: "wantsMarketAnalysis", label: "Quer mercado/inteligencia" },
];

export default function CompanyPersonalizationPanel({
  companyId,
  onToast,
}: {
  companyId?: string | null;
  onToast: (message: string, type?: "success" | "error" | "info") => void;
}) {
  const [data, setData] = useState<CompanyPersonalizationResponse | null>(null);
  const [form, setForm] = useState<CompanyOnboardingPayload>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    getCompanyPersonalization({ companyId })
      .then((next) => {
        setData(next);
        setForm({ ...EMPTY_FORM, ...(next.profile || {}) });
      })
      .catch((error) => onToast(getErrorMessage(error, "Nao foi possivel carregar a personalizacao."), "error"))
      .finally(() => setLoading(false));
  }, [companyId, onToast]);

  const updateField = <K extends keyof CompanyOnboardingPayload>(key: K, value: CompanyOnboardingPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveProfile = async () => {
    if (!companyId) return;
    try {
      setSaving(true);
      const result = await updateCompanyPersonalizationProfile(form, { companyId });
      setData((current) => current ? { ...current, ...result } : current);
      onToast("Perfil empresarial salvo.", "success");
    } catch (error) {
      onToast(getErrorMessage(error, "Nao foi possivel salvar o perfil."), "error");
    } finally {
      setSaving(false);
    }
  };

  const reapply = async () => {
    if (!companyId) return;
    if (!window.confirm("Reaplicar recomendacoes pode sobrescrever modulos e metricas manuais. Continuar?")) {
      return;
    }
    try {
      setSaving(true);
      const result = await resetCompanyRecommendations({ companyId });
      setData(result);
      window.dispatchEvent(new CustomEvent("dashboard:preferences-updated", { detail: { companyId } }));
      window.dispatchEvent(new CustomEvent("company:personalization-updated", { detail: { companyId } }));
      onToast("Recomendacoes reaplicadas.", "success");
    } catch (error) {
      onToast(getErrorMessage(error, "Nao foi possivel reaplicar recomendacoes."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="personalization" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-900 dark:bg-zinc-950">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-500">Personalizacao</p>
          <h2 className="mt-2 text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100">
            Perfil empresarial
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Ajuste o tipo de negocio e reaplique recomendacoes quando sua operacao mudar.
          </p>
        </div>
        <button
          type="button"
          onClick={reapply}
          disabled={saving || loading || !data?.profile}
          className="rounded-2xl border border-lime-400/30 bg-lime-400/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-lime-600 transition hover:bg-lime-400/15 disabled:opacity-50 dark:text-lime-300"
        >
          Reaplicar recomendacoes
        </button>
      </div>

      {!companyId ? (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-800">
          Selecione uma empresa para editar a personalizacao.
        </div>
      ) : loading ? (
        <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-800">
          Carregando perfil...
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Tipo de negocio
              <select
                value={form.businessType}
                onChange={(event) => updateField("businessType", event.target.value as BusinessType)}
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-lime-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Objetivo principal
              <input
                value={form.mainGoal || ""}
                onChange={(event) => updateField("mainGoal", event.target.value)}
                placeholder="Ex: vender mais, reduzir custos..."
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-lime-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Maturidade de dados
              <input
                value={form.dataMaturity || ""}
                onChange={(event) => updateField("dataMaturity", event.target.value)}
                placeholder="Planilhas, ERP, CRM..."
                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none focus:border-lime-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-2">
            {TOGGLES.map((item) => {
              const checked = Boolean(form[item.key]);
              return (
                <button
                  key={String(item.key)}
                  type="button"
                  onClick={() => updateField(item.key, !checked as never)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                    checked
                      ? "border-lime-400/60 bg-lime-400/10 text-lime-700 dark:text-lime-300"
                      : "border-zinc-200 text-zinc-500 dark:border-zinc-800"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-zinc-500">
              {data?.recommendations
                ? `Recomendados: ${data.recommendations.modules.length} modulos, ${data.recommendations.dashboardMetrics.length} metricas.`
                : "Crie um perfil para gerar recomendacoes."}
            </p>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="rounded-2xl bg-lime-400 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
