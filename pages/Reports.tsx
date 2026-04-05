import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { analyzeData, getFinancialReport, getTransactions } from "../src/services/endpoints";
import type { TransactionItem } from "../src/types/domain";
import { useAuth } from "../App";
import { formatTransactionDate, getTransactionDateValue } from "../src/utils/datetime";

const asCurrency = (value: number) =>
  `R$ ${Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatCompact = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  });

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: "1px solid #27272a",
  background: "#09090b",
  color: "#f4f4f5",
  fontSize: 12,
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "green" | "red" | "blue" | "white";
}) => {
  const colors = {
    green: "text-lime-400 border-lime-400/20 bg-lime-400/5",
    red: "text-red-400 border-red-400/20 bg-red-400/5",
    blue: "text-blue-400 border-blue-400/20 bg-blue-400/5",
    white: "text-zinc-100 border-zinc-700 bg-zinc-900",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-black tracking-tight ${colors[accent].split(" ")[0]}`}>{value}</p>
    </div>
  );
};

// ─── AI Executive Summary ──────────────────────────────────────────────────────
const AiSummaryCard = ({ text, loading }: { text: string | null; loading: boolean }) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-400">Sumario Executivo IA</p>
        <div className="mt-3 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-3 animate-pulse rounded-full bg-zinc-800" style={{ width: `${80 - i * 12}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!text) return null;

  const lines = text
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

  return (
    <div className="rounded-2xl border border-lime-400/20 bg-lime-400/5 p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-400">Sumario Executivo IA</p>
      <ul className="mt-3 space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-snug text-zinc-200">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-400" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Reports = () => {
  const { selectedCompanyId, detailLevel } = useAuth();
  const { addToast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const [period, setPeriod] = useState("30d");
  const [sector, setSector] = useState("geral");
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [pdfLoading, setPdfLoading] = useState(false);

  const load = useCallback(async () => {
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
      setAiSummary(null);
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
  }, [selectedCompanyId, addToast]);

  useEffect(() => {
    load();
  }, [load]);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const chartData = useMemo(() => {
    const map = new Map<string, { name: string; Receita: number; Despesa: number }>();
    safeTransactions.forEach((tx) => {
      const key = formatTransactionDate(getTransactionDateValue(tx), { year: "numeric" });
      if (!map.has(key)) map.set(key, { name: key, Receita: 0, Despesa: 0 });
      const row = map.get(key)!;
      if (tx.type === "income") row.Receita += Number(tx.amount || 0);
      if (tx.type === "expense") row.Despesa += Number(tx.amount || 0);
    });
    return Array.from(map.values()).slice(-20);
  }, [safeTransactions]);

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { month: string; Lucro: number; Perda: number }>();
    chartData.forEach((row) => {
      const [day, month, year] = row.name.split("/");
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      if (Number.isNaN(parsed.getTime())) return;
      const key = parsed.toLocaleDateString("pt-BR", { month: "short" });
      const norm = key.charAt(0).toUpperCase() + key.slice(1).replace(".", "");
      if (!monthMap.has(norm)) monthMap.set(norm, { month: norm, Lucro: 0, Perda: 0 });
      const cur = monthMap.get(norm)!;
      cur.Lucro += row.Receita;
      cur.Perda += row.Despesa;
    });
    return Array.from(monthMap.values()).slice(-6);
  }, [chartData]);

  const lineData = useMemo(
    () =>
      monthlyData.length > 0
        ? monthlyData
        : [
            { month: "Jan", Lucro: 4000, Perda: 2500 },
            { month: "Fev", Lucro: 3000, Perda: 1500 },
            { month: "Mar", Lucro: 2000, Perda: 10000 },
            { month: "Abr", Lucro: 2800, Perda: 4000 },
            { month: "Mai", Lucro: 1900, Perda: 4800 },
            { month: "Jun", Lucro: 2400, Perda: 3800 },
          ],
    [monthlyData]
  );

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
    const eff = Math.round((totals.income / totalFlow) * 100) || 85;
    const waste = Math.round((totals.expense / totalFlow) * 100) || 15;
    return [
      { name: "Sua empresa", Eficiencia: Math.max(35, Math.min(95, eff)), Desperdicio: Math.max(5, Math.min(65, waste)) },
      { name: "Media setor", Eficiencia: Math.max(30, Math.min(90, eff - 15)), Desperdicio: Math.max(10, Math.min(70, waste + 15)) },
    ];
  }, [totals]);

  const maxValue = useMemo(() => {
    const vals = chartData.flatMap((r) => [r.Receita, r.Despesa]);
    return vals.length ? Math.max(...vals) : 0;
  }, [chartData]);

  const margin = totals.income > 0 ? Math.round(((totals.income - totals.expense) / totals.income) * 100) : 0;

  // ── AI Summary ──────────────────────────────────────────────────────────────
  const generateAiSummary = useCallback(async () => {
    if (!selectedCompanyId) return;
    setAiLoading(true);
    setAiSummary(null);
    try {
      const response = await analyzeData(
        {
          companyId: selectedCompanyId,
          financialData: {
            income: totals.income,
            expenses: totals.expense,
            balance: totals.balance,
            margin,
          },
          period,
          sector,
        },
        detailLevel ?? "medium"
      );
      const text =
        typeof response === "string"
          ? response
          : response.analysis || response.insight || response.message || "";
      setAiSummary(text || null);
      if (!text) addToast("IA nao retornou sumario.", "info");
    } catch (err) {
      addToast(getErrorMessage(err, "Erro ao gerar sumario com IA."), "error");
    } finally {
      setAiLoading(false);
    }
  }, [selectedCompanyId, totals, margin, period, sector, detailLevel, addToast]);

  // ── PDF Export ───────────────────────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    try {
      // Gerar sumario IA antes do PDF se ainda não tiver
      if (!aiSummary && !aiLoading) {
        await generateAiSummary();
      }

      // Delay para DOM atualizar
      await new Promise((res) => setTimeout(res, 300));

      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#09090b",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;

      let position = 0;
      let remaining = imgH;

      while (remaining > 0) {
        pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
        remaining -= pageH;
        if (remaining > 0) {
          pdf.addPage();
          position -= pageH;
        }
      }

      const date = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
      pdf.save(`relatorio-next-level-${date}.pdf`);
      addToast("PDF exportado com sucesso.", "success");
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao gerar PDF."), "error");
    } finally {
      setPdfLoading(false);
    }
  }, [reportRef, aiSummary, aiLoading, generateAiSummary, addToast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-zinc-100 md:text-4xl">Relatorios</h1>
          <p className="mt-1 text-sm text-zinc-500">Analise financeira orientada por dados e IA.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 outline-none transition hover:border-zinc-600"
          >
            <option value="30d">Ultimos 30 dias</option>
            <option value="90d">Ultimos 90 dias</option>
            <option value="12m">Ultimos 12 meses</option>
          </select>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 outline-none transition hover:border-zinc-600"
          >
            <option value="geral">Todos os setores</option>
            <option value="ecommerce">E-commerce</option>
            <option value="servicos">Servicos</option>
            <option value="industria">Industria</option>
          </select>

          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            Atualizar
          </button>

          <button
            type="button"
            onClick={generateAiSummary}
            disabled={aiLoading || !selectedCompanyId}
            className="rounded-xl border border-lime-400/40 bg-lime-400/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-lime-400 transition hover:bg-lime-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiLoading ? "Analisando..." : "Sumario IA"}
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={pdfLoading || loading || !selectedCompanyId}
            className="rounded-xl bg-lime-400 px-5 py-2 text-xs font-black uppercase tracking-wide text-zinc-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pdfLoading ? "Gerando PDF..." : "Exportar PDF"}
          </button>
        </div>
      </header>

      {/* States */}
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
        // ── Conteúdo capturável pelo PDF ────────────────────────────────────
        <div ref={reportRef} className="space-y-6 rounded-2xl bg-[#09090b] p-2">

          {/* Branding no PDF */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.25em] text-lime-400">Next Level AI</span>
              <p className="mt-0.5 text-[11px] text-zinc-600">
                Relatorio gerado em {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>
            <span className="rounded-xl bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-lime-400">
              Confidencial
            </span>
          </div>

          {/* AI Summary */}
          <AiSummaryCard text={aiSummary} loading={aiLoading} />

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Receita Total" value={asCurrency(totals.income)} accent="green" />
            <KpiCard label="Despesas" value={asCurrency(totals.expense)} accent="red" />
            <KpiCard label="Saldo" value={asCurrency(totals.balance)} accent={totals.balance >= 0 ? "blue" : "red"} />
            <KpiCard label="Margem Liquida" value={`${margin}%`} accent={margin >= 20 ? "green" : margin >= 0 ? "blue" : "red"} />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950 p-5">
              <h2 className="mb-1 text-base font-black tracking-tight text-zinc-100">Lucros e Perdas</h2>
              <p className="mb-4 text-[11px] text-zinc-500">Evolucao mensal de receitas vs despesas</p>
              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                    <XAxis dataKey="month" stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} />
                    <YAxis stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={(v) => formatCompact(Number(v))} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, n: string) => [asCurrency(Number(v)), n]} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} formatter={(v) => <span className={v === "Lucro" ? "text-lime-400" : "text-red-400"}>{v}</span>} />
                    <Line type="monotone" dataKey="Lucro" stroke="#B6FF00" strokeWidth={2} dot={{ r: 3, fill: "#B6FF00", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Perda" stroke="#f87171" strokeWidth={2} dot={{ r: 3, fill: "#f87171", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950 p-5">
              <h2 className="mb-1 text-base font-black tracking-tight text-zinc-100">Projecoes de Crescimento</h2>
              <p className="mb-4 text-[11px] text-zinc-500">Tendencia projetada com base no saldo atual</p>
              <div className="h-[280px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="rptGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B6FF00" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#B6FF00" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                    <XAxis dataKey="year" stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} />
                    <YAxis stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} tickFormatter={(v) => formatCompact(Number(v))} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [asCurrency(Number(v)), "Projecao"]} />
                    <Area type="monotone" dataKey="total" stroke="#B6FF00" strokeWidth={2} fill="url(#rptGrowth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart row 2 */}
          <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950 p-5">
            <h2 className="mb-1 text-base font-black tracking-tight text-zinc-100">Eficiencia vs Media do Setor</h2>
            <p className="mb-4 text-[11px] text-zinc-500">Comparativo de eficiencia e desperdicio financeiro</p>
            <div className="h-[260px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                  <XAxis dataKey="name" stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <YAxis stroke="#52525b" tick={{ fill: "#71717a", fontSize: 11 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} formatter={(v) => <span className={v === "Desperdicio" ? "text-red-400" : "text-lime-400"}>{v}</span>} />
                  <Bar dataKey="Desperdicio" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="Eficiencia" fill="#B6FF00" radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-[11px] text-zinc-600">
              Pico financeiro do periodo:{" "}
              <span className="font-bold text-zinc-400">{formatCompact(maxValue)}</span>
            </p>
          </div>

          {/* Footer PDF */}
          <div className="border-t border-zinc-800 pt-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-700">
            Next Level AI — Relatorio Confidencial — {new Date().toLocaleDateString("pt-BR")}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
