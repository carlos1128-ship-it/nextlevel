import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import {
  disconnectWhatsapp,
  getWhatsappConnectionStatus,
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

const Integrations = () => {
  const { selectedCompanyId } = useAuth();
  const { addToast } = useToast();
  const [connection, setConnection] = useState<WhatsappConnection | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const statusLabel = useMemo(() => {
    if (!connection) return "Desconectado";
    if (connection.status === "waiting_qr") return "Aguardando QR";
    if (connection.status === "creating") return "Criando instancia";
    if (connection.status === "connected") return "Conectado";
    if (connection.status === "error") return "Erro";
    return "Desconectado";
  }, [connection]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    getWhatsappConnectionStatus(selectedCompanyId)
      .then(setConnection)
      .catch(() => undefined);
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    const shouldPoll =
      connection?.status === "creating" || connection?.status === "waiting_qr";
    if (!shouldPoll) return;

    const timer = window.setInterval(() => {
      getWhatsappConnectionStatus(selectedCompanyId)
        .then(setConnection)
        .catch(() => undefined);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [connection?.status, selectedCompanyId]);

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
      .then(setQrImage)
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
      addToast("Instancia WhatsApp iniciada.", "success");
    } catch (error) {
      addToast(getErrorMessage(error, "Nao foi possivel iniciar o WhatsApp."), "error");
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
            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Status</p>
                <p className="mt-1 font-bold text-zinc-100">{statusLabel}</p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Numero</p>
                <p className="mt-1 font-bold text-zinc-100">
                  {connection?.phoneNumber || "Aguardando conexao"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={handleConnect}
              disabled={loading || !selectedCompanyId}
              className="rounded-md bg-lime-400 px-4 py-2 text-sm font-black text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Conectando..." : "Conectar WhatsApp"}
            </button>
            {isConnected(connection?.status) ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-200 transition hover:border-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Desconectar
              </button>
            ) : null}
          </div>
        </div>

        {connection?.status === "waiting_qr" || qrImage || connection?.pairingCode ? (
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
