import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useNavigate } from "react-router-dom";
import { useAuth, useBilling } from "../App";
import { LockIcon } from "../components/icons";
import { useToast } from "../components/Toast";
import {
  disconnectMercadoLivre,
  disconnectWhatsapp,
  disconnectInstagram,
  getMercadoLivreConnectUrl,
  getMercadoLivreDashboard,
  getMercadoLivreStatus,
  getInstagramConnectUrl,
  getInstagramStatus,
  getWhatsappConnectionStatus,
  restartWhatsappConnection,
  startWhatsappConnection,
  syncMercadoLivre,
  type InstagramConnectionStatus,
  type MercadoLivreDashboard,
  type MercadoLivreStatus,
} from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { WhatsappConnection } from "../src/types/domain";

function isConnected(status?: string | null) {
  return status === "connected";
}

function isQrPending(status?: string | null) {
  return status === "qr_required" || status === "qr_pending" || status === "waiting_qr";
}

function hasQrData(connection?: WhatsappConnection | null) {
  return Boolean(connection?.qrCode || connection?.code || connection?.pairingCode);
}

function isOperationStatus(status?: string | null) {
  return (
    status === "creating" ||
    status === "creating_instance" ||
    status === "qr_required" ||
    status === "qr_pending" ||
    status === "connecting" ||
    status === "disconnecting"
  );
}

function isInstagramTokenExpired(status?: InstagramConnectionStatus | null) {
  return Boolean(
    status?.tokenExpired ||
      status?.status === "token_expired" ||
      status?.status === "reconnect_required",
  );
}

function getInstagramStatusLabel(status?: InstagramConnectionStatus | null) {
  if (isInstagramTokenExpired(status)) return "Token expirado";
  if (status?.connected) return "Conectado";
  return "Desconectado";
}

function isCooldownStatus(status?: string | null) {
  return status === "rate_limited" || status === "provider_warming_up" || status === "qr_not_ready";
}

function sanitizeCustomerConnectionMessage(message?: string | null) {
  if (!message) return null;
  return message
    .replace(/Evolution API/gi, "conexão do WhatsApp")
    .replace(/Evolution/gi, "conexão")
    .replace(/(META|INSTAGRAM)_[A-Z_]+/gi, "configuração");
}

const Integrations = () => {
  const navigate = useNavigate();
  const { selectedCompanyId } = useAuth();
  const { currentPlan } = useBilling();
  const { addToast } = useToast();
  const [connection, setConnection] = useState<WhatsappConnection | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramStatus, setInstagramStatus] = useState<InstagramConnectionStatus | null>(null);
  const [mercadoLivreStatus, setMercadoLivreStatus] = useState<MercadoLivreStatus | null>(null);
  const [mercadoLivreDashboard, setMercadoLivreDashboard] = useState<MercadoLivreDashboard | null>(null);
  const [mercadoLivreLoading, setMercadoLivreLoading] = useState(false);
  const [mercadoLivreSyncing, setMercadoLivreSyncing] = useState(false);
  const [retryRemaining, setRetryRemaining] = useState(0);
  const normalizedPlan = String(currentPlan || "").toUpperCase();
  const canUseMainIntegrations = normalizedPlan === "PREMIUM" || normalizedPlan === "PRO_BUSINESS";
  const canUseMarketplaces = normalizedPlan === "PREMIUM" || normalizedPlan === "PRO_BUSINESS";

  const statusLabel = useMemo(() => {
    if (!connection) return "Desconectado";
    if (connection.status === "not_configured") return "Desconectado";
    if (connection.status === "qr_pending" && hasQrData(connection)) return "QR pendente";
    if (isQrPending(connection.status)) return "QR indisponível";
    if (connection.status === "creating" || connection.status === "creating_instance") return "Criando instância";
    if (connection.status === "connecting") return "Conectando";
    if (connection.status === "disconnecting") return "Desconectando";
    if (connection.status === "connected") return "Conectado";
    if (connection.status === "disconnected_pending_provider_cleanup") return "Desconectado na Next Level";
    if (connection.status === "disconnect_pending") return "Limpeza pendente";
    if (connection.status === "disconnected_requires_new_qr") return "Novo QR necessário";
    if (connection.status === "rate_limited") return "Limite temporário";
    if (connection.status === "provider_warming_up") return "Preparando conexão";
    if (connection.status === "qr_not_ready") return "QR ainda não pronto";
    if (connection.status === "repair_ready") return "Reparo pronto";
    if (connection.status === "error") return "Erro";
    if (connection.status === "idle") return "Pronto para conectar";
    return "Desconectado";
  }, [connection]);

  const connectionHealthLabel =
    connection?.webhookStatus === "configured" ? "Conexão ativa" : "Sincronizando";
  const automationLabel =
    connection?.automationStatus === "configured" ? "Atendimento pronto" : "Aguardando conexão";

  useEffect(() => {
    if (!selectedCompanyId || !canUseMainIntegrations) {
      setConnection(null);
      setInstagramStatus(null);
      setMercadoLivreStatus(null);
      setMercadoLivreDashboard(null);
      return;
    }
    getWhatsappConnectionStatus(selectedCompanyId)
      .then(setConnection)
      .catch(() => undefined);
    getInstagramStatus(selectedCompanyId)
      .then(setInstagramStatus)
      .catch(() => undefined);
    if (canUseMarketplaces) {
      getMercadoLivreStatus(selectedCompanyId)
        .then(setMercadoLivreStatus)
        .catch(() => undefined);
      getMercadoLivreDashboard(selectedCompanyId)
        .then(setMercadoLivreDashboard)
        .catch(() => undefined);
    } else {
      setMercadoLivreStatus(null);
      setMercadoLivreDashboard(null);
    }
  }, [canUseMainIntegrations, canUseMarketplaces, selectedCompanyId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("integration_provider");
    if (provider !== "instagram" && provider !== "mercadolivre") return;

    const status = params.get("integration_status");
    const message = params.get("integration_message");
    const providerLabel = provider === "mercadolivre" ? "Mercado Livre" : "Instagram";
    addToast(
      message || (status === "connected" ? `${providerLabel} conectado.` : `Não foi possível conectar o ${providerLabel}.`),
      status === "connected" ? "success" : "error",
    );
    window.history.replaceState({}, "", window.location.pathname);
    if (provider === "mercadolivre" && selectedCompanyId && canUseMarketplaces) {
      getMercadoLivreStatus(selectedCompanyId).then(setMercadoLivreStatus).catch(() => undefined);
      getMercadoLivreDashboard(selectedCompanyId).then(setMercadoLivreDashboard).catch(() => undefined);
    }
  }, [addToast, canUseMarketplaces, selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId || !canUseMainIntegrations) return;
    const shouldPoll =
      connection?.status === "creating" ||
      connection?.status === "creating_instance" ||
      isQrPending(connection?.status) ||
      connection?.status === "connecting" ||
      isCooldownStatus(connection?.status);
    if (!shouldPoll) return;

    const timer = window.setInterval(() => {
      getWhatsappConnectionStatus(selectedCompanyId)
        .then(setConnection)
        .catch(() => undefined);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [canUseMainIntegrations, connection?.status, selectedCompanyId]);

  useEffect(() => {
    if (!isCooldownStatus(connection?.status)) {
      setRetryRemaining(0);
      return;
    }

    const initial = Math.max(0, Number(connection?.retryAfterSeconds || 0));
    setRetryRemaining(initial);
    if (!initial) return;

    const timer = window.setInterval(() => {
      setRetryRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [connection?.retryAfterSeconds, connection?.status]);

  useEffect(() => {
    const rawQr = connection?.qrCode;
    if (!rawQr) {
      setQrImage(null);
      return;
    }

    if (rawQr.startsWith("data:image")) {
      setQrImage(rawQr);
      return;
    }

    QRCode.toDataURL(rawQr, {
      margin: 1,
      width: 280,
      color: {
        dark: "#050505",
        light: "#f7fee7",
      },
    })
      .then((image) => {
        setQrImage(image);
      })
      .catch(() => setQrImage(null));
  }, [connection?.qrCode]);

  const handleConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar.", "error");
      return;
    }

    try {
      setLoading(true);
      const next = await startWhatsappConnection(selectedCompanyId);
      setConnection(next);
      if (isConnected(next.status)) {
        addToast("WhatsApp conectado.", "success");
      } else if (next.status === "qr_pending" && hasQrData(next)) {
        addToast("QR Code gerado.", "success");
      } else if (next.status === "provider_warming_up") {
        addToast(
          sanitizeCustomerConnectionMessage(next.message) || "Preparando conexão com WhatsApp...",
          "info",
        );
      } else if (next.status === "rate_limited") {
        addToast(
          sanitizeCustomerConnectionMessage(next.message) || "Muitas tentativas agora. Aguarde alguns segundos.",
          "info",
        );
      } else if (next.status === "qr_not_ready") {
        addToast(sanitizeCustomerConnectionMessage(next.message) || "QR ainda não está pronto. Tente novamente em alguns segundos.", "info");
      } else {
        addToast(sanitizeCustomerConnectionMessage(next.message || next.lastError) || "Erro ao gerar QR Code.", "error");
      }
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível iniciar o WhatsApp."), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRepair = async () => {
    if (!selectedCompanyId) return;

    try {
      setLoading(true);
      const next = await restartWhatsappConnection(selectedCompanyId);
      setConnection(next);
      if (isConnected(next.status)) {
        addToast("Conexão verificada.", "success");
      } else if (next.status === "qr_pending" && hasQrData(next)) {
        addToast("QR Code gerado.", "success");
      } else if (next.status === "provider_warming_up" || next.status === "rate_limited") {
        addToast(sanitizeCustomerConnectionMessage(next.message) || "Conexão indisponível agora.", "info");
      } else if (next.status === "qr_not_ready" || next.status === "repair_ready") {
        addToast(sanitizeCustomerConnectionMessage(next.message) || "Clique em Conectar WhatsApp para gerar o QR.", "info");
      } else {
        addToast(sanitizeCustomerConnectionMessage(next.message) || "Conexão ainda precisa de novo QR.", "info");
      }
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível reparar a conexão."), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedCompanyId) return;

    try {
      setLoading(true);
      const next = await disconnectWhatsapp(selectedCompanyId);
      setConnection(next);
      addToast("WhatsApp desconectado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível desconectar."), "error");
    } finally {
      setLoading(false);
    }
  };

  const refreshInstagramStatus = async () => {
    if (!selectedCompanyId) return;
    const next = await getInstagramStatus(selectedCompanyId);
    setInstagramStatus(next);
  };

  const handleInstagramConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar.", "error");
      return;
    }

    try {
      setInstagramLoading(true);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const session = await getInstagramConnectUrl(selectedCompanyId, returnTo);
      window.location.assign(session.authUrl);
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível iniciar o Instagram."), "error");
      setInstagramLoading(false);
    }
  };

  const handleInstagramDisconnect = async () => {
    if (!selectedCompanyId) return;

    try {
      setInstagramLoading(true);
      await disconnectInstagram(selectedCompanyId);
      await refreshInstagramStatus();
      addToast("Instagram desconectado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível desconectar o Instagram."), "error");
    } finally {
      setInstagramLoading(false);
    }
  };

  const refreshMercadoLivre = async () => {
    if (!selectedCompanyId || !canUseMarketplaces) return;
    const [status, dashboard] = await Promise.all([
      getMercadoLivreStatus(selectedCompanyId),
      getMercadoLivreDashboard(selectedCompanyId),
    ]);
    setMercadoLivreStatus(status);
    setMercadoLivreDashboard(dashboard);
  };

  const handleMercadoLivreConnect = async () => {
    if (!selectedCompanyId) {
      addToast("Selecione uma empresa antes de conectar.", "error");
      return;
    }
    if (!canUseMarketplaces) {
      addToast("Mercado Livre está disponível a partir do plano Premium.", "error");
      return;
    }

    try {
      setMercadoLivreLoading(true);
      const returnTo = `${window.location.pathname}${window.location.search}`;
      const session = await getMercadoLivreConnectUrl(selectedCompanyId, returnTo);
      window.location.assign(session.authUrl);
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível iniciar o Mercado Livre."), "error");
      setMercadoLivreLoading(false);
    }
  };

  const handleMercadoLivreSync = async () => {
    if (!selectedCompanyId || !canUseMarketplaces) return;
    try {
      setMercadoLivreSyncing(true);
      await syncMercadoLivre(selectedCompanyId);
      await refreshMercadoLivre();
      addToast("Integração Mercado Livre reprocessada.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Falha ao sincronizar Mercado Livre."), "error");
    } finally {
      setMercadoLivreSyncing(false);
    }
  };

  const handleMercadoLivreDisconnect = async () => {
    if (!selectedCompanyId || !canUseMarketplaces) return;
    try {
      setMercadoLivreLoading(true);
      await disconnectMercadoLivre(selectedCompanyId);
      await refreshMercadoLivre();
      addToast("Mercado Livre desconectado.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Não foi possível desconectar Mercado Livre."), "error");
    } finally {
      setMercadoLivreLoading(false);
    }
  };

  if (!canUseMainIntegrations) {
    return (
      <div className="nl-page">
        <div className="nl-page-header">
          <div className="nl-page-header__meta">
            <p className="nl-eyebrow">Integrações</p>
            <h1 className="nl-page-title">Canais conectados</h1>
            <p className="nl-page-subtitle">
              Conecte atendimento, marketplaces e dados de venda para alimentar sua inteligência.
            </p>
          </div>
        </div>

        <section className="nl-card border-red-500/25 p-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-300">
                <LockIcon className="h-6 w-6" />
              </div>
              <div>
                <span className="nl-badge-danger mb-2">Restrito ao plano Premium</span>
                <h2 className="text-xl font-bold text-[var(--nl-text-primary)]">
                  Recurso bloqueado
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--nl-text-secondary)]">
                  As integrações automáticas liberam conexão com canais de venda, atendimento e dados em tempo real para sua empresa.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/planos?upgrade=integrations")}
              className="nl-button-primary"
            >
              Fazer upgrade
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="nl-page">
      <div className="nl-page-header">
        <div className="nl-page-header__meta">
          <p className="nl-eyebrow">Conectividade & Dados</p>
          <h1 className="nl-page-title">Sincronização de Canais</h1>
          <p className="nl-page-subtitle">
            Centralize seus pontos de contato e vendas para alimentar o motor de inteligência e atendimento.
          </p>
        </div>
      </div>

      <section className="nl-card p-6 md:p-8 mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5 min-w-0 flex-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
               <span className="text-2xl">📱</span>
            </div>
            <div className="min-w-0">
               <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h2 className="text-xl font-black text-[var(--nl-text-primary)]">WhatsApp Business</h2>
                  <span className={`nl-badge-${isConnected(connection?.status) ? "success" : "muted"}`}>
                     {statusLabel}
                  </span>
               </div>
               <p className="text-[13px] leading-relaxed text-[var(--nl-text-secondary)] mb-6 max-w-2xl">
                 Conecte o motor de atendimento agêntico diretamente ao número oficial da empresa para automação de vendas e suporte 24/7.
               </p>

               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)]">Saúde do Link</span>
                     <span className="text-xs font-bold text-[var(--nl-text-primary)]">{connectionHealthLabel}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)]">Agente Ativado</span>
                     <span className="text-xs font-bold text-[var(--nl-text-primary)]">{automationLabel}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-3 pt-1">
            {isConnected(connection?.status) ? (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRepair}
                  disabled={loading || !selectedCompanyId || isOperationStatus(connection?.status)}
                  className="nl-button-primary py-2 px-6 text-xs"
                >
                  {loading ? "Verificando..." : "Sincronizar Canal"}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={loading || isOperationStatus(connection?.status)}
                  className="nl-button-secondary text-red-400 border-red-900/30 hover:bg-red-950/20 py-2 text-xs"
                >
                  Interromper Fluxo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={
                  loading ||
                  !selectedCompanyId ||
                  !canUseMainIntegrations ||
                  isOperationStatus(connection?.status) ||
                  retryRemaining > 0
                }
                className="nl-button-primary px-8 py-3"
              >
                  {loading
                  ? "Gerando Instância..."
                  : !canUseMainIntegrations
                    ? "Upgrade Necessário"
                  : connection?.status === "provider_warming_up"
                    ? "Iniciando Motor..."
                  : retryRemaining > 0
                    ? `Aguarde ${retryRemaining}s`
                  : isQrPending(connection?.status)
                    ? "Aguardando Leitura"
                    : "Conectar Agora"}
              </button>
            )}
          </div>
        </div>

        {(connection?.status === "qr_pending" && hasQrData(connection)) || qrImage ? (
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center gap-10">
            <div className="h-[280px] w-[280px] rounded-3xl border border-white/5 bg-white p-6 shadow-[0_0_50px_rgba(255,255,255,0.05)] shrink-0">
               {qrImage ? (
                  <img src={qrImage} alt="QR Auth" className="w-full h-full" />
               ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-900 font-bold text-center text-xs">
                    Gerando Semente de Autenticação...
                  </div>
               )}
            </div>
            <div className="max-w-md">
               <h3 className="text-lg font-bold text-[var(--nl-text-primary)] mb-2">Escaneie o QR Code</h3>
               <p className="text-sm text-[var(--nl-text-secondary)] leading-relaxed mb-6">
                 Abra o WhatsApp em seu celular → Aparelhos Conectados → Conectar um aparelho.
               </p>
               {connection?.pairingCode && (
                 <div className="nl-card-glass p-4 border-emerald-500/20 mb-4 inline-block w-full">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Código de Pareamento</p>
                    <p className="text-3xl font-black text-white font-mono tracking-widest">{connection.pairingCode}</p>
                 </div>
               )}
               <div className="flex items-center gap-2 text-[11px] text-[var(--nl-text-muted)] bg-white/5 py-2 px-3 rounded-lg border border-white/5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Após a leitura, a sincronização levará cerca de 5 segundos.
               </div>
            </div>
          </div>
        ) : null}

        {connection?.status === "provider_warming_up" ||
        connection?.status === "rate_limited" ||
        connection?.status === "qr_not_ready" ||
        connection?.status === "error" ? (
          <div className={`mt-6 p-4 rounded-xl border flex items-center gap-4 ${
            connection.status === "error"
              ? "border-red-500/20 bg-red-500/5 text-red-300"
              : "border-amber-500/20 bg-amber-500/5 text-amber-200"
          }`}>
            <span className="text-lg">{connection.status === "error" ? "❌" : "⏳"}</span>
            <div className="text-xs font-medium">
               <p>{sanitizeCustomerConnectionMessage(connection.message || connection.lastError) || "Ocorreu um atraso na inicialização do serviço."}</p>
               {retryRemaining > 0 && <p className="mt-1 opacity-70">Aguardando cooldown: {retryRemaining} segundos.</p>}
            </div>
          </div>
        ) : null}
      </section>

      <section className="nl-card p-6 md:p-8 mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5 min-w-0 flex-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-pink-500/20 bg-pink-500/10 text-pink-400">
               <span className="text-2xl">📸</span>
            </div>
            <div className="min-w-0">
               <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h2 className="text-xl font-black text-[var(--nl-text-primary)]">Instagram Direct</h2>
                  <span className={`nl-badge-${instagramStatus?.connected ? "success" : "muted"}`}>
                     {getInstagramStatusLabel(instagramStatus)}
                  </span>
               </div>
               <p className="text-[13px] leading-relaxed text-[var(--nl-text-secondary)] mb-6 max-w-2xl">
                 Integre seus DMs para captação automática de leads e resposta rápida a interessados em seus produtos e serviços.
               </p>

               {isInstagramTokenExpired(instagramStatus) && (
                 <div className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 py-1.5 px-3 text-[11px] font-bold text-amber-300 border border-amber-500/20">
                   ⚠️ Renovação de Acesso Necessária
                 </div>
               )}
            </div>
          </div>

          <div className="flex shrink-0 gap-3 pt-1">
            {instagramStatus?.connected && !isInstagramTokenExpired(instagramStatus) ? (
              <button
                type="button"
                onClick={handleInstagramDisconnect}
                disabled={instagramLoading}
                className="nl-button-secondary text-red-400 border-red-900/30 hover:bg-red-950/20 py-2 px-6 text-xs"
              >
                {instagramLoading ? "Processando..." : "Desativar Canal"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstagramConnect}
                disabled={instagramLoading || !canUseMainIntegrations || Boolean(instagramStatus?.provider_setup_required)}
                className="nl-button-primary px-8 py-3"
              >
                {instagramLoading
                  ? "Sincronizando..."
                  : isInstagramTokenExpired(instagramStatus)
                    ? "Renovar Conexão"
                    : "Liberar Acesso Instagram"}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="nl-card p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5 min-w-0 flex-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
               <span className="text-2xl">🎒</span>
            </div>
            <div className="min-w-0">
               <div className="flex flex-wrap items-center gap-3 mb-1.5">
                  <h2 className="text-xl font-black text-[var(--nl-text-primary)]">Mercado Livre (Beta)</h2>
                  <span className={`nl-badge-${mercadoLivreStatus?.connected ? "success" : "muted"}`}>
                     {mercadoLivreStatus?.connected ? "Conectado" : "Inativo"}
                  </span>
               </div>
               <p className="text-[13px] leading-relaxed text-[var(--nl-text-secondary)] mb-6 max-w-2xl">
                 Evolua sua conta vendedora com importação automática de pedidos, estoque centralizado e relatórios de métricas avançadas.
               </p>

               {mercadoLivreStatus?.connected && (
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)]">Câmbio Acumulado</span>
                       <span className="text-xs font-bold text-emerald-400">
                         {Number(mercadoLivreDashboard?.revenue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                       </span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)]">Catálogo</span>
                       <span className="text-xs font-bold text-[var(--nl-text-primary)]">{mercadoLivreDashboard?.products || 0} Skus</span>
                    </div>
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--nl-text-muted)]">Pendências</span>
                       <span className="text-xs font-bold text-amber-400">{mercadoLivreDashboard?.pendingQuestions || 0} Ações</span>
                    </div>
                 </div>
               )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3 pt-1">
            {mercadoLivreStatus?.connected ? (
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleMercadoLivreSync}
                  disabled={mercadoLivreSyncing || !canUseMarketplaces}
                  className="nl-button-primary py-2 px-6 text-xs"
                >
                  {mercadoLivreSyncing ? "Reprocessando..." : "Sincronizar Dados"}
                </button>
                <button
                  type="button"
                  onClick={handleMercadoLivreDisconnect}
                  disabled={mercadoLivreLoading}
                  className="nl-button-secondary text-red-400 border-red-900/30 hover:bg-red-950/20 py-2 text-xs"
                >
                  Liberar Catálogo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleMercadoLivreConnect}
                disabled={mercadoLivreLoading || !canUseMarketplaces}
                className="nl-button-primary px-8 py-3"
              >
                {mercadoLivreLoading
                  ? "Sincronizando..."
                  : !canUseMarketplaces
                    ? "Exclusivo PREMIUM"
                    : "Conectar Mercado Livre"}
              </button>
            )}
          </div>
        </div>

        {mercadoLivreStatus?.connected && (
          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-[11px] font-medium text-[var(--nl-text-muted)] bg-white/5 px-2 py-1 rounded">
              {mercadoLivreStatus?.lastSyncAt ? `Sincronia estável: ${new Date(mercadoLivreStatus.lastSyncAt).toLocaleString("pt-BR")}` : "Aguardando fluxo de entrada..."}
            </p>
            {mercadoLivreStatus?.webhook && (
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-emerald-400">Webhooks Operacionais</span>
              </div>
            )}
          </div>
        )}
      </section>

      {!canUseMarketplaces && (
        <p className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-6">
          ⚠ Mercado Livre está disponível apenas no plano Premium.
        </p>
      )}

    </div>
  );
};

export default Integrations;
