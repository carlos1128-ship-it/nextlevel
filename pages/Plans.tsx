import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import {
  BillingCycle,
  BillingPlan,
  BillingPlanKey,
  createBillingCheckout,
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
import { formatCurrencyInCents, getDisplayPlanAmountInCents, getPublicPlanName, PLAN_DISPLAY } from "../src/utils/planDisplay";

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
    name: "Business",
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
  const { isLoggedIn, logout } = useAuth();
  const saved = readPlanSelectionFromSearch(params) || readPendingSelectedPlan();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    saved?.billingCycle || "MONTHLY",
  );
  const [selectedPlan, setSelectedPlan] = useState<PendingPlanSelection | null>(saved);
  const [plans, setPlans] = useState<BillingPlan[]>(fallbackPlans);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [loadingPlanKey, setLoadingPlanKey] = useState<string | null>(null);
  const [checkoutEnabled, setCheckoutEnabled] = useState<boolean | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<string>("MANUAL");
  const [billingConfigMessage, setBillingConfigMessage] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
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
        setIsLoadingPlans(false);
        if (configResult.status === "fulfilled") {
          setCheckoutEnabled(Boolean(configResult.value.checkoutEnabled));
          setPaymentProvider(configResult.value.paymentProvider);
          setBillingConfigMessage(configResult.value.message);
        } else {
          setCheckoutEnabled(false);
          setBillingConfigMessage("Gateway de pagamento temporariamente indisponivel.");
        }
        setIsLoadingConfig(false);
      })
      .catch(() => {
        setPlans(fallbackPlans);
        setCheckoutEnabled(false);
        setBillingConfigMessage("Gateway de pagamento temporariamente indisponivel.");
        setIsLoadingPlans(false);
        setIsLoadingConfig(false);
      });
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    getBillingMe()
      .then((billing) => {
        setHasActiveSubscription(Boolean(billing.hasActiveSubscription));
        setCurrentPlan(billing.subscription?.planKey || null);
        setCurrentSource(billing.subscription?.source || null);
      })
      .catch(() => {
        setHasActiveSubscription(false);
      });
  }, [isLoggedIn]);

  const orderedPlans = useMemo(
    () => [...plans].sort((a, b) => a.level - b.level),
    [plans],
  );
  const isInitialBillingLoading = isLoadingPlans || isLoadingConfig;
  const isActuallyUnavailable = !isInitialBillingLoading && checkoutEnabled === false;

  const updateBillingCycle = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
    if (!selectedPlan) return;
    const nextSelection = { ...selectedPlan, billingCycle: cycle };
    setSelectedPlan(nextSelection);
    savePendingSelectedPlan(nextSelection);
  };

  const subscribe = async (planKey: BillingPlanKey) => {
    const nextSelection = { planKey, billingCycle };
    setSelectedPlan(nextSelection);
    savePendingSelectedPlan(nextSelection);

    if (!isLoggedIn) {
      navigate(`/login?intent=subscribe&plan=${planKey}&cycle=${billingCycle}`);
      return;
    }

    setLoadingPlanKey(planKey);
    setMessage("Preparando pagamento seguro...");
    try {
      const checkout = await createBillingCheckout({ planKey, billingCycle });
      clearPendingSelectedPlan();
      window.location.href = checkout.checkoutUrl;
    } catch (error: any) {
      const code = error?.response?.data?.code;
      setMessage(
        code === "PLAN_PRICE_UNAVAILABLE"
          ? "Este plano está indisponível no momento."
          : code === "PAYMENT_PROVIDER_UNAVAILABLE"
          ? "Gateway de pagamento temporariamente indisponível."
          : "Não foi possível iniciar o pagamento agora. Tente novamente em alguns instantes.",
      );
    } finally {
      setLoadingPlanKey(null);
    }
  };

  if (isLoggedIn && hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-[#030508] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-lime-400/20 bg-white/[0.04] p-8 text-center shadow-[0_0_60px_rgba(182,255,0,0.08)]">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">Assinatura ativa</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Seu acesso está liberado</h1>
          <p className="mt-4 text-zinc-400">
            Plano atual: {planLabel(currentPlan)}{currentSource ? ` (${currentSource})` : ""}.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-8 rounded-[18px] bg-lime-300 px-7 py-3 text-sm font-black uppercase tracking-[0.14em] text-zinc-950"
          >
            Ir para o dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030508] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">
              NEXT LEVEL
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
              Escolha seu nível
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Para acessar a NEXT LEVEL , selecione um plano e finalize sua assinatura.
            </p>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              Seu acesso será liberado automaticamente após a confirmação do pagamento.
            </p>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              Os limites de mensagens sao renovados mensalmente.
            </p>
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              {isInitialBillingLoading
                ? "Preparando pagamento..."
                : paymentProvider === "CAKTO" && checkoutEnabled
                ? "Pagamento seguro via Cakto"
                : "Gateway de pagamento temporariamente indisponivel."}
            </p>
            {params.get("upgrade") ? (
              <p className="mt-3 text-sm font-bold text-lime-300">
                Seu plano atual não dá acesso a esse recurso.
              </p>
            ) : null}
            {selectedPlan ? (
              <p className="mt-3 text-sm font-bold text-lime-300">
                Você escolheu o plano {planSelectionLabel(selectedPlan)}. Continue para finalizar o pagamento com segurança.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => updateBillingCycle("MONTHLY")}
                className={`rounded-[14px] px-5 py-2 text-xs font-black uppercase tracking-[0.14em] ${billingCycle === "MONTHLY" ? "bg-white text-zinc-950" : "text-zinc-400"}`}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => updateBillingCycle("ANNUAL")}
                className={`rounded-[14px] px-5 py-2 text-xs font-black uppercase tracking-[0.14em] ${billingCycle === "ANNUAL" ? "bg-lime-300 text-zinc-950" : "text-zinc-400"}`}
              >
                Anual
              </button>
            </div>
            {isLoggedIn ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-[14px] border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/[0.06]"
              >
                Sair
              </button>
            ) : null}
          </div>
        </header>

        {message ? (
          <div className="mt-6 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm font-bold text-lime-200">
            {message}
          </div>
        ) : null}

        {isActuallyUnavailable && billingConfigMessage ? (
          <div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-bold text-amber-100">
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
            const displayName = getPublicPlanName(plan.key, plan.name);
            const displayDescription = display?.summary || plan.description;
            const displayFeatures = display?.features || plan.features;
            const available = !isInitialBillingLoading && Boolean(price?.available) && checkoutEnabled === true;
            const planUnavailable = !isInitialBillingLoading && checkoutEnabled === true && Boolean(price) && !price.available;
            const providerUnavailable = !isInitialBillingLoading && checkoutEnabled === false;
            const loading = loadingPlanKey === plan.key;
            const isSelected = selectedPlan?.planKey === plan.key;
            const buttonLabel = loading
              ? "Preparando pagamento..."
              : isInitialBillingLoading
              ? "Carregando..."
              : available
              ? "Continuar para pagamento"
              : providerUnavailable
              ? "Pagamento temporariamente indisponivel"
              : planUnavailable
              ? "Plano indisponivel"
              : "Plano indisponivel";
            const helperCopy = isInitialBillingLoading
              ? "Preparando pagamento seguro..."
              : available
              ? "Pagamento seguro via Cakto"
              : providerUnavailable
              ? "Estamos ajustando o gateway de pagamento. Tente novamente em alguns instantes."
              : "Este plano ainda nao possui link de checkout configurado.";
            return (
              <article
                key={plan.key}
                className={`relative flex min-h-[520px] flex-col rounded-[24px] border p-6 ${
                  isSelected
                    ? "border-lime-300 bg-[linear-gradient(160deg,rgba(182,255,0,0.14),rgba(8,10,14,1)_58%)] shadow-[0_0_65px_rgba(182,255,0,0.18)]"
                    : plan.key === "PREMIUM"
                    ? "border-lime-400/35 bg-[linear-gradient(160deg,rgba(182,255,0,0.1),rgba(8,10,14,1)_60%)] shadow-[0_0_55px_rgba(182,255,0,0.1)]"
                    : "border-white/[0.08] bg-white/[0.035]"
                }`}
              >
                {isSelected ? (
                  <span className="absolute left-5 top-5 rounded-full border border-lime-300/40 bg-lime-300/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-lime-200">
                    Selecionado
                  </span>
                ) : null}
                {plan.key === "PREMIUM" ? (
                  <span className="absolute right-5 top-5 rounded-full bg-lime-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-950">
                    Mais escolhido
                  </span>
                ) : null}
                {plan.key === "PRO_BUSINESS" ? (
                  <span className="absolute right-5 top-5 rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-lime-200">
                    Mais completo
                  </span>
                ) : null}
                <h2 className="text-2xl font-black">{displayName}</h2>
                <p className="mt-3 min-h-16 text-sm leading-6 text-zinc-400">{displayDescription}</p>
                <div className="mt-5">
                  <span className="text-4xl font-black">
                    {price ? formatCurrencyInCents(displayAmountInCents) : "Indisponível"}
                  </span>
                  <span className="ml-2 text-sm text-zinc-500">
                    {billingCycle === "MONTHLY" ? "/mês" : "/ano"}
                  </span>
                </div>
                <div className="mt-5 rounded-[18px] border border-lime-300/[0.16] bg-lime-300/[0.055] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">{display.aiTier}</p>
                  <ul className="mt-3 space-y-1.5">
                    {display.aiLimitItems.map((item) => (
                      <li key={item} className="text-sm font-bold leading-5 text-zinc-100">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">{display.aiDescription}</p>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {displayFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-lime-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={!available || loading || isInitialBillingLoading}
                  onClick={() => subscribe(plan.key)}
                  className={`mt-7 rounded-[18px] px-5 py-4 text-sm font-black uppercase tracking-[0.14em] transition ${
                    available
                      ? "bg-lime-300 text-zinc-950 hover:brightness-105"
                      : "cursor-not-allowed border border-amber-400/25 bg-amber-400/10 text-amber-200"
                  }`}
                >
                  {buttonLabel}
                </button>
                <p className={`mt-3 min-h-10 text-xs font-semibold leading-5 ${available ? "text-lime-200" : "text-zinc-500"}`}>
                  {helperCopy}
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
