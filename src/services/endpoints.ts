import api from "./api";
import type {
  Company,
  DashboardPreference,
  DashboardPreferencesResponse,
  DashboardPeriod,
  DashboardMetricsResponse,
  DashboardSummary,
  CompanyOnboardingPayload,
  CompanyPersonalizationResponse,
  CompanyPersonalizationStatus,
  CompanyModulePreference,
  PersonalizationRecommendations,
  DetailLevel,
  UserNiche,
  Customer,
  OperationalCost,
  PaginatedResponse,
  Product,
  TransactionItem,
  UserProfile,
  IntegrationStatus,
  IntegrationDiagnostic,
  IntegrationProvider,
  ForecastResponse,
  StrategicAction,
  MarketComparison,
  MarketTrend,
  BotConfig,
  ConversationThread,
  WhatsappConnectionSnapshot,
  Lead,
  LeadStatus,
  AdminErrorLog,
  AdminHealth,
  AdminQuota,
  AdminUsageStats,
  AuditFeedItem,
  SubscriptionTier,
  AgentConfig,
  WhatsappConnection,
  ConversationLiveFeedItem,
  IntelligentImportRecord,
  ImportedMetricRecord,
  AIUsageCurrentResponse,
  AIUsageLimitsResponse,
  AiDashboardIntelligence,
} from "../types/domain";

function extractCompanyId(company: Partial<Company> | null | undefined) {
  return company?.id || company?._id || null;
}

function normalizeTransaction(transaction: any): TransactionItem {
  const rawType = String(transaction?.type || "").toLowerCase();
  const normalizedDate =
    transaction?.date || transaction?.occurredAt || transaction?.createdAt || new Date().toISOString();
  return {
    ...transaction,
    type: rawType === "income" ? "income" : "expense",
    amount: Number(transaction?.amount || 0),
    date: normalizedDate,
    occurredAt: transaction?.occurredAt || normalizedDate,
    createdAt: transaction?.createdAt || normalizedDate,
  } as TransactionItem;
}

function normalizeProduct(product: any): Product {
  const createdAt = product?.createdAt || product?.created_at || new Date().toISOString();
  const updatedAt = product?.updatedAt || product?.updated_at || createdAt;
  return {
    id: product?.id || product?._id || "",
    companyId: product?.companyId || product?.company_id || "",
    name: product?.name || "",
    sku: product?.sku ?? null,
    category: product?.category ?? null,
    price: Number(product?.price ?? 0),
    cost: product?.cost === undefined || product?.cost === null ? null : Number(product.cost),
    mlItemId: product?.mlItemId ?? null,
    marketplaceStatus: product?.marketplaceStatus ?? null,
    availableQuantity:
      product?.availableQuantity === undefined || product?.availableQuantity === null
        ? null
        : Number(product.availableQuantity),
    tax: product?.tax === undefined || product?.tax === null ? null : Number(product.tax),
    shipping:
      product?.shipping === undefined || product?.shipping === null
        ? null
        : Number(product.shipping),
    financials: product?.financials
      ? {
        grossProfit: Number(product.financials?.grossProfit ?? 0),
        netMargin: Number(product.financials?.netMargin ?? 0),
        warningLevel: product.financials?.warningLevel || "HEALTHY",
      }
      : undefined,
    createdAt: createdAt,
    updatedAt: updatedAt,
  } as Product;
}

function normalizeCustomer(customer: any): Customer {
  const createdAt = customer?.createdAt || customer?.created_at || new Date().toISOString();
  const updatedAt = customer?.updatedAt || customer?.updated_at || createdAt;
  return {
    id: customer?.id || customer?._id || "",
    companyId: customer?.companyId || customer?.company_id || "",
    name: customer?.name || "",
    email: customer?.email ?? null,
    phone: customer?.phone ?? null,
    channel: customer?.channel ?? null,
    provider: customer?.provider ?? null,
    externalCustomerId: customer?.externalCustomerId ?? null,
    source: customer?.source ?? null,
    interest: customer?.interest ?? null,
    objective: customer?.objective ?? null,
    desiredDate: customer?.desiredDate || null,
    desiredTime: customer?.desiredTime ?? null,
    status: customer?.status ?? null,
    latestAction: normalizeBusinessActionRequest(customer?.latestAction),
    businessActionRequests: Array.isArray(customer?.businessActionRequests)
      ? customer.businessActionRequests.map(normalizeBusinessActionRequest).filter(Boolean)
      : [],
    createdAt,
    updatedAt,
  } as Customer;
}

function normalizeBusinessActionRequest(data: any) {
  if (!data) return null;
  return {
    id: data?.id || "",
    companyId: data?.companyId || "",
    customerId: data?.customerId ?? null,
    leadId: data?.leadId ?? null,
    conversationId: data?.conversationId || "",
    channel: data?.channel || "",
    provider: data?.provider || "",
    customerExternalId: data?.customerExternalId || "",
    type: data?.type || "",
    status: data?.status || "",
    requestedService: data?.requestedService ?? null,
    objective: data?.objective ?? null,
    desiredDate: data?.desiredDate || null,
    desiredTime: data?.desiredTime ?? null,
    notes: data?.notes ?? null,
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || data?.createdAt || new Date().toISOString(),
  };
}

function normalizeCost(cost: any): OperationalCost {
  const baseDate =
    cost?.date || cost?.occurredAt || cost?.createdAt || cost?.created_at || new Date().toISOString();
  const createdAt = cost?.createdAt || cost?.created_at || baseDate;
  const updatedAt = cost?.updatedAt || cost?.updated_at || createdAt;
  return {
    id: cost?.id || cost?._id || "",
    companyId: cost?.companyId || cost?.company_id || "",
    name: cost?.name || "",
    category: cost?.category ?? null,
    amount: Number(cost?.amount ?? cost?.value ?? 0),
    date: typeof baseDate === "string" ? baseDate : new Date(baseDate).toISOString(),
    createdAt: typeof createdAt === "string" ? createdAt : new Date(createdAt).toISOString(),
    updatedAt: typeof updatedAt === "string" ? updatedAt : new Date(updatedAt).toISOString(),
  } as OperationalCost;
}

function normalizeMarketComparison(item: any): MarketComparison {
  return {
    productId: item?.productId || item?.product_id || "",
    productName: item?.productName || item?.product_name || "Produto",
    internalPrice: Number(item?.internalPrice ?? item?.internal_price ?? 0),
    marketAverage: Number(item?.marketAverage ?? item?.market_average ?? 0),
    gapPct: Number(item?.gapPct ?? item?.gap_pct ?? 0),
    badge: (item?.badge as MarketComparison["badge"]) || "sem_dados",
  };
}

function normalizeMarketTrend(item: any): MarketTrend {
  const createdAt = item?.createdAt || item?.created_at || new Date().toISOString();
  return {
    id: item?.id || item?._id,
    companyId: item?.companyId || item?.company_id,
    term: item?.term || "",
    volume: Number(item?.volume ?? 0),
    growthPercentage: Number(item?.growthPercentage ?? item?.growth_percentage ?? 0),
    createdAt: typeof createdAt === "string" ? createdAt : new Date(createdAt).toISOString(),
  };
}

function normalizeBotConfig(data: any): BotConfig {
  return {
    id: data?.id || "",
    companyId: data?.companyId || data?.company_id || "",
    botName: data?.botName || "Atendente IA",
    agentName: data?.agentName || data?.botName || "Atendente IA",
    welcomeMessage: data?.welcomeMessage ?? null,
    toneOfVoice: data?.toneOfVoice || "amigavel",
    tone: data?.tone || data?.toneOfVoice || "AmigÃ¡vel",
    instructions: data?.instructions ?? null,
    isActive: Boolean(data?.isActive ?? true),
    isOnline: Boolean(data?.isOnline ?? data?.isActive ?? true),
    isConnected: Boolean(data?.isConnected ?? false),
    metaPhoneNumberId: data?.metaPhoneNumberId || null,
    metaWabaId: data?.metaWabaId || null,
    phoneNumber: data?.phoneNumber || null,
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || data?.createdAt || new Date().toISOString(),
  };
}

function normalizeConversationMessage(data: any) {
  return {
    id: data?.id || "",
    conversationId: data?.conversationId || "",
    content: data?.content || "",
    role: (data?.role as "user" | "assistant" | "human") || "user",
    timestamp: data?.timestamp || data?.createdAt || new Date().toISOString(),
  };
}

function normalizeAppointmentRequest(data: any) {
  if (!data) return null;
  return {
    id: data?.id || "",
    companyId: data?.companyId || "",
    conversationId: data?.conversationId || "",
    channel: data?.channel || "",
    provider: data?.provider || "",
    customerExternalId: data?.customerExternalId || "",
    status: data?.status || "",
    intent: data?.intent || "",
    requestedService: data?.requestedService ?? null,
    requestedDate: data?.requestedDate || null,
    requestedTime: data?.requestedTime ?? null,
    notes: data?.notes ?? null,
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || data?.createdAt || new Date().toISOString(),
  };
}

export function normalizeConversation(data: any): ConversationThread {
  return {
    id: data?.id || "",
    companyId: data?.companyId || "",
    contactNumber: data?.contactNumber || "",
    contactName: data?.contactName ?? null,
    status: (data?.status as ConversationThread["status"]) || "Aguardando",
    isPaused: Boolean(data?.isPaused ?? false),
    pausedUntil: data?.pausedUntil || null,
    lastMessageAt: data?.lastMessageAt || data?.updatedAt || new Date().toISOString(),
    appointmentRequests: Array.isArray(data?.appointmentRequests)
      ? data.appointmentRequests.map(normalizeAppointmentRequest).filter(Boolean)
      : [],
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || new Date().toISOString(),
    messages: Array.isArray(data?.messages) ? data.messages.map(normalizeConversationMessage) : [],
  };
}

function normalizeLead(data: any): Lead {
  const conversations = Array.isArray(data?.conversations)
    ? data.conversations.map((c: any) => ({
      id: c?.id || "",
      leadId: c?.leadId || data?.id || "",
      role: (c?.role as Lead["conversations"][number]["role"]) || "USER",
      content: c?.content || "",
      createdAt: c?.createdAt || new Date().toISOString(),
    }))
    : [];

  return {
    id: data?.id || "",
    companyId: data?.companyId || "",
    externalId: data?.externalId || "",
    name: data?.name ?? null,
    status: (data?.status as LeadStatus) || "NEW",
    score: Number(data?.score ?? 0),
    lastInteraction: data?.lastInteraction || null,
    botPausedUntil: data?.botPausedUntil || null,
    lastQuotedValue: data?.lastQuotedValue === null || data?.lastQuotedValue === undefined ? null : Number(data.lastQuotedValue),
    channel: data?.channel ?? null,
    provider: data?.provider ?? null,
    externalCustomerId: data?.externalCustomerId ?? null,
    latestIntent: data?.latestIntent ?? null,
    actionStatus: data?.actionStatus ?? null,
    requestedService: data?.requestedService ?? null,
    requestedDate: data?.requestedDate || null,
    requestedTime: data?.requestedTime ?? null,
    notes: data?.notes ?? null,
    appointmentRequest: normalizeAppointmentRequest(data?.appointmentRequest),
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || new Date().toISOString(),
    conversations,
  };
}

function normalizeAdminHealth(data: any): AdminHealth {
  return {
    services: {
      database: {
        status: data?.services?.database?.status || "unknown",
        latencyMs: Number(data?.services?.database?.latencyMs || 0),
      },
      redis: {
        status: data?.services?.redis?.status || "unknown",
        latencyMs: Number(data?.services?.redis?.latencyMs || 0),
      },
      ai: {
        status: data?.services?.ai?.status || "unknown",
        avgLatencyMs: Number(data?.services?.ai?.avgLatencyMs || 0),
      },
    },
    providers: {
      meta: data?.providers?.meta || "unknown",
      mercadoLivre: data?.providers?.mercadoLivre || "unknown",
      gemini: data?.providers?.gemini || "missing",
      openai: data?.providers?.openai || "missing",
    },
    requestTimeline: Array.isArray(data?.requestTimeline)
      ? data.requestTimeline.map((point: any) => ({
        label: point?.label || "",
        avgResponseTime: Number(point?.avgResponseTime || 0),
        success: Number(point?.success || 0),
        failure: Number(point?.failure || 0),
      }))
      : [],
    successVsFailure: {
      success: Number(data?.successVsFailure?.success || 0),
      failure: Number(data?.successVsFailure?.failure || 0),
      errorRateLastWindow: Number(data?.successVsFailure?.errorRateLastWindow || 0),
    },
  };
}

function normalizeAdminUsageStats(data: any): AdminUsageStats {
  return {
    totals: {
      totalTokens: Number(data?.totals?.totalTokens || 0),
      totalMessages: Number(data?.totals?.totalMessages || 0),
      monthlyRevenue: Number(data?.totals?.monthlyRevenue || 0),
      aiCostEstimate: Number(data?.totals?.aiCostEstimate || 0),
      estimatedProfit: Number(data?.totals?.estimatedProfit || 0),
    },
    companies: Array.isArray(data?.companies)
      ? data.companies.map((item: any) => ({
        companyId: item?.companyId || "",
        companyName: item?.companyName || "Empresa",
        currentTier: (item?.currentTier as SubscriptionTier) || "FREE",
        llmTokensUsed: Number(item?.llmTokensUsed || 0),
        whatsappMessagesSent: Number(item?.whatsappMessagesSent || 0),
        billingCycleEnd: item?.billingCycleEnd || new Date().toISOString(),
        monthlyRevenue: Number(item?.monthlyRevenue || 0),
        aiCostEstimate: Number(item?.aiCostEstimate || 0),
        profitEstimate: Number(item?.profitEstimate || 0),
      }))
      : [],
  };
}

function normalizeAdminQuota(data: any): AdminQuota {
  return {
    id: data?.id || "",
    companyId: data?.companyId || "",
    llmTokensUsed: Number(data?.llmTokensUsed || 0),
    whatsappMessagesSent: Number(data?.whatsappMessagesSent || 0),
    currentTier: (data?.currentTier as SubscriptionTier) || "FREE",
    billingCycleEnd: data?.billingCycleEnd || new Date().toISOString(),
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || new Date().toISOString(),
    company: {
      id: data?.company?.id || data?.companyId || "",
      name: data?.company?.name || "Empresa",
      sector: data?.company?.sector ?? null,
    },
  };
}

function normalizeWhatsappConnection(data: any): WhatsappConnection {
  const qrCode = data?.qrCode ?? data?.code ?? data?.qrcode ?? data?.base64 ?? null;
  return {
    id: data?.id ?? null,
    companyId: data?.companyId ?? null,
    provider: data?.provider || "evolution",
    instanceName: data?.instanceName ?? null,
    status: data?.status || "disconnected",
    statusCode: data?.statusCode ?? null,
    connectionState: data?.connectionState ?? null,
    qrCode,
    code: data?.code ?? qrCode,
    pairingCode: data?.pairingCode ?? null,
    phoneNumber: data?.phoneNumber ?? null,
    webhookUrl: data?.webhookUrl ?? null,
    webhookStatus: data?.webhookStatus ?? "pending",
    automationStatus: data?.automationStatus ?? "pending",
    lastError: data?.lastError ?? null,
    message: data?.message ?? null,
    retryAfterSeconds:
      data?.retryAfterSeconds === undefined || data?.retryAfterSeconds === null
        ? null
        : Number(data.retryAfterSeconds),
    expiresInSeconds:
      data?.expiresInSeconds === undefined || data?.expiresInSeconds === null
        ? null
        : Number(data.expiresInSeconds),
    sessionGeneration: data?.sessionGeneration ?? null,
    userRequestedDisconnect: Boolean(data?.userRequestedDisconnect),
    lastConnectionAt: data?.lastConnectionAt ?? null,
    lastDisconnectedAt: data?.lastDisconnectedAt ?? null,
    createdAt: data?.createdAt ?? null,
    updatedAt: data?.updatedAt ?? null,
  };
}

function toWhatsappConnectionSnapshot(data: any): WhatsappConnectionSnapshot {
  const connection = normalizeWhatsappConnection(data);
  const qrRequired =
    connection.status === "qr_required" ||
    connection.status === "qr_pending" ||
    connection.status === "qr_not_ready";

  return {
    instanceName: connection.instanceName,
    qrCode: connection.qrCode,
    qrcode: connection.qrCode,
    pairingCode: connection.pairingCode,
    ready: connection.status === "connected",
    status: connection.status,
    state: connection.connectionState || connection.status,
    lifecycleState: connection.status,
    connected: connection.status === "connected",
    method: "evolution",
    phoneNumber: connection.phoneNumber,
    qrRequired,
    webhookStatus: connection.webhookStatus,
    automationStatus: connection.automationStatus,
    retryAfterSeconds: connection.retryAfterSeconds,
    failureReason: connection.lastError || connection.message || null,
  };
}

function normalizeAgentConfig(data: any, companyId: string): AgentConfig {
  return {
    id: data?.id || "",
    companyId: data?.companyId || companyId,
    agentName: data?.agentName || data?.botName || "Atendente Next Level",
    companyDescription: data?.companyDescription || "",
    welcomeMessage: data?.welcomeMessage || "",
    systemPrompt: data?.systemPrompt || data?.instructions || "",
    toneOfVoice: data?.toneOfVoice || data?.tone || "consultivo",
    internetSearchEnabled: Boolean(data?.internetSearchEnabled),
    speechToTextEnabled: Boolean(data?.speechToTextEnabled ?? data?.speechToText),
    imageUnderstandingEnabled: Boolean(
      data?.imageUnderstandingEnabled ?? data?.imageUnderstanding,
    ),
    pauseForHuman: Boolean(data?.pauseForHuman),
    splitRepliesEnabled: Boolean(data?.splitRepliesEnabled),
    messageBufferEnabled: Boolean(data?.messageBufferEnabled ?? true),
    debounceSeconds: Number(data?.debounceSeconds ?? 3),
    maxContextMessages: Number(data?.maxContextMessages ?? 20),
    isEnabled: Boolean(data?.isEnabled ?? data?.isOnline ?? data?.isActive),
    modelProvider: data?.modelProvider || "openai",
    modelName: data?.modelName || "gpt-4o-mini",
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
  };
}

function normalizeConversationLiveFeedItem(data: any): ConversationLiveFeedItem {
  return {
    id: data?.id || "",
    companyId: data?.companyId || "",
    whatsappConnectionId: data?.whatsappConnectionId ?? null,
    provider: data?.provider || "WHATSAPP",
    channel: data?.channel || "whatsapp",
    remoteJid: data?.remoteJid ?? null,
    contactName: data?.contactName ?? null,
    contactNumber: data?.contactNumber || "",
    status: data?.status || "Aguardando",
    botPaused: Boolean(data?.botPaused),
    lastMessage: data?.lastMessage || "",
    lastMessageDirection: data?.lastMessageDirection ?? null,
    lastMessageStatus: data?.lastMessageStatus ?? null,
    intent: data?.intent ?? null,
    actionStatus: data?.actionStatus ?? null,
    appointmentRequest: normalizeAppointmentRequest(data?.appointmentRequest),
    lastMessageAt: data?.lastMessageAt || new Date().toISOString(),
  };
}

function normalizeAdminErrorLog(data: any): AdminErrorLog {
  return {
    id: data?.id || "",
    method: data?.method || "GET",
    path: data?.path || "/",
    statusCode: Number(data?.statusCode || 0),
    responseTime: Number(data?.responseTime || 0),
    companyId: data?.companyId ?? null,
    createdAt: data?.createdAt || new Date().toISOString(),
    company: data?.company
      ? {
        id: data.company.id || "",
        name: data.company.name || "Empresa",
      }
      : null,
  };
}

function normalizeAuditFeedItem(data: any): AuditFeedItem {
  return {
    id: data?.id || "",
    companyId: data?.companyId ?? null,
    actorType: data?.actorType || "SYSTEM",
    actorId: data?.actorId ?? null,
    action: data?.action || "system.unknown",
    details: data?.details,
    createdAt: data?.createdAt || new Date().toISOString(),
    company: data?.company
      ? {
        id: data.company.id || "",
        name: data.company.name || "Empresa",
      }
      : null,
  };
}

function asPaginated<T>(
  payload:
    | PaginatedResponse<T>
    | T[]
    | { data?: T[]; pagination?: PaginatedResponse<T>["pagination"] }
    | undefined,
  normalizer: (item: any) => T
): PaginatedResponse<T> {
  if (Array.isArray(payload)) {
    const normalized = payload.map(normalizer);
    const size = normalized.length;
    return {
      data: normalized,
      pagination: {
        page: 1,
        limit: Math.max(1, size || 10),
        total: size,
        totalPages: size ? 1 : 0,
      },
    };
  }

  const rawData = payload && typeof payload === "object" && Array.isArray((payload as { data?: T[] }).data)
    ? ((payload as { data?: T[] }).data as any[])
    : [];
  const data = rawData.map(normalizer);
  const rawPagination =
    (payload && typeof payload === "object" && (payload as PaginatedResponse<T>).pagination) || undefined;

  const page = Number(rawPagination?.page) || 1;
  const limit = Number(rawPagination?.limit) || (data.length || 10);
  const total = Number(rawPagination?.total) || data.length;
  const totalPages =
    Number(rawPagination?.totalPages) ||
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : data.length ? 1 : 0);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getDashboardSummary(params?: {
  companyId?: string | null;
  period?: DashboardPeriod;
  metrics?: string[];
}) {
  const { data } = await api.get<Partial<DashboardSummary>>("/dashboard/summary", {
    params: {
      companyId: params?.companyId || undefined,
      period: params?.period || undefined,
      metrics: params?.metrics?.length ? params.metrics.join(",") : undefined,
    },
  });
  return data;
}

export async function getDashboardMetrics(params?: {
  companyId?: string | null;
  period?: DashboardPeriod;
  metrics?: string[];
  comparePrevious?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  const { data } = await api.get<DashboardMetricsResponse>("/dashboard/metrics", {
    params: {
      companyId: params?.companyId || undefined,
      period: params?.period || undefined,
      metrics: params?.metrics?.length ? params.metrics.join(",") : undefined,
      comparePrevious:
        params?.comparePrevious === undefined ? undefined : String(params.comparePrevious),
      startDate: params?.startDate || undefined,
      endDate: params?.endDate || undefined,
    },
  });
  return data;
}

export async function getAiDashboardInsights(params?: {
  companyId?: string | null;
  period?: DashboardPeriod;
}) {
  const { data } = await api.get<AiDashboardIntelligence>("/ai/dashboard-insights", {
    params: {
      companyId: params?.companyId || undefined,
      period: params?.period || undefined,
    },
  });
  return data;
}

export async function getDashboardPreferences(params?: { companyId?: string | null }) {
  const { data } = await api.get<DashboardPreferencesResponse>("/dashboard/preferences", {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return data;
}

export async function saveDashboardPreferences(
  preferences: DashboardPreference[],
  params?: { companyId?: string | null },
) {
  const { data } = await api.put<DashboardPreferencesResponse>(
    "/dashboard/preferences",
    { preferences },
    { params: params?.companyId ? { companyId: params.companyId } : undefined },
  );
  return data;
}

export async function resetDashboardPreferences(params?: { companyId?: string | null }) {
  const { data } = await api.post<DashboardPreferencesResponse>(
    "/dashboard/preferences/reset",
    {},
    { params: params?.companyId ? { companyId: params.companyId } : undefined },
  );
  return data;
}

export async function getCompanyPersonalizationStatus(params?: { companyId?: string | null }) {
  const { data } = await api.get<CompanyPersonalizationStatus>("/company/personalization/status", {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return data;
}

export async function getCompanyPersonalization(params?: { companyId?: string | null }) {
  const { data } = await api.get<CompanyPersonalizationResponse>("/company/personalization", {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return data;
}

export async function previewCompanyOnboarding(
  payload: CompanyOnboardingPayload,
  params?: { companyId?: string | null },
) {
  const { data } = await api.post<{ recommendations: PersonalizationRecommendations }>(
    "/company/personalization/preview",
    payload,
    { params: params?.companyId ? { companyId: params.companyId } : undefined },
  );
  return data;
}

export async function saveCompanyOnboarding(
  payload: CompanyOnboardingPayload,
  params?: { companyId?: string | null },
) {
  const { data } = await api.post<
    CompanyPersonalizationResponse & {
      appliedSetup?: unknown;
      userNiche?: UserNiche;
    }
  >("/company/personalization/onboarding", payload, {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return data;
}

export async function updateCompanyPersonalizationProfile(
  payload: Partial<CompanyOnboardingPayload>,
  params?: { companyId?: string | null },
) {
  const { data } = await api.put<Pick<CompanyPersonalizationResponse, "profile" | "recommendations">>(
    "/company/personalization/profile",
    payload,
    { params: params?.companyId ? { companyId: params.companyId } : undefined },
  );
  return data;
}

export async function resetCompanyRecommendations(params?: { companyId?: string | null }) {
  const { data } = await api.post<CompanyPersonalizationResponse>(
    "/company/personalization/reset-recommendations",
    {},
    { params: params?.companyId ? { companyId: params.companyId } : undefined },
  );
  return data;
}

export async function saveCompanyModulePreferences(
  preferences: Array<Pick<CompanyModulePreference, "moduleKey" | "enabled" | "order">>,
  params?: { companyId?: string | null },
) {
  const { data } = await api.put<{ modulePreferences: CompanyModulePreference[] }>(
    "/company/modules/preferences",
    { preferences },
    { params: params?.companyId ? { companyId: params.companyId } : undefined },
  );
  return data;
}

export async function getTransactions(
  companyId?: string,
  params?: { start?: string; end?: string },
) {
  const { data } = await api.get<any[]>("/financial/transactions", {
    params: {
      companyId: companyId || undefined,
      start: params?.start || undefined,
      end: params?.end || undefined,
    },
  });
  return Array.isArray(data) ? data.map((item) => normalizeTransaction(item)) : [];
}

export type SaleOrderItem = {
  id: string;
  externalId: string | null;
  channel: string;
  amount: number;
  productName: string | null;
  category: string | null;
  occurredAt: string;
};

export async function getSalesOrders(params?: { companyId?: string | null; start?: string; end?: string }) {
  const { data } = await api.get<any[]>("/sales", {
    params: {
      companyId: params?.companyId || undefined,
      start: params?.start || undefined,
      end: params?.end || undefined,
    },
  });
  return Array.isArray(data)
    ? data.map((item) => ({
        id: item?.id || "",
        externalId: item?.externalId || null,
        channel: item?.channel || "manual",
        amount: Number(item?.amount || 0),
        productName: item?.productName || null,
        category: item?.category || null,
        occurredAt: item?.occurredAt || item?.createdAt || new Date().toISOString(),
      }))
    : [];
}

export async function createTransaction(payload: {
  companyId: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category?: string;
  date: string;
  manual?: boolean;
}) {
  const { data } = await api.post<{
    transaction: TransactionItem;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    transactionsCount: number;
  }>("/financial/transactions", {
    ...payload,
    amount: Number(payload.amount),
    date: new Date(payload.date).toISOString(),
  });
  return {
    ...data,
    transaction: normalizeTransaction(data.transaction),
  };
}

export async function getCompanies() {
  const { data } = await api.get<Company | Company[] | { companies?: Company[]; company?: Company }>(
    "/company"
  );

  const companies = Array.isArray(data)
    ? data
    : data && typeof data === "object" && !Array.isArray(data) && extractCompanyId(data as Company)
      ? [data as Company]
      : Array.isArray((data as { companies?: Company[] })?.companies)
        ? (data as { companies?: Company[] }).companies
        : (data as { company?: Company })?.company && extractCompanyId((data as { company?: Company }).company)
          ? [(data as { company: Company }).company]
          : [];

  return companies.filter((company) => Boolean(extractCompanyId(company)));
}

export async function createCompany(payload: {
  name: string;
  userId?: string;
  sector?: string;
  segment?: string;
  document?: string;
  description?: string;
  openedAt?: string;
}) {
  const { data } = await api.post<Company | { company?: Company; data?: Company }>("/company", payload);
  const normalizedData =
    data && typeof data === "object" && !Array.isArray(data) && "company" in data
      ? (data as { company?: Company }).company || data
      : data;
  if (normalizedData && typeof normalizedData === "object" && !Array.isArray(normalizedData)) {
    if ((normalizedData as { company?: Company }).company) return (normalizedData as { company: Company }).company;
    if ((normalizedData as { data?: Company }).data) return (normalizedData as { data: Company }).data;
  }
  return normalizedData as Company;
}

export async function deleteCompany(id: string) {
  const { data } = await api.delete<{
    success: boolean;
    companyId: string;
    companyName: string;
    deletedCounts?: Record<string, number>;
  }>(`/company/${id}`);
  return data;
}

export async function analyzeData(payload: unknown, detailLevel: DetailLevel) {
  const { data } = await api.post<{ analysis?: string; insight?: string; message?: string } | string>(
    "/ai/analyze",
    { data: payload, detailLevel }
  );
  return data;
}

export async function getUserProfile() {
  const { data } = await api.get<UserProfile>("/profile");
  return data;
}

export async function updateUserProfile(payload: Partial<UserProfile>) {
  const { data } = await api.patch<UserProfile>("/profile", payload);
  return data;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const { data } = await api.patch("/profile/password", payload);
    return data;
  } catch {
    const { data } = await api.patch("/profile/change-password", payload);
    return data;
  }
}

export async function chatWithAi(payload: {
  companyId?: string;
  message: string;
  detailLevel: DetailLevel;
}) {
  try {
    const { data } = await api.post<{ response?: string; message?: string } | string>("/chat", payload);
    return data;
  } catch {
    // Compatibility fallback for environments still exposing AI chat in /ai/chat.
    const { data } = await api.post<{ response?: string; message?: string } | string>("/ai/chat", {
      message: payload.message,
      detailLevel: payload.detailLevel,
    });
    return data;
  }
}

export async function getFinancialReport(
  companyId: string,
  params?: { start?: string; end?: string },
) {
  const { data } = await api.get<{ income: number; expense: number; balance: number }>(
    "/financial/report",
    { params: { companyId, start: params?.start || undefined, end: params?.end || undefined } }
  );
  return data;
}

export async function getProducts(params?: {
  companyId?: string;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const query = {
    companyId: params?.companyId || undefined,
    page: params?.page || undefined,
    limit: params?.limit || undefined,
    search: params?.search || undefined,
    category: params?.category || undefined,
    minPrice: params?.minPrice ?? undefined,
    maxPrice: params?.maxPrice ?? undefined,
  };

  const { data } = await api.get<
    PaginatedResponse<Product> | Product[] | { data?: Product[]; pagination?: PaginatedResponse<Product>["pagination"] }
  >("/products", { params: query });

  return asPaginated<Product>(data as any, normalizeProduct);
}

export async function createProduct(
  companyId: string,
  payload: {
    name: string;
    price: number;
    sku?: string;
    category?: string;
    cost?: number;
    tax?: number;
    shipping?: number;
  },
) {
  const { data } = await api.post<Product>("/products", { ...payload, companyId });
  return normalizeProduct(data);
}

export async function updateProduct(
  companyId: string,
  id: string,
  payload: Partial<{
    name: string;
    price: number;
    sku?: string;
    category?: string;
    cost?: number;
    tax?: number;
    shipping?: number;
  }>,
) {
  const { data } = await api.put<Product>(`/products/${id}`, { ...payload, companyId });
  return normalizeProduct(data);
}

export async function deleteProduct(companyId: string, id: string) {
  await api.delete(`/products/${id}`, { params: { companyId } });
  return { deleted: true };
}

export async function getCustomers(params?: {
  companyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = {
    companyId: params?.companyId || undefined,
    search: params?.search || undefined,
    page: params?.page || undefined,
    limit: params?.limit || undefined,
  };

  const { data } = await api.get<
    PaginatedResponse<Customer> | Customer[] | { data?: Customer[]; pagination?: PaginatedResponse<Customer>["pagination"] }
  >("/customers", { params: query });

  return asPaginated<Customer>(data as any, normalizeCustomer);
}

export async function createCustomer(
  companyId: string,
  payload: { name: string; email?: string; phone?: string }
) {
  const { data } = await api.post<Customer>("/customers", { ...payload, companyId });
  return normalizeCustomer(data);
}

export async function updateCustomer(
  companyId: string,
  id: string,
  payload: Partial<{ name: string; email?: string; phone?: string }>
) {
  const { data } = await api.put<Customer>(`/customers/${id}`, { ...payload, companyId });
  return normalizeCustomer(data);
}

export async function deleteCustomer(companyId: string, id: string) {
  await api.delete(`/customers/${id}`, { params: { companyId } });
  return { deleted: true };
}

export async function getCosts(params?: {
  companyId?: string;
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  const query = {
    companyId: params?.companyId || undefined,
    search: params?.search || undefined,
    category: params?.category || undefined,
    startDate: params?.startDate || undefined,
    endDate: params?.endDate || undefined,
    page: params?.page || undefined,
    limit: params?.limit || undefined,
  };

  const { data } = await api.get<
    PaginatedResponse<OperationalCost> | OperationalCost[] | { data?: OperationalCost[]; pagination?: PaginatedResponse<OperationalCost>["pagination"] }
  >("/costs", { params: query });

  return asPaginated<OperationalCost>(data as any, normalizeCost);
}

export async function createCost(
  companyId: string,
  payload: { name: string; category?: string; amount: number; date: string }
) {
  const { data } = await api.post<OperationalCost>("/costs", {
    ...payload,
    companyId,
    amount: Number(payload.amount),
    date: new Date(payload.date).toISOString(),
  });
  return normalizeCost(data);
}

export async function updateCost(
  companyId: string,
  id: string,
  payload: Partial<{ name: string; category?: string; amount?: number; date?: string }>
) {
  const { data } = await api.put<OperationalCost>(`/costs/${id}`, {
    ...payload,
    companyId,
    amount: payload.amount === undefined ? undefined : Number(payload.amount),
    date: payload.date ? new Date(payload.date).toISOString() : undefined,
  });
  return normalizeCost(data);
}

export async function deleteCost(companyId: string, id: string) {
  await api.delete(`/costs/${id}`, { params: { companyId } });
  return { deleted: true };
}

export async function deleteMyAccount() {
  const { data } = await api.delete<{ success: boolean }>("/profile");
  return data;
}

export async function getIntegrationStatuses(companyId?: string | null) {
  const { data } = await api.get<{ data?: IntegrationStatus[] } | IntegrationStatus[]>(
    "/integrations/status",
    {
      params: companyId ? { companyId } : undefined,
    }
  );

  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: IntegrationStatus[] }).data)) {
    return (data as { data?: IntegrationStatus[] }).data as IntegrationStatus[];
  }

  return [];
}

export async function connectIntegration(
  companyId: string,
  payload: {
    provider: IntegrationProvider;
    accessToken: string;
    externalId?: string;
    status?: string;
  }
) {
  const { data } = await api.post("/integrations/connect", {
    ...payload,
    companyId,
  });
  return data;
}

export async function getIntegrationDiagnostic(provider: string, companyId?: string | null) {
  const { data } = await api.get<IntegrationDiagnostic>(`/integrations/status/${provider}`, {
    params: companyId ? { companyId } : undefined,
  });
  return {
    status: data?.status || "INACTIVE",
    lastEventReceived: data?.lastEventReceived || null,
  } as IntegrationDiagnostic;
}

export async function startWhatsappConnection(companyId: string) {
  const { data } = await api.post("/whatsapp/connection/connect", { companyId });
  return normalizeWhatsappConnection(data);
}

export async function requestWhatsappQr(companyId: string) {
  const { data } = await api.post("/whatsapp/connect/qr", { companyId });
  return normalizeWhatsappConnection(data);
}

export async function restartWhatsappConnection(companyId: string) {
  const { data } = await api.post("/whatsapp/connect/restart", { companyId });
  return normalizeWhatsappConnection(data);
}

export async function getWhatsappConnectionStatus(companyId: string) {
  const { data } = await api.get("/whatsapp/connection/status", {
    params: { companyId },
  });
  return normalizeWhatsappConnection(data);
}

export async function disconnectWhatsapp(companyId: string) {
  const { data } = await api.post("/whatsapp/connect/disconnect", { companyId });
  return normalizeWhatsappConnection(data);
}

export async function getAgentConfig(companyId: string) {
  const { data } = await api.get("/agent-config", { params: { companyId } });
  return normalizeAgentConfig(data, companyId);
}

export async function saveAgentConfig(
  companyId: string,
  payload: Partial<AgentConfig>,
) {
  const { data } = await api.patch("/agent-config", payload, {
    params: { companyId },
  });
  return normalizeAgentConfig(data, companyId);
}

export async function getConversationsLiveFeed(params?: {
  companyId?: string | null;
  limit?: number;
}) {
  const { data } = await api.get<any[]>("/attendant/conversations", {
    params: {
      companyId: params?.companyId || undefined,
      limit: params?.limit || undefined,
    },
  });
  return Array.isArray(data) ? data.map(normalizeConversationLiveFeedItem) : [];
}

export async function getIntegrationOAuthSession(
  provider: string,
  companyId?: string | null,
  returnTo?: string,
) {
  const { data } = await api.get<{
    provider: string;
    authUrl: string;
    callbackUrl: string;
    mode: "oauth" | "mock";
  }>(`/auth/${provider}`, {
    params: {
      companyId: companyId || undefined,
      returnTo: returnTo || undefined,
    },
  });

  return data;
}

export type InstagramConnectionStatus = {
  connected: boolean;
  status: string;
  provider?: string | null;
  provider_setup_required?: boolean;
  instagramAccountId?: string | null;
  igBusinessId?: string | null;
  igUsername?: string | null;
  pageId?: string | null;
  pageName?: string | null;
  tokenExpiry?: string | null;
  tokenExpiresAt?: string | null;
  tokenExpired?: boolean;
  updatedAt?: string | null;
};

export async function getInstagramConnectUrl(
  companyId: string,
  returnTo?: string,
) {
  const { data } = await api.get<{
    provider: "instagram";
    authUrl: string;
    callbackUrl: string;
    mode: "oauth";
  }>("/instagram/connect", {
    params: {
      companyId,
      returnTo: returnTo || undefined,
    },
  });

  return data;
}

export async function getInstagramStatus(companyId: string) {
  const { data } = await api.get<InstagramConnectionStatus>("/instagram/status", {
    params: { companyId },
  });
  return data;
}

export async function disconnectInstagram(companyId: string) {
  const { data } = await api.post(
    "/instagram/disconnect",
    null,
    { params: { companyId } },
  );
  return data;
}

export async function getForecast(params: {
  companyId?: string | null;
  type: "SALES" | "DEMAND" | "REVENUE";
  horizon?: number;
}) {
  const { data } = await api.get<ForecastResponse>(`/analytics/forecast/${params.type}`, {
    params: {
      companyId: params.companyId || undefined,
      horizon: params.horizon || undefined,
    },
  });
  return data;
}

export async function getStrategicActions(params?: {
  companyId?: string | null;
  status?: "SUGGESTED" | "APPROVED" | "EXECUTED" | "REJECTED";
}) {
  const { data } = await api.get<StrategicAction[] | { data?: StrategicAction[] }>(
    "/strategy/actions",
    {
      params: {
        companyId: params?.companyId || undefined,
        status: params?.status || undefined,
      },
    }
  );
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: StrategicAction[] }).data)) {
    return (data as { data?: StrategicAction[] }).data as StrategicAction[];
  }
  return [];
}

export async function executeStrategicAction(id: string, companyId?: string | null) {
  const { data } = await api.post<StrategicAction>(`/strategy/actions/${id}/execute`, null, {
    params: companyId ? { companyId } : undefined,
  });
  return data;
}

export async function getMarketIntelOverview(params?: { companyId?: string | null }) {
  const { data } = await api.get<{
    comparison?: any[];
    trends?: any[];
    refreshedAt?: string | null;
  }>("/market-intel/overview", {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });

  return {
    comparison: Array.isArray(data?.comparison)
      ? data.comparison.map((item) => normalizeMarketComparison(item))
      : [],
    trends: Array.isArray(data?.trends) ? data.trends.map((t) => normalizeMarketTrend(t)) : [],
    refreshedAt: (data?.refreshedAt as string) || null,
  };
}

export async function triggerMarketScan(params?: { companyId?: string | null; productIds?: string[] }) {
  const { data } = await api.post(
    "/market-intel/track",
    params?.productIds?.length ? { productIds: params.productIds } : {},
    { params: params?.companyId ? { companyId: params.companyId } : undefined }
  );
  return data;
}

export async function refreshMarketTrends(companyId?: string | null) {
  const { data } = await api.post(
    "/market-intel/trends/refresh",
    {},
    { params: companyId ? { companyId } : undefined }
  );
  return data;
}

export async function getBotConfig(companyId?: string | null) {
  const { data } = await api.get<BotConfig>("/attendant/config", {
    params: companyId ? { companyId } : undefined,
  });
  return normalizeBotConfig(data);
}

export async function updateBotConfig(
  companyId: string,
  payload: Partial<Pick<BotConfig, "botName" | "agentName" | "welcomeMessage" | "toneOfVoice" | "tone" | "instructions" | "isActive" | "isOnline">>
) {
  const { data } = await api.put<BotConfig>(
    "/attendant/config",
    payload,
    { params: companyId ? { companyId } : undefined }
  );
  return normalizeBotConfig(data);
}

export async function getAttendantConversations(params?: { companyId?: string | null; limit?: number }) {
  const { data } = await api.get<any[]>("/attendant/conversations", {
    params: {
      companyId: params?.companyId || undefined,
      limit: params?.limit || undefined,
    },
  });
  return Array.isArray(data) ? data.map(normalizeConversation) : [];
}

export async function getAttendantConversation(companyId: string, conversationId: string) {
  const { data } = await api.get(`/attendant/conversations/${conversationId}`, {
    params: { companyId },
  });
  return normalizeConversation(data);
}

export async function pauseAttendantConversation(companyId: string, conversationId: string) {
  const { data } = await api.post(`/attendant/conversations/${conversationId}/pause`, null, {
    params: { companyId },
  });
  return normalizeConversation(data);
}

export async function resumeAttendantConversation(companyId: string, conversationId: string) {
  const { data } = await api.post(`/attendant/conversations/${conversationId}/resume`, null, {
    params: { companyId },
  });
  return normalizeConversation(data);
}

export async function sendHumanAttendantMessage(companyId: string, conversationId: string, content: string) {
  const { data } = await api.post(
    `/attendant/conversations/${conversationId}/human-message`,
    { content },
    { params: { companyId } },
  );
  return normalizeConversation(data);
}

export async function getAttendantLeads(params?: { companyId?: string | null; limit?: number }) {
  const { data } = await api.get<any[]>("/attendant/leads", {
    params: {
      companyId: params?.companyId || undefined,
      limit: params?.limit || undefined,
    },
  });
  return Array.isArray(data) ? data.map(normalizeLead) : [];
}

export async function interveneLead(leadId: string, companyId?: string | null) {
  const { data } = await api.post(`/attendant/leads/${leadId}/intervene`, null, {
    params: companyId ? { companyId } : undefined,
  });
  return normalizeLead(data);
}

export async function getAttendantRoi(companyId?: string | null) {
  const { data } = await api.get<{ iaSalesCount?: number; iaRevenue?: number }>("/attendant/roi", {
    params: companyId ? { companyId } : undefined,
  });
  return {
    iaSalesCount: Number(data?.iaSalesCount || 0),
    iaRevenue: Number(data?.iaRevenue || 0),
  };
}

export async function getAdminHealth() {
  const { data } = await api.get("/admin/health");
  return normalizeAdminHealth(data);
}

export async function getAdminUsageStats() {
  const { data } = await api.get("/admin/usage-stats");
  return normalizeAdminUsageStats(data);
}

export async function getAdminErrorLogs() {
  const { data } = await api.get<any[]>("/admin/error-logs");
  return Array.isArray(data) ? data.map(normalizeAdminErrorLog) : [];
}

export async function getAdminAuditFeed() {
  const { data } = await api.get<any[]>("/admin/audit-feed");
  return Array.isArray(data) ? data.map(normalizeAuditFeedItem) : [];
}

export async function getAdminQuotas() {
  const { data } = await api.get<any[]>("/admin/quotas");
  return Array.isArray(data) ? data.map(normalizeAdminQuota) : [];
}

export async function resetAdminQuota(companyId: string) {
  const { data } = await api.post(`/admin/quotas/${companyId}/reset`);
  return normalizeAdminQuota(data);
}

export async function updateAdminQuota(
  companyId: string,
  payload: Partial<{
    currentTier: SubscriptionTier;
    llmTokensUsed: number;
    whatsappMessagesSent: number;
    billingCycleEnd: string;
  }>
) {
  const { data } = await api.patch(`/admin/quotas/${companyId}`, payload);
  return normalizeAdminQuota(data);
}

export async function exportFinancialCsv(params?: { companyId?: string | null }) {
  const { data } = await api.get<Blob>("/export/financial", {
    params: {
      companyId: params?.companyId || undefined,
    },
    responseType: "blob",
  });
  return data;
}

// â”€â”€â”€ WhatsApp Instance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function evolutionConnect(companyId: string) {
  const { data } = await api.post("/whatsapp/connection/connect", {
    companyId,
  });
  return toWhatsappConnectionSnapshot(data);
}

export async function evolutionGetQRCode(companyId: string) {
  const { data } = await api.get("/whatsapp/connection/status", {
    params: { companyId },
  });
  return toWhatsappConnectionSnapshot(data);
}

export async function evolutionGetStatus(companyId: string) {
  const { data } = await api.get("/whatsapp/connection/status", {
    params: { companyId },
  });
  return toWhatsappConnectionSnapshot(data);
}

export async function evolutionDisconnect(companyId: string) {
  const { data } = await api.post("/whatsapp/connect/disconnect", {
    companyId,
  });
  return toWhatsappConnectionSnapshot(data);
}



// â”€â”€â”€ Shopee Scraper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function initializeShopeeLogin(companyId: string, credentials?: { user?: string, pass?: string }) {
  const { data } = await api.post("/integrations/shopee/initialize-login", credentials || {}, {
    params: { companyId },
  });
  return data;
}

export async function verifyShopeeOtp(companyId: string, code: string) {
  const { data } = await api.post(
    "/integrations/shopee/verify-otp",
    { code },
    {
      params: { companyId },
    },
  );
  return data;
}

export async function getShopeeOrders(companyId: string) {
  const { data } = await api.get("/integrations/shopee/orders", {
    params: { companyId },
  });
  return data;
}

export async function saveMetaAPIConfig(
  companyId: string,
  payload: {
    metaAccessToken: string;
    phoneNumber?: string;
  }
) {
  // Map frontend field names â†’ DTO field names expected by the backend
  const { data } = await api.post(
    "/whatsapp/config", // Corrected path to match controller @Controller('whatsapp')
    {
      accessToken: payload.metaAccessToken,
      phoneNumber: payload.phoneNumber,
    },
    { params: { companyId } },
  );
  return data;
}

export async function disconnectMetaAPIConfig(companyId: string) {
  const { data } = await api.delete("/whatsapp/config", {
    params: { companyId },
  });
  return data;
}

export async function getWhatsappOAuthUrl(companyId: string): Promise<string> {
  const { data } = await api.get<{ url: string }>("/meta/oauth/url", {
    params: { companyId },
  });
  return data.url;
}

export async function getMetaWhatsappStatus(companyId: string) {
  const { data } = await api.get<{
    connected: boolean;
    method: "meta" | null;
    status: string;
    phoneNumberId: string | null;
    phoneNumber: string | null;
    whatsappBusinessId?: string | null;
    updatedAt?: string | null;
  }>(
    "/meta/status",
    { params: { companyId } }
  );
  return data;
}

export type MercadoLivreStatus = {
  connected: boolean;
  mlUserId: string | null;
  nickname: string | null;
  status: string;
  expiresAt: string | null;
  lastSyncAt: string | null;
  updatedAt: string | null;
  webhook: null | {
    status: string;
    lastEventAt: string;
  };
};

export type MercadoLivreDashboard = {
  revenue: number;
  orders: number;
  products: number;
  pendingQuestions: number;
  averageRating: number;
};

export type MercadoLivreProduct = {
  id: string;
  mlItemId: string | null;
  title: string;
  price: number;
  status: string | null;
  stock: number;
  soldQuantity: number;
  permalink: string | null;
  updatedAt: string;
};

export type MercadoLivreOrder = {
  id: string;
  mlOrderId: string;
  status: string;
  totalAmount: number;
  paidAmount: number | null;
  currencyId: string | null;
  dateCreated: string;
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
  shipment: null | { status: string | null; trackingCode: string | null };
};

export type MercadoLivreQuestion = {
  id: string;
  mlQuestionId: string;
  mlItemId: string | null;
  status: string | null;
  question: string;
  answer: string | null;
  dateCreated: string | null;
};

export async function getMercadoLivreConnectUrl(companyId: string, returnTo: string) {
  const { data } = await api.get<{ authUrl: string; callbackUrl: string }>("/auth/ml", {
    params: { companyId, returnTo },
  });
  return data;
}

export async function getMercadoLivreStatus(companyId: string) {
  const { data } = await api.get<MercadoLivreStatus>("/integrations/mercadolivre/status", {
    params: { companyId },
  });
  return data;
}

export async function getMercadoLivreDashboard(companyId: string) {
  const { data } = await api.get<MercadoLivreDashboard>("/integrations/mercadolivre/dashboard", {
    params: { companyId },
  });
  return data;
}

export async function syncMercadoLivre(companyId: string) {
  const { data } = await api.post("/integrations/mercadolivre/sync", null, {
    params: { companyId },
  });
  return data;
}

export async function syncMercadoLivreProducts(companyId: string) {
  const { data } = await api.post("/integrations/mercadolivre/sync/products", null, {
    params: { companyId },
  });
  return data;
}

export async function syncMercadoLivreOrders(companyId: string) {
  const { data } = await api.post("/integrations/mercadolivre/sync/orders", null, {
    params: { companyId },
  });
  return data;
}

export async function disconnectMercadoLivre(companyId: string) {
  const { data } = await api.post("/integrations/mercadolivre/disconnect", null, {
    params: { companyId },
  });
  return data;
}

export async function getMercadoLivreProducts(companyId: string) {
  const { data } = await api.get<MercadoLivreProduct[]>("/integrations/mercadolivre/products", {
    params: { companyId },
  });
  return Array.isArray(data) ? data : [];
}

export async function getMercadoLivreOrders(companyId: string) {
  const { data } = await api.get<MercadoLivreOrder[]>("/integrations/mercadolivre/orders", {
    params: { companyId },
  });
  return Array.isArray(data) ? data : [];
}

export async function getMercadoLivreQuestions(companyId: string) {
  const { data } = await api.get<MercadoLivreQuestion[]>("/integrations/mercadolivre/questions", {
    params: { companyId },
  });
  return Array.isArray(data) ? data : [];
}

export async function answerMercadoLivreQuestion(companyId: string, questionId: string, text: string) {
  const { data } = await api.post(
    "/integrations/mercadolivre/questions/answer",
    { questionId, text },
    { params: { companyId } },
  );
  return data;
}

function normalizeImportedMetricRecord(data: any): ImportedMetricRecord {
  return {
    id: data?.id || "",
    companyId: data?.companyId || "",
    importId: data?.importId || "",
    metricKey: data?.metricKey || "",
    label: data?.label || "",
    value: data?.value,
    unit: data?.unit || "text",
    currency: data?.currency ?? null,
    periodStart: data?.periodStart || null,
    periodEnd: data?.periodEnd || null,
    source: data?.source || "manual_text",
    platform: data?.platform ?? null,
    confidence: Number(data?.confidence || 0),
    status: data?.status || "pending_review",
    metadataJson: data?.metadataJson,
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || data?.createdAt || new Date().toISOString(),
    sourceLabel: data?.sourceLabel || undefined,
  };
}

function normalizeIntelligentImportRecord(data: any): IntelligentImportRecord {
  return {
    id: data?.id || "",
    companyId: data?.companyId || "",
    userId: data?.userId || "",
    inputType: (data?.inputType || "text") as IntelligentImportRecord["inputType"],
    fileName: data?.fileName ?? null,
    fileMimeType: data?.fileMimeType ?? null,
    fileSize: data?.fileSize === undefined || data?.fileSize === null ? null : Number(data.fileSize),
    expectedCategory: data?.expectedCategory || "auto",
    detectedCategory: data?.detectedCategory || "unknown",
    detectedPlatform: data?.detectedPlatform || "unknown",
    detectedPeriodStart: data?.detectedPeriodStart || null,
    detectedPeriodEnd: data?.detectedPeriodEnd || null,
    confidence: Number(data?.confidence || 0),
    status: data?.status || "uploaded",
    aiSummary: data?.aiSummary ?? null,
    extracted: data?.extracted || null,
    warnings: Array.isArray(data?.warnings) ? data.warnings : [],
    previewRows: Array.isArray(data?.previewRows) ? data.previewRows : [],
    importedMetrics: Array.isArray(data?.importedMetrics)
      ? data.importedMetrics.map(normalizeImportedMetricRecord)
      : [],
    importedEntities: Array.isArray(data?.importedEntities) ? data.importedEntities : [],
    errorMessage: data?.errorMessage ?? null,
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || data?.createdAt || new Date().toISOString(),
    confirmedAt: data?.confirmedAt || null,
    betaCapabilities: data?.betaCapabilities,
  };
}

export async function getIntelligentImports(params?: { companyId?: string | null }) {
  const { data } = await api.get<any[]>("/intelligent-imports", {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return Array.isArray(data) ? data.map(normalizeIntelligentImportRecord) : [];
}

export async function createTextIntelligentImport(
  payload: { text: string; expectedCategory?: string },
  params?: { companyId?: string | null },
) {
  const { data } = await api.post("/intelligent-imports/text", payload, {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return normalizeIntelligentImportRecord(data);
}

export async function uploadIntelligentImportFile(
  payload: { file: File; expectedCategory?: string },
  params?: { companyId?: string | null },
) {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (payload.expectedCategory) {
    formData.append("expectedCategory", payload.expectedCategory);
  }
  const { data } = await api.post("/intelligent-imports/file", formData, {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return normalizeIntelligentImportRecord(data);
}

export async function analyzeIntelligentImport(id: string, params?: { companyId?: string | null }) {
  const { data } = await api.post(`/intelligent-imports/${id}/analyze`, null, {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return normalizeIntelligentImportRecord(data);
}

export async function getIntelligentImport(id: string, params?: { companyId?: string | null }) {
  const { data } = await api.get(`/intelligent-imports/${id}`, {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return normalizeIntelligentImportRecord(data);
}

export async function reviewIntelligentImport(
  id: string,
  payload: {
    expectedCategory?: string;
    detectedCategory?: string;
    detectedPlatform?: string;
    detectedPeriodStart?: string | null;
    detectedPeriodEnd?: string | null;
    confidence?: number;
    summary?: string;
    metrics?: Array<{
      metricKey: string;
      label: string;
      value: unknown;
      unit: string;
      currency?: string | null;
      confidence?: number;
      sourceText?: string;
    }>;
    entities?: Array<{
      entityType: string;
      data: Record<string, unknown>;
      confidence?: number;
    }>;
    warnings?: string[];
  },
  params?: { companyId?: string | null },
) {
  const { data } = await api.put(`/intelligent-imports/${id}/review`, payload, {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return normalizeIntelligentImportRecord(data);
}

export async function confirmIntelligentImport(id: string, params?: { companyId?: string | null }) {
  const { data } = await api.post(`/intelligent-imports/${id}/confirm`, null, {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return normalizeIntelligentImportRecord(data);
}

export async function rejectIntelligentImport(id: string, params?: { companyId?: string | null }) {
  const { data } = await api.post(`/intelligent-imports/${id}/reject`, null, {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return normalizeIntelligentImportRecord(data);
}

export async function getImportedMetrics(params?: { companyId?: string | null }) {
  const { data } = await api.get<any[]>("/imported-metrics", {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return Array.isArray(data) ? data.map(normalizeImportedMetricRecord) : [];
}

export async function getCurrentAIUsage(params?: { companyId?: string | null; yearMonth?: string }) {
  const { data } = await api.get<AIUsageCurrentResponse>("/usage/ai/current", {
    params: {
      companyId: params?.companyId || undefined,
      yearMonth: params?.yearMonth || undefined,
    },
  });
  return data;
}

export async function getAIUsageLimits(params?: { companyId?: string | null }) {
  const { data } = await api.get<AIUsageLimitsResponse>("/usage/ai/limits", {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return data;
}

export type BillingCycle = "MONTHLY" | "ANNUAL";
export type BillingPlanKey = "COMMON" | "PREMIUM" | "PRO_BUSINESS";

export type BillingPlanPrice = {
  amountInCents: number;
  currency: string;
  available: boolean;
  provider?: string;
};

export type BillingPlan = {
  key: BillingPlanKey;
  name: string;
  description: string | null;
  level: number;
  features: string[];
  prices: Partial<Record<BillingCycle, BillingPlanPrice>>;
};

export type BillingMeResponse = {
  hasActiveSubscription: boolean;
  activePlan: BillingPlanKey | null;
  subscription: null | {
    id: string;
    planKey: BillingPlanKey;
    billingCycle: BillingCycle;
    status: string;
    provider?: string | null;
    source?: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd?: boolean;
    expiresAt: string | null;
  };
  limits?: Record<string, unknown>;
  features?: {
    integrations?: boolean;
    aiChat?: boolean;
    basicDashboard?: boolean;
    advancedInsights?: boolean;
    reports?: boolean;
  };
  aiUsage?: unknown;
};

export type CheckoutSessionStatusResponse = {
  status: "ACTIVE" | "AWAITING_STRIPE_WEBHOOK" | "PENDING_PAYMENT" | string;
  hasActiveSubscription: boolean;
  message?: string;
  checkoutSession?: {
    id: string;
    stripeStatus: string | null;
    paymentStatus: string | null;
  };
  billing?: BillingMeResponse;
};

export type ChangePlanResponse = {
  status: "changed" | "pending_confirmation" | "checkout_required" | "portal_required" | string;
  checkoutUrl?: string;
  portalUrl?: string;
  message?: string;
  billing?: BillingMeResponse;
};

export type BillingConfigResponse = {
  paymentProvider: "STRIPE" | string;
  checkoutEnabled: boolean;
  message: string | null;
  webhookUrl?: string | null;
};

export async function getBillingPlans() {
  const { data } = await api.get<{ plans: BillingPlan[] }>("/billing/plans");
  return Array.isArray(data?.plans) ? data.plans : [];
}

export async function getBillingConfig() {
  const { data } = await api.get<BillingConfigResponse>("/billing/config");
  return data;
}

export async function getBillingMe(params?: { companyId?: string | null }) {
  const { data } = await api.get<BillingMeResponse>("/billing/me", {
    params: params?.companyId ? { companyId: params.companyId } : undefined,
  });
  return data;
}

export async function getCheckoutSessionStatus(
  sessionId: string,
  params?: { companyId?: string | null },
) {
  const { data } = await api.get<CheckoutSessionStatusResponse>(
    `/billing/checkout-session/${encodeURIComponent(sessionId)}/status`,
    {
      params: params?.companyId ? { companyId: params.companyId } : undefined,
    },
  );
  return data;
}

export async function createBillingCheckout(payload: {
  planKey: BillingPlanKey;
  billingCycle: BillingCycle;
  billingInterval?: "monthly" | "yearly";
  companyId?: string | null;
}) {
  const { data } = await api.post<{
    checkoutUrl: string;
  }>("/billing/checkout", payload);
  return data;
}

export async function changeBillingPlan(payload: {
  planKey?: BillingPlanKey;
  targetPlanKey: BillingPlanKey;
  billingCycle: BillingCycle;
  billingInterval?: "monthly" | "yearly";
  companyId?: string | null;
}) {
  const { data } = await api.post<ChangePlanResponse>("/billing/change-plan", payload);
  return data;
}

export async function createBillingPortal(payload?: { companyId?: string | null }) {
  const { data } = await api.post<{ portalUrl: string }>("/billing/portal", payload || {});
  return data;
}
