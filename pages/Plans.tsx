import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, useBilling } from "../App";
import NextLevelLoader from "../components/NextLevelLoader";
import {
  BillingCycle,
  BillingPlan,
  BillingPlanKey,
  changeBillingPlan,
  createBillingCheckout,
  createBillingPortal,
  getBillingConfig,
  getBillingMe,
  getBillingPlans,
} from "../src/services/endpoints";
import {
  clearPendingSelectedPlan,
  planLabel,
  planSelectionLabel,
  PendingPlanSelection,
  readPendingSelectedPlan,
  readPlanSelectionFromSearch,
  savePendingSelectedPlan,
} from "../src/utils/billingSelection";
import {
  formatCurrencyInCents,
  getDisplayPlanAmountInCents,
  getPublicPlanName,
  PLAN_DISPLAY,
} from "../src/utils/planDisplay";

const fallbackPlans: BillingPlan[] = [
  {
    key: "COMMON",
    name: "Essencial",
    description: PLAN_DISPLAY.COMMON.summary,
    level: 1,
    features: PLAN_DISPLAY.COMMON.features,
    prices: {
      MONTHLY: { amountInCents: 5700, currency: "BRL", available: false },
      ANNUAL: { amountInCents: 57000, currency: "BRL", available: false },
    },
  },
  {
    key: "PREMIUM",
    name: "Premium",
    description: PLAN_DISPLAY.PREMIUM.summary,
    level: 2,
    features: PLAN_DISPLAY.PREMIUM.features,
    prices: {
      MONTHLY: { amountInCents: 9700, currency: "BRL", available: false },
      ANNUAL: { amountInCents: 97000, currency: "BRL", available: false },
    },
  },
  {
    key: "PRO_BUSINESS",
    name: "Pro Business",
    description: PLAN_DISPLAY.PRO_BUSINESS.summary,
    level: 3,
    features: PLAN_DISPLAY.PRO_BUSINESS.features,
    prices: {
      MONTHLY: { amountInCents: 19700, currency: "BRL", available: false },
      ANNUAL: { amountInCents: 197000, currency: "BRL", available: false },
    },
  },
];

const Plans = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isLoggedIn, logout, selectedCompanyId } = useAuth();
  const { refreshBilling } = useBilling();
  const saved = readPlanSelectionFromSearch(params) || readPendingSelectedPlan();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(saved?.billingCycle || "MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<PendingPlanSelection | null>(saved);
  const [plans, setPlans] = useState<BillingPlan[]>(fallbackPlans);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentBillingCycle, setCurrentBillingCycle] = useState<BillingCycle | null>(null);
  const [loadingPlanKey, setLoadingPlanKey] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutEnabled, setCheckoutEnabled] = useState<boolean | null>(null);
  const [billingConfigMessage, setBillingConfigMessage] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [billingLoadError, setBillingLoadError] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextSelection = readPlanSelectionFromSearch(params) || readPendingSelectedPlan();
    if (!nextSelection) return;
    setSelectedPlan(nextSelection);
    setBillingCycle(nextSelection.billingCycle);
    savePendingSelectedPlan(nextSelection);
    setMessage(`Você escolheu o plano ${planSelectionLabel(nextSelection)}. Continue para finalizar o pagamento com segurança.`);
  }, [params]);

  useEffect(() => {
    Promise.allSettled([getBillingPlans(), getBillingConfig()])
      .then(([plansResult, configResult]) => {
        if (plansResult.status === "fulfilled" && plansResult.value.length) {
          setPlans(plansResult.value);
        }
        if (configResult.status === "fulfilled") {
          setCheckoutEnabled(Boolean(configResult.value.checkoutEnabled));
          setBillingConfigMessage(configResult.value.message);
        } else {
          setCheckoutEnabled(false);
          setBillingConfigMessage("Pagamento temporariamente indisponível.");
        }
      })
      .catch(() => {
        setPlans(fallbackPlans);
        setCheckoutEnabled(false);
        setBillingConfigMessage("Pagamento temporariamente indisponível.");
      })
      .finally(() => {
        setIsLoadingPlans(false);
        setIsLoadingConfig(false);
      });
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    setIsLoadingBilling(true);
    setBillingLoadError(false);
    getBillingMe({ companyId: selectedCompanyId })
      .then((billing) => {
        setHasActiveSubscription(Boolean(billing.hasActiveSubscription));
        setCurrentPlan(billing.subscription?.planKey || billing.activePlan || null);
        setCurrentBillingCycle(billing.subscription?.billingCycle || null);
      })
      .catch(() => {
        setBillingLoadError(true);
      setMessage("Não foi possível carregar sua assinatura agora. Tente novamente em instantes.");
      })
      .finally(() => setIsLoadingBilling(false));
  }, [isLoggedIn, selectedCompanyId]);

  const orderedPlans = useMemo(() => [...plans].sort((a, b) => a.level - b.level), [plans]);
  const isInitialBillingLoading = isLoadingPlans || isLoadingConfig;
  const isActuallyUnavailable = !isInitialBillingLoading && checkoutEnabled === false;
  const currentPlanLevel = orderedPlans.find((plan) => plan.key === currentPlan)?.level || 0;

  const updateBillingCycle = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    if (!selectedPlan) return;
    const nextSelection = { ...selectedPlan, billingCycle: cycle };
    setSelectedPlan(nextSelection);
    savePendingSelectedPlan(nextSelection);
  };

  const syncBillingState = async () => {
    const billing = await getBillingMe({ companyId: selectedCompanyId });
    setHasActiveSubscription(Boolean(billing.hasActiveSubscription));
    setCurrentPlan(billing.subscription?.planKey || billing.activePlan || null);
    setCurrentBillingCycle(billing.subscription?.billingCycle || null);
    await refreshBilling(true);
    return billing;
  };

  const subscribe = async (planKey: BillingPlanKey) => {
    const nextSelection = { planKey, billingCycle };
    setSelectedPlan(nextSelection);
    savePendingSelectedPlan(nextSelection);

    if (!isLoggedIn) {
      navigate(`/login?intent=subscribe&plan=${planKey}&cycle=${billingCycle}`);
      return;
    }

    if (billingLoadError) {
      setMessage("Não foi possível validar sua assinatura agora. Tente novamente em instantes.");
      return;
    }

    setLoadingPlanKey(planKey);
    setMessage(hasActiveSubscription ? "Atualizando sua assinatura..." : "Abrindo ambiente seguro de pagamento...");
    try {
      if (hasActiveSubscription) {
        if (currentPlan === planKey && currentBillingCycle === billingCycle) {
          await openPortal();
          return;
        }

        const result = await changeBillingPlan({
          targetPlanKey: planKey,
          planKey,
          billingCycle,
          billingInterval: billingCycle === "ANNUAL" ? "yearly" : "monthly",
          companyId: selectedCompanyId,
        });

        if (result.status === "checkout_required" && result.checkoutUrl) {
          clearPendingSelectedPlan();
          window.location.href = result.checkoutUrl;
          return;
        }

        if (result.status === "portal_required") {
          setMessage(result.message || "Abra o ambiente seguro de assinatura para concluir esta alteração.");
          await openPortal();
          return;
        }

        await syncBillingState();
        clearPendingSelectedPlan();
        setMessage(result.message || "Plano atualizado com sucesso.");
        return;
      }

      const checkout = await createBillingCheckout({
        planKey,
        billingCycle,
        billingInterval: billingCycle === "ANNUAL" ? "yearly" : "monthly",
        companyId: selectedCompanyId,
      });
      clearPendingSelectedPlan();
      window.location.href = checkout.checkoutUrl;
    } catch (error: any) {
      const code = error?.response?.data?.code;
      setMessage(
        code === "PLAN_PRICE_UNAVAILABLE"
          ? "Este plano está indisponível no momento."
          : "Não foi possível iniciar o pagamento agora. Tente novamente em alguns instantes.",
      );
    } finally {
      setLoadingPlanKey(null);
    }
  };

  const openPortal = async () => {
    try {
      setPortalLoading(true);
      setMessage("Abrindo ambiente seguro de assinatura...");
      const session = await createBillingPortal({ companyId: selectedCompanyId });
      window.location.href = session.portalUrl;
    } catch {
      setMessage("Não foi possível abrir o gerenciamento da assinatura agora.");
    } finally {
      setPortalLoading(false);
    }
  };
  const showGlobalPlanLoading = Boolean(loadingPlanKey || portalLoading);

  return (
    <div className="nl-page min-h-screen bg-[#030508] px-5 py-8 overflow-y-auto custom-scrollbar">
      {showGlobalPlanLoading ? (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm shadow-2xl">
          <NextLevelLoader />
        </div>
      ) : null}
      
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-8 border-b border-white/5 pb-10 md:flex-row md:items-end md:justify-between pt-4">
          <div className="flex-1">
            <p className="nl-eyebrow text-[var(--nl-neon)] mb-3">Infraestrutura Estratégica</p>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl text-white">Escolha seu nível de <span className="text-[var(--nl-neon)] italic">ROI</span>.</h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--nl-text-secondary)]">
              Selecione o plano ideal para a escala da sua operação. A ativação é instantânea e o processamento de pagamentos é feito sob rigorosos protocolos de segurança.
            </p>
            
            <div className="mt-8 flex items-center gap-4">
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${checkoutEnabled ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-amber-500/20 bg-amber-500/5 text-amber-400"}`}>
                  <span className={`h-2 w-2 rounded-full ${checkoutEnabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {isInitialBillingLoading ? "Iniciando Segurança..." : checkoutEnabled ? "Ambiente Seguro Ativo" : "Checkout em Manutenção"}
               </div>
               {params.get("upgrade") && (
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#B2FF00] animate-pulse">Upgrade Requerido</span>
               )}
            </div>

            {isLoggedIn && hasActiveSubscription && (
              <div className="mt-8 nl-card-glass p-5 border-emerald-500/20 max-w-md">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Assinatura Ativa</p>
                <div className="flex items-center justify-between mt-1">
                   <h2 className="text-xl font-black text-white">
                     {planLabel(currentPlan)} <span className="opacity-40 text-sm font-medium">({currentBillingCycle === "ANNUAL" ? "Anual" : "Mensal"})</span>
                   </h2>
                   <button onClick={openPortal} className="text-[10px] font-bold text-[var(--nl-neon)] uppercase tracking-widest hover:underline">Gerenciar</button>
                </div>
              </div>
            )}
            {selectedPlan && !hasActiveSubscription && (
              <p className="mt-6 text-sm font-bold text-[var(--nl-neon)] animate-pulse">
                Você escolheu o plano {planSelectionLabel(selectedPlan)}. Finalize abaixo.
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-5">
            <div className="flex rounded-xl border border-white/5 bg-white/[0.02] p-1.5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => updateBillingCycle("MONTHLY")}
                className={`rounded-lg px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition-all ${billingCycle === "MONTHLY" ? "bg-white text-zinc-950 shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => updateBillingCycle("ANNUAL")}
                className={`rounded-lg px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] transition-all flex items-center gap-2 ${billingCycle === "ANNUAL" ? "bg-[var(--nl-neon)] text-zinc-950 shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Anual <span className="px-1.5 py-0.5 rounded bg-black/10 text-[8px] font-black">-15% OFF</span>
              </button>
            </div>
            {isLoggedIn && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 transition-all"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-white/5 transition-all"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        {message && !hasActiveSubscription && (
          <div className="mt-8 p-4 rounded-xl border border-[var(--nl-neon)]/20 bg-[var(--nl-neon)]/5 text-xs font-bold text-[var(--nl-neon)] animate-pulse">
            {message}
          </div>
        )}

        {isActuallyUnavailable && billingConfigMessage && (
          <div className="mt-8 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs font-bold text-amber-200">
            {billingConfigMessage}
          </div>
        )}

        <section className="mt-12 grid gap-8 lg:grid-cols-3 mb-16">
          {orderedPlans.map((plan) => {
            const display = PLAN_DISPLAY[plan.key];
            const price = plan.prices[billingCycle];
            const displayAmountInCents = getDisplayPlanAmountInCents(
              plan.key,
              billingCycle,
              price?.amountInCents || 0,
            );
            const available = !isInitialBillingLoading && Boolean(price?.available) && checkoutEnabled === true;
            const loading = loadingPlanKey === plan.key;
            const isSelected = selectedPlan?.planKey === plan.key;
            const isCurrentPlan = hasActiveSubscription && currentPlan === plan.key;
            const isExactCurrentPlan = isCurrentPlan && currentBillingCycle === billingCycle;
            const isUpgrade = hasActiveSubscription && plan.level > currentPlanLevel;
            const isDowngrade = hasActiveSubscription && plan.level < currentPlanLevel;
            const actionAvailable = !isLoadingBilling && !billingLoadError && (hasActiveSubscription || available);
            const buttonLabel = loading
              ? "Processando..."
              : portalLoading && hasActiveSubscription
                ? "Abrindo Portal..."
              : isInitialBillingLoading
                ? "Aguarde"
                : isExactCurrentPlan
                  ? "Minha Assinatura"
                    : hasActiveSubscription
                    ? (isUpgrade ? "Mudar para este" : isDowngrade ? "Mudar para este" : "Mudar Faturamento")
                    : available
                      ? "Assinar Agora"
                      : "Sob Consulta";

            return (
              <article
                key={plan.key}
                className={`relative flex min-h-[600px] flex-col rounded-3xl border p-8 transition-all duration-500 overflow-hidden ${
                  isSelected
                    ? "border-[var(--nl-neon)] bg-[linear-gradient(160deg,rgba(178,255,0,0.1),rgba(3,5,8,1)_40%)] shadow-[0_0_80px_rgba(178,255,0,0.05)]"
                    : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="absolute inset-0 pointer-events-none opacity-20">
                   {isSelected && <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--nl-neon)] blur-[100px]" />}
                </div>

                <div className="mb-8 flex items-center justify-between">
                   {plan.key === "PREMIUM" && (
                     <span className="rounded-full bg-[var(--nl-neon)] px-3 py-1 text-[9px] font-black uppercase text-black ring-4 ring-[var(--nl-neon)]/10">
                       Popular
                     </span>
                   )}
                   {isCurrentPlan && (
                     <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[9px] font-black uppercase text-emerald-400">
                       Plano Atual
                     </span>
                   )}
                </div>

                <h2 className="text-3xl font-black text-white">{getPublicPlanName(plan.key, plan.name)}</h2>
                <p className="mt-4 min-h-[50px] text-xs leading-relaxed text-[var(--nl-text-secondary)]">{display?.summary || plan.description}</p>
                
                <div className="mt-8 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">
                    {price ? formatCurrencyInCents(displayAmountInCents) : "--"}
                  </span>
                  <span className="text-[10px] font-black text-[var(--nl-text-muted)] uppercase tracking-widest">{billingCycle === "MONTHLY" ? "/ mensal" : "/ anual"}</span>
                </div>

                <div className="mt-10 mb-8 p-5 rounded-2xl bg-white/5 border border-white/5">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--nl-neon)] mb-4">{display.aiTier}</p>
                   <div className="space-y-3">
                      {display.aiLimitItems.map((item) => (
                        <div key={item} className="flex items-center gap-3">
                           <div className="h-1.5 w-1.5 rounded-full bg-[var(--nl-neon)]" />
                           <span className="text-[11px] font-bold text-white opacity-80">{item}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <ul className="flex-1 space-y-4">
                  {(display?.features || plan.features).map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg className="h-4 w-4 shrink-0 text-[var(--nl-neon)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[13px] text-[var(--nl-text-secondary)]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10">
                  <button
                    type="button"
                    disabled={!actionAvailable || loading || isInitialBillingLoading || (hasActiveSubscription && portalLoading)}
                    onClick={() => subscribe(plan.key)}
                    className={`w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                      isExactCurrentPlan
                        ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                        : actionAvailable
                        ? "bg-[var(--nl-neon)] text-black hover:scale-[1.02] active:scale-95 shadow-[0_4px_25px_rgba(182,255,0,0.15)]"
                        : "bg-white/5 border border-white/5 text-zinc-600 grayscale cursor-not-allowed"
                    }`}
                  >
                    {buttonLabel}
                  </button>
                </div>
                
                <p className="mt-4 text-center text-[9px] font-bold uppercase tracking-widest text-[var(--nl-text-muted)] opacity-60">
                  Segurança Stripe de Ponta a Ponta
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default Plans;
