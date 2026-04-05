import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useToast } from "../components/Toast";
import { getErrorMessage } from "../src/services/error";
import { EmptyState, ErrorState, LoadingState } from "../components/AsyncState";
import { exportFinancialCsv, getFinancialReport, getTransactions } from "../src/services/endpoints";
import type { TransactionItem } from "../src/types/domain";
import { useAuth } from "../App";
import { formatTransactionDate, getTransactionDateValue } from "../src/utils/datetime";

const asCurrency = (value: number) =>
  `R$ ${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatCompactCurrency = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });

const Reports = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [period, setPeriod] = useState("30d");
  const [sector, setSector] = useState("geral");
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    if (!selectedCompanyId) {
      setTransactions([]);
      setTotals({ income: 0, expense: 0, balance: 0 });
      setLoadError("Selecione uma empresa para gerar o relatorio.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);
      const [data, report] = await Promise.all([
        getTransactions(selectedCompanyId),
        getFinancialReport(selectedCompanyId),
      ]);
      setTransactions(Array.isArray(data) ? data : []);
      setTotals(report);
    } catch (error) {
      setTransactions([]);
      setTotals({ income: 0, expense: 0, balance: 0 });
      const message = getErrorMessage(error, "Nao foi possivel carregar o relatorio.");
      setLoadError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedCompanyId]);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const chartData = useMemo(() => {
    const map = new Map<string, { name: string; Receita: number; Despesa: number }>();
    safeTransactions.forEach((tx) => {
      const key = formatTransactionDate(getTransactionDateValue(tx), {
        year: "numeric",
      });
      if (!map.has(key)) map.set(key, { name: key, Receita: 0, Despesa: 0 });
      const row = map.get(key);
      if (!row) return;
      if (tx.type === "income") row.Receita += Number(tx.amount || 0);
      if (tx.type === "expense") row.Despesa += Number(tx.amount || 0);
    });
    return Array.from(map.values()).slice(-20);
  }, [safeTransactions]);

  const monthlyData = useMemo(() => {
    if (chartData.length === 0) return [];

    const monthMap = new Map<string, { month: string; Lucro: number; Perda: number }>();

    chartData.forEach((row) => {
      const [day, month, year] = row.name.split("/");
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      if (Number.isNaN(parsed.getTime())) return;

      const key = parsed.toLocaleDateString("pt-BR", { month: "short" });
      const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).replace(".", "");

      if (!monthMap.has(normalizedKey)) monthMap.set(normalizedKey, { month: normalizedKey, Lucro: 0, Perda: 0 });
      const current = monthMap.get(normalizedKey);
      if (!current) return;
      current.Lucro += row.Receita;
      current.Perda += row.Despesa;
    });

    const values = Array.from(monthMap.values());
    return values.length > 0 ? values.slice(-6) : [];
  }, [chartData]);

  const lineData = useMemo(() => {
    if (monthlyData.length > 0) return monthlyData;

    return [
      { month: "Jan", Lucro: 4000, Perda: 2500 },
      { month: "Fev", Lucro: 3000, Perda: 1500 },
      { month: "Mar", Lucro: 2000, Perda: 10000 },
      { month: "Abr", Lucro: 2800, Perda: 4000 },
      { month: "Mai", Lucro: 1900, Perda: 4800 },
      { month: "Jun", Lucro: 2400, Perda: 3800 },
    ];
  }, [monthlyData]);

  const projectionData = useMemo(() => {
    const base = Math.max(totals.balance || 0, totals.income - totals.expense, 5000);
    return [
      { year: "2024", total: base },
      { year: "2025", total: Math.round(base * 1.2) },
      { year: "2026", total: Math.round(base * 1.45) },
      { year: "2027", total: Math.round(base * 1.8) },
    ];
  }, [totals]);

  const comparisonData = useMemo(() => {
    const totalFlow = Math.max(totals.income + totals.expense, 1);
    const efficiency = Math.round((totals.income / totalFlow) * 100) || 85;
    const waste = Math.round((totals.expense / totalFlow) * 100) || 15;

    return [
      {
        name: "Empresa A",
        Eficiencia: Math.max(35, Math.min(95, efficiency)),
        Desperdicio: Math.max(5, Math.min(65, waste)),
      },
      {
        name: "Empresa B",
        Eficiencia: Math.max(30, Math.min(90, efficiency - 15)),
        Desperdicio: Math.max(10, Math.min(70, waste + 15)),
      },
    ];
  }, [totals]);

  const maxValue = useMemo(() => {
    const values = chartData.flatMap((row) => [row.Receita, row.Despesa]);
    return values.length ? Math.max(...values) : 0;
  }, [chartData]);

  const handleExport = async () => {
    try {
      const blob = await exportFinancialCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "relatorio-financeiro.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      addToast("Relatorio exportado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao exportar relatorio."), "error");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-5xl">Relatorios</h1>
      </header>

      <section className="flex flex-wrap gap-3">
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 outline-none transition hover:border-zinc-600"
        >
          <option value="30d">Filtrar por data</option>
          <option value="90d">Ultimos 90 dias</option>
          <option value="12m">Ultimos 12 meses</option>
        </select>

        <select
          value={sector}
          onChange={(event) => setSector(event.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 outline-none transition hover:border-zinc-600"
        >
          <option value="geral">Filtrar por setor</option>
          <option value="ecommerce">E-commerce</option>
          <option value="servicos">Servicos</option>
          <option value="industria">Industria</option>
        </select>

        <button
          type="button"
          className="rounded-lg border border-lime-300/70 bg-lime-300 px-5 py-2.5 text-sm font-black text-zinc-900 transition hover:brightness-95"
        >
          Gerar relatorio detalhado
        </button>

        <button
          onClick={load}
          type="button"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          Atualizar
        </button>

        <button
          onClick={handleExport}
          type="button"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-bold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          Exportar PDF
        </button>
      </section>

      {loading ? (
        <LoadingState label="Carregando relatorio..." />
      ) : loadError ? (
        <ErrorState
          title="Erro ao carregar relatorio"
          description={loadError}
          actionLabel="Tentar novamente"
          onAction={load}
        />
      ) : chartData.length === 0 ? (
        <EmptyState
          title="Sem dados para relatorio"
          description="Cadastre transacoes para gerar visualizacoes e exportacoes."
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:p-5">
              <h2 className="mb-2 text-2xl font-black tracking-tight text-zinc-100">Lucros e Perdas</h2>
              <div className="h-[340px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
                  <LineChart data={lineData} margin={{ top: 20, right: 16, left: 0, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#243046" />
                    <XAxis dataKey="month" stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #3f3f46",
                        background: "#09090b",
                        color: "#f4f4f5",
                      }}
                      formatter={(value: number, name: string) => [asCurrency(Number(value || 0)), name]}
                    />
                    <Legend
                      wrapperStyle={{ color: "#d4d4d8", fontSize: "11px", fontWeight: 700 }}
                      formatter={(value) => (
                        <span className={value === "Lucro" ? "text-lime-300" : "text-red-300"}>{value}</span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="Lucro"
                      stroke="#B6FF00"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#D8FF66", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#E9FFC4", stroke: "#171717", strokeWidth: 2 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Perda"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#fca5a5", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#fecaca", stroke: "#171717", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:p-5">
              <h2 className="mb-2 text-2xl font-black tracking-tight text-zinc-100">Projecoes de Crescimento</h2>
              <div className="h-[340px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={260}>
                  <AreaChart data={projectionData} margin={{ top: 20, right: 8, left: 0, bottom: 6 }}>
                    <defs>
                      <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B6FF00" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#B6FF00" stopOpacity={0.08} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#243046" />
                    <XAxis dataKey="year" stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis
                      stroke="#a1a1aa"
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      tickFormatter={(value) => formatCompactCurrency(Number(value || 0))}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #3f3f46",
                        background: "#09090b",
                        color: "#f4f4f5",
                      }}
                      formatter={(value: number) => [asCurrency(Number(value || 0)), "Total"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#B6FF00"
                      strokeWidth={2}
                      fill="url(#growthFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 md:p-5">
            <h2 className="mb-2 text-2xl font-black tracking-tight text-zinc-100">Comparativo entre Empresas</h2>
            <div className="h-[330px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={240}>
                <BarChart data={comparisonData} margin={{ top: 20, right: 12, left: 0, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#243046" />
                  <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                  <YAxis stroke="#a1a1aa" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #3f3f46",
                      background: "#09090b",
                      color: "#f4f4f5",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: "#d4d4d8", fontSize: "11px", fontWeight: 700 }}
                    formatter={(value) => (
                      <span className={value === "Desperdicio" ? "text-red-300" : "text-lime-300"}>{value}</span>
                    )}
                  />
                  <Bar dataKey="Desperdicio" fill="#f87171" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Eficiencia" fill="#B6FF00" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Pico financeiro do periodo: <span className="font-bold text-zinc-300">{formatCompactCurrency(maxValue)}</span>
            </p>
          </section>
        </>
      )}

    </div>
  );
};

export default Reports;

