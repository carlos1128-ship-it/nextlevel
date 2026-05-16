import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "../components/Toast";
import { createTransaction, getTransactions } from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import MarginCalculator from "../components/MarginCalculator";
import type { TransactionItem } from "../src/types/domain";
import { useAuth } from "../App";
import {
  formatTransactionDate,
  formatTransactionDateTime,
  getTransactionDateValue,
  toDateTimeLocalValue,
} from "../src/utils/datetime";

const asCurrency = (value: number) =>
  `R$ ${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type TransactionsUpdatedDetail = {
  companyId: string;
  transaction?: TransactionItem;
  totalIncome?: number;
  totalExpense?: number;
  balance?: number;
  transactionsCount?: number;
};

const FinancialFlow = () => {
  const { addToast } = useToast();
  const { selectedCompanyId } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(30);

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => toDateTimeLocalValue());

  const loadTransactions = async () => {
    if (!selectedCompanyId) {
      setTransactions([]);
      setLoadError("Selecione uma empresa para continuar.");
      setLoadingPage(false);
      return;
    }

    setLoadingPage(true);
    setLoadError(null);
    try {
      const data = await getTransactions(selectedCompanyId);
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      setTransactions([]);
      const message = getErrorMessage(error, "Não foi possível carregar as transações.");
      setLoadError(message);
      addToast(message, "error");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [selectedCompanyId]);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - periodDays + 1);
    start.setHours(0, 0, 0, 0);

    return safeTransactions.filter((tx) => {
      const value = getTransactionDateValue(tx);
      const txDate = value ? new Date(value) : null;
      if (!txDate || Number.isNaN(txDate.getTime())) return false;
      return txDate >= start && txDate <= now;
    });
  }, [safeTransactions, periodDays]);

  const chartData = useMemo(() => {
    const grouped = new Map<string, { name: string; Entradas: number; Saidas: number }>();
    filteredTransactions.forEach((tx, index) => {
      const day = formatTransactionDate(getTransactionDateValue(tx), { month: "short" });
      if (!grouped.has(day)) grouped.set(day, { name: day || `Sem ${index + 1}`, Entradas: 0, Saidas: 0 });
      const row = grouped.get(day);
      if (!row) return;
      if (tx.type === "income") row.Entradas += Number(tx.amount) || 0;
      if (tx.type === "expense") row.Saidas += Number(tx.amount) || 0;
    });

    const values = Array.from(grouped.values()).slice(-8);
    return values;
  }, [filteredTransactions]);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  const notifyDashboardUpdate = (detail: TransactionsUpdatedDetail) => {
    window.dispatchEvent(new CustomEvent("transactions:updated", { detail }));
  };

  const submitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!description.trim() || !parsedAmount) {
      addToast("Preencha descrição e valor.", "info");
      return;
    }
    try {
      setLoadingSubmit(true);
      if (!selectedCompanyId) {
        throw new Error("Selecione uma empresa para continuar.");
      }
      const result = await createTransaction({
        companyId: selectedCompanyId,
        type,
        amount: parsedAmount,
        description: description.trim(),
        category: category.trim() || undefined,
        date,
      });
      setAmount("");
      setDescription("");
      setCategory("");
      setDate(toDateTimeLocalValue());
      await loadTransactions();
      notifyDashboardUpdate({
        companyId: selectedCompanyId,
        transaction: result.transaction,
        totalIncome: result.totalIncome,
        totalExpense: result.totalExpense,
        balance: result.balance,
        transactionsCount: result.transactionsCount,
      });
      addToast("Transação criada.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao criar transação."), "error");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Gestão de Tesouraria</p>
          <h1 className="nl-page-title">Fluxo Financeiro</h1>
          <p className="nl-page-subtitle">Monitore a saúde do seu caixa em tempo real com conciliação automática de entradas e saídas.</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={periodDays}
            onChange={(event) => setPeriodDays(Number(event.target.value) as 7 | 30 | 90)}
            className="nl-input py-2 text-xs w-[160px]"
          >
            <option value={30}>Últimos 30 dias</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <div className="nl-badge-neon py-2 text-[10px]">Empresa Ativa</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <div className="nl-card p-5 relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--nl-neon)] opacity-[0.03] blur-3xl pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">Faturamento Líquido</p>
          <p className="mt-3 text-2xl font-black text-[var(--nl-neon)] leading-none">{asCurrency(totalIncome)}</p>
        </div>
        <div className="nl-card p-5 relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-[0.03] blur-3xl pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">Margem Real</p>
          <p className="mt-3 text-2xl font-black text-blue-400 leading-none">{margin.toFixed(1)}%</p>
        </div>
        <div className="nl-card p-5 relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500 opacity-[0.03] blur-3xl pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">Custo Operacional</p>
          <p className="mt-3 text-2xl font-black text-red-400 leading-none">{asCurrency(totalExpense)}</p>
        </div>
        <div className="nl-card p-5 relative overflow-hidden flex flex-col justify-between h-[120px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-[0.03] blur-3xl pointer-events-none" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">Lucro em Caixa</p>
          <p className="mt-3 text-2xl font-black text-[var(--nl-text-primary)] leading-none">{asCurrency(balance)}</p>
        </div>
      </div>

      <MarginCalculator freeUsesLeft={7} />

      {loadingPage ? (
        <LoadingState />
      ) : loadError ? (
        <ErrorState
          title="Erro ao carregar transações"
          description={loadError}
          actionLabel="Tentar novamente"
          onAction={loadTransactions}
        />
      ) : (
        <>
          <section className="nl-card p-6 md:p-8 mb-8">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--nl-text-muted)] mb-8 flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-[var(--nl-neon)] shadow-[0_0_8px_var(--nl-neon)]" />
               Oscilação de Patrimônio (Cash Flow)
            </h3>
            {chartData.length === 0 ? (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-white/5 text-xs text-[var(--nl-text-muted)]">
                Aguardando primeiras movimentações do período.
              </div>
            ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--nl-neon)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--nl-neon)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                  <Tooltip contentStyle={{ backgroundColor: "#131517", borderColor: "#24282c", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="Entradas" stroke="var(--nl-neon)" fill="url(#colorEntradas)" strokeWidth={3} />
                  <Area type="monotone" dataKey="Saidas" stroke="#ef4444" fill="url(#colorSaidas)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            )}
          </section>

          <form
            onSubmit={submitTransaction}
            className="nl-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-4 mb-8"
          >
            <div className="md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1 block mb-1.5">Tipo</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "income" | "expense")}
                  className="nl-input text-xs"
                >
                  <option value="income">Entrada (+)</option>
                  <option value="expense">Saída (-)</option>
                </select>
            </div>
            <div className="md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1 block mb-1.5">Valor Bruto</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="nl-input text-xs font-bold"
                />
            </div>
            <div className="md:col-span-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1 block mb-1.5">Ocorrência</span>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Venda Direta #88"
                  className="nl-input text-xs"
                />
            </div>
            <div className="md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)] px-1 block mb-1.5">Data & Hora</span>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="nl-input text-[11px]"
                />
            </div>
            <div className="md:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="nl-button-primary w-full py-3 text-xs"
                >
                  {loadingSubmit ? "Registrando..." : "Registrar Transação"}
                </button>
            </div>
          </form>

          {filteredTransactions.length === 0 ? (
            <EmptyState
              title="Sem transações neste período"
              description="Altere o filtro ou registre uma nova movimentacao."
            />
          ) : (
          <section className="nl-card overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5">
                <h3 className="text-[13px] font-bold text-[var(--nl-text-primary)]">Movimentações Recentes</h3>
                <p className="text-[11px] text-[var(--nl-text-muted)] mt-0.5">Últimos lançamentos confirmados</p>
            </div>
            <div className="p-2">
              <div className="space-y-1">
                {filteredTransactions.slice(0, 15).map((tx) => {
                  const transactionDate = getTransactionDateValue(tx);
                  const isIncome = tx.type === "income";
                  return (
                    <div
                      key={tx.id}
                      className="group flex flex-col gap-2 rounded-xl p-4 md:flex-row md:items-center md:justify-between hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isIncome ? "bg-[var(--nl-neon)]/10 text-[var(--nl-neon)]" : "bg-red-400/10 text-red-400"}`}>
                           {isIncome ? "↑" : "↓"}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-[var(--nl-text-primary)] group-hover:text-[var(--nl-neon)] transition-colors">{tx.description}</p>
                          <p className="text-[11px] text-[var(--nl-text-muted)] mt-0.5">
                            {tx.category || "Sem Categ."} · {formatTransactionDateTime(transactionDate)}
                          </p>
                        </div>
                      </div>
                      <div className={`text-[15px] font-black tracking-tight ${isIncome ? "text-[var(--nl-neon)]" : "text-red-400"}`}>
                        {isIncome ? "+" : "-"} {asCurrency(Number(tx.amount || 0))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialFlow;
