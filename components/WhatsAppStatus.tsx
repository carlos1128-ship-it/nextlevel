import React, { useEffect, useState } from "react";
import {
  createWhatsappInstance,
  getWhatsappHealth,
  terminateWhatsappSession,
} from "../src/services/endpoints";
import { useToast } from "./Toast";

interface ConnectionStatus {
  companyId: string;
  status: string;
  connected: boolean;
  authenticated?: boolean;
  method?: "meta" | "wppconnect" | null;
  phoneNumber?: string | null;
  qrCode: string | null;
  awaitingQR: boolean;
  qrRequired?: boolean;
}

interface WhatsAppStatusProps {
  companyId: string | null;
  showDetails?: boolean;
}

export const WhatsAppStatus = ({ companyId, showDetails = false }: WhatsAppStatusProps) => {
  const { addToast } = useToast();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<"connect" | "disconnect" | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchStatus = async () => {
      try {
        const data = await getWhatsappHealth(companyId);
        setStatus(data);
      } catch {
        setStatus(null);
      }
    };

    setLoading(true);
    fetchStatus().finally(() => setLoading(false));
    const interval = setInterval(fetchStatus, status?.connected ? 8000 : 2000);
    return () => clearInterval(interval);
  }, [companyId, status?.connected]);

  const handleReconnect = async () => {
    if (!companyId) return;
    setBusyAction("connect");
    try {
      await createWhatsappInstance(companyId);
      const refreshed = await getWhatsappHealth(companyId);
      setStatus(refreshed);
      addToast("QR Code atualizado para reconectar o WhatsApp.", "success");
    } catch {
      addToast("Nao foi possivel gerar um novo QR Code agora.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisconnect = async () => {
    if (!companyId) return;
    setBusyAction("disconnect");
    try {
      await terminateWhatsappSession(companyId);
      const refreshed = await getWhatsappHealth(companyId).catch(() => null);
      setStatus(refreshed);
      addToast("WhatsApp desconectado.", "success");
    } catch {
      addToast("Nao foi possivel desconectar agora.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const isConnected = Boolean(status?.connected);
  const needsQr =
    Boolean(status?.qrRequired) ||
    status?.status === "QR_REQUIRED" ||
    status?.status === "qrRequired" ||
    status?.status === "disconnectedMobile";

  if (loading && !status) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sincronizando...</span>
      </div>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
          isConnected
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : needsQr
              ? "border-red-500/30 bg-red-500/10 text-red-300"
              : "border-zinc-800 bg-zinc-900/40 text-zinc-500"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isConnected
              ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              : needsQr
                ? "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.35)]"
                : "bg-zinc-600"
          }`}
        />
        {isConnected ? "Conectado" : "Desconectado"}
      </div>

      {isConnected ? (
        <div className="space-y-1 px-1 text-xs text-zinc-400">
          <p>
            Numero: <span className="text-zinc-100">{status?.phoneNumber || "WhatsApp ativo"}</span>
          </p>
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={busyAction !== null}
            className="mt-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {busyAction === "disconnect" ? "Desconectando..." : "Desconectar"}
          </button>
        </div>
      ) : null}

      {!isConnected && needsQr ? (
        <div className="space-y-3 px-1">
          <p className="text-xs leading-5 text-zinc-400">
            Seu WhatsApp foi desconectado. Clique em Reconectar para escanear o QR Code novamente.
          </p>
          <p className="text-[11px] leading-5 text-amber-300">
            Antes do teste, remova todos os aparelhos em Dispositivos conectados no celular.
          </p>
          <button
            type="button"
            onClick={() => void handleReconnect()}
            disabled={busyAction !== null}
            className="rounded-2xl bg-amber-400 px-3 py-2 text-xs font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
          >
            {busyAction === "connect" ? "Gerando QR Code..." : "Reconectar via QR Code"}
          </button>
          {status?.qrCode ? (
            <div className="rounded-2xl border border-amber-400/20 bg-zinc-900/80 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
                Escaneie o QR Code
              </p>
              <img
                src={status.qrCode}
                alt="QR Code do WhatsApp"
                className="mx-auto h-40 w-40 rounded-xl border border-zinc-800 bg-white p-2"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {!isConnected && !needsQr && showDetails ? (
        <p className="px-1 text-[10px] font-medium text-zinc-500">
          Aguardando conexao ou nova leitura do QR Code.
        </p>
      ) : null}
    </div>
  );
};
