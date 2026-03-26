import React, { useState } from "react";

type CalculatorMode = "profit" | "ideal-price";

interface MarginCalculatorProps {
  freeUsesLeft?: number;
  className?: string;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const sanitizeCurrencyDigits = (value: string) => value.replace(/\D/g, "");

const parseCurrencyInput = (value: string) => Number(sanitizeCurrencyDigits(value) || "0") / 100;

const formatCurrency = (value: number) => currencyFormatter.format(Number.isFinite(value) ? value : 0);

const formatCurrencyInput = (value: string) => {
  const digits = sanitizeCurrencyDigits(value);
  if (!digits) return "";
  return formatCurrency(Number(digits) / 100);
};

const formatPercent = (value: number) => `${percentFormatter.format(Number.isFinite(value) ? value : 0)}%`;

const CalculatorIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7 3.5H17C18.3807 3.5 19.5 4.61929 19.5 6V18C19.5 19.3807 18.3807 20.5 17 20.5H7C5.61929 20.5 4.5 19.3807 4.5 18V6C4.5 4.61929 5.61929 3.5 7 3.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path d="M8 8H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 12H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 16H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 16H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const MarginCalculator = ({ className = "" }: MarginCalculatorProps) => {
  const [mode, setMode] = useState<CalculatorMode>("profit");
  const [productName, setProductName] = useState("");
  const [sellingPriceInput, setSellingPriceInput] = useState("");
  const [costPriceInput, setCostPriceInput] = useState("");
  const [idealCostInput, setIdealCostInput] = useState("");
  const [desiredMarginInput, setDesiredMarginInput] = useState("");

  const normalizedProductName = productName.trim() || "este produto";
  const sellingPrice = parseCurrencyInput(sellingPriceInput);
  const costPrice = parseCurrencyInput(costPriceInput);
  const profit = sellingPrice - costPrice;
  const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  const desiredMargin = Math.max(0, Number(desiredMarginInput.replace(",", ".")) || 0);
  const idealCost = parseCurrencyInput(idealCostInput);
  const suggestedPrice =
    idealCost > 0 && desiredMargin < 100 ? idealCost / (1 - desiredMargin / 100) : 0;

  const hasProfitInputs = Boolean(productName.trim() || sellingPriceInput || costPriceInput);
  const hasIdealInputs = Boolean(idealCostInput || desiredMarginInput);
  const isIdealMarginValid = desiredMargin < 100;
  const profitToneClass =
    profit > 0
      ? "text-emerald-500"
      : profit < 0
        ? "text-rose-400"
        : "text-zinc-100";

  return (
    <section
      className={`relative overflow-hidden rounded-[32px] border border-zinc-800 bg-[#09090b] shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.02),_transparent_60%)]" />

      <div className="relative grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:p-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                <CalculatorIcon className="h-4 w-4" />
                Calculadora Minimalista
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
                Descubra o lucro ideal sem ruído
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
                Digite so o essencial. A resposta aparece na hora, com foco em lucro real e
                precificacao inteligente.
              </p>
            </div>

            <div
              className="inline-flex w-full rounded-full border border-zinc-800 bg-zinc-950/90 p-1 text-sm text-zinc-400 lg:w-auto"
              role="tablist"
              aria-label="Modo da calculadora"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "profit"}
                onClick={() => setMode("profit")}
                className={`flex-1 rounded-full px-4 py-2.5 font-semibold transition lg:flex-none ${
                  mode === "profit"
                    ? "bg-emerald-500 text-zinc-950 shadow-[0_0_28px_rgba(16,185,129,0.28)]"
                    : "hover:text-zinc-200"
                }`}
              >
                Lucro do Produto
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "ideal-price"}
                onClick={() => setMode("ideal-price")}
                className={`flex-1 rounded-full px-4 py-2.5 font-semibold transition lg:flex-none ${
                  mode === "ideal-price"
                    ? "bg-emerald-500 text-zinc-950 shadow-[0_0_28px_rgba(16,185,129,0.28)]"
                    : "hover:text-zinc-200"
                }`}
              >
                Gerador de Preco Ideal
              </button>
            </div>
          </div>

          {mode === "profit" ? (
            <div className="grid gap-4 md:grid-cols-3">
              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Nome do produto</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Para personalizar o resultado final.
                </span>
                <input
                  type="text"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Ex.: Kit Premium"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-medium text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>

              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Preco de venda</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Quanto entra no caixa por venda.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sellingPriceInput}
                  onChange={(event) => setSellingPriceInput(formatCurrencyInput(event.target.value))}
                  placeholder="R$ 149,90"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>

              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Custo do produto</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  O valor que sai do seu bolso.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={costPriceInput}
                  onChange={(event) => setCostPriceInput(formatCurrencyInput(event.target.value))}
                  placeholder="R$ 89,90"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Custo base</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Comece pelo valor real do produto.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={idealCostInput}
                  onChange={(event) => setIdealCostInput(formatCurrencyInput(event.target.value))}
                  placeholder="R$ 89,90"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>

              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Margem desejada (%)</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Informe a meta de margem que voce quer atingir.
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="99.9"
                  step="0.1"
                  value={desiredMarginInput}
                  onChange={(event) => setDesiredMarginInput(event.target.value)}
                  placeholder="Ex.: 25"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {mode === "profit" ? "Preco de venda" : "Custo base"}
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
                {mode === "profit" ? formatCurrency(sellingPrice) : formatCurrency(idealCost)}
              </p>
            </div>

            <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {mode === "profit" ? "Custo do produto" : "Margem desejada"}
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
                {mode === "profit" ? formatCurrency(costPrice) : formatPercent(desiredMargin)}
              </p>
            </div>

            <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {mode === "profit" ? "Margem atual" : "Preco sugerido"}
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
                {mode === "profit" ? formatPercent(margin) : formatCurrency(suggestedPrice)}
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] border border-zinc-800 bg-[linear-gradient(180deg,rgba(9,9,11,0.92),rgba(16,24,20,0.98))] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:p-6">
          {mode === "profit" ? (
            !hasProfitInputs ? (
              <div className="flex min-h-[320px] flex-col justify-center rounded-[24px] border border-dashed border-zinc-800 bg-zinc-950/60 px-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300/70">
                  Resultado ao vivo
                </p>
                <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-50">
                  Seu lucro vai aparecer aqui
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Preencha nome, preco de venda e custo para ver o lucro por produto com clareza.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <p className="text-sm font-medium leading-6 text-emerald-50">
                    Seu lucro no produto{" "}
                    <span className="font-black text-white">{normalizedProductName}</span> e:
                  </p>
                  <p className={`mt-4 text-5xl font-black tracking-tight ${profitToneClass}`}>
                    {formatCurrency(profit)}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                    <span className="text-sm text-zinc-400">Margem do produto</span>
                    <strong className="text-zinc-100">{formatPercent(margin)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                    <span className="text-sm text-zinc-400">Preco de venda</span>
                    <strong className="text-zinc-100">{formatCurrency(sellingPrice)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                    <span className="text-sm text-zinc-400">Custo do produto</span>
                    <strong className="text-zinc-100">{formatCurrency(costPrice)}</strong>
                  </div>
                </div>

                <p className="text-sm leading-6 text-zinc-400">
                  {profit > 0
                    ? "Voce ja tem margem positiva. Agora vale testar escala com seguranca."
                    : profit < 0
                      ? "Esse preco esta abaixo do ideal. Revise custo ou reposicione a oferta."
                      : "Ajuste os valores para sair do zero e descobrir a margem real."}
                </p>
              </div>
            )
          ) : !hasIdealInputs ? (
            <div className="flex min-h-[320px] flex-col justify-center rounded-[24px] border border-dashed border-zinc-800 bg-zinc-950/60 px-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300/70">
                Preco ideal
              </p>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-50">
                Gere um preco sugerido em segundos
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Informe custo e margem desejada para receber a sugestao de preco na hora.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm font-medium leading-6 text-emerald-50">
                  Preco sugerido para bater sua meta:
                </p>
                <p className="mt-4 text-5xl font-black tracking-tight text-emerald-500">
                  {isIdealMarginValid ? formatCurrency(suggestedPrice) : "--"}
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <span className="text-sm text-zinc-400">Custo base</span>
                  <strong className="text-zinc-100">{formatCurrency(idealCost)}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <span className="text-sm text-zinc-400">Margem desejada</span>
                  <strong className="text-zinc-100">{formatPercent(desiredMargin)}</strong>
                </div>
              </div>

              <p className="text-sm leading-6 text-zinc-400">
                {isIdealMarginValid
                  ? "Use esse valor como ponto de partida e ajuste conforme mercado, frete e posicionamento."
                  : "A margem desejada precisa ser menor que 100% para gerar um preco valido."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default MarginCalculator;
