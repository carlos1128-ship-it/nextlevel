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
  const isNeon = accent === "green" || (accent === "blue" && value !== "0");
  return (
    <div className="nl-card p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
      {isNeon && <div className="absolute top-0 right-0 w-20 h-20 bg-[var(--nl-neon)] opacity-[0.03] blur-2xl pointer-events-none" />}
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--nl-text-muted)]">{label}</p>
      <div className="mt-2">
        <p className={`text-2xl font-black tracking-tight ${accent === "red" ? "text-red-400" : isNeon ? "text-[var(--nl-neon)]" : "text-[var(--nl-text-primary)]"}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

// ─── AI Executive Summary ──────────────────────────────────────────────────────
const AiSummaryCard = ({ text, loading }: { text: string | null; loading: boolean }) => {
  if (loading) {
    return (
      <div className="nl-card p-6 md:p-8 border-[var(--nl-neon)]/30 bg-gradient-to-br from-[rgba(182,255,0,0.05)] to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--nl-neon)] opacity-[0.02] blur-[100px] pointer-events-none" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--nl-neon)] flex items-center gap-2">
          <span className="animate-pulse">✨</span> Gerando Inteligência Artificial
        </p>
        <div className="mt-6 space-y-3">
          <div className="h-4 animate-pulse rounded-full bg-white/5 w-[90%]" />
          <div className="h-4 animate-pulse rounded-full bg-white/5 w-[75%]" />
          <div className="h-4 animate-pulse rounded-full bg-white/5 w-[85%]" />
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
    <div className="nl-card p-6 md:p-8 border-[var(--nl-neon)]/30 bg-gradient-to-br from-[rgba(182,255,0,0.05)] to-transparent relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--nl-neon)] opacity-[0.02] blur-[100px] pointer-events-none" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--nl-neon)] flex items-center gap-2 mb-6">
        <span>✨</span> Insight Executivo Next Level
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-[var(--nl-neon)]/20 transition-colors">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--nl-neon)] shadow-[0_0_8px_var(--nl-neon)]" />
            <p className="text-[13px] leading-relaxed text-[var(--nl-text-secondary)]">{line}</p>
          </div>
        ))}
      </div>
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
      setLoadError("Selecione uma empresa para gerar o relatório.");
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
      const message = getErrorMessage(error, "Não foi possível carregar o relatório.");
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
      { name: "Sua empresa", Eficiência: Math.max(35, Math.min(95, eff)), Desperdício: Math.max(5, Math.min(65, waste)) },
      { name: "Média setor", Eficiência: Math.max(30, Math.min(90, eff - 15)), Desperdício: Math.max(10, Math.min(70, waste + 15)) },
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
      if (!text) addToast("IA não retornou sumário.", "info");
    } catch (err) {
      addToast(getErrorMessage(err, "Erro ao gerar sumário com IA."), "error");
    } finally {
      setAiLoading(false);
    }
  }, [selectedCompanyId, totals, margin, period, sector, detailLevel, addToast]);

  // ── PDF Export ───────────────────────────────────────────────────────────────
  const handleExportPdf = useCallback(async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    try {
      // Gerar sumário IA antes do PDF se ainda não tiver
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

      // Paint dark background on page 1 before adding image.
      // Without this, any unused space below the image is jsPDF's
      // default white, causing the white blank Area at the bottom.
      pdf.setFillColor(9, 9, 11); // #09090b — matches report bg
      pdf.rect(0, 0, pageW, pageH, "F");

      let position = 0;
      let remaining = imgH;

      while (remaining > 0) {
        pdf.addImage(imgData, "PNG", 0, position, pageW, imgH);
        remaining -= pageH;
        if (remaining > 0) {
          pdf.addPage();
          position -= pageH;
          // Paint dark background on every subsequent page too.
          pdf.setFillColor(9, 9, 11);
          pdf.rect(0, 0, pageW, pageH, "F");
        }
      }

      const date = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
      pdf.save(`relatório-next-level-${date}.pdf`);
      addToast("PDF exportado com sucesso.", "success");
    } catch (err) {
      addToast(getErrorMessage(err, "Falha ao gerar PDF."), "error");
    } finally {
      setPdfLoading(false);
    }
  }, [reportRef, aiSummary, aiLoading, generateAiSummary, addToast]);

  return (
    <div className="nl-page">
      {/* Header */}
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Inteligência Financeira</p>
          <h1 className="nl-page-title">Relatórios & Insights</h1>
          <p className="nl-page-subtitle">Analise financeira orientada por dados e IA para decisões estratégicas.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="nl-input py-2 text-xs w-[140px]"
          >
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="12m">Últimos 12 meses</option>
          </select>

          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="nl-input py-2 text-xs w-[140px]"
          >
            <option value="geral">Todos os setores</option>
            <option value="ecommerce">E-commerce</option>
            <option value="serviços">Serviços</option>
            <option value="industria">Industria</option>
          </select>

          <button
            type="button"
            onClick={load}
            className="nl-button-secondary py-2 text-xs"
          >
            Sincronizar
          </button>

          <button
            type="button"
            onClick={generateAiSummary}
            disabled={aiLoading || !selectedCompanyId}
            className="nl-button-primary py-2 text-xs border-[var(--nl-neon)]/30 group"
          >
            <span className={aiLoading ? "animate-pulse" : "group-hover:scale-110 transition-transform"}>✨</span> {aiLoading ? "Analisando..." : "Insight IA"}
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={pdfLoading || loading || !selectedCompanyId}
            className="nl-button-primary py-2 text-xs"
          >
            {pdfLoading ? "Gerando..." : "Baixar PDF"}
          </button>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <ErrorState
          title="Erro ao carregar relatório"
          description={loadError}
          actionLabel="Tentar novamente"
          onAction={load}
        />
      ) : chartData.length === 0 ? (
        <EmptyState
          title="Sem dados para relatório"
          description="Cadastre transações para gerar visualizações e exportações."
        />
      ) : (
        // ── Conteúdo capturável pelo PDF ────────────────────────────────────
        <div ref={reportRef} className="space-y-8 rounded-3xl bg-[#09090b] p-4 md:p-6">
          {/* Branding no PDF */}
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-black uppercase tracking-[0.25em] text-[var(--nl-neon)]">Next Level Core</span>
              <p className="text-[11px] text-[var(--nl-text-muted)] font-medium">Relatório Estratégico · Gerado em {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="nl-badge-neon text-[10px]">Documento Confidencial</div>
          </div>

          {/* AI Summary */}
          <AiSummaryCard text={aiSummary} loading={aiLoading} />

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Faturamento Bruto" value={asCurrency(totals.income)} accent="green" />
            <KpiCard label="Despesas Operacionais" value={asCurrency(totals.expense)} accent="red" />
            <KpiCard label="Resultado Líquido" value={asCurrency(totals.balance)} accent={totals.balance >= 0 ? "blue" : "red"} />
            <KpiCard label="Margem de Lucro" value={`${margin}%`} accent={margin >= 20 ? "green" : margin >= 0 ? "blue" : "red"} />
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="nl-card p-6 border-white/5 bg-black/20">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--nl-text-muted)] mb-6">Fluxo de Caixa (L/P)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(Number(v))} />
                    <Tooltip contentStyle={{ backgroundColor: "#131517", borderColor: "#24282c", borderRadius: 12, fontSize: 12 }} formatter={(v: number, n: string) => [asCurrency(Number(v)), n]} />
                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 20 }} formatter={(v) => <span className={v === "Lucro" ? "text-[var(--nl-neon)]" : "text-red-400"}>{v}</span>} />
                    <Line type="monotone" dataKey="Lucro" stroke="var(--nl-neon)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#FFF" }} />
                    <Line type="monotone" dataKey="Perda" stroke="#f87171" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#FFF" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="nl-card p-6 border-white/5 bg-black/20">
              <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--nl-text-muted)] mb-6">Escalabilidade Projetada</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rptGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--nl-neon)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--nl-neon)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="year" stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(Number(v))} />
                    <Tooltip contentStyle={{ backgroundColor: "#131517", borderColor: "#24282c", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [asCurrency(Number(v)), "Projeção"]} />
                    <Area type="monotone" dataKey="total" stroke="var(--nl-neon)" strokeWidth={3} fill="url(#rptGrowth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart row 2 */}
          <div className="nl-card p-6 border-white/5 bg-black/20">
            <h3 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[var(--nl-text-muted)] mb-6">Peer Benchmarking (Setor)</h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#131517", borderColor: "#24282c", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 20 }} formatter={(v) => <span className={v === "Desperdício" ? "text-red-400" : "text-[var(--nl-neon)]"}>{v}</span>} />
                  <Bar dataKey="Desperdício" fill="#f87171" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Eficiência" fill="var(--nl-neon)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-[11px] text-[var(--nl-text-muted)] text-center">
              Pico de Faturamento: <span className="text-[var(--nl-text-primary)] font-bold">{formatCompact(maxValue)}</span>
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-[9px] font-bold uppercase tracking-[0.3em] text-white/20">
            <span>Next Level Platform v2.0</span>
            <span>Relatório Confidencial Digital</span>
            <span>{new Date().getFullYear()} © Todos os direitos reservados.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
