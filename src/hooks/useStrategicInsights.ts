import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AxiosError } from "axios";
import api from "../services/api";
import { analyzeData, getDashboardSummary, getFinancialReport } from "../services/endpoints";
import type { DashboardSummary, DetailLevel } from "../types/domain";

export interface StrategicInsightCard {
  title: string;
  description: string;
  category: string;
  color: "green" | "blue" | "purple" | "red";
}

type StrategicInsightsResult = {
  cards: StrategicInsightCard[];
  rawText: string;
  source: "cache" | "ai" | "analytics";
  updatedAt: number;
  error: string | null;
};

type StrategicInsightsOptions = {
  companyId: string | null;
  detailLevel: DetailLevel;
  enabled?: boolean;
  summary?: DashboardSummary | null;
};

type CachedStrategicInsightsResult = StrategicInsightsResult & {
  companyId: string;
  detailLevel: DetailLevel;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 2000;
const STORAGE_PREFIX = "strategic_insights_cache_v1";
const MAX_INSIGHT_CHARS = 120;

const memoryCache = new Map<string, CachedStrategicInsightsResult>();
const inFlightRequests = new Map<string, Promise<StrategicInsightsResult>>();

function buildCacheKey(companyId: string, detailLevel: DetailLevel) {
  return `${companyId}:${detailLevel}`;
}

function buildStorageKey(companyId: string, detailLevel: DetailLevel) {
  return `${STORAGE_PREFIX}:${buildCacheKey(companyId, detailLevel)}`;
}

function inferCategory(content: string): string {
  const text = content.toLowerCase();
  if (text.includes("risco") || text.includes("ameaca")) return "Risco";
  if (text.includes("oportunidade")) return "Oportunidade";
  if (text.includes("recomend")) return "Recomendacao";
  if (text.includes("padrao") || text.includes("tendencia")) return "Padrao";
  return "Sugestao da IA";
}

function inferColor(category: string): StrategicInsightCard["color"] {
  if (category === "Risco") return "red";
  if (category === "Oportunidade") return "green";
  if (category === "Recomendacao") return "purple";
  return "blue";
}

function compactText(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= MAX_INSIGHT_CHARS) return clean;
  return `${clean.slice(0, MAX_INSIGHT_CHARS - 3)}...`;
}

function sanitizeInsight(value: string) {
  let text = value || "";
  text = text.replace(/\*\*/g, "");
  const dadosIdx = text.toLowerCase().indexOf("dados:");
  if (dadosIdx >= 0) {
    text = text.slice(0, dadosIdx).trim();
  }
  text = text.replace(/\n{2,}/g, "\n");
  return text.trim();
}

function stripInsightLead(value: string) {
  return value
    .replace(/^(baseado nos seus dados[:,]?\s*)/i, "")
    .replace(/^(com base nos seus dados[:,]?\s*)/i, "")
    .replace(/^(eu recomendo que\s*)/i, "")
    .replace(/^(eu recomendo\s*)/i, "")
    .replace(/^(recomendo que\s*)/i, "")
    .replace(/^(recomendo\s*)/i, "")
    .replace(/^(sugiro que\s*)/i, "")
    .replace(/^(sugiro\s*)/i, "")
    .replace(/^(considere\s*)/i, "")
    .trim();
}

function normalizeInsightLine(value: string) {
  const compact = sanitizeInsight(value)
    .replace(/^(padroes|riscos|oportunidades|recomendacoes)\s*:\s*/i, "")
    .replace(/^[-*•]\s*/, "")
    .split(/[.!?](?:\s|$)/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(". ");

  return compactText(stripInsightLead(compact).replace(/\s+/g, " ").trim());
}

function parseInsightLines(value: string) {
  return sanitizeInsight(value)
    .split(/\n+/)
    .map((item) => normalizeInsightLine(item))
    .filter(Boolean)
    .slice(0, 4);
}

function cardsToRawText(cards: StrategicInsightCard[]) {
  return cards.map((item) => item.description).join("\n");
}

function readCachedResult(companyId: string, detailLevel: DetailLevel) {
  const key = buildCacheKey(companyId, detailLevel);
  const inMemory = memoryCache.get(key);
  if (inMemory && Date.now() - inMemory.updatedAt < CACHE_TTL_MS) {
    return inMemory;
  }

  const raw = localStorage.getItem(buildStorageKey(companyId, detailLevel));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedStrategicInsightsResult;
    if (Date.now() - parsed.updatedAt >= CACHE_TTL_MS) {
      localStorage.removeItem(buildStorageKey(companyId, detailLevel));
      return null;
    }
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    localStorage.removeItem(buildStorageKey(companyId, detailLevel));
    return null;
  }
}

function writeCachedResult(result: CachedStrategicInsightsResult) {
  const key = buildCacheKey(result.companyId, result.detailLevel);
  memoryCache.set(key, result);
  localStorage.setItem(
    buildStorageKey(result.companyId, result.detailLevel),
    JSON.stringify(result)
  );
}

function getAiErrorDetails(error: unknown) {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as { message?: string; error?: string; detail?: string } | string | undefined;
    const status = error.response?.status;
    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || payload?.error || payload?.detail || error.message;
    return {
      status,
      message: status ? `[${status}] ${message}` : message,
    };
  }

  return {
    status: undefined,
    message: error instanceof Error ? error.message : "Erro desconhecido ao gerar insights.",
  };
}

function isRateLimitError(error: unknown) {
  const details = getAiErrorDetails(error);
  const message = details.message.toLowerCase();
  return details.status === 429 || message.includes("limite da ia") || message.includes("quota") || message.includes("rate limit");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestAiAnalysis(
  companyId: string,
  detailLevel: DetailLevel,
  summaryOverride?: DashboardSummary | null
) {
  const [summary, financialReport] = await Promise.all([
    summaryOverride ? Promise.resolve(summaryOverride) : getDashboardSummary({ companyId }),
    getFinancialReport(companyId),
  ]);

  const response = await analyzeData(
    {
      companyId,
      summary,
      financialData: {
        income: financialReport?.income || 0,
        expenses: financialReport?.expense || 0,
        balance: financialReport?.balance || 0,
      },
      goals: [],
    },
    detailLevel
  );

  const text =
    typeof response === "string"
      ? response
      : response.analysis || response.insight || response.message || JSON.stringify(response);

  const parsedLines = parseInsightLines(text);
  const cards = parsedLines.map((item, index) => {
    const category = inferCategory(item);
    return {
      title: parsedLines.length > 1 ? `Insight ${index + 1}` : "Insight",
      description: item,
      category,
      color: inferColor(category),
    } as StrategicInsightCard;
  });

  return {
    cards,
    rawText: parsedLines.length ? parsedLines.join("\n") : sanitizeInsight(text),
  };
}

async function requestAnalyticsFallback(companyId: string) {
  const { data } = await api.get("/insights", {
    params: { companyId },
  });

  const cards = Array.isArray(data)
    ? data
        .map((item: any) => {
          const baseDescription = normalizeInsightLine(String(item?.description ?? ""));
          if (!baseDescription) return null;
          const description =
            item?.value != null ? compactText(`${baseDescription} • ${item.value}`) : baseDescription;
          const category =
            item?.type === "metric"
              ? "Metrica"
              : item?.type === "peak"
                ? "Pico"
                : item?.type === "product"
                  ? "Produto"
                  : item?.type === "growth"
                    ? "Crescimento"
                    : item?.type === "alert"
                      ? "Alerta"
                      : item?.type === "info"
                        ? "Info"
                        : inferCategory(baseDescription);

          const colorMap: Record<string, StrategicInsightCard["color"]> = {
            Metrica: "blue",
            Pico: "purple",
            Produto: "green",
            Crescimento: "green",
            Alerta: "red",
            Info: "blue",
          };

          return {
            title: item?.title ?? "Insight",
            description,
            category,
            color: colorMap[category] || inferColor(category),
          } as StrategicInsightCard;
        })
        .filter(Boolean)
    : [];

  return {
    cards,
    rawText: cardsToRawText(cards),
  };
}

async function fetchStrategicInsights(
  companyId: string,
  detailLevel: DetailLevel,
  options?: { forceFresh?: boolean; summary?: DashboardSummary | null }
): Promise<StrategicInsightsResult> {
  const cached = readCachedResult(companyId, detailLevel);
  if (cached && !options?.forceFresh) {
    return { ...cached, source: "cache" };
  }

  const cacheKey = buildCacheKey(companyId, detailLevel);
  const existing = inFlightRequests.get(cacheKey);
  if (existing) {
    return existing;
  }

  const request: Promise<StrategicInsightsResult> = (async () => {
    try {
      let aiResult: { cards: StrategicInsightCard[]; rawText: string } | null = null;

      try {
        aiResult = await requestAiAnalysis(companyId, detailLevel, options?.summary);
      } catch (error) {
        if (!isRateLimitError(error)) {
          throw error;
        }
        await sleep(RETRY_DELAY_MS);
        aiResult = await requestAiAnalysis(companyId, detailLevel, options?.summary);
      }

      if (aiResult.cards.length) {
        const result: CachedStrategicInsightsResult = {
          companyId,
          detailLevel,
          cards: aiResult.cards,
          rawText: aiResult.rawText,
          source: "ai",
          updatedAt: Date.now(),
          error: null,
        };
        writeCachedResult(result);
        return result;
      }

      const fallback = await requestAnalyticsFallback(companyId);
      return {
        cards: fallback.cards,
        rawText: fallback.rawText,
        source: "analytics",
        updatedAt: Date.now(),
        error: null,
      } as StrategicInsightsResult;
    } catch (error) {
      const fallbackCache = readCachedResult(companyId, detailLevel);
      if (fallbackCache) {
        return {
          ...fallbackCache,
          source: "cache" as const,
          error: getAiErrorDetails(error).message,
        };
      }

      const fallback = await requestAnalyticsFallback(companyId);
      return {
        cards: fallback.cards,
        rawText: fallback.rawText,
        source: "analytics",
        updatedAt: Date.now(),
        error: getAiErrorDetails(error).message,
      } as StrategicInsightsResult;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, request);
  return request;
}

export function useStrategicInsights({
  companyId,
  detailLevel,
  enabled = true,
  summary,
}: StrategicInsightsOptions) {
  const [cards, setCards] = useState<StrategicInsightCard[]>([]);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<StrategicInsightsResult["source"] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const requestIdRef = useRef(0);

  const cacheKey = useMemo(
    () => (companyId ? buildCacheKey(companyId, detailLevel) : null),
    [companyId, detailLevel]
  );

  const load = useCallback(
    async (options?: { forceFresh?: boolean }) => {
      if (!companyId || !enabled) {
        setCards([]);
        setRawText("");
        setError(null);
        setSource(null);
        setUpdatedAt(null);
        return null;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (options?.forceFresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await fetchStrategicInsights(companyId, detailLevel, {
          forceFresh: options?.forceFresh,
          summary,
        });
        if (requestIdRef.current !== requestId) return result;
        setCards(result.cards);
        setRawText(result.rawText);
        setError(result.error);
        setSource(result.source);
        setUpdatedAt(result.updatedAt);
        return result;
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [companyId, detailLevel, enabled, summary]
  );

  useEffect(() => {
    if (!cacheKey || !enabled) {
      setCards([]);
      setRawText("");
      setError(null);
      setSource(null);
      setUpdatedAt(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    void load();
  }, [cacheKey, enabled, load]);

  return {
    cards,
    rawText,
    loading,
    refreshing,
    error,
    source,
    updatedAt,
    reload: load,
  };
}
