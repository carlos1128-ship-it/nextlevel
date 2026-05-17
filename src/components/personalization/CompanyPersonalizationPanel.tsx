import React, { useEffect, useState } from "react";
import {
  getCompanyPersonalization,
  resetCompanyRecommendations,
  updateCompanyPersonalizationProfile,
} from "../../services/endpoints";
import NextLevelLoader from "../../../components/NextLevelLoader";
import { getErrorMessage } from "../../services/error";
import type { BusinessType, CompanyOnboardingPayload, CompanyPersonalizationResponse } from "../../types/domain";

const BUSINESS_TYPES: Array<{ value: BusinessType; label: string }> = [
  { value: "ecommerce_physical", label: "E-commerce físico" },
  { value: "ecommerce_digital", label: "Produto digital / infoproduto" },
  { value: "saas", label: "SaaS / software" },
  { value: "agency", label: "Agência / marketing" },
  { value: "medical_clinic", label: "Clínica / saúde" },
  { value: "law_office", label: "Advocacia" },
  { value: "local_services", label: "Serviços locais" },
  { value: "retail_store", label: "Loja física / varejo" },
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
  { key: "usesPaidTraffic", label: "Usa tráfego pago" },
  { key: "hasPhysicalProducts", label: "Produtos físicos" },
  { key: "hasDigitalProducts", label: "Produtos digitais" },
  { key: "hasServices", label: "Serviços" },
  { key: "usesWhatsAppForSales", label: "WhatsApp em vendas/atendimento" },
  { key: "usesMarketplace", label: "Marketplace" },
  { key: "hasSupportTeam", label: "Equipe de atendimento" },
  { key: "hasOperationalCosts", label: "Custos operacionais relevantes" },
  { key: "wantsAutomation", label: "Quer automação" },
  { key: "wantsMarketAnalysis", label: "Quer mercado/inteligência" },
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
      .catch((error) => onToast(getErrorMessage(error, "Não foi possível carregar a personalização."), "error"))
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
      onToast(getErrorMessage(error, "Não foi possível salvar o perfil."), "error");
    } finally {
      setSaving(false);
    }
  };

  const reapply = async () => {
    if (!companyId) return;
    if (!window.confirm("Reaplicar recomendações pode sobrescrever módulos e métricas manuais. Continuar?")) {
      return;
    }
    try {
      setSaving(true);
      const result = await resetCompanyRecommendations({ companyId });
      setData(result);
      window.dispatchEvent(new CustomEvent("dashboard:preferences-updated", { detail: { companyId } }));
      window.dispatchEvent(new CustomEvent("company:personalization-updated", { detail: { companyId } }));
      onToast("Recomendações reaplicadas.", "success");
    } catch (error) {
      onToast(getErrorMessage(error, "Não foi possível reaplicar recomendações."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="personalization" className="nl-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-500">Personalização</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-100">
            Perfil empresarial
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Ajuste o tipo de negócio e reaplique recomendações quando sua operação mudar.
          </p>
        </div>
        <button
          type="button"
          onClick={reapply}
          disabled={saving || loading || !data?.profile}
          className="nl-button-secondary border-lime-400/30 text-lime-300 disabled:opacity-50"
        >
          Reaplicar recomendações
        </button>
      </div>

      {!companyId ? (
        <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-5 text-sm text-zinc-500">
          Selecione uma empresa para editar a personalização.
        </div>
      ) : loading ? (
        <NextLevelLoader fullscreen={false} className="mt-5" />
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="text-sm font-bold text-zinc-300">
              Tipo de negócio
              <select
                value={form.businessType}
                onChange={(event) => updateField("businessType", event.target.value as BusinessType)}
                className="nl-input mt-2"
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-bold text-zinc-300">
              Objetivo principal
              <input
                value={form.mainGoal || ""}
                onChange={(event) => updateField("mainGoal", event.target.value)}
                placeholder="Ex: vender mais, reduzir custos..."
                className="nl-input mt-2"
              />
            </label>
            <label className="text-sm font-bold text-zinc-300">
              Maturidade de dados
              <input
                value={form.dataMaturity || ""}
                onChange={(event) => updateField("dataMaturity", event.target.value)}
                placeholder="Planilhas, ERP, CRM..."
                className="nl-input mt-2"
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
                      : "border-white/10 text-zinc-500"
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
                ? `Recomendados: ${data.recommendations.modules.length} módulos, ${data.recommendations.dashboardMetrics.length} métricas.`
                : "Crie um perfil para gerar recomendações."}
            </p>
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="nl-button-primary disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
