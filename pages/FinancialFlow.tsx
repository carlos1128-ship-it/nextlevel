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
    <div className="nl-page space-y-6">
      <header className="nl-page-header">
        <div>
          <p className="nl-eyebrow">Financeiro</p>
          <h1 className="nl-title">Fluxo financeiro</h1>
          <p className="nl-subtitle">
            Registre entradas e saídas, acompanhe margem e veja o impacto financeiro da operação.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3">
        <select
          value={periodDays}
          onChange={(event) => setPeriodDays(Number(event.target.value) as 7 | 30 | 90)}
          className="nl-input max-w-[220px]"
        >
          <option value={30}>Últimos 30 dias</option>
          <option value={7}>Últimos 7 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>
        <span className="nl-chip">
          Empresa ativa
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="nl-card nl-card-metric min-w-0">
          <p className="nl-stat-label">Faturamento do período</p>
          <p className="nl-stat-value">{asCurrency(totalIncome)}</p>
          <p className="mt-2 text-sm font-bold text-zinc-500">Período: {periodDays} dias</p>
        </div>
        <div className="nl-card nl-card-metric min-w-0">
          <p className="nl-stat-label">Lucro líquido</p>
          <p className="nl-stat-value">{asCurrency(balance)}</p>
          <p className="mt-2 text-sm font-bold text-zinc-500">Receitas menos saídas</p>
        </div>
        <div className="nl-card nl-card-metric min-w-0">
          <p className="nl-stat-label">Custos operacionais</p>
          <p className="nl-stat-value">{asCurrency(totalExpense)}</p>
          <p className="mt-2 text-sm font-bold text-zinc-500">Saídas do período</p>
        </div>
        <div className="nl-card nl-card-metric min-w-0">
          <p className="nl-stat-label">Margem de lucro</p>
          <p className="nl-stat-value">{margin.toFixed(1)}%</p>
          <p className="mt-2 text-sm font-bold text-zinc-500">Calculada com dados reais</p>
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
          <div className="nl-card min-w-0 p-5">
            <h3 className="mb-4 text-2xl font-black tracking-tight text-zinc-100 md:text-3xl">Fluxo de caixa</h3>
            {chartData.length === 0 ? (
              <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-white/10 text-sm text-zinc-500">
                Sem movimentações no período selecionado.
              </div>
            ) : (
            <ResponsiveContainer width="100%" minWidth={280} minHeight={260} height={380}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B6FF00" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#B6FF00" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#27302b" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip contentStyle={{ background: "#111613", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="Entradas" stroke="#B6FF00" fill="url(#colorEntradas)" strokeWidth={2} />
                <Area type="monotone" dataKey="Saidas" stroke="#ef4444" fill="url(#colorSaidas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>

          <form
            onSubmit={submitTransaction}
            className="nl-card grid grid-cols-1 gap-3 p-4 md:grid-cols-6"
          >
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expense")}
              className="nl-input"
            >
              <option value="income">Entrada</option>
              <option value="expense">Saída</option>
            </select>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor"
              className="nl-input"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição"
              className="nl-input"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Categoria"
              className="nl-input"
            />
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="nl-input"
            />
            <button
              type="submit"
              disabled={loadingSubmit}
              className="nl-button-primary disabled:opacity-50"
            >
              {loadingSubmit ? "Salvando..." : "Adicionar"}
            </button>
          </form>

          {filteredTransactions.length === 0 ? (
            <EmptyState
              title="Sem transações neste período"
              description="Altere o filtro ou registre uma nova movimentação."
            />
          ) : (
            <div className="nl-card p-4">
              <h3 className="mb-4 text-xl font-black tracking-tight text-zinc-100">Últimas transações</h3>
              <div className="space-y-3">
                {filteredTransactions.slice(0, 12).map((tx) => {
                  const transactionDate = getTransactionDateValue(tx);
                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-bold text-zinc-100">{tx.description}</p>
                        <p className="text-xs text-zinc-400">
                          {tx.category || "Sem categoria"} · {formatTransactionDateTime(transactionDate)}
                        </p>
                      </div>
                      <div className={`text-sm font-black ${tx.type === "income" ? "text-lime-400" : "text-red-400"}`}>
                        {tx.type === "income" ? "+" : "-"} {asCurrency(Number(tx.amount || 0))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FinancialFlow;
