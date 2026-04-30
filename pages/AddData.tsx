import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import {
  analyzeIntelligentImport,
  confirmIntelligentImport,
  createTextIntelligentImport,
  getIntelligentImport,
  getIntelligentImports,
  rejectIntelligentImport,
  reviewIntelligentImport,
  uploadIntelligentImportFile,
} from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type {
  IntelligentImportEntity,
  IntelligentImportMetric,
  IntelligentImportRecord,
} from "../src/types/domain";
import { BarChartIcon, LightbulbIcon, PlusIcon, ReceiptIcon, UsersIcon } from "../components/icons";

type InputMode = "text" | "csv" | "image" | "pdf";

const INPUT_MODES: Array<{
  mode: InputMode;
  title: string;
  description: string;
  accept?: string;
  beta?: boolean;
}> = [
  {
    mode: "image",
    title: "Enviar print/imagem",
    description: "Bom para dashboards de anuncios, delivery e marketplaces.",
    accept: "image/png,image/jpeg,image/webp",
    beta: true,
  },
  {
    mode: "pdf",
    title: "Enviar PDF/documento",
    description: "Use para relatorios exportados ou documentos financeiros.",
    accept: "application/pdf,text/plain",
    beta: true,
  },
  {
    mode: "csv",
    title: "Importar CSV",
    description: "Preview, sugestao de leitura e confirmacao antes de salvar.",
    accept: ".csv,text/csv,application/vnd.ms-excel",
  },
  {
    mode: "text",
    title: "Colar texto",
    description: "Perfeito para copiar dados de relatorios ou escrever manualmente.",
  },
];

const CATEGORY_OPTIONS = [
  { value: "auto", label: "Detectar automaticamente" },
  { value: "marketing", label: "Marketing / Trafego" },
  { value: "sales", label: "Vendas" },
  { value: "marketplace", label: "Marketplace" },
  { value: "delivery", label: "Delivery" },
  { value: "financial", label: "Financeiro" },
  { value: "products", label: "Produtos" },
  { value: "customers", label: "Clientes" },
];

function statusLabel(status: string) {
  switch (status) {
    case "uploaded":
      return "Enviado";
    case "analyzing":
      return "Analisando";
    case "needs_review":
      return "Revisar";
    case "confirmed":
      return "Confirmado";
    case "rejected":
      return "Rejeitado";
    case "failed":
      return "Falhou";
    default:
      return status;
  }
}

function statusClasses(status: string) {
  if (status === "confirmed") return "border-lime-400/30 bg-lime-400/10 text-lime-300";
  if (status === "needs_review") return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (status === "failed" || status === "rejected") return "border-red-500/30 bg-red-500/10 text-red-200";
  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function formatMetricInput(value: unknown) {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return JSON.stringify(value ?? "");
}

function parseMetricDraft(value: string, unit: IntelligentImportMetric["unit"]) {
  if (unit === "text") return value;
  const normalized = value.trim();
  if (!normalized) return 0;
  const commaIndex = normalized.lastIndexOf(",");
  const dotIndex = normalized.lastIndexOf(".");
  let raw = normalized;
  if (commaIndex >= 0 && dotIndex >= 0) {
    raw = commaIndex > dotIndex ? normalized.replace(/\./g, "").replace(",", ".") : normalized.replace(/,/g, "");
  } else if (commaIndex >= 0) {
    raw = normalized.replace(",", ".");
  }
  const numeric = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : value;
}

const AddData = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [mode, setMode] = useState<InputMode>("text");
  const [expectedCategory, setExpectedCategory] = useState("auto");
  const [textValue, setTextValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [history, setHistory] = useState<IntelligentImportRecord[]>([]);
  const [selectedImport, setSelectedImport] = useState<IntelligentImportRecord | null>(null);
  const [draftMetrics, setDraftMetrics] = useState<IntelligentImportMetric[]>([]);
  const [draftEntities, setDraftEntities] = useState<IntelligentImportEntity[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const activeMode = useMemo(() => INPUT_MODES.find((item) => item.mode === mode), [mode]);
  const canAnalyze =
    mode === "text"
      ? textValue.trim().length >= 3
      : Boolean(selectedFile);

  const loadHistory = async (selectedId?: string) => {
    if (!selectedCompanyId) {
      setHistory([]);
      setSelectedImport(null);
      setIsLoadingHistory(false);
      return;
    }
    try {
      setIsLoadingHistory(true);
      const imports = await getIntelligentImports({ companyId: selectedCompanyId });
      setHistory(imports);
      const nextSelected =
        (selectedId ? imports.find((item) => item.id === selectedId) : null) ||
        imports[0] ||
        null;
      setSelectedImport(nextSelected);
      setDraftMetrics(nextSelected?.extracted?.metrics || []);
      setDraftEntities(nextSelected?.extracted?.entities || []);
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel carregar o historico."), "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [selectedCompanyId]);

  const handleAnalyze = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de importar dados.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      let created: IntelligentImportRecord;
      if (mode === "text") {
        created = await createTextIntelligentImport(
          {
            text: textValue,
            expectedCategory,
          },
          { companyId: selectedCompanyId },
        );
      } else {
        if (!selectedFile) {
          addToast("Selecione um arquivo antes de analisar.", "error");
          return;
        }
        created = await uploadIntelligentImportFile(
          {
            file: selectedFile,
            expectedCategory,
          },
          { companyId: selectedCompanyId },
        );
      }

      const analyzed = await analyzeIntelligentImport(created.id, {
        companyId: selectedCompanyId,
      });
      setSelectedImport(analyzed);
      setDraftMetrics(analyzed.extracted?.metrics || []);
      setDraftEntities(analyzed.extracted?.entities || []);
      setSelectedFile(null);
      if (mode === "text") {
        setTextValue("");
      }
      await loadHistory(analyzed.id);
      addToast("Analise concluida. Revise os dados antes de confirmar.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel analisar esta importacao."), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectImport = async (importId: string) => {
    if (!selectedCompanyId) return;
    try {
      const item = await getIntelligentImport(importId, { companyId: selectedCompanyId });
      setSelectedImport(item);
      setDraftMetrics(item.extracted?.metrics || []);
      setDraftEntities(item.extracted?.entities || []);
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel abrir esta importacao."), "error");
    }
  };

  const handleMetricValueChange = (index: number, rawValue: string) => {
    setDraftMetrics((current) =>
      current.map((metric, metricIndex) =>
        metricIndex === index
          ? {
              ...metric,
              value: parseMetricDraft(rawValue, metric.unit),
            }
          : metric,
      ),
    );
  };

  const handleConfirm = async () => {
    if (!selectedImport || !selectedCompanyId) return;
    if (!selectedImport.extracted && draftMetrics.length === 0 && draftEntities.length === 0) {
      addToast("Essa importacao ainda nao tem dados para confirmar.", "error");
      return;
    }

    try {
      setIsConfirming(true);
      const reviewed = await reviewIntelligentImport(
        selectedImport.id,
        {
          expectedCategory,
          detectedCategory: selectedImport.extracted?.detectedCategory,
          detectedPlatform: selectedImport.extracted?.detectedPlatform,
          detectedPeriodStart: selectedImport.extracted?.period.startDate || null,
          detectedPeriodEnd: selectedImport.extracted?.period.endDate || null,
          confidence: selectedImport.extracted?.confidence,
          summary: selectedImport.extracted?.summary || selectedImport.aiSummary || "",
          metrics: draftMetrics,
          entities: draftEntities,
          warnings: selectedImport.extracted?.warnings || selectedImport.warnings,
        },
        { companyId: selectedCompanyId },
      );
      const confirmed = await confirmIntelligentImport(reviewed.id, {
        companyId: selectedCompanyId,
      });
      setSelectedImport(confirmed);
      setDraftMetrics(confirmed.extracted?.metrics || []);
      setDraftEntities(confirmed.extracted?.entities || []);
      await loadHistory(confirmed.id);
      addToast("Importacao confirmada com sucesso.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel confirmar a importacao."), "error");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    if (!selectedImport || !selectedCompanyId) return;
    try {
      setIsConfirming(true);
      const rejected = await rejectIntelligentImport(selectedImport.id, {
        companyId: selectedCompanyId,
      });
      setSelectedImport(rejected);
      await loadHistory(rejected.id);
      addToast("Importacao rejeitada.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel rejeitar a importacao."), "error");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <main className="space-y-7">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Adicionar Dados
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
          Importacao Inteligente
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          Envie prints, PDFs, planilhas ou textos e deixe a IA organizar os dados para a NEXT LEVEL.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="grid gap-3 md:grid-cols-2">
            {INPUT_MODES.map((item) => (
              <button
                key={item.mode}
                type="button"
                onClick={() => {
                  setMode(item.mode);
                  setSelectedFile(null);
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === item.mode
                    ? "border-lime-400/50 bg-lime-400/10"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-zinc-100">{item.title}</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">{item.description}</p>
                  </div>
                  {item.beta ? (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-200">
                      Beta
                    </span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                Categoria esperada
              </span>
              <select
                value={expectedCategory}
                onChange={(event) => setExpectedCategory(event.target.value)}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-lime-400/40"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              {mode === "text" ? (
                <label className="block space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    Texto ou relatorio manual
                  </span>
                  <textarea
                    value={textValue}
                    onChange={(event) => setTextValue(event.target.value)}
                    placeholder="Cole aqui um relatorio, resultado de campanha, resumo financeiro ou qualquer dado bruto..."
                    className="min-h-[220px] w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-lime-400/40"
                  />
                </label>
              ) : (
                <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/80 px-5 text-center">
                  <PlusIcon className="h-8 w-8 text-lime-300" />
                  <p className="mt-4 text-sm font-black text-zinc-100">
                    {selectedFile ? selectedFile.name : activeMode?.title}
                  </p>
                  <p className="mt-2 max-w-md text-xs leading-5 text-zinc-500">
                    {mode === "csv"
                      ? "CSV com preview e sugestao de leitura."
                      : "Analise multimodal em beta. Quando o ambiente nao tiver suporte, a importacao fica salva sem fingir extracao."}
                  </p>
                  <input
                    type="file"
                    accept={activeMode?.accept}
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Revise os dados extraidos antes de confirmar.
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={!canAnalyze || isSubmitting}
              className="rounded-2xl bg-lime-400 px-6 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Analisando..." : "Analisar com IA"}
            </button>
            {activeMode?.beta ? (
              <p className="text-xs text-zinc-500">
                Prints e PDFs dependem da capacidade multimodal ativa no backend.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-lime-300">
                Historico
              </p>
              <h2 className="mt-2 text-2xl font-black text-zinc-50">Importacoes recentes</h2>
            </div>
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
              {history.length} itens
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {isLoadingHistory ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
                Carregando importacoes...
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
                Ainda nao ha dados importados.
              </div>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleSelectImport(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedImport?.id === item.id
                      ? "border-lime-400/50 bg-lime-400/10"
                      : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-zinc-100">
                        {item.fileName || item.aiSummary || "Importacao manual"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.inputType} • {item.detectedPlatform || "unknown"} • {item.detectedCategory || "unknown"}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${statusClasses(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        {!selectedImport ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center">
            <h2 className="text-2xl font-black text-zinc-100">Aguardando sua primeira importacao</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-500">
              Envie um print, PDF, CSV ou texto e a IA vai montar uma leitura para sua revisao.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClasses(selectedImport.status)}`}>
                    {statusLabel(selectedImport.status)}
                  </span>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                    {selectedImport.detectedCategory || "unknown"}
                  </span>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                    {selectedImport.detectedPlatform || "unknown"}
                  </span>
                  <span className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                    Confianca {Math.round((selectedImport.extracted?.confidence || selectedImport.confidence || 0) * 100)}%
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-zinc-100">
                    {selectedImport.fileName || "Importacao manual"}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                    {selectedImport.extracted?.summary || selectedImport.aiSummary || "Importacao carregada para revisao."}
                  </p>
                </div>
                {selectedImport.extracted?.period.label ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Periodo detectado: {selectedImport.extracted.period.label}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={isConfirming || selectedImport.status === "confirmed"}
                  className="rounded-2xl border border-zinc-700 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-200 disabled:opacity-50"
                >
                  Rejeitar
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  disabled={
                    isConfirming ||
                    selectedImport.status === "confirmed" ||
                    selectedImport.status === "failed"
                  }
                  className="rounded-2xl bg-lime-400 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-zinc-950 disabled:opacity-50"
                >
                  {isConfirming ? "Confirmando..." : "Confirmar importacao"}
                </button>
              </div>
            </div>

            {selectedImport.warnings.length > 0 ? (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">
                  Alertas
                </p>
                <ul className="mt-3 space-y-2 text-sm text-amber-100">
                  {selectedImport.warnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selectedImport.previewRows.length > 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <ReceiptIcon className="h-5 w-5 text-lime-300" />
                  <h3 className="text-lg font-black text-zinc-100">Preview</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500">
                        {Object.keys(selectedImport.previewRows[0] || {}).map((header) => (
                          <th key={header} className="px-3 py-2 font-black uppercase tracking-[0.12em]">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedImport.previewRows.slice(0, 5).map((row, rowIndex) => (
                        <tr key={`${selectedImport.id}-preview-${rowIndex}`} className="border-b border-zinc-900">
                          {Object.keys(selectedImport.previewRows[0] || {}).map((header) => (
                            <td key={`${rowIndex}-${header}`} className="px-3 py-2">
                              {row[header]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <BarChartIcon className="h-5 w-5 text-lime-300" />
                  <h3 className="text-lg font-black text-zinc-100">Metricas extraidas</h3>
                </div>
                {draftMetrics.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhuma metrica clara foi detectada.</p>
                ) : (
                  <div className="space-y-3">
                    {draftMetrics.map((metric, index) => (
                      <div
                        key={`${selectedImport.id}-${metric.metricKey}-${index}`}
                        className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 md:grid-cols-[1.1fr_1fr_130px]"
                      >
                        <div>
                          <p className="text-sm font-black text-zinc-100">{metric.label}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                            {metric.metricKey} • {metric.unit}
                          </p>
                          {metric.sourceText ? (
                            <p className="mt-2 text-xs text-zinc-500">{metric.sourceText}</p>
                          ) : null}
                        </div>
                        <input
                          value={formatMetricInput(metric.value)}
                          onChange={(event) => handleMetricValueChange(index, event.target.value)}
                          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-lime-400/40"
                        />
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                          {Math.round(metric.confidence * 100)}% conf.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-lime-300" />
                    <h3 className="text-lg font-black text-zinc-100">Entidades detectadas</h3>
                  </div>
                  {draftEntities.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nenhuma entidade estruturada detectada.</p>
                  ) : (
                    <div className="space-y-3">
                      {draftEntities.slice(0, 6).map((entity, index) => (
                        <div key={`${selectedImport.id}-entity-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black text-zinc-100">{entity.entityType}</p>
                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                              {Math.round(entity.confidence * 100)}%
                            </span>
                          </div>
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs leading-5 text-zinc-400">
                            {JSON.stringify(entity.data, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <LightbulbIcon className="h-5 w-5 text-lime-300" />
                    <h3 className="text-lg font-black text-zinc-100">Notas do MVP</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-zinc-400">
                    <li>• Nada entra no dashboard sem confirmacao.</li>
                    <li>• CSV e texto estao prontos para revisao e confirmacao.</li>
                    <li>• Print/PDF dependem da capacidade multimodal ativa no backend.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default AddData;
