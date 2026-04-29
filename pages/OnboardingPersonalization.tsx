import React, { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import {
  previewCompanyOnboarding,
  saveCompanyOnboarding,
} from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type {
  BusinessType,
  CompanyOnboardingPayload,
  PersonalizationRecommendations,
} from "../src/types/domain";

type OnboardingForm = CompanyOnboardingPayload & {
  businessType: BusinessType;
};

const BUSINESS_OPTIONS: Array<{ key: BusinessType; label: string; description: string }> = [
  { key: "ecommerce_physical", label: "E-commerce fisico", description: "Produtos, margem, estoque, WhatsApp e trafego." },
  { key: "ecommerce_digital", label: "Produto digital", description: "Funil, conversao, CAC, ROAS e reembolsos." },
  { key: "saas", label: "SaaS / software", description: "MRR, churn, LTV, ativacao e retencao." },
  { key: "agency", label: "Agencia / marketing", description: "Clientes, contratos, margem e recorrencia." },
  { key: "medical_clinic", label: "Clinica / saude", description: "Agenda, pacientes, no-show e atendimento seguro." },
  { key: "law_office", label: "Advocacia", description: "Leads, consultas, pipeline e follow-up juridico." },
  { key: "local_services", label: "Servicos locais", description: "Agendamentos, recorrencia e custos operacionais." },
  { key: "retail_store", label: "Loja fisica / varejo", description: "Produtos, horarios de pico e ticket medio." },
  { key: "restaurant", label: "Restaurante / delivery", description: "Cardapio, pedidos, pico e custos de entrega." },
  { key: "marketplace_seller", label: "Marketplace seller", description: "Taxas, frete, margem e produtos campeoes." },
  { key: "other", label: "Outro", description: "Configuracao balanceada para comecar rapido." },
];

const BUSINESS_LABELS = Object.fromEntries(BUSINESS_OPTIONS.map((item) => [item.key, item.label])) as Record<BusinessType, string>;

const OPERATION_TOGGLES: Array<{ key: keyof OnboardingForm; label: string; hint: string }> = [
  { key: "hasPhysicalProducts", label: "Vende produtos fisicos?", hint: "Ativa produtos, margem e mix." },
  { key: "hasDigitalProducts", label: "Vende produtos digitais?", hint: "Ativa funil, conversao e reembolso." },
  { key: "hasServices", label: "Vende servicos?", hint: "Ativa receita por servico e agenda." },
  { key: "usesPaidTraffic", label: "Usa trafego pago?", hint: "Recomenda CAC, ROAS e campanhas." },
  { key: "usesWhatsAppForSales", label: "Usa WhatsApp para vendas/atendimento?", hint: "Prepara Atendente IA e integracao." },
  { key: "usesMarketplace", label: "Vende em marketplace?", hint: "Recomenda taxas, frete e margem." },
  { key: "hasSupportTeam", label: "Tem equipe de atendimento?", hint: "Liga pausa humana e handoff." },
  { key: "hasOperationalCosts", label: "Tem custos operacionais relevantes?", hint: "Mostra custos e desperdicio." },
  { key: "wantsAutomation", label: "Quer automacao?", hint: "Recomenda projetos e IA operacional." },
  { key: "wantsMarketAnalysis", label: "Quer analise de mercado?", hint: "Ativa radar de mercado e oportunidades." },
];

const GOALS = [
  "Vender mais",
  "Reduzir custos",
  "Automatizar atendimento",
  "Entender financas",
  "Melhorar marketing",
  "Controlar clientes",
  "Analisar mercado",
  "Melhorar operacao",
  "Melhorar retencao",
  "Organizar relatorios",
];

const SIZE_OPTIONS = [
  { value: "solo", label: "Solo" },
  { value: "small_team", label: "Time pequeno" },
  { value: "medium_team", label: "Time medio" },
  { value: "large_team", label: "Time grande" },
];

const REVENUE_OPTIONS = [
  { value: "no_revenue", label: "Ainda sem receita" },
  { value: "up_to_5k", label: "Ate R$ 5 mil/mes" },
  { value: "5k_20k", label: "R$ 5 mil a R$ 20 mil/mes" },
  { value: "20k_100k", label: "R$ 20 mil a R$ 100 mil/mes" },
  { value: "100k_plus", label: "Acima de R$ 100 mil/mes" },
];

const MATURITY_OPTIONS = [
  "Ainda nao registro dados",
  "Uso planilhas",
  "Uso sistema de vendas",
  "Uso ERP/CRM",
  "Tenho varias integracoes",
];

const METRIC_LABELS: Record<string, string> = {
  revenue: "Receita",
  net_profit: "Lucro liquido",
  margin: "Margem",
  average_ticket: "Ticket medio",
  cac: "CAC",
  roas: "ROAS",
  best_selling_products: "Produtos mais vendidos",
  profit_by_product: "Lucro por produto",
  operational_costs: "Custos operacionais",
  peak_sales_hours: "Horarios de pico",
  conversion_rate: "Conversao",
  mrr: "MRR",
  churn: "Churn",
  ltv: "LTV",
  appointments: "Consultas",
  service_revenue: "Receita de servicos",
  leads: "Leads",
};

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Produtos",
  customers: "Clientes",
  financial: "Financeiro",
  reports: "Relatorios",
  attendant: "Atendente IA",
  integrations: "Integracoes",
  market_intelligence: "Mercado",
  automations: "Automacoes",
  costs: "Custos",
  insights: "Insights",
};

const DEFAULT_FORM: OnboardingForm = {
  businessType: "ecommerce_physical",
  businessModel: "",
  mainGoal: "",
  salesChannel: "",
  companySize: "",
  monthlyRevenueRange: "",
  dataMaturity: "",
  originalBusinessDescription: "",
  detectedBusinessType: null,
  classificationConfidence: null,
  usesPaidTraffic: false,
  hasPhysicalProducts: true,
  hasDigitalProducts: false,
  hasServices: false,
  usesWhatsAppForSales: true,
  usesMarketplace: false,
  hasSupportTeam: false,
  hasOperationalCosts: true,
  wantsAutomation: true,
  wantsMarketAnalysis: false,
};

function formatKey(value: string) {
  return METRIC_LABELS[value] || MODULE_LABELS[value] || value.replace(/_/g, " ");
}

const OnboardingPersonalization = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedCompanyId, setNiche } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingForm>(DEFAULT_FORM);
  const [preview, setPreview] = useState<PersonalizationRecommendations | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftKey = selectedCompanyId ? `nextlevel:onboarding:${selectedCompanyId}` : "";
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const safeReturnTo = returnTo.startsWith("/onboarding") || returnTo.startsWith("/login") ? "/dashboard" : returnTo;

  useEffect(() => {
    if (!draftKey) return;
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;
    try {
      setForm({ ...DEFAULT_FORM, ...(JSON.parse(raw) as Partial<OnboardingForm>) });
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftKey) return;
    localStorage.setItem(draftKey, JSON.stringify(form));
  }, [draftKey, form]);

  useEffect(() => {
    let cancelled = false;
    if (step !== 4 || !selectedCompanyId) return;
    setPreviewLoading(true);
    setError(null);
    previewCompanyOnboarding(form, { companyId: selectedCompanyId })
      .then((data) => {
        if (!cancelled) setPreview(data.recommendations);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, "Nao foi possivel gerar a recomendacao agora."));
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step, selectedCompanyId, form]);

  const selectedBusiness = useMemo(
    () => BUSINESS_OPTIONS.find((item) => item.key === (preview?.businessType || form.businessType)) || BUSINESS_OPTIONS[0],
    [form.businessType, preview?.businessType],
  );

  const canGoNext = useMemo(() => {
    if (step === 0) {
      if (form.businessType !== "other") return Boolean(form.businessType);
      return Boolean(form.originalBusinessDescription?.trim());
    }
    if (step === 2) return Boolean(form.mainGoal);
    if (step === 3) return Boolean(form.companySize && form.monthlyRevenueRange && form.dataMaturity);
    return true;
  }, [form, step]);

  if (!selectedCompanyId) {
    return <Navigate to="/companies" replace />;
  }

  const updateField = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const goNext = () => {
    if (!canGoNext) {
      setError("Preencha esta etapa para montarmos uma recomendacao precisa.");
      return;
    }
    setError(null);
    setStep((current) => Math.min(4, current + 1));
  };

  const submit = async (applyRecommendedSetup: boolean) => {
    try {
      setSaving(true);
      setError(null);
      const result = await saveCompanyOnboarding(
        {
          ...form,
          applyRecommendedSetup,
        },
        { companyId: selectedCompanyId },
      );
      if (result.userNiche) setNiche(result.userNiche);
      localStorage.removeItem(draftKey);
      sessionStorage.setItem(`nextlevel:onboarding-status:${selectedCompanyId}`, "ready");
      window.dispatchEvent(new CustomEvent("dashboard:preferences-updated", { detail: { companyId: selectedCompanyId } }));
      window.dispatchEvent(new CustomEvent("company:personalization-updated", { detail: { companyId: selectedCompanyId } }));
      addToast("Experiencia personalizada com sucesso.", "success");
      navigate(applyRecommendedSetup ? safeReturnTo : "/settings#dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Nao foi possivel salvar a personalizacao."));
      addToast(getErrorMessage(err, "Nao foi possivel salvar a personalizacao."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#030507] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(182,255,0,0.18),transparent_30%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.12),transparent_28%),linear-gradient(135deg,#030507_0%,#09100c_48%,#030507_100%)]" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 md:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-lime-300">NEXT LEVEL SETUP</p>
            <h1 className="mt-3 text-4xl font-black tracking-tighter md:text-6xl">Personalize sua experiencia na NEXT LEVEL</h1>
            <p className="mt-4 max-w-3xl text-sm font-medium text-zinc-400 md:text-base">
              Responda algumas perguntas rapidas para montarmos um painel, ferramentas e IA alinhados ao seu tipo de negocio.
            </p>
          </div>
          <div className="hidden rounded-3xl border border-lime-400/20 bg-lime-400/10 px-5 py-4 text-right md:block">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-lime-300">Etapa {step + 1} de 5</p>
            <p className="mt-1 text-xs text-zinc-400">Setup em menos de 3 minutos</p>
          </div>
        </div>

        <div className="mb-8 h-2 overflow-hidden rounded-full bg-zinc-900">
          <div className="h-full rounded-full bg-lime-400 transition-all duration-500" style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>

        <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/78 p-5 shadow-2xl shadow-black/30 backdrop-blur md:p-8">
          {step === 0 ? (
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Tipo de negocio</p>
              <h2 className="mt-2 text-3xl font-black tracking-tighter">Qual tipo de negocio voce administra?</h2>
              <p className="mt-2 text-sm text-zinc-500">Isso define as metricas, modulos e limites seguros do Atendente IA.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {BUSINESS_OPTIONS.map((option) => {
                  const active = form.businessType === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => updateField("businessType", option.key)}
                      className={`rounded-3xl border p-5 text-left transition ${
                        active
                          ? "border-lime-400 bg-lime-400 text-zinc-950 shadow-lg shadow-lime-400/20"
                          : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-lime-400/40"
                      }`}
                    >
                      <span className="text-base font-black">{option.label}</span>
                      <span className={`mt-2 block text-xs ${active ? "text-zinc-800" : "text-zinc-500"}`}>{option.description}</span>
                    </button>
                  );
                })}
              </div>
              {form.businessType === "other" ? (
                <label className="mt-5 block rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
                    Descricao livre
                  </span>
                  <span className="mt-2 block text-sm font-bold text-zinc-200">
                    Descreva com o que sua empresa trabalha
                  </span>
                  <textarea
                    value={form.originalBusinessDescription || ""}
                    onChange={(event) => updateField("originalBusinessDescription", event.target.value)}
                    rows={4}
                    className="mt-4 w-full resize-none rounded-2xl border border-zinc-800 bg-[#05070a] px-4 py-3 text-sm font-medium text-zinc-100 outline-none transition focus:border-lime-400"
                    placeholder="Ex: consultoria para restaurantes, curso online, clinica odontologica, loja de pecas..."
                  />
                </label>
              ) : null}
            </section>
          ) : null}

          {step === 1 ? (
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Operacao</p>
              <h2 className="mt-2 text-3xl font-black tracking-tighter">Como sua empresa funciona hoje?</h2>
              <p className="mt-2 text-sm text-zinc-500">Cada resposta liga ou desliga recomendacoes, sem encher seu painel de coisa inutil.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {OPERATION_TOGGLES.map((item) => {
                  const checked = Boolean(form[item.key]);
                  return (
                    <button
                      key={String(item.key)}
                      type="button"
                      onClick={() => updateField(item.key, !checked as never)}
                      className={`flex items-center justify-between gap-4 rounded-3xl border p-4 text-left transition ${
                        checked ? "border-lime-400/70 bg-lime-400/10" : "border-zinc-800 bg-zinc-950"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-black text-zinc-100">{item.label}</span>
                        <span className="mt-1 block text-xs text-zinc-500">{item.hint}</span>
                      </span>
                      <span className={`h-7 w-12 rounded-full p-1 transition ${checked ? "bg-lime-400" : "bg-zinc-800"}`}>
                        <span className={`block h-5 w-5 rounded-full bg-zinc-950 transition ${checked ? "translate-x-5" : ""}`} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Objetivo principal</p>
              <h2 className="mt-2 text-3xl font-black tracking-tighter">Qual e seu principal objetivo agora?</h2>
              <p className="mt-2 text-sm text-zinc-500">Vamos priorizar atalhos, insights e primeiras acoes com base nisso.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => updateField("mainGoal", goal)}
                    className={`rounded-2xl border px-5 py-4 text-left text-sm font-black transition ${
                      form.mainGoal === goal ? "border-lime-400 bg-lime-400 text-zinc-950" : "border-zinc-800 bg-zinc-950 text-zinc-300"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">Tamanho e dados</p>
              <h2 className="mt-2 text-3xl font-black tracking-tighter">Qual o tamanho e maturidade do seu negocio?</h2>
              <p className="mt-2 text-sm text-zinc-500">Isso evita recomendar metricas que dependem de dados que voce ainda nao registra.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <SelectCard title="Tamanho" value={form.companySize || ""} options={SIZE_OPTIONS} onChange={(value) => updateField("companySize", value)} />
                <SelectCard title="Receita mensal" value={form.monthlyRevenueRange || ""} options={REVENUE_OPTIONS} onChange={(value) => updateField("monthlyRevenueRange", value)} />
                <SelectCard
                  title="Maturidade de dados"
                  value={form.dataMaturity || ""}
                  options={MATURITY_OPTIONS.map((value) => ({ value, label: value }))}
                  onChange={(value) => updateField("dataMaturity", value)}
                />
              </div>
            </section>
          ) : null}

          {step === 4 ? (
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">Configuracao recomendada</p>
              <h2 className="mt-2 text-3xl font-black tracking-tighter">Seu painel vai nascer com foco em {selectedBusiness.label}</h2>
              <p className="mt-2 text-sm text-zinc-500">O dashboard inicial fica limpo; as metricas abaixo entram como sugestoes para voce ativar quando fizer sentido.</p>
              {previewLoading ? (
                <div className="mt-8 rounded-3xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">Gerando recomendacao real no backend...</div>
              ) : preview ? (
                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                  {form.businessType === "other" ? (
                    <div className="rounded-3xl border border-lime-400/25 bg-lime-400/10 p-5 lg:col-span-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">Perfil sugerido</p>
                      <p className="mt-2 text-lg font-black">{BUSINESS_LABELS[preview.businessType] || "Outro"}</p>
                      <p className="mt-2 text-sm text-zinc-400">
                        Voce pode aceitar esta sugestao agora ou voltar para escolher outro perfil manualmente.
                      </p>
                    </div>
                  ) : null}
                  <PreviewCard title="Metricas sugeridas" items={preview.dashboardMetrics.slice(0, 10).map(formatKey)} />
                  <PreviewCard title="Modulos" items={preview.modules.slice(0, 10).map(formatKey)} />
                  <PreviewCard title="Primeiras acoes" items={preview.firstActions.slice(0, 6)} />
                  <div className="rounded-3xl border border-lime-400/25 bg-lime-400/10 p-5 lg:col-span-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">Atendente IA</p>
                    <p className="mt-2 text-lg font-black">{preview.agent.tone}</p>
                    <p className="mt-2 text-sm text-zinc-400">{preview.agent.systemPrompt}</p>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => (step === 0 ? navigate("/plans") : setStep((current) => Math.max(0, current - 1)))}
              className="rounded-2xl border border-zinc-800 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-100"
            >
              {step === 0 ? "Ver plano" : "Voltar"}
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-2xl bg-lime-400 px-7 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:opacity-90"
              >
                Continuar
              </button>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  disabled={saving}
                  className="rounded-2xl border border-zinc-800 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-300 transition hover:text-white disabled:opacity-50"
                >
                  Voltar e alterar respostas
                </button>
                <button
                  type="button"
                  onClick={() => void submit(false)}
                  disabled={saving}
                  className="rounded-2xl border border-lime-400/30 bg-lime-400/10 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-lime-300 transition hover:bg-lime-400/15 disabled:opacity-50"
                >
                  Personalizar manualmente
                </button>
                <button
                  type="button"
                  onClick={() => void submit(true)}
                  disabled={saving || previewLoading}
                  className="rounded-2xl bg-lime-400 px-7 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-950 transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Salvando..." : "Usar configuracao recomendada"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

const SelectCard = ({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) => (
  <label className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{title}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-3 w-full rounded-2xl border border-zinc-800 bg-[#05070a] px-4 py-3 text-sm font-bold text-zinc-100 outline-none transition focus:border-lime-400"
    >
      <option value="">Selecione</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const PreviewCard = ({ title, items }: { title: string; items: string[] }) => (
  <div className="rounded-3xl border border-zinc-800 bg-[#070a0d] p-5">
    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{title}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1.5 text-[11px] font-bold text-lime-200">
          {item}
        </span>
      ))}
    </div>
  </div>
);

export default OnboardingPersonalization;
