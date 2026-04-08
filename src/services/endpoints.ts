import api from "./api";
import type {
  Company,
  DashboardPeriod,
  DashboardSummary,
  DetailLevel,
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
  WhatsappConnectionSnapshot,
  Lead,
  LeadStatus,
  AdminErrorLog,
  AdminHealth,
  AdminQuota,
  AdminUsageStats,
  AuditFeedItem,
  SubscriptionTier,
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
    createdAt,
    updatedAt,
  } as Customer;
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
    welcomeMessage: data?.welcomeMessage ?? null,
    toneOfVoice: data?.toneOfVoice || "amigavel",
    instructions: data?.instructions ?? null,
    isActive: Boolean(data?.isActive ?? true),
    createdAt: data?.createdAt || new Date().toISOString(),
    updatedAt: data?.updatedAt || data?.createdAt || new Date().toISOString(),
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
}) {
  const { data } = await api.get<Partial<DashboardSummary>>("/dashboard/summary", {
    params: {
      companyId: params?.companyId || undefined,
      period: params?.period || undefined,
    },
  });
  return data;
}

export async function getTransactions(companyId?: string) {
  const { data } = await api.get<any[]>("/financial/transactions", {
    params: companyId ? { companyId } : undefined,
  });
  return Array.isArray(data) ? data.map((item) => normalizeTransaction(item)) : [];
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

export async function getFinancialReport(companyId: string) {
  const { data } = await api.get<{ income: number; expense: number; balance: number }>(
    "/financial/report",
    { params: { companyId } }
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
  payload: Partial<Pick<BotConfig, "botName" | "welcomeMessage" | "toneOfVoice" | "instructions" | "isActive">>
) {
  const { data } = await api.put<BotConfig>(
    "/attendant/config",
    payload,
    { params: companyId ? { companyId } : undefined }
  );
  return normalizeBotConfig(data);
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

// ─── WhatsApp Instance ───────────────────────────────────────

export async function createWhatsappInstance(companyId?: string | null) {
  const { data } = await api.post<WhatsappConnectionSnapshot>(
    "/attendant/whatsapp/instance",
    null,
    { params: companyId ? { companyId } : undefined },
  );
  return data;
}

export async function getWhatsappQRCode(companyId?: string | null) {
  const { data } = await api.get<WhatsappConnectionSnapshot>(
    "/attendant/whatsapp/qrcode",
    { params: companyId ? { companyId } : undefined },
  );
  return data;
}

export async function getWhatsappStatus(companyId?: string | null) {
  const { data } = await api.get<WhatsappConnectionSnapshot>("/attendant/whatsapp/status", {
    params: companyId ? { companyId } : undefined,
  });
  return data;
}

export async function terminateWhatsappSession(companyId: string) {
  const { data } = await api.delete<{ success: boolean }>(`/attendant/whatsapp/session/${companyId}`);
  return data;
}
