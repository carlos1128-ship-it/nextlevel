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

const asCurrency = (value: number) =>
  `R$ ${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const FinancialFlow = () => {
  const { addToast } = useToast();
  const { selectedCompanyId } = useAuth();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));

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
      const message = getErrorMessage(error, "Nao foi possivel carregar as transacoes.");
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

  const chartData = useMemo(() => {
    const grouped = new Map<string, { name: string; Entradas: number; Saidas: number }>();
    safeTransactions.forEach((tx, index) => {
      const day = new Date(tx.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
      if (!grouped.has(day)) grouped.set(day, { name: day || `Sem ${index + 1}`, Entradas: 0, Saidas: 0 });
      const row = grouped.get(day);
      if (!row) return;
      if (tx.type === "income") row.Entradas += Number(tx.amount) || 0;
      if (tx.type === "expense") row.Saidas += Number(tx.amount) || 0;
    });

    const values = Array.from(grouped.values()).slice(-8);
    if (values.length) return values;

    return [
      { name: "Sem 1", Entradas: 4000, Saidas: 2400 },
      { name: "Sem 2", Entradas: 3000, Saidas: 1398 },
      { name: "Sem 3", Entradas: 5000, Saidas: 3908 },
      { name: "Sem 4", Entradas: 2800, Saidas: 2100 },
      { name: "Sem 5", Entradas: 1900, Saidas: 900 },
      { name: "Sem 6", Entradas: 4400, Saidas: 3200 },
    ];
  }, [safeTransactions]);

  const totalIncome = safeTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const totalExpense = safeTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  const balance = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

  const notifyDashboardUpdate = () => {
    window.dispatchEvent(new Event("transactions:updated"));
  };

  const submitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!description.trim() || !parsedAmount) {
      addToast("Preencha descricao e valor.", "info");
      return;
    }
    try {
      setLoadingSubmit(true);
      if (!selectedCompanyId) {
        throw new Error("Selecione uma empresa para continuar.");
      }
      await createTransaction({
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
      setDate(new Date().toISOString().slice(0, 16));
      await loadTransactions();
      notifyDashboardUpdate();
      addToast("Transacao criada.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao criar transacao."), "error");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <h1 className="text-3xl font-black tracking-tighter text-zinc-100 md:text-4xl">Fluxo Financeiro</h1>

      <div className="flex flex-wrap gap-3">
        <select className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-zinc-100 focus:outline-none">
          <option>Ultimos 30 dias</option>
          <option>Ultimos 7 dias</option>
          <option>Ultimos 90 dias</option>
        </select>
        <select className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-zinc-100 focus:outline-none">
          <option>Empresa A</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">Faturamento Mensal</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-zinc-100 xl:text-3xl">{asCurrency(totalIncome)}</p>
          <p className="mt-2 text-sm font-bold text-lime-400">+12.5% vs. periodo anterior</p>
        </div>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">Lucro Liquido</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-zinc-100 xl:text-3xl">{asCurrency(balance)}</p>
          <p className="mt-2 text-sm font-bold text-lime-400">+8.3% vs. periodo anterior</p>
        </div>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">Custos Operacionais</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-zinc-100 xl:text-3xl">{asCurrency(totalExpense)}</p>
          <p className="mt-2 text-sm font-bold text-red-500">-2.1% vs. periodo anterior</p>
        </div>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">Margem de Lucro</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-zinc-100 xl:text-3xl">{margin.toFixed(1)}%</p>
          <p className="mt-2 text-sm font-bold text-lime-400">+2.1% vs. periodo anterior</p>
        </div>
      </div>

      <MarginCalculator freeUsesLeft={7} />

      {loadingPage ? (
        <LoadingState label="Carregando transacoes..." />
      ) : loadError ? (
        <ErrorState
          title="Erro ao carregar transacoes"
          description={loadError}
          actionLabel="Tentar novamente"
          onAction={loadTransactions}
        />
      ) : (
        <>
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-4 shadow-sm min-w-0">
            <h3 className="mb-4 text-2xl font-black tracking-tighter text-zinc-100 md:text-3xl">Fluxo de Caixa (Entradas vs. Saidas)</h3>
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
                <CartesianGrid strokeDasharray="4 4" stroke="#334155" />
                <XAxis dataKey="name" stroke="#a1a1aa" />
                <YAxis stroke="#a1a1aa" />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "12px" }} />
                <Area type="monotone" dataKey="Entradas" stroke="#B6FF00" fill="url(#colorEntradas)" strokeWidth={2} />
                <Area type="monotone" dataKey="Saidas" stroke="#ef4444" fill="url(#colorSaidas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <form
            onSubmit={submitTransaction}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-900 bg-zinc-950 p-4 md:grid-cols-6"
          >
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expense")}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none"
            >
              <option value="income">Entrada</option>
              <option value="expense">Saida</option>
            </select>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Valor"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Categoria"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
            />
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loadingSubmit}
              className="rounded-xl bg-lime-400 px-3 py-2 font-black text-zinc-900 disabled:opacity-50"
            >
              {loadingSubmit ? "Salvando..." : "Adicionar"}
            </button>
          </form>

          {safeTransactions.length === 0 ? (
            <EmptyState
              title="Sem transacoes cadastradas"
              description="Use o formulario acima para registrar sua primeira movimentacao."
            />
          ) : null}
        </>
      )}
    </div>
  );
};

export default FinancialFlow;
