export type DetailLevel = "low" | "medium" | "high";
export type UserNiche = "ECOMMERCE" | "MEDICINA" | "SERVICOS" | "EDUCACAO" | "OUTROS";
export type DashboardPeriod = "today" | "yesterday" | "week" | "month" | "year";

export interface DashboardSummary {
  revenue: number;
  losses: number;
  profit: number;
  cashflow: number;
  companyCount: number;
  period: DashboardPeriod;
  lineData: Array<{ name: string; Receitas: number; Saidas: number }>;
  pieData: Array<{ name: string; value: number }>;
}

export interface TransactionItem {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date?: string;
  occurredAt?: string;
  createdAt: string;
  category?: string;
}

export interface Company {
  id?: string;
  _id?: string;
  name: string;
  sector?: string;
  segment?: string;
  document?: string;
  description?: string;
  openedAt?: string;
  status?: string;
}

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  admin?: boolean;
  detailLevel?: DetailLevel;
  niche?: UserNiche | null;
  theme?: "light" | "dark";
  companyCount?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku?: string | null;
  category?: string | null;
  price: number;
  cost?: number | null;
  tax?: number | null;
  shipping?: number | null;
  financials?: {
    grossProfit: number;
    netMargin: number;
    warningLevel: "HEALTHY" | "WARNING" | "CRITICAL";
  };
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperationalCost {
  id: string;
  companyId: string;
  name: string;
  category?: string | null;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationProvider = "WHATSAPP" | "INSTAGRAM" | "MERCADOLIVRE" | "SHOPEE";

export type WhatsappConnectionStatus =
  | "not_configured"
  | "creating_instance"
  | "qr_required"
  | "qr_pending"
  | "idle"
  | "creating"
  | "waiting_qr"
  | "connecting"
  | "connected"
  | "disconnected"
  | "disconnected_requires_new_qr"
  | "disconnected_pending_provider_cleanup"
  | "disconnecting"
  | "rate_limited"
  | "provider_warming_up"
  | "error";

export interface WhatsappConnection {
  id: string | null;
  companyId: string | null;
  provider: "evolution" | string;
  instanceName: string | null;
  status: WhatsappConnectionStatus;
  connectionState?: string | null;
  qrCode: string | null;
  code?: string | null;
  pairingCode: string | null;
  phoneNumber: string | null;
  webhookUrl: string | null;
  webhookStatus?: "configured" | "pending" | "error";
  automationStatus?: "configured" | "pending" | "error";
  lastError?: string | null;
  message?: string | null;
  retryAfterSeconds?: number | null;
  expiresInSeconds?: number | null;
  sessionGeneration?: number | null;
  userRequestedDisconnect?: boolean;
  lastConnectionAt: string | null;
  lastDisconnectedAt?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AgentConfig {
  id: string;
  companyId: string;
  agentName: string;
  companyDescription: string;
  welcomeMessage: string;
  systemPrompt: string;
  toneOfVoice: string;
  internetSearchEnabled: boolean;
  speechToTextEnabled: boolean;
  imageUnderstandingEnabled: boolean;
  pauseForHuman: boolean;
  splitRepliesEnabled: boolean;
  messageBufferEnabled: boolean;
  debounceSeconds: number;
  maxContextMessages: number;
  isEnabled: boolean;
  modelProvider: string;
  modelName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IntegrationStatus {
  provider: IntegrationProvider;
  status: string;
  connected: boolean;
  externalId: string | null;
  updatedAt?: string | null;
}

export interface IntegrationDiagnostic {
  status: "ACTIVE" | "INACTIVE" | "DORMANT";
  lastEventReceived: string | null;
}

export interface ForecastPoint {
  date: string;
  value: number;
}

export interface ForecastInterval {
  lower: number;
  upper: number;
  margin: number;
}

export interface ForecastResponse {
  status: "ok" | "insufficient_data";
  type: "SALES" | "DEMAND" | "REVENUE";
  historicalData?: ForecastPoint[];
  predictedData?: ForecastPoint[];
  confidenceInterval?: ForecastInterval;
  accuracyScore?: number;
  generatedAt?: string;
  message?: string;
}

export type StrategicActionType = "MARKETING" | "ESTOQUE" | "FINANCEIRO";
export type StrategicActionStatus = "SUGGESTED" | "APPROVED" | "EXECUTED" | "REJECTED";

export interface StrategicAction {
  id: string;
  companyId: string;
  title: string;
  description: string;
  type: StrategicActionType;
  status: StrategicActionStatus;
  impactScore: number;
  payload: any;
  createdAt: string;
}

export type MarketBadge = 'sem_dados' | 'competitivo' | 'acima';

export interface MarketComparison {
  productId: string;
  productName: string;
  internalPrice: number;
  marketAverage: number;
  gapPct: number;
  badge: MarketBadge;
}

export interface MarketTrend {
  id?: string;
  companyId?: string;
  term: string;
  volume: number;
  growthPercentage: number;
  createdAt?: string;
}

export type LeadStatus = "NEW" | "QUALIFIED" | "CONVERTED" | "LOST";

export interface BotConfig {
  id: string;
  companyId: string;
  botName: string;
  agentName?: string;
  welcomeMessage: string | null;
  toneOfVoice: string;
  tone?: string;
  instructions: string | null;
  isActive: boolean;
  isOnline?: boolean;
  isConnected?: boolean;
  connectionMethod?: "meta" | "evolution" | null;
  metaPhoneNumberId?: string | null;
  metaWabaId?: string | null;
  phoneNumber?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WhatsappConnectionSnapshot {
  instanceName?: string | null;
  qrCode?: string | null;
  qrcode?: string | null;
  pairingCode?: string | null;
  ready?: boolean;
  status: string;
  state?: string;
  lifecycleState?: string;
  connected?: boolean;
  method?: "meta" | "evolution" | null;
  phoneNumber?: string | null;
  qrRequired?: boolean;
  failureReason?: string | null;
  diagnosticSnapshot?: {
    companyId: string;
    sessionName: string | null;
    correlationId: string | null;
    currentState: string;
    status: string;
    hasClient: boolean;
    hasBrowser: boolean;
    hasPage: boolean;
    hasQr: boolean;
    qrAgeMs: number | null;
    qrExpiresAt: string | null;
    lastEvent: string | null;
    lastError: string | null;
    lastTransitionAt: string;
  };
  updatedAt?: string | null;
  quotaUsed?: number | null;
  quotaLimit?: number | null;
}

export interface ChatConversation {
  id: string;
  leadId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  content: string;
  role: "user" | "assistant" | "human";
  timestamp: string;
}

export interface ConversationThread {
  id: string;
  companyId: string;
  contactNumber: string;
  contactName: string | null;
  status: "IA respondeu" | "Aguardando" | "Humano assumiu";
  isPaused: boolean;
  pausedUntil: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  messages: ConversationMessage[];
}

export interface ConversationLiveFeedItem {
  id: string;
  companyId: string;
  whatsappConnectionId: string | null;
  remoteJid: string | null;
  contactName: string | null;
  contactNumber: string;
  status: string;
  botPaused: boolean;
  lastMessage: string;
  lastMessageDirection: "inbound" | "outbound" | string | null;
  lastMessageAt: string;
}

export interface Lead {
  id: string;
  companyId: string;
  externalId: string;
  name: string | null;
  status: LeadStatus;
  score: number;
  lastInteraction: string | null;
  botPausedUntil: string | null;
  lastQuotedValue: number | null;
  createdAt: string;
  updatedAt: string;
  conversations: ChatConversation[];
}

export interface AttendantRoi {
  iaSalesCount: number;
  iaRevenue: number;
}

export type SubscriptionTier = "FREE" | "PRO" | "ENTERPRISE";
export type HealthStatus = "up" | "down" | "unknown";
export type ProviderStatus = "up" | "degraded" | "unknown" | "configured" | "missing";
export type AuditActorType = "HUMAN" | "AI" | "SYSTEM";

export interface AdminHealthService {
  status: HealthStatus;
  latencyMs: number;
}

export interface AdminHealthTimelinePoint {
  label: string;
  avgResponseTime: number;
  success: number;
  failure: number;
}

export interface AdminHealth {
  services: {
    database: AdminHealthService;
    redis: AdminHealthService;
    ai: {
      status: HealthStatus | "unknown";
      avgLatencyMs: number;
    };
  };
  providers: {
    meta: ProviderStatus;
    mercadoLivre: ProviderStatus;
    gemini: ProviderStatus;
    openai: ProviderStatus;
  };
  requestTimeline: AdminHealthTimelinePoint[];
  successVsFailure: {
    success: number;
    failure: number;
    errorRateLastWindow: number;
  };
}

export interface AdminUsageCompany {
  companyId: string;
  companyName: string;
  currentTier: SubscriptionTier;
  llmTokensUsed: number;
  whatsappMessagesSent: number;
  billingCycleEnd: string;
  monthlyRevenue: number;
  aiCostEstimate: number;
  profitEstimate: number;
}

export interface AdminUsageStats {
  totals: {
    totalTokens: number;
    totalMessages: number;
    monthlyRevenue: number;
    aiCostEstimate: number;
    estimatedProfit: number;
  };
  companies: AdminUsageCompany[];
}

export interface AdminCompanySummary {
  id: string;
  name: string;
  sector?: string | null;
}

export interface AdminQuota {
  id: string;
  companyId: string;
  llmTokensUsed: number;
  whatsappMessagesSent: number;
  currentTier: SubscriptionTier;
  billingCycleEnd: string;
  createdAt: string;
  updatedAt: string;
  company: AdminCompanySummary;
}

export interface AdminErrorLog {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  companyId?: string | null;
  createdAt: string;
  company?: Pick<AdminCompanySummary, "id" | "name"> | null;
}

export interface AuditFeedItem {
  id: string;
  companyId?: string | null;
  actorType: AuditActorType;
  actorId?: string | null;
  action: string;
  details?: unknown;
  createdAt: string;
  company?: Pick<AdminCompanySummary, "id" | "name"> | null;
}
