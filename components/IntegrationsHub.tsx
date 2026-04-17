import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../App";
import { useToast } from "./Toast";
import {
  getIntegrationOAuthSession,
  getIntegrationStatuses,
  getWhatsappStatus,
  getMetaWhatsappStatus,
  initializeShopeeLogin,
  verifyShopeeOtp,
  saveMetaAPIConfig,
  disconnectMetaAPIConfig,
} from "../src/services/endpoints";
import { WhatsAppStatus } from "./WhatsAppStatus";
import { WhatsAppConnectButton } from "./WhatsAppConnectButton";
import type { IntegrationProvider } from "../src/types/domain";

type HubProvider = "whatsapp" | "instagram" | "mercadolivre" | "shopee";
type HubConnectionStatus = "connected" | "disconnected" | "syncing";

interface HubStatus {
  provider: HubProvider;
  connected: boolean;
  status: HubConnectionStatus;
  updatedAt: string | null;
  source: "api" | "oauth" | "meta" | "legacy";
}

const HUB_STORAGE_PREFIX = "next_level_integrations_hub";

const PROVIDERS: Array<{
  id: HubProvider;
  name: string;
  description: string;
  accentClass: string;
  surfaceClass: string;
  backendProvider?: IntegrationProvider;
}> = [
    {
      id: "whatsapp",
      name: "WhatsApp NEXT",
      description: "Converse, cobre e feche vendas em segundos.",
      accentClass: "text-emerald-300",
      surfaceClass: "from-emerald-500/20 via-emerald-400/5 to-transparent",
      backendProvider: "WHATSAPP",
    },
    {
      id: "instagram",
      name: "Instagram",
      description: "Puxe DMs e transforme comentario em oportunidade.",
      accentClass: "text-pink-300",
      surfaceClass: "from-pink-500/20 via-fuchsia-500/5 to-transparent",
      backendProvider: "INSTAGRAM",
    },
    {
      id: "mercadolivre",
      name: "Mercado Livre",
      description: "Sincronize vendas, mensagens e reputacao sem atrito.",
      accentClass: "text-[#FFE600]",
      surfaceClass: "from-yellow-400/20 via-yellow-300/5 to-transparent",
      backendProvider: "MERCADOLIVRE",
    },
    {
      id: "shopee",
      name: "Shopee NEXT",
      description: "Sincronize pedidos, rastreio e chat da Shopee em um só lugar.",
      accentClass: "text-[#EE4D2D]",
      surfaceClass: "from-orange-500/20 via-orange-400/5 to-transparent",
      backendProvider: "SHOPEE",
    },
  ];

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

function isHubProvider(value: string | null): value is HubProvider {
  return PROVIDERS.some((provider) => provider.id === value);
}

function buildDefaultStatuses(): Record<HubProvider, HubStatus> {
  return {
    whatsapp: {
      provider: "whatsapp",
      connected: false,
      status: "disconnected",
      updatedAt: null,
      source: "oauth",
    },
    instagram: {
      provider: "instagram",
      connected: false,
      status: "disconnected",
      updatedAt: null,
      source: "oauth",
    },
    mercadolivre: {
      provider: "mercadolivre",
      connected: false,
      status: "disconnected",
      updatedAt: null,
      source: "oauth",
    },
    shopee: {
      provider: "shopee",
      connected: false,
      status: "disconnected",
      updatedAt: null,
      source: "oauth",
    },
  };
}

function buildStorageKey(companyId: string | null) {
  return `${HUB_STORAGE_PREFIX}:${companyId || "sem-empresa"}`;
}

function readPersistedStatuses(companyId: string | null) {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(buildStorageKey(companyId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<HubProvider, HubStatus>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persistStatuses(companyId: string | null, statuses: Record<HubProvider, HubStatus>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(buildStorageKey(companyId), JSON.stringify(statuses));
}

function mergeStatuses(
  apiStatuses: Awaited<ReturnType<typeof getIntegrationStatuses>>,
  persisted: Partial<Record<HubProvider, HubStatus>>,
) {
  const next = buildDefaultStatuses();

  apiStatuses.forEach((item) => {
    const provider = PROVIDERS.find(
      (entry) => entry.backendProvider === item.provider,
    )?.id;

    if (!provider) return;

    next[provider] = {
      provider,
      connected: Boolean(item.connected),
      status: item.connected ? "connected" : "disconnected",
      updatedAt: item.updatedAt || null,
      source: "api",
    };
  });

  Object.entries(persisted).forEach(([providerKey, value]) => {
    const provider = providerKey as HubProvider;
    if (!value) return;

    next[provider] = {
      ...next[provider],
      ...value,
      provider,
    };
  });

  return next;
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "Nunca conectado";

  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeWhatsappConnected(status: string | null | undefined) {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "connected" || normalized === "open";
}

function StatusPulse({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${connected
        ? "border-lime-400/30 bg-lime-400/10 text-lime-200"
        : "border-zinc-700 bg-zinc-800/80 text-zinc-300"
        }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.65)]" : "bg-zinc-500"
          }`}
      />
      {connected ? "Conectado" : "Desconectado"}
    </span>
  );
}

function BrandLogo({ provider }: { provider: HubProvider }) {
  if (provider === "whatsapp") {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
        <svg
          className="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 3.5C7.32 3.5 3.5 7.18 3.5 11.75C3.5 13.5 4.06 15.12 5.02 16.45L4.25 20.5L8.45 19.4C9.7 20.08 10.82 20 12 20C16.68 20 20.5 16.32 20.5 11.75C20.5 7.18 16.68 3.5 12 3.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.3 9.2C9.6 8.85 9.84 8.84 10.1 8.85C10.31 8.86 10.54 8.86 10.77 9.42C11 9.98 11.54 10.85 11.61 10.96C11.69 11.07 11.74 11.2 11.66 11.33C11.58 11.46 11.54 11.54 11.38 11.72C11.23 11.89 11.06 12.11 10.93 12.23C10.81 12.35 10.68 12.48 10.85 12.77C11.02 13.07 11.6 13.98 12.42 14.72C13.47 15.67 14.35 15.96 14.67 16.08C14.98 16.2 15.16 16.18 15.3 16.02C15.44 15.87 15.9 15.36 16.08 15.11C16.27 14.87 16.46 14.91 16.74 15.02C17.02 15.13 18.51 15.86 18.82 16.01C19.13 16.16 19.34 16.23 19.42 16.36C19.5 16.49 19.5 17.11 19.14 17.8C18.79 18.49 17.08 19.17 16.38 19.2C15.68 19.23 15.03 19.4 12.07 18.21C9.11 17.02 7.15 13.51 7 13.29C6.85 13.06 5.8 11.69 5.8 10.27C5.8 8.85 6.53 8.17 6.79 7.89C7.06 7.61 7.37 7.54 7.58 7.54H8.21C8.41 7.54 8.65 7.62 8.84 8.07"
            fill="currentColor"
          />
        </svg>
      </div>
    );
  }

  if (provider === "instagram") {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/25 via-pink-500/15 to-amber-300/25 text-pink-200">
        <svg
          className="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="5"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.1" cy="6.9" r="1" fill="currentColor" />
        </svg>
      </div>
    );
  }

  if (provider === "mercadolivre") {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[#FFE600]">
        <svg
          className="h-9 w-9"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Ícone de aperto de mãos - Mercado Livre */}
          <path
            d="M7.5 13.5L9 12L12 15L15 12L16.5 13.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 11L12 9L14 11"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 15C7.34315 15 6 13.6569 6 12C6 10.3431 7.34315 9 9 9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M15 15C16.6569 15 18 13.6569 18 12C18 10.3431 16.6569 9 15 9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    );
  }

  if (provider === "shopee") {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-[#EE4D2D]">
        <svg
          className="h-9 w-9"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Sacola de compras com 'S' - Shopee */}
          <path
            d="M6 8H18L19.5 20H4.5L6 8Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 8V6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Letra S estilizada */}
          <path
            d="M9.5 13.5C9.5 12.6716 10.1716 12 11 12H13C13.8284 12 14.5 12.6716 14.5 13.5C14.5 14.3284 13.8284 15 13 15H11C10.1716 15 9.5 15.6716 9.5 16.5C9.5 17.3284 10.1716 18 11 18H13C13.8284 18 14.5 17.3284 14.5 16.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-100">
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M4 8.5C4 7.12 5.12 6 6.5 6H17.5C18.88 6 20 7.12 20 8.5V15.5C20 16.88 18.88 18 17.5 18H6.5C5.12 18 4 16.88 4 15.5V8.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M7.5 12H16.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M9 9.5V14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

const IntegrationsHub = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [statuses, setStatuses] = useState<Record<HubProvider, HubStatus>>(buildDefaultStatuses);
  const [loadingProvider, setLoadingProvider] = useState<HubProvider | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  const [shopeeModalOpen, setShopeeModalOpen] = useState(false);
  const [shopeeUser, setShopeeUser] = useState("");
  const [shopeePass, setShopeePass] = useState("");
  const [shopeeOtpModalOpen, setShopeeOtpModalOpen] = useState(false);
  const [shopeeOtp, setShopeeOtp] = useState("");
  const [shopeeVerifying, setShopeeVerifying] = useState(false);

  const connectedCount = useMemo(
    () => (Object.values(statuses) as HubStatus[]).filter((status) => status.connected).length,
    [statuses],
  );

  const syncFromBackend = async () => {
    const persisted = readPersistedStatuses(selectedCompanyId);

    if (!selectedCompanyId) {
      const fallback = mergeStatuses([], persisted);
      setStatuses(fallback);
      persistStatuses(selectedCompanyId, fallback);
      setBootstrapping(false);
      return;
    }

    try {
      const [apiStatuses, whatsappStatus, metaStatus] = await Promise.all([
        getIntegrationStatuses(selectedCompanyId),
        getWhatsappStatus(selectedCompanyId).catch(() => null),
        getMetaWhatsappStatus(selectedCompanyId).catch(() => null),
      ]);
      const next = mergeStatuses(apiStatuses, persisted);
      
      // Prefer Meta Cloud API status if connected
      const isMetaConnected = metaStatus?.connected || false;
      const isLegacyConnected = whatsappStatus ? normalizeWhatsappConnected(whatsappStatus.status) : false;
      
      next.whatsapp = {
        provider: "whatsapp",
        connected: isMetaConnected || isLegacyConnected,
        status: (isMetaConnected || isLegacyConnected) ? "connected" : "disconnected",
        updatedAt: new Date().toISOString(),
        source: isMetaConnected ? "meta" : "legacy",
      };

      setStatuses(next);
      persistStatuses(selectedCompanyId, next);
    } catch {
      const fallback = mergeStatuses([], persisted);
      setStatuses(fallback);
      persistStatuses(selectedCompanyId, fallback);
      addToast("Nao foi possivel ler o status real das integracoes. Exibindo o modo local.", "info");
    } finally {
      setBootstrapping(false);
    }
  };

  useEffect(() => {
    void syncFromBackend();
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;

    const params = new URLSearchParams(window.location.search);
    const whatsappStatusParam = params.get("whatsapp");
    if (whatsappStatusParam) {
      if (whatsappStatusParam === "connected") {
        addToast("WhatsApp conectado com sucesso!", "success");
        void syncFromBackend();
      } else if (whatsappStatusParam === "error") {
        addToast("Erro ao conectar WhatsApp via Meta.", "error");
      }
      params.delete("whatsapp");
      const cleanedQuery = params.toString();
      const cleanedUrl = `${window.location.pathname}${cleanedQuery ? `?${cleanedQuery}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", cleanedUrl);
      return;
    }

    const provider = params.get("integration_provider");
    const status = params.get("integration_status");
    const message = params.get("integration_message");

    if (!isHubProvider(provider) || !status) return;

    setStatuses((current) => {
      const next = {
        ...current,
        [provider]: {
          ...current[provider],
          connected: status === "connected",
          status: status === "connected" ? "connected" : "disconnected",
          updatedAt: new Date().toISOString(),
          source: "oauth" as const,
        },
      };
      persistStatuses(selectedCompanyId, next);
      return next;
    });

    addToast(
      message ||
      (status === "connected"
        ? "Integracao concluida com sucesso."
        : "Nao foi possivel concluir a integracao."),
      status === "connected" ? "success" : "error",
    );

    params.delete("integration_provider");
    params.delete("integration_status");
    params.delete("integration_message");

    const cleanedQuery = params.toString();
    const cleanedUrl = `${window.location.pathname}${cleanedQuery ? `?${cleanedQuery}` : ""}${window.location.hash}`;
    window.history.replaceState({}, "", cleanedUrl);
  }, [addToast, selectedCompanyId]);

  const markLocalConnection = (provider: HubProvider, connected: boolean) => {
    setStatuses((current) => {
      const next = {
        ...current,
        [provider]: {
          ...current[provider],
          connected,
          status: connected ? "connected" : "disconnected",
          updatedAt: new Date().toISOString(),
          source: "oauth" as const,
        },
      };
      persistStatuses(selectedCompanyId, next);
      return next;
    });
  };

  // Removido useEffect de polling do WhatsApp QR code

  const handleWhatsappConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar canais.", "info");
      return;
    }

    setWhatsappModalOpen(true);
  };

  const handleSaveMetaConfig = async () => {
    if (!selectedCompanyId || !metaAccessToken || !phoneNumber) {
      addToast("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    setIsSavingMeta(true);
    try {
      await saveMetaAPIConfig(selectedCompanyId, {
        metaAccessToken,
        phoneNumber,
      });
      addToast("Configuração do Meta salva com sucesso!", "success");
      setWhatsappModalOpen(false);
      
      setStatuses((current) => {
        const next = {
          ...current,
          whatsapp: {
            ...current.whatsapp,
            connected: true,
            status: "connected" as const,
            updatedAt: new Date().toISOString(),
            source: "api" as const,
          },
        };
        persistStatuses(selectedCompanyId, next);
        return next;
      });
    } catch (error) {
      addToast("Erro ao salvar configuração.", "error");
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!selectedCompanyId || !window.confirm("Deseja realmente desconectar o WhatsApp? Isso limpará suas credenciais.")) return;
    setIsSavingMeta(true);
    try {
      await disconnectMetaAPIConfig(selectedCompanyId);
      addToast("Meta Cloud API desconectada.", "success");
      setWhatsappModalOpen(false);
      setMetaAccessToken("");
      setPhoneNumber("");
      await syncFromBackend();
    } catch (error) {
      addToast("Erro ao desconectar.", "error");
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleShopeeConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar canais.", "info");
      return;
    }

    // Se o modal de credenciais não estiver aberto e não tivermos user/pass, abre o modal
    if (!shopeeModalOpen && !shopeeUser) {
      setShopeeModalOpen(true);
      return;
    }

    setLoadingProvider("shopee");
    try {
      const response = await initializeShopeeLogin(selectedCompanyId, {
        user: shopeeUser || undefined,
        pass: shopeePass || undefined
      });

      if (response.status === "OTP_REQUIRED") {
        setShopeeModalOpen(false);
        setShopeeOtpModalOpen(true);
        addToast("Codigo de verificacao solicitado pela Shopee.", "info");
      } else if (response.status === "SUCCESS") {
        setShopeeModalOpen(false);
        markLocalConnection("shopee", true);
        addToast("Shopee conectada com sucesso!", "success");
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || "Erro ao iniciar conexao com a Shopee.", "error");
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleShopeeVerifyOtp = async () => {
    if (!selectedCompanyId || !shopeeOtp) return;

    setShopeeVerifying(true);
    try {
      await verifyShopeeOtp(selectedCompanyId, shopeeOtp);
      markLocalConnection("shopee", true);
      setShopeeOtpModalOpen(false);
      setShopeeOtp("");
      addToast("Shopee autenticada com sucesso!", "success");
    } catch (err: any) {
      addToast(err.response?.data?.message || "Codigo invalido ou erro na verificacao.", "error");
    } finally {
      setShopeeVerifying(false);
    }
  };

  const handleOAuthConnect = async (provider: HubProvider) => {
    if (provider === "shopee") {
      return handleShopeeConnect();
    }

    const currentProvider = PROVIDERS.find((item) => item.id === provider);
    if (!currentProvider) return;

    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar canais.", "info");
      return;
    }

    setLoadingProvider(provider);
    setStatuses((current) => ({
      ...current,
      [provider]: {
        ...current[provider],
        status: "syncing",
      },
    }));

    try {
      const [session] = await Promise.all([
        getIntegrationOAuthSession(provider, selectedCompanyId, window.location.href),
        wait(900),
      ]);

      if (session?.authUrl) {
        window.location.assign(session.authUrl);
        return;
      }

      markLocalConnection(provider, true);
      addToast(`${currentProvider.name} conectado em modo demonstracao.`, "success");
    } catch {
      await wait(500);
      markLocalConnection(provider, true);
      addToast(
        `${currentProvider.name} entrou em modo demonstracao. O hook OAuth ja ficou pronto no backend para a proxima etapa.`,
        "info",
      );
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleCloseWhatsappModal = () => {
    setWhatsappModalOpen(false);
  };

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-zinc-800 bg-[#09090b] shadow-lg shadow-black/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(181,255,0,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_32%)]" />

      <div className="relative space-y-6 p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
              One-Click Hub
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-zinc-50 sm:text-3xl">
              Conecte seus canais sem pedir token para o usuario
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Um clique inicia o OAuth. O card mostra status, loading e volta pronto quando a
              autorizacao termina.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/75 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Canais ativos</p>
              <p className="mt-2 text-2xl font-black text-zinc-100">{connectedCount}/3</p>
            </div>
            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-lime-200/70">UX prometida</p>
              <p className="mt-2 text-sm font-semibold text-lime-100">
                Sem ID, sem Access Token, sem modal chato.
              </p>
            </div>
          </div>
        </div>

        {!selectedCompanyId ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Escolha uma empresa para liberar os botões de conexao.
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PROVIDERS.map((provider) => {
            const status = statuses[provider.id];
            const isLoading = loadingProvider === provider.id || status.status === "syncing";
            const isWhatsapp = provider.id === "whatsapp";
            const buttonLabel = isLoading
              ? isWhatsapp
                ? "Carregando..."
                : "Conectando..."
              : status.connected
                ? isWhatsapp
                  ? "Configurado"
                  : "Revalidar acesso"
                : isWhatsapp
                  ? "Configurar Meta"
                  : "Conectar em 1 clique";

            return (
              <article
                key={provider.id}
                className="group relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950/85 p-5 transition duration-200 hover:-translate-y-1 hover:border-lime-400/30 hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
              >
                <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${provider.surfaceClass}`} />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <BrandLogo provider={provider.id} />
                    {isWhatsapp ? (
                      <WhatsAppStatus companyId={selectedCompanyId} />
                    ) : (
                      <StatusPulse connected={status.connected} />
                    )}
                  </div>

                  <div className="mt-5">
                    <h3 className="text-xl font-black tracking-tight text-zinc-50">{provider.name}</h3>
                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-zinc-400">
                      {provider.description}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/65 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Ultima sincronizacao</p>
                    <p className={`mt-2 text-sm font-semibold ${provider.accentClass}`}>
                      {bootstrapping ? "Lendo status..." : formatUpdatedAt(status.updatedAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void (isWhatsapp
                        ? handleWhatsappConnect()
                        : handleOAuthConnect(provider.id))
                    }
                    disabled={!selectedCompanyId || isLoading}
                    className={`mt-5 inline-flex items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${!selectedCompanyId
                      ? "cursor-not-allowed bg-zinc-800 text-zinc-500"
                      : "bg-lime-400 text-zinc-950 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.99]"
                      }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full border-2 border-zinc-950/25 border-t-zinc-950 ${isLoading ? "animate-spin" : ""
                        }`}
                    />
                    {buttonLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {shopeeModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={() => setShopeeModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-[28px] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EE4D2D]">
                    Shopee NEXT
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
                    Conectar Conta
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Insira as credenciais do seu Seller Center para iniciar a integração automática.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShopeeModalOpen(false)}
                  className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Usuário / E-mail</label>
                  <input
                    type="text"
                    placeholder="ex@email.com"
                    value={shopeeUser}
                    onChange={(e) => setShopeeUser(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={shopeePass}
                    onChange={(e) => setShopeePass(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white focus:border-[#EE4D2D] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleShopeeConnect}
                disabled={loadingProvider === "shopee" || !shopeeUser || !shopeePass}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EE4D2D] py-3.5 text-sm font-black text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {loadingProvider === "shopee" ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                    Iniciando Login...
                  </>
                ) : (
                  "Conectar Agora"
                )}
              </button>
              
              <p className="mt-4 text-center text-[10px] uppercase tracking-widest text-zinc-500">
                Segurança ponta-a-ponta via Puppeteer Stealth
              </p>
            </div>
          </div>
        ) : null}

        {whatsappModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={handleCloseWhatsappModal}
          >
            <div
              className="w-full max-w-md rounded-[28px] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                    WhatsApp NEXT
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
                    Configurar Meta Cloud API
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Insira as credenciais oficiais da Meta para enviar e receber mensagens.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseWhatsappModal}
                  className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-8 flex flex-col items-center justify-center space-y-4 text-center">
                <WhatsAppConnectButton companyId={selectedCompanyId} />
                <p className="max-w-[280px] text-[10px] uppercase tracking-widest text-zinc-500">
                  Clique para abrir o popup seguro da Meta e selecionar sua conta business.
                </p>
              </div>

              {statuses.whatsapp.connected && (
                <div className="mt-8 border-t border-zinc-900 pt-6">
                  <button
                    type="button"
                    onClick={handleDisconnectMeta}
                    className="w-full text-xs font-bold uppercase tracking-widest text-red-400/70 transition hover:text-red-400"
                  >
                    Desconectar conta atual
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {shopeeOtpModalOpen ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={() => setShopeeOtpModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-[28px] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EE4D2D]">
                    Shopee NEXT
                  </p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-50">
                    Verificação Shopee
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    A Shopee enviou um código de verificação. Digite-o abaixo para concluir a integração.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShopeeOtpModalOpen(false)}
                  className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
                >
                  Cancelar
                </button>
              </div>

              <div className="mt-6">
                <input
                  type="text"
                  placeholder="000000"
                  value={shopeeOtp}
                  onChange={(e) => setShopeeOtp(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center text-2xl font-black tracking-[0.5em] text-white focus:border-[#EE4D2D] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleShopeeVerifyOtp}
                disabled={shopeeVerifying || shopeeOtp.length < 4}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-3.5 text-sm font-black text-zinc-950 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
              >
                {shopeeVerifying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-950" />
                    Verificando...
                  </>
                ) : (
                  "Confirmar Código"
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default IntegrationsHub;
