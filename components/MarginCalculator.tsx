import React, { useMemo, useState } from "react";

type MarginPlanId = "silver" | "gold" | "diamond";

interface MarginCalculatorProps {
  freeUsesLeft?: number;
  defaultPlan?: MarginPlanId;
  className?: string;
}

const PLAN_OPTIONS: Array<{
  id: MarginPlanId;
  name: string;
  rate: number;
  highlight: string;
  description: string;
}> = [
  {
    id: "silver",
    name: "Prata",
    rate: 12,
    highlight: "Melhor para validar rapido",
    description: "Taxa mais enxuta para testar o produto sem travar caixa.",
  },
  {
    id: "gold",
    name: "Ouro",
    rate: 15,
    highlight: "Equilibrio de escala",
    description: "Boa visibilidade sem apertar tanto a margem.",
  },
  {
    id: "diamond",
    name: "Diamante",
    rate: 18,
    highlight: "Mais vitrine e alcance",
    description: "Plano premium para acelerar giro e destaque na busca.",
  },
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const sanitizeCurrencyDigits = (value: string) => value.replace(/\D/g, "");

const parseCurrencyInput = (value: string) => Number(sanitizeCurrencyDigits(value) || "0") / 100;

const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);

const formatCurrencyInput = (value: string) => {
  const digits = sanitizeCurrencyDigits(value);
  if (!digits) return "";
  return formatCurrency(Number(digits) / 100);
};

const formatPercent = (value: number) => `${value.toFixed(1).replace(".", ",")}%`;

const EmptyResultIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M4.5 18.5V13.5M9.5 18.5V8.5M14.5 18.5V11.5M19.5 18.5V5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 20.5H20.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.5 3.5H20.5V6.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ResultGlowIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 3L13.902 8.098L19 10L13.902 11.902L12 17L10.098 11.902L5 10L10.098 8.098L12 3Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.5 16L19.133 17.367L20.5 18L19.133 18.633L18.5 20L17.867 18.633L16.5 18L17.867 17.367L18.5 16Z"
      fill="currentColor"
    />
  </svg>
);

const MarginCalculator = ({
  freeUsesLeft = 7,
  defaultPlan = "gold",
  className = "",
}: MarginCalculatorProps) => {
  const [selectedPlan, setSelectedPlan] = useState<MarginPlanId>(defaultPlan);
  const [isMaxPlan, setIsMaxPlan] = useState(false);
  const [salePriceInput, setSalePriceInput] = useState("");
  const [costInput, setCostInput] = useState("");
  const [isHighlightingResult, setIsHighlightingResult] = useState(false);

  const calculated = useMemo(() => {
    const activePlan = PLAN_OPTIONS.find((plan) => plan.id === selectedPlan) || PLAN_OPTIONS[1];
    const salePrice = parseCurrencyInput(salePriceInput);
    const cost = parseCurrencyInput(costInput);
    const maxPlanRate = isMaxPlan ? 2.5 : 0;
    const totalRate = activePlan.rate + maxPlanRate;
    const platformFee = salePrice * (totalRate / 100);
    const netProfit = salePrice - cost - platformFee;
    const marginPercent = salePrice > 0 ? (netProfit / salePrice) * 100 : 0;
    const breakEvenPrice =
      totalRate < 100 ? cost / Math.max(0.0001, 1 - totalRate / 100) : 0;

    const target15Denominator = 1 - totalRate / 100 - 0.15;
    const target20Denominator = 1 - totalRate / 100 - 0.2;
    const target15Price = target15Denominator > 0 ? cost / target15Denominator : null;
    const target20Price = target20Denominator > 0 ? cost / target20Denominator : null;
    const hasAnyValue = salePrice > 0 || cost > 0;
    const hasCompleteData = salePrice > 0 && cost > 0;

    let tone: "good" | "warning" | "bad" = "warning";
    let title = "Margem em tempo real";
    let action = "Preencha os dois campos para descobrir se esse preco esta te dando caixa ou te drenando.";

    if (!hasCompleteData) {
      tone = "warning";
    } else if (netProfit < 0) {
      tone = "bad";
      title = "Prejuizo detectado";
      action = `Ajuste o preco para pelo menos ${formatCurrency(
        breakEvenPrice,
      )} e sair do zero sem vender no escuro.`;
    } else if (marginPercent < 10) {
      tone = "warning";
      title = "Margem apertada";
      action = target15Price
        ? `Para buscar 15% de margem, teste ${formatCurrency(target15Price)} como novo preco alvo.`
        : "A margem esta curta. Revise custo e taxa antes de aumentar volume.";
    } else {
      tone = "good";
      title = "Lucro saudavel";
      action =
        target20Price && target20Price > salePrice
          ? `Se o mercado aceitar ${formatCurrency(target20Price)}, voce se aproxima da faixa premium de 20% de margem.`
          : "Voce ja esta com uma margem boa. Agora vale ganhar volume sem sacrificar lucro.";
    }

    return {
      activePlan,
      salePrice,
      cost,
      platformFee,
      netProfit,
      marginPercent,
      totalRate,
      breakEvenPrice,
      target15Price,
      target20Price,
      hasAnyValue,
      hasCompleteData,
      tone,
      title,
      action,
    };
  }, [costInput, isMaxPlan, salePriceInput, selectedPlan]);

  const resultToneClass =
    calculated.tone === "good"
      ? "border-lime-400/30 bg-lime-400/10 text-lime-50"
      : calculated.tone === "bad"
        ? "border-red-500/35 bg-red-500/10 text-red-50"
        : "border-amber-400/30 bg-amber-400/10 text-amber-50";

  const profitValueClass =
    calculated.netProfit > 0
      ? "text-lime-300"
      : calculated.netProfit < 0
        ? "text-red-400"
        : "text-zinc-100";

  const handleHighlightResult = () => {
    setIsHighlightingResult(true);
    window.setTimeout(() => setIsHighlightingResult(false), 900);
  };

  return (
    <section
      className={`relative overflow-hidden rounded-[30px] border border-zinc-800 bg-[#09090b] shadow-lg shadow-black/30 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(181,255,0,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.12),_transparent_38%)]" />

      <div className="relative p-4 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div
              className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/80 p-1 text-xs text-zinc-400 shadow-lg shadow-black/20"
              role="tablist"
              aria-label="Simulacao de navegacao da calculadora"
            >
              <button
                type="button"
                className="rounded-full px-3 py-1.5 transition hover:text-zinc-200"
              >
                Resumo
              </button>
              <button
                type="button"
                className="rounded-full bg-lime-400 px-3 py-1.5 font-bold text-zinc-950 shadow-[0_0_20px_rgba(163,230,53,0.35)]"
                aria-selected="true"
              >
                Calculadora Imperial
              </button>
              <button
                type="button"
                className="rounded-full px-3 py-1.5 transition hover:text-zinc-200"
              >
                Projecao
              </button>
            </div>

            <h2 className="mt-4 text-2xl font-black tracking-tight text-zinc-50 sm:text-3xl">
              Calcule sua margem antes de perder dinheiro no clique errado
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Preencha preco e custo, escolha o plano e veja o lucro liquido nascer na hora.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-left text-sm shadow-lg shadow-lime-500/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-400/15 text-lime-300">
              <ResultGlowIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-lime-200">Modo lucro ligado</p>
              <p className="text-xs text-lime-100/75">
                A calculadora entrega uma acao sugerida junto do numero.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-4 shadow-lg shadow-black/20 sm:p-5">
            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-100">
              <span className="font-semibold text-lime-200">
                Voce tem {freeUsesLeft} usos gratuitos
              </span>{" "}
              para testar ofertas antes de liberar o plano completo.
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Plano Max</p>
                  <p className="text-xs text-zinc-500">
                    Mais visibilidade, com acrescimo de 2,5% na taxa total.
                  </p>
                </div>

                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isMaxPlan}
                    onChange={(event) => setIsMaxPlan(event.target.checked)}
                  />
                  <span className="h-7 w-14 rounded-full bg-zinc-700 transition peer-checked:bg-lime-400/60" />
                  <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition peer-checked:translate-x-7 peer-checked:bg-lime-200" />
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {PLAN_OPTIONS.map((plan) => {
                const isSelected = plan.id === selectedPlan;

                return (
                  <label
                    key={plan.id}
                    className={`group relative cursor-pointer rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5 hover:border-lime-400/40 ${
                      isSelected
                        ? "border-lime-400/40 bg-lime-400/10 shadow-[0_0_24px_rgba(163,230,53,0.14)]"
                        : "border-zinc-800 bg-zinc-900/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="margin-plan"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => setSelectedPlan(plan.id)}
                    />

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{plan.name}</p>
                        <p className="mt-1 text-2xl font-black tracking-tight text-zinc-50">
                          {plan.rate}%
                        </p>
                      </div>
                      <span
                        className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-lime-300 bg-lime-300 shadow-[0_0_18px_rgba(190,242,100,0.55)]"
                            : "border-zinc-600"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isSelected ? "bg-zinc-950" : "bg-transparent"
                          }`}
                        />
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-lime-300/80">
                      {plan.highlight}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">{plan.description}</p>
                  </label>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <span className="text-sm font-semibold text-zinc-100">Preco de venda</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Quanto o cliente vai pagar nessa oferta.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={salePriceInput}
                  onChange={(event) => setSalePriceInput(formatCurrencyInput(event.target.value))}
                  placeholder="Ex.: R$ 149,90"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-lg font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-lime-400"
                />
              </label>

              <label className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <span className="text-sm font-semibold text-zinc-100">Custo</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Produto, frete interno e o que mais sai do seu bolso.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={costInput}
                  onChange={(event) => setCostInput(formatCurrencyInput(event.target.value))}
                  placeholder="Ex.: R$ 59,90"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-lg font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-lime-400"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Taxa total</p>
                <p className="mt-2 text-xl font-black text-zinc-100">
                  {formatPercent(calculated.totalRate)}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Taxa em reais</p>
                <p className="mt-2 text-xl font-black text-zinc-100">
                  {formatCurrency(calculated.platformFee)}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Ponto de equilibrio
                </p>
                <p className="mt-2 text-xl font-black text-zinc-100">
                  {calculated.hasCompleteData
                    ? formatCurrency(calculated.breakEvenPrice)
                    : "--"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleHighlightResult}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-lime-400 px-5 py-3 font-black text-zinc-950 shadow-[0_0_28px_rgba(163,230,53,0.25)] transition hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98]"
              >
                <span
                  className={`h-4 w-4 rounded-full border-2 border-zinc-950/30 border-t-zinc-950 ${
                    isHighlightingResult ? "animate-spin" : ""
                  }`}
                />
                Calcular margem
              </button>

              <div className="text-xs text-zinc-500">
                O botao fica aqui por UX, mas o calculo ja reage enquanto voce digita.
              </div>
            </div>
          </div>

          <aside
            className={`rounded-[28px] border border-zinc-800 bg-zinc-950/90 p-5 shadow-lg shadow-black/20 transition duration-200 ${
              isHighlightingResult ? "scale-[1.01] border-lime-400/30" : ""
            }`}
          >
            {!calculated.hasAnyValue ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-zinc-800 bg-zinc-900/40 px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-zinc-900 text-lime-300 shadow-[0_0_30px_rgba(163,230,53,0.08)]">
                  <EmptyResultIcon className="h-10 w-10" />
                </div>
                <h3 className="mt-6 text-xl font-black tracking-tight text-zinc-100">
                  Seu lucro vai aparecer aqui
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">
                  Digite preco e custo para descobrir se essa oferta esta imprimindo caixa ou
                  queimando margem escondida.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-[24px] border p-5 ${resultToneClass}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-current/80">
                    {calculated.title}
                  </p>
                  <p className={`mt-4 text-4xl font-black tracking-tight ${profitValueClass}`}>
                    {formatCurrency(calculated.netProfit)}
                  </p>
                  <p className="mt-2 text-sm text-current/80">Lucro liquido por venda</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Margem final</p>
                    <p
                      className={`mt-2 text-2xl font-black ${
                        calculated.marginPercent > 0
                          ? "text-lime-300"
                          : calculated.marginPercent < 0
                            ? "text-red-400"
                            : "text-zinc-100"
                      }`}
                    >
                      {formatPercent(calculated.marginPercent)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Plano ativo</p>
                    <p className="mt-2 text-2xl font-black text-zinc-100">
                      {calculated.activePlan.name}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {isMaxPlan ? "Com Plano Max ligado" : "Sem upgrade Max"}
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-zinc-800 bg-zinc-900/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Acao sugerida agora
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-200">{calculated.action}</p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <span className="text-sm text-zinc-400">Preco atual</span>
                    <strong className="text-zinc-100">
                      {formatCurrency(calculated.salePrice)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <span className="text-sm text-zinc-400">Custo declarado</span>
                    <strong className="text-zinc-100">{formatCurrency(calculated.cost)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <span className="text-sm text-zinc-400">Preco para 15% de margem</span>
                    <strong className="text-zinc-100">
                      {calculated.target15Price
                        ? formatCurrency(calculated.target15Price)
                        : "--"}
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
};

export default MarginCalculator;
