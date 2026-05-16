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
    <div className="min-h-screen bg-[#030508] px-5 py-8 text-white">
      {showGlobalPlanLoading ? (
        <div className="fixed inset-0 z-[80]">
          <NextLevelLoader />
        </div>
      ) : null}
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">NEXT LEVEL</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Escolha seu nível</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Selecione um plano e finalize sua assinatura em um ambiente seguro. O acesso é liberado assim que o pagamento for confirmado.
            </p>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              {isInitialBillingLoading
                ? "Preparando pagamento..."
                : isLoadingBilling
                  ? "Validando plano atual..."
                : checkoutEnabled
                  ? "Pagamento seguro disponível"
                  : "Pagamento temporariamente indisponível."}
            </p>
            {params.get("upgrade") ? (
              <p className="mt-3 text-sm font-bold text-lime-300">Seu plano atual não dá acesso a esse recurso.</p>
            ) : null}
            {isLoggedIn && hasActiveSubscription ? (
              <div className="mt-5 rounded-lg border border-lime-400/20 bg-lime-400/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-300">Plano atual</p>
                <p className="mt-2 text-lg font-black text-white">
                  {planLabel(currentPlan)} {currentBillingCycle === "ANNUAL" ? "anual" : "mensal"}
                </p>
                <p className="mt-2 text-xs leading-5 text-lime-100/80">
                  Para cancelar, trocar forma de pagamento ou ver cobranças, abra o gerenciamento da assinatura.
                </p>
              </div>
            ) : null}
            {selectedPlan ? (
              <p className="mt-3 text-sm font-bold text-lime-300">
                Você escolheu o plano {planSelectionLabel(selectedPlan)}.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => updateBillingCycle("MONTHLY")}
                className={`rounded-md px-5 py-2 text-xs font-black uppercase tracking-[0.14em] ${billingCycle === "MONTHLY" ? "bg-white text-zinc-950" : "text-zinc-400"}`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => updateBillingCycle("ANNUAL")}
                className={`rounded-md px-5 py-2 text-xs font-black uppercase tracking-[0.14em] ${billingCycle === "ANNUAL" ? "bg-lime-300 text-zinc-950" : "text-zinc-400"}`}
              >
                Anual
              </button>
            </div>
            {isLoggedIn ? (
              <>
              {hasActiveSubscription ? (
                <button
                  type="button"
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="rounded-lg border border-lime-300/40 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-lime-200 disabled:opacity-60"
                >
                  {portalLoading ? "Abrindo..." : "Gerenciar assinatura"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.06]"
              >
                Voltar ao dashboard
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.06]"
              >
                Encerrar sessão
              </button>
              </>
            ) : null}
          </div>
        </header>

        {message ? (
          <div className="mt-6 rounded-lg border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm font-bold text-lime-200">
            {message}
          </div>
        ) : null}

        {isActuallyUnavailable && billingConfigMessage ? (
          <div className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
            {billingConfigMessage}
          </div>
        ) : null}

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
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
              ? "Preparando..."
              : portalLoading && hasActiveSubscription
                ? "Abrindo..."
              : isInitialBillingLoading
                ? "Aguarde"
                : isExactCurrentPlan
                  ? "Gerenciar assinatura"
                    : hasActiveSubscription
                    ? (isUpgrade ? "Fazer upgrade" : isDowngrade ? "Fazer downgrade" : "Alterar cobrança")
                    : available
                      ? "Assinar agora"
                      : "Plano indisponível";

            return (
              <article
                key={plan.key}
                className={`relative flex min-h-[520px] flex-col rounded-lg border p-6 ${
                  isSelected
                    ? "border-lime-300 bg-[linear-gradient(160deg,rgba(182,255,0,0.14),rgba(8,10,14,1)_58%)] shadow-[0_0_65px_rgba(182,255,0,0.18)]"
                    : plan.key === "PREMIUM"
                      ? "border-lime-400/35 bg-[linear-gradient(160deg,rgba(182,255,0,0.1),rgba(8,10,14,1)_60%)] shadow-[0_0_55px_rgba(182,255,0,0.1)]"
                      : "border-white/[0.08] bg-white/[0.035]"
                }`}
              >
                {isSelected && !isCurrentPlan ? (
                  <span className="absolute left-5 top-5 rounded-full border border-lime-300/40 bg-lime-300/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-lime-200">
                    Selecionado
                  </span>
                ) : null}
                {isCurrentPlan ? (
                  <span className="absolute left-5 top-5 rounded-full border border-lime-300/40 bg-lime-300/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-lime-200">
                    Plano atual
                  </span>
                ) : null}
                {plan.key === "PREMIUM" ? (
                  <span className="absolute right-5 top-5 rounded-full bg-lime-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-950">
                    Mais escolhido
                  </span>
                ) : null}
                <h2 className="mt-10 text-2xl font-black">{getPublicPlanName(plan.key, plan.name)}</h2>
                <p className="mt-3 min-h-16 text-sm leading-6 text-zinc-400">{display?.summary || plan.description}</p>
                <div className="mt-5">
                  <span className="text-4xl font-black">
                    {price ? formatCurrencyInCents(displayAmountInCents) : "Indisponível"}
                  </span>
                  <span className="ml-2 text-sm text-zinc-500">{billingCycle === "MONTHLY" ? "/mês" : "/ano"}</span>
                </div>
                <div className="mt-5 rounded-lg border border-lime-300/[0.16] bg-lime-300/[0.055] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">{display.aiTier}</p>
                  <ul className="mt-3 space-y-1.5">
                    {display.aiLimitItems.map((item) => (
                      <li key={item} className="text-sm font-bold leading-5 text-zinc-100">{item}</li>
                    ))}
                  </ul>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {(display?.features || plan.features).map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-lime-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={!actionAvailable || loading || isInitialBillingLoading || (hasActiveSubscription && portalLoading)}
                  onClick={() => subscribe(plan.key)}
                  className={`mt-7 rounded-lg px-5 py-4 text-sm font-black uppercase tracking-[0.14em] transition ${
                    actionAvailable
                      ? "bg-lime-300 text-zinc-950 hover:brightness-105"
                      : "cursor-not-allowed border border-amber-400/25 bg-amber-400/10 text-amber-200"
                  }`}
                >
                  {buttonLabel}
                </button>
                <p className={`mt-3 min-h-10 text-xs font-semibold leading-5 ${actionAvailable ? "text-lime-200" : "text-zinc-500"}`}>
                  {hasActiveSubscription
                    ? isExactCurrentPlan
                      ? "Cancele, veja cobranças ou atualize a forma de pagamento no ambiente seguro."
                      : "A alteração deste plano será aplicada de forma segura na sua assinatura."
                    : available
                      ? "Pagamento em ambiente seguro."
                      : "Este plano ainda não está pronto para pagamento."}
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
