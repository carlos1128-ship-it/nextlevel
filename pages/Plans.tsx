import React, { useMemo, useState } from "react";

type BillingCycle = "monthly" | "annual";

type Plan = {
  title: string;
  monthlyPrice: number;
  features: string[];
  isPopular?: boolean;
};

const formatPrice = (value: number) =>
  value.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const PlanCard = ({ plan, billingCycle }: { plan: Plan; billingCycle: BillingCycle; key?: React.Key }) => {
  const annual = billingCycle === "annual";
  const displayPrice = annual ? plan.monthlyPrice * 11 : plan.monthlyPrice;
  const effectiveMonthly = displayPrice / 12;

  return (
    <div
      className={`flex flex-col rounded-3xl border bg-[#121212] p-8 transition-all duration-300 ${
        plan.isPopular
          ? "z-10 scale-105 border-[#B6FF00]/40 shadow-2xl"
          : "border-zinc-200 hover:border-white/20 dark:border-zinc-800"
      }`}
    >
      {plan.isPopular ? (
        <div className="mx-auto mb-6 w-max rounded-full bg-[#B6FF00] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-black neon-glow">
          Mais Popular
        </div>
      ) : null}
      <h3 className="mb-2 text-center text-2xl font-black tracking-tighter">{plan.title}</h3>
      <div className="mb-2 flex items-baseline justify-center">
        <span className="mr-1 text-sm font-bold text-zinc-500 dark:text-zinc-400">R$</span>
        <span className="text-5xl font-black tracking-tighter">{formatPrice(displayPrice)}</span>
        <span className="ml-1 text-sm font-bold text-zinc-500 dark:text-zinc-400">
          {annual ? "/ano" : "/mês"}
        </span>
      </div>
      <div className="mb-6 flex min-h-10 flex-col items-center justify-center text-center">
        {annual ? (
          <>
            <span className="text-xs font-bold tracking-wide text-[#B6FF00]">
              Equivale a 11 meses - 1 mês grátis
            </span>
            <span className="mt-1 text-[11px] font-semibold text-zinc-500">
              equivale a R$ {effectiveMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês
            </span>
          </>
        ) : null}
      </div>
      <ul className="mb-10 flex-grow space-y-4">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-gray-400">
            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#B6FF00]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        data-billing-cycle={billingCycle}
        disabled
        className="w-full cursor-not-allowed rounded-xl border border-amber-400/30 bg-amber-400/10 py-4 text-xs font-black uppercase tracking-widest text-amber-200"
      >
        Gateway em configuração
      </button>
    </div>
  );
};

const Plans = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const billingCycle: BillingCycle = isAnnual ? "annual" : "monthly";
  const plans = useMemo<Plan[]>(
    () => [
      {
        title: "Common",
        monthlyPrice: 97,
        features: [
          "Até 2 empresas vinculadas",
          "Dashboard em tempo real",
          "Calculadora de margem e preço ideal",
          "Relatórios básicos",
          "Chat IA essencial",
          "Suporte via e-mail",
        ],
      },
      {
        title: "Premium",
        monthlyPrice: 137,
        isPopular: true,
        features: [
          "Até 10 empresas vinculadas",
          "WhatsApp e Instagram",
          "Alertas de margem",
          "Relatórios automáticos semanais",
          "Chat IA ampliado",
          "Recomendações práticas da IA",
          "Suporte prioritário",
        ],
      },
      {
        title: "Pro Business",
        monthlyPrice: 247,
        features: [
          "Empresas ilimitadas",
          "Tudo do Premium",
          "Mercado Livre, Mercado Pago e Shopee",
          "Insights preditivos avançados",
          "Integrações customizadas via API",
          "Rotinas operacionais avançadas",
          "Acompanhamento prioritário",
        ],
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-5xl font-black tracking-tighter">Escolha seu nível</h1>
        <p className="mx-auto max-w-xl text-lg font-medium text-zinc-500 dark:text-zinc-400">
          Três planos pagos para estruturar margem, automação e comando operacional no ritmo da sua empresa.
        </p>
      </div>

      <div className="mb-12 flex justify-center">
        <div className="flex items-center rounded-full border border-zinc-200 bg-[#121212] p-1 dark:border-zinc-800">
          <button
            onClick={() => setIsAnnual(false)}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              !isAnnual ? "bg-[#B6FF00] text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
              isAnnual ? "bg-[#B6FF00] text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            Anual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.title} plan={plan} billingCycle={billingCycle} />
        ))}
      </div>

      <div className="mt-20 rounded-3xl border border-zinc-200 bg-[#121212] p-10 text-center dark:border-zinc-800">
        <h3 className="mb-4 text-2xl font-black tracking-tighter">Checkout em preparação</h3>
        <p className="mx-auto mb-8 max-w-lg text-zinc-500 dark:text-zinc-400">
          Os planos já estão definidos. A assinatura fica bloqueada até o gateway de pagamento ser configurado com segurança.
        </p>
        <button disabled className="cursor-not-allowed border-b-2 border-zinc-700 pb-1 text-sm font-black uppercase tracking-widest text-zinc-500">
          Configuração do provedor necessária
        </button>
      </div>
    </div>
  );
};

export default Plans;
