import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useAuth, useBilling } from "../App";
import { useToast } from "../components/Toast";
import {
  disconnectWhatsapp,
  disconnectInstagram,
  getInstagramConnectUrl,
  getInstagramStatus,
  getWhatsappConnectionStatus,
  restartWhatsappConnection,
  startWhatsappConnection,
  type InstagramConnectionStatus,
} from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { WhatsappConnection } from "../src/types/domain";

const channels = [
  {
    title: "Mercado Livre",
    description: "Configuração do provedor necessária: aguardando OAuth/API oficial.",
  },
];

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

const Integrations = () => {
  const { selectedCompanyId } = useAuth();
  const { currentPlan } = useBilling();
  const { addToast } = useToast();
  const [connection, setConnection] = useState<WhatsappConnection | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramStatus, setInstagramStatus] = useState<InstagramConnectionStatus | null>(null);
  const [retryRemaining, setRetryRemaining] = useState(0);
  const normalizedPlan = String(currentPlan || "").toUpperCase();
  const canUseMainIntegrations = normalizedPlan === "PREMIUM" || normalizedPlan === "PRO_BUSINESS";
  const canUseMarketplaces = normalizedPlan === "PRO_BUSINESS";

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
    if (connection.status === "provider_warming_up") return "Evolution iniciando";
    if (connection.status === "qr_not_ready") return "QR ainda não pronto";
    if (connection.status === "repair_ready") return "Reparo pronto";
    if (connection.status === "error") return "Erro";
    if (connection.status === "idle") return "Pronto para conectar";
    return "Desconectado";
  }, [connection]);

  const webhookLabel =
    connection?.webhookStatus === "configured" ? "Webhook configurado" : "Webhook pendente";
  const automationLabel =
    connection?.automationStatus === "configured" ? "Automação configurada" : "Automação pendente";
  const phoneLabel =
    isConnected(connection?.status) && !connection?.phoneNumber
      ? "Conectado, sincronizando número"
      : connection?.phoneNumber || "Aguardando conexão";

  useEffect(() => {
    if (!selectedCompanyId) return;
    getWhatsappConnectionStatus(selectedCompanyId)
      .then(setConnection)
      .catch(() => undefined);
    getInstagramStatus(selectedCompanyId)
      .then(setInstagramStatus)
      .catch(() => undefined);
  }, [selectedCompanyId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("integration_provider") !== "instagram") return;

    const status = params.get("integration_status");
    const message = params.get("integration_message");
    addToast(
      message || (status === "connected" ? "Instagram conectado." : "Não foi possível conectar o Instagram."),
      status === "connected" ? "success" : "error",
    );
    window.history.replaceState({}, "", window.location.pathname);
  }, [addToast]);

  useEffect(() => {
    if (!selectedCompanyId) return;
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
  }, [connection?.status, selectedCompanyId]);

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
        instanceName: connection?.instanceName,
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
          instanceName: connection?.instanceName,
          source: "code",
        });
      })
      .catch(() => setQrImage(null));
  }, [connection?.instanceName, connection?.qrCode]);

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
          next.message || "Preparando conexão com WhatsApp...",
          "info",
        );
      } else if (next.status === "rate_limited") {
        addToast(
          next.message || "A Evolution limitou as requisições. Aguarde alguns segundos.",
          "info",
        );
      } else if (next.status === "qr_not_ready") {
        addToast(next.message || "QR ainda não está pronto. Tente novamente em alguns segundos.", "info");
      } else {
        addToast(next.message || next.lastError || "Erro ao gerar QR Code.", "error");
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
        addToast(next.message || "Evolution indisponível agora.", "info");
      } else if (next.status === "qr_not_ready" || next.status === "repair_ready") {
        addToast(next.message || "Clique em Conectar WhatsApp para gerar o QR.", "info");
      } else {
        addToast(next.message || "Conexão ainda precisa de novo QR.", "info");
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

  return (
    <main className="space-y-7">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Integrações
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
          Canais conectados ao lucro
        </h1>
      </section>

      <section className="rounded-lg border border-lime-400/25 bg-zinc-950 p-5 shadow-2xl shadow-lime-950/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
                WhatsApp
              </p>
              <h2 className="mt-2 text-2xl font-black text-zinc-50">
                Atendimento IA via Evolution
              </h2>
            </div>
            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Sessão</p>
                <p className="mt-1 font-bold text-zinc-100">{statusLabel}</p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Webhook</p>
                <p className="mt-1 font-bold text-zinc-100">{webhookLabel}</p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Automação</p>
                <p className="mt-1 font-bold text-zinc-100">{automationLabel}</p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Número</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {phoneLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            {isConnected(connection?.status) ? (
              <button
                type="button"
                onClick={handleRepair}
                disabled={loading || !selectedCompanyId || isOperationStatus(connection?.status)}
                className="rounded-md bg-lime-400 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-md bg-lime-400 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:border-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Desconectar
              </button>
            ) : null}
          </div>
        </div>

        {(connection?.status === "qr_pending" && hasQrData(connection)) || qrImage ? (
          <div className="mt-6 grid gap-5 border-t border-zinc-900 pt-5 lg:grid-cols-[320px_1fr]">
            <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-zinc-800 bg-lime-50 p-5">
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
                <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Código de pareamento
                  </p>
                  <p className="mt-2 font-mono text-2xl font-black text-lime-300">
                    {connection.pairingCode}
                  </p>
                </div>
              ) : null}
              <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Instância
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-zinc-200">
                  {connection?.instanceName || "nextlevel"}
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
            {connection.message || connection.lastError || "Não foi possível gerar o QR Code agora."}
            {retryRemaining > 0 ? ` Tente novamente em ${retryRemaining}s.` : ""}
          </p>
        ) : null}
        {!canUseMainIntegrations ? (
          <p className="mt-4 rounded-md border border-lime-400/25 bg-lime-400/10 p-3 text-sm font-semibold text-lime-100">
            Integracoes com WhatsApp e Instagram estao disponiveis a partir do plano Premium.
          </p>
        ) : null}
      </section>

      <section className="rounded-lg border border-lime-400/25 bg-zinc-950 p-5 shadow-2xl shadow-lime-950/20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
                Instagram
              </p>
              <h2 className="mt-2 text-2xl font-black text-zinc-50">
                DMs com IA via Meta Graph API
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Conecte uma conta profissional vinculada a uma Página do Facebook para responder DMs com memoria isolada por empresa.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {getInstagramStatusLabel(instagramStatus)}
                </p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Conta</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {instagramStatus?.igUsername ? `@${instagramStatus.igUsername}` : "Aguardando OAuth"}
                </p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Página</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {instagramStatus?.pageName || instagramStatus?.pageId || "Meta Business"}
                </p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Webhook</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {instagramStatus?.provider_setup_required ? "Configurar ENV" : "Pronto"}
                </p>
              </div>
            </div>

            {instagramStatus?.provider_setup_required ? (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100">
                Configure META_APP_ID, META_APP_SECRET, INSTAGRAM_REDIRECT_URI, INSTAGRAM_OAUTH_SCOPE e INSTAGRAM_WEBHOOK_VERIFY_TOKEN no backend.
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
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:border-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {instagramLoading ? "Desconectando..." : "Desconectar"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstagramConnect}
                disabled={instagramLoading || !canUseMainIntegrations || Boolean(instagramStatus?.provider_setup_required)}
                className="rounded-md bg-lime-400 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
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

      <section className="grid gap-4 md:grid-cols-3">
        {channels.map((channel) => (
          <article
            key={channel.title}
            className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
              Em preparação
            </p>
            <h2 className="mt-3 text-xl font-black text-zinc-50">{channel.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{channel.description}</p>
          </article>
        ))}
        {!canUseMarketplaces ? (
          <p className="rounded-lg border border-lime-400/20 bg-lime-400/10 p-4 text-sm font-semibold text-lime-100 md:col-span-3">
            Mercado Livre, Utmify e marketplaces estao disponiveis no plano Pro Business.
          </p>
        ) : null}
      </section>

    </main>
  );
};

export default Integrations;
