import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import {
  disconnectWhatsapp,
  getWhatsappConnectionStatus,
  restartWhatsappConnection,
  startWhatsappConnection,
} from "../src/services/endpoints";
import { getErrorMessage } from "../src/services/error";
import type { WhatsappConnection } from "../src/types/domain";

const channels = [
  {
    title: "Instagram",
    description: "Meta Graph pronto para campanhas e captura de sinais.",
  },
  {
    title: "Mercado Livre",
    description: "Canal comercial preservado para sincronizacao operacional.",
  },
  {
    title: "Shopee",
    description: "Monitoramento e integracao comercial em evolucao.",
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

function isCooldownStatus(status?: string | null) {
  return status === "rate_limited" || status === "provider_warming_up" || status === "qr_not_ready";
}

const Integrations = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [connection, setConnection] = useState<WhatsappConnection | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryRemaining, setRetryRemaining] = useState(0);

  const statusLabel = useMemo(() => {
    if (!connection) return "Desconectado";
    if (connection.status === "not_configured") return "Desconectado";
    if (connection.status === "qr_pending" && hasQrData(connection)) return "QR pendente";
    if (isQrPending(connection.status)) return "QR indisponivel";
    if (connection.status === "creating" || connection.status === "creating_instance") return "Criando instancia";
    if (connection.status === "connecting") return "Conectando";
    if (connection.status === "disconnecting") return "Desconectando";
    if (connection.status === "connected") return "Conectado";
    if (connection.status === "disconnected_pending_provider_cleanup") return "Desconectado na Next Level";
    if (connection.status === "disconnect_pending") return "Limpeza pendente";
    if (connection.status === "disconnected_requires_new_qr") return "Novo QR necessario";
    if (connection.status === "rate_limited") return "Limite temporario";
    if (connection.status === "provider_warming_up") return "Evolution iniciando";
    if (connection.status === "qr_not_ready") return "QR ainda nao pronto";
    if (connection.status === "repair_ready") return "Reparo pronto";
    if (connection.status === "error") return "Erro";
    if (connection.status === "idle") return "Pronto para conectar";
    return "Desconectado";
  }, [connection]);

  const webhookLabel =
    connection?.webhookStatus === "configured" ? "Webhook configurado" : "Webhook pendente";
  const automationLabel =
    connection?.automationStatus === "configured" ? "Automacao configurada" : "Automacao pendente";
  const phoneLabel =
    isConnected(connection?.status) && !connection?.phoneNumber
      ? "Conectado, sincronizando numero"
      : connection?.phoneNumber || "Aguardando conexao";

  useEffect(() => {
    if (!selectedCompanyId) return;
    getWhatsappConnectionStatus(selectedCompanyId)
      .then(setConnection)
      .catch(() => undefined);
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    const shouldPoll =
      connection?.status === "creating" ||
      connection?.status === "creating_instance" ||
      isQrPending(connection?.status) ||
      connection?.status === "connecting";
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
          next.message || "Evolution iniciando, tente novamente em alguns segundos.",
          "info",
        );
      } else if (next.status === "rate_limited") {
        addToast(
          next.message || "A Evolution limitou as requisicoes. Aguarde alguns segundos.",
          "info",
        );
      } else if (next.status === "qr_not_ready") {
        addToast(next.message || "QR ainda nao esta pronto. Tente novamente em alguns segundos.", "info");
      } else {
        addToast(next.message || next.lastError || "Erro ao gerar QR Code.", "error");
      }
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel iniciar o WhatsApp."), "error");
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
        addToast("Conexao verificada.", "success");
      } else if (next.status === "qr_pending" && hasQrData(next)) {
        addToast("QR Code gerado.", "success");
      } else if (next.status === "provider_warming_up" || next.status === "rate_limited") {
        addToast(next.message || "Evolution indisponivel agora.", "info");
      } else if (next.status === "qr_not_ready" || next.status === "repair_ready") {
        addToast(next.message || "Clique em Conectar WhatsApp para gerar o QR.", "info");
      } else {
        addToast(next.message || "Conexao ainda precisa de novo QR.", "info");
      }
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel reparar a conexao."), "error");
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
      addToast(getErrorMessage(error, "Nao foi possivel desconectar."), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-7">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Integracoes
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
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Sessao</p>
                <p className="mt-1 font-bold text-zinc-100">{statusLabel}</p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Webhook</p>
                <p className="mt-1 font-bold text-zinc-100">{webhookLabel}</p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Automacao</p>
                <p className="mt-1 font-bold text-zinc-100">{automationLabel}</p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Numero</p>
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
                {loading ? "Verificando..." : "Reparar conexao"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={
                  loading ||
                  !selectedCompanyId ||
                  isOperationStatus(connection?.status) ||
                  retryRemaining > 0
                }
                className="rounded-md bg-lime-400 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Conectando..."
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
                  QR indisponivel no momento
                </p>
              )}
            </div>
            <div className="space-y-4">
              {connection?.pairingCode ? (
                <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                    Codigo de pareamento
                  </p>
                  <p className="mt-2 font-mono text-2xl font-black text-lime-300">
                    {connection.pairingCode}
                  </p>
                </div>
              ) : null}
              <div className="rounded-md border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Instancia
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
          <p className="mt-4 rounded-md border border-red-500/30 bg-red-950/30 p-3 text-sm font-semibold text-red-200">
            {connection.message || connection.lastError || "Nao foi possivel gerar o QR Code agora."}
            {retryRemaining > 0 ? ` Tente novamente em ${retryRemaining}s.` : ""}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {channels.map((channel) => (
          <article
            key={channel.title}
            className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lime-300">
              Canal ativo
            </p>
            <h2 className="mt-3 text-xl font-black text-zinc-50">{channel.title}</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{channel.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Integrations;
