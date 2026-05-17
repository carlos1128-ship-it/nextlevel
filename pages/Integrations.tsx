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
      console.info("whatsapp.qr.frontend.rendered", {
        source: "base64",
      });
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
        console.info("whatsapp.qr.frontend.rendered", {
          source: "code",
        });
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
      <main className="nl-page space-y-7">
        <section className="nl-page-header">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Integrações
          </p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
            Canais conectados ao lucro
          </h1>
        </section>

        <section className="nl-card border-red-500/30 bg-red-500/10 p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-red-400/30 bg-red-500/15 text-red-300">
                <LockIcon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-300">
                  Disponível no Premium
                </p>
                <h2 className="mt-2 text-2xl font-black text-zinc-50">
                  Assine Premium para ter integrações e mais.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
                  As integrações automáticas liberam conexão com canais de venda, atendimento e dados em tempo real para sua empresa.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/planos?upgrade=integrations")}
              className="nl-button-primary"
            >
              Ver planos
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="nl-page space-y-7">
      <section className="nl-page-header">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Integrações
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
          Canais conectados ao lucro
        </h1>
      </section>

      <section className="nl-card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
                WhatsApp
              </p>
              <h2 className="mt-2 text-2xl font-black text-zinc-50">
                WhatsApp
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Conecte o atendimento da sua empresa ao WhatsApp.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                <p className="mt-1 font-bold text-zinc-100">{statusLabel}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Saúde</p>
                <p className="mt-1 font-bold text-zinc-100">{connectionHealthLabel}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Atendimento IA</p>
                <p className="mt-1 font-bold text-zinc-100">{automationLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            {isConnected(connection?.status) ? (
              <button
                type="button"
                onClick={handleRepair}
                disabled={loading || !selectedCompanyId || isOperationStatus(connection?.status)}
                className="nl-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Verificando..." : "Reparar conexão"}
              </button>
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
                className="nl-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                  {loading
                  ? "Preparando conexão..."
                  : !canUseMainIntegrations
                    ? "Disponivel no Premium"
                  : connection?.status === "provider_warming_up"
                    ? "Preparando conexão..."
                  : retryRemaining > 0
                    ? `Aguarde ${retryRemaining}s`
                  : isQrPending(connection?.status)
                    ? "Aguardando leitura"
                    : "Conectar WhatsApp"}
              </button>
            )}
            {isConnected(connection?.status) ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading || isOperationStatus(connection?.status)}
                className="nl-button-secondary hover:border-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Desconectar
              </button>
            ) : null}
          </div>
        </div>

        {(connection?.status === "qr_pending" && hasQrData(connection)) || qrImage ? (
          <div className="mt-6 grid gap-5 border-t border-white/[0.08] pt-5 lg:grid-cols-[320px_1fr]">
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-lime-300/25 bg-lime-50 p-5">
              {qrImage ? (
                <img src={qrImage} alt="QR Code do WhatsApp" className="h-72 w-72" />
              ) : (
                <p className="text-center text-sm font-bold text-zinc-900">
                  QR indisponível no momento
                </p>
              )}
            </div>
            <div className="space-y-4">
              {connection?.pairingCode ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Código de pareamento
                  </p>
                  <p className="mt-2 font-mono text-2xl font-black text-lime-300">
                    {connection.pairingCode}
                  </p>
                </div>
              ) : null}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Próximo passo
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-zinc-200">
                  Leia o QR Code com o WhatsApp da empresa para concluir a conexão.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {connection?.status === "provider_warming_up" ||
        connection?.status === "rate_limited" ||
        connection?.status === "qr_not_ready" ||
        connection?.status === "error" ? (
          <p className={`mt-4 rounded-md border p-3 text-sm font-semibold ${
            connection.status === "error"
              ? "border-red-500/30 bg-red-950/30 text-red-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-100"
          }`}>
            {sanitizeCustomerConnectionMessage(connection.message || connection.lastError) || "Não foi possível gerar o QR Code agora."}
            {retryRemaining > 0 ? ` Tente novamente em ${retryRemaining}s.` : ""}
          </p>
        ) : null}
        {!canUseMainIntegrations ? (
          <p className="mt-4 rounded-xl border border-lime-400/25 bg-lime-400/10 p-3 text-sm font-semibold text-lime-100">
            Integrações com WhatsApp e Instagram estão disponíveis a partir do plano Premium.
          </p>
        ) : null}
      </section>

      <section className="nl-card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
                Integração
              </p>
              <h2 className="mt-2 text-2xl font-black text-zinc-50">
                Instagram
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Organize mensagens e oportunidades vindas do Instagram.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {getInstagramStatusLabel(instagramStatus)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Conta</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {instagramStatus?.connected ? "Conta profissional conectada" : "Aguardando conexão"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Oportunidades</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {instagramStatus?.connected ? "Mensagens organizadas" : "Conecte para ativar"}
                </p>
              </div>
            </div>

            {instagramStatus?.provider_setup_required ? (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100">
                A conexão com Instagram está temporariamente indisponível. Tente novamente em instantes.
              </p>
            ) : null}
            {isInstagramTokenExpired(instagramStatus) ? (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100">
                Token expirado / Reconexão necessária.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-3">
            {instagramStatus?.connected && !isInstagramTokenExpired(instagramStatus) ? (
              <button
                type="button"
                onClick={handleInstagramDisconnect}
                disabled={instagramLoading}
                className="nl-button-secondary hover:border-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {instagramLoading ? "Desconectando..." : "Desconectar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstagramConnect}
                disabled={instagramLoading || !canUseMainIntegrations || Boolean(instagramStatus?.provider_setup_required)}
                className="nl-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {instagramLoading
                  ? "Abrindo Instagram..."
                  : !canUseMainIntegrations
                    ? "Disponivel no Premium"
                  : isInstagramTokenExpired(instagramStatus)
                    ? "Reconectar Instagram"
                    : "Conectar Instagram"}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="nl-card p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
                Mercado Livre
              </p>
              <h2 className="mt-2 text-2xl font-black text-zinc-50">
                Mercado Livre
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Conecte sua conta vendedora para importar produtos, pedidos, vendas e dados operacionais automaticamente.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {mercadoLivreStatus?.connected ? "Conectado" : "Desconectado"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Conta</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {mercadoLivreStatus?.nickname || mercadoLivreStatus?.mlUserId || "Aguardando OAuth"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Receita ML</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {Number(mercadoLivreDashboard?.revenue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Produtos</p>
                <p className="mt-1 font-bold text-zinc-100">{mercadoLivreDashboard?.products || 0}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Pedidos</p>
                <p className="mt-1 font-bold text-zinc-100">{mercadoLivreDashboard?.orders || 0}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Perguntas</p>
                <p className="mt-1 font-bold text-zinc-100">{mercadoLivreDashboard?.pendingQuestions || 0} pendentes</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Última sync</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {mercadoLivreStatus?.lastSyncAt ? new Date(mercadoLivreStatus.lastSyncAt).toLocaleString("pt-BR") : "Ainda não sincronizado"}
                </p>
              </div>
            </div>

            {mercadoLivreStatus?.webhook ? (
              <p className="rounded-xl border border-lime-400/20 bg-lime-400/10 p-3 text-sm font-semibold text-lime-100">
                Prova de conexão: último webhook {mercadoLivreStatus.webhook.status.toLowerCase()} em {new Date(mercadoLivreStatus.webhook.lastEventAt).toLocaleString("pt-BR")}.
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {mercadoLivreStatus?.connected ? (
              <>
                <button
                  type="button"
                  onClick={handleMercadoLivreSync}
                  disabled={mercadoLivreSyncing || !canUseMarketplaces}
                  className="nl-button-primary disabled:opacity-50"
                >
                  {mercadoLivreSyncing ? "Reprocessando..." : "Reprocessar integração"}
                </button>
                <button
                  type="button"
                  onClick={handleMercadoLivreDisconnect}
                  disabled={mercadoLivreLoading}
                  className="nl-button-secondary hover:border-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Desconectar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleMercadoLivreConnect}
                disabled={mercadoLivreLoading || !canUseMarketplaces}
                className="nl-button-primary disabled:opacity-50"
              >
                {mercadoLivreLoading
                  ? "Abrindo Mercado Livre..."
                  : !canUseMarketplaces
                    ? "Disponível no Premium"
                    : "Conectar Mercado Livre"}
              </button>
            )}
          </div>
        </div>
      </section>

      {!canUseMarketplaces ? (
        <p className="rounded-2xl border border-lime-400/20 bg-lime-400/10 p-4 text-sm font-semibold text-lime-100">
          Mercado Livre está disponível a partir do Premium.
        </p>
      ) : null}

    </main>
  );
};

export default Integrations;
