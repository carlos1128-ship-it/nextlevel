import React, { useMemo, useState } from "react";

type BillingCycle = "monthly" | "annual";

type Plan = {
  title: string;
  monthlyPrice: number;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
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
          {annual ? "/ano" : "/mes"}
        </span>
      </div>
      <div className="mb-6 flex min-h-10 flex-col items-center justify-center text-center">
        {annual ? (
          <>
            <span className="text-xs font-bold tracking-wide text-[#B6FF00]">
              Equivale a 11 meses - 1 mes gratis
            </span>
            <span className="mt-1 text-[11px] font-semibold text-zinc-500">
              equivale a R$ {effectiveMonthly.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mes
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
        className={`w-full rounded-xl py-4 text-xs font-black uppercase tracking-widest transition-all ${
          plan.isPopular ? "bg-[#B6FF00] text-black neon-glow hover:opacity-90" : "bg-white/5 text-white hover:bg-white/10"
        }`}
      >
        {plan.buttonText}
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
        buttonText: "Assinar Agora",
        features: [
          "Ate 2 empresas vinculadas",
          "Dashboard em tempo real",
          "Calculadora de margem e preco ideal",
          "Relatorios basicos",
          "Chat IA essencial",
          "Suporte via e-mail",
        ],
      },
      {
        title: "Premium",
        monthlyPrice: 137,
        isPopular: true,
        buttonText: "Assinar Agora",
        features: [
          "Ate 10 empresas vinculadas",
          "WhatsApp e Instagram",
          "Alertas de margem",
          "Relatorios automaticos semanais",
          "Chat IA ampliado",
          "Recomendacoes praticas da IA",
          "Suporte prioritario",
        ],
      },
      {
        title: "Pro Business",
        monthlyPrice: 247,
        buttonText: "Comecar Agora",
        features: [
          "Empresas ilimitadas",
          "Tudo do Premium",
          "Mercado Livre, Mercado Pago e Shopee",
          "Insights preditivos avancados",
          "Integracoes customizadas via API",
          "Rotinas operacionais avancadas",
          "Acompanhamento prioritario",
        ],
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-5xl font-black tracking-tighter">Escolha seu Nivel</h1>
        <p className="mx-auto max-w-xl text-lg font-medium text-zinc-500 dark:text-zinc-400">
          Tres planos pagos para estruturar margem, automacao e comando operacional no ritmo da sua empresa.
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
        <h3 className="mb-4 text-2xl font-black tracking-tighter">Precisa de algo sob medida?</h3>
        <p className="mx-auto mb-8 max-w-lg text-zinc-500 dark:text-zinc-400">
          Para operacoes de grande escala ou necessidades especificas de integracao, nosso plano Enterprise e a solucao ideal.
        </p>
        <button className="border-b-2 border-[#B6FF00] pb-1 text-sm font-black uppercase tracking-widest text-[#B6FF00] transition-all hover:opacity-80">
          Solicitar Orcamento Customizado
        </button>
      </div>
    </div>
  );
};

export default Plans;
