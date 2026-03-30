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
  
  // Novas variáveis
  const [taxesInput, setTaxesInput] = useState("");
  const [shippingInput, setShippingInput] = useState("");

  const [idealCostInput, setIdealCostInput] = useState("");
  const [desiredMarginInput, setDesiredMarginInput] = useState("");

  const normalizedProductName = productName.trim() || "este produto";
  
  const sellingPrice = parseCurrencyInput(sellingPriceInput);
  const costPrice = parseCurrencyInput(costPriceInput);
  const taxes = parseCurrencyInput(taxesInput);
  const shipping = parseCurrencyInput(shippingInput);

  const profit = sellingPrice - costPrice - taxes - shipping;
  const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  const desiredMargin = Math.max(0, Number(desiredMarginInput.replace(",", ".")) || 0);
  const idealCost = parseCurrencyInput(idealCostInput);
  // Custo Total Ideal = Custo Base + Impostos e Frete globais da base do lucro (podemos zerar na visualização simplificada, ou computar caso digitado)
  const totalCostIdeal = idealCost + taxes + shipping;
  const suggestedPrice =
    totalCostIdeal > 0 && desiredMargin < 100 ? totalCostIdeal / (1 - desiredMargin / 100) : 0;

  const hasProfitInputs = Boolean(productName.trim() || sellingPriceInput || costPriceInput || taxesInput || shippingInput);
  const hasIdealInputs = Boolean(idealCostInput || desiredMarginInput || taxesInput || shippingInput);
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
                Inteligência Comercial
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-zinc-50 sm:text-4xl">
                Cálculo de Margem Real
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
                Evasão de lucro dói. Calcule a sua Margem Real blindada considerando taxas táticas e operacionais logísticas de frete.
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
                Lucro Líquido Real
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
                Precificação Tática
              </button>
            </div>
          </div>

          {mode === "profit" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <label className="lg:col-span-2 rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Produto Operacional</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Defina o nome de identificação.
                </span>
                <input
                  type="text"
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Ex.: Kit Premium Tático"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-medium text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>

              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Preço de Venda Base</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Preço final praticado ao cliente.
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
                <span className="text-sm font-semibold text-zinc-100">Custo Absoluto</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Custo base de aquisição ou confecção.
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

              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Impostos / Taxas (R$)</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Gateway, plataformas, emissão.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={taxesInput}
                  onChange={(event) => setTaxesInput(formatCurrencyInput(event.target.value))}
                  placeholder="R$ 8,00"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>

              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Frete Embutido (R$)</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Parcela de logística do seu bolso.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={shippingInput}
                  onChange={(event) => setShippingInput(formatCurrencyInput(event.target.value))}
                  placeholder="R$ 15,00"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Custo Base Agregado</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Soma de confecção e matéria-prima.
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
                <span className="text-sm font-semibold text-zinc-100">Margem Desejada (%)</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Meta líquida por operação faturada.
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

              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Impostos / Taxas Estimados (R$)</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Estimativa a subtrair do fechamento.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={taxesInput}
                  onChange={(event) => setTaxesInput(formatCurrencyInput(event.target.value))}
                  placeholder="R$ 8,00"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>

              <label className="rounded-[24px] border border-zinc-800 bg-zinc-950/80 p-4">
                <span className="text-sm font-semibold text-zinc-100">Frete Fixo (R$)</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Média do custo logístico esperado.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={shippingInput}
                  onChange={(event) => setShippingInput(formatCurrencyInput(event.target.value))}
                  placeholder="R$ 15,00"
                  className="mt-3 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base font-semibold text-zinc-50 outline-none transition placeholder:text-zinc-500 focus:border-emerald-500"
                />
              </label>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {mode === "profit" ? "Preço Operacional" : "Custo Pleno"}
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
                {mode === "profit" ? formatCurrency(sellingPrice) : formatCurrency(totalCostIdeal)}
              </p>
            </div>

            <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {mode === "profit" ? "Despesas Totais" : "Margem Alvo"}
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
                {mode === "profit" ? formatCurrency(costPrice + taxes + shipping) : formatPercent(desiredMargin)}
              </p>
            </div>

            <div className="rounded-[22px] border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {mode === "profit" ? "Margem Real" : "Preço Otimizado"}
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
                  Auditoria de Operação
                </p>
                <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-50">
                  Lucro Real pendente
                </h3>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Preencha o preço e os custos implícitos na venda tática para calcular a saúde líquida.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <p className="text-sm font-medium leading-6 text-emerald-50">
                    Lucro líquido em {" "}
                    <span className="font-black text-white">{normalizedProductName}</span> é de:
                  </p>
                  <p className={`mt-4 text-5xl font-black tracking-tight ${profitToneClass}`}>
                    {formatCurrency(profit)}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                    <span className="text-sm text-zinc-400">Margem Real</span>
                    <strong className="text-zinc-100">{formatPercent(margin)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                    <span className="text-sm text-zinc-400">Preço de Fechamento</span>
                    <strong className="text-zinc-100">{formatCurrency(sellingPrice)}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                    <span className="text-sm text-zinc-400">Despesas Totais</span>
                    <strong className="text-zinc-100">{formatCurrency(costPrice + taxes + shipping)}</strong>
                  </div>
                </div>

                <p className="text-sm leading-6 text-zinc-400">
                  {profit > 0
                    ? "Margem verde. A operação possui viabilidade tática para injeção de Ads."
                    : profit < 0
                      ? "Atenção Crítica: O LTV do produto sofre deságio. Replano na estruturação base sugerido!"
                      : "Operação neutra (Break-even). Ajuste alavancas de ticket para extrair lucro."}
                </p>

                <button
                  type="button"
                  onClick={async () => {
                    const token = localStorage.getItem("@next-level:token");
                    if (!token) return alert("Você precisa estar logado para exportar o relatório.");
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/report/margin-pdf`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          companyName: "Minha Empresa", // Podia puxar do estado global/perfil
                          productName: normalizedProductName,
                          sellingPrice,
                          costPrice,
                          taxes,
                          shipping,
                          profit,
                          margin
                        })
                      });
                      if (!res.ok) throw new Error("Erro ao gerar PDF");
                      const blob = await res.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `relatorio-margem-${Date.now()}.pdf`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error(err);
                      alert("Falha ao exportar relatório. " + (err instanceof Error ? err.message : String(err)));
                    }
                  }}
                  className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-zinc-50 outline-none transition hover:bg-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#09090b]"
                >
                  Download Relatório Integrado (PDF)
                </button>
              </div>
            )
          ) : !hasIdealInputs ? (
            <div className="flex min-h-[320px] flex-col justify-center rounded-[24px] border border-dashed border-zinc-800 bg-zinc-950/60 px-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300/70">
                Alvo Tático
              </p>
              <h3 className="mt-4 text-2xl font-black tracking-tight text-zinc-50">
                Gere métricas em tempo real
              </h3>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Posicione os custos diretos e a margem percentual pretendida.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 p-5">
                <p className="text-sm font-medium leading-6 text-emerald-50">
                  Preço Sugerido (Target):
                </p>
                <p className="mt-4 text-5xl font-black tracking-tight text-emerald-500">
                  {isIdealMarginValid ? formatCurrency(suggestedPrice) : "--"}
                </p>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <span className="text-sm text-zinc-400">Despesas Integradas</span>
                  <strong className="text-zinc-100">{formatCurrency(totalCostIdeal)}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">
                  <span className="text-sm text-zinc-400">Margem Alvo</span>
                  <strong className="text-zinc-100">{formatPercent(desiredMargin)}</strong>
                </div>
              </div>

              <p className="text-sm leading-6 text-zinc-400">
                {isIdealMarginValid
                  ? "Este target incorpora custo de mercadoria, operação fiscal e logística de envio sem degradar o seu net profit."
                  : "Calibragem inviável. A margem deve ser inferior a 100% para não acionar um preço teoricamente infinito."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
};

export default MarginCalculator;
