import React, { useState } from "react";
import { evolutionConnect, evolutionDisconnect } from "../src/services/endpoints";
import { useEvolutionStatus } from "../src/hooks/useEvolutionStatus";
import { useToast } from "./Toast";

interface WhatsAppStatusProps {
  companyId: string | null;
  showDetails?: boolean;
}

export const WhatsAppStatus = ({ companyId, showDetails = false }: WhatsAppStatusProps) => {
  const { addToast } = useToast();
  const { connected, loading, state, refetch } = useEvolutionStatus(companyId);
  const [busyAction, setBusyAction] = useState<"connect" | "disconnect" | null>(null);

  const handleConnect = async () => {
    if (!companyId) return;

    setBusyAction("connect");
    try {
      await evolutionConnect(companyId);
      await refetch();
      addToast("Gerando QR Code... aguarde alguns segundos.", "info");
    } catch {
      addToast("Nao foi possivel conectar. Tente novamente.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  const handleDisconnect = async () => {
    if (!companyId) return;

    setBusyAction("disconnect");
    try {
      await evolutionDisconnect(companyId);
      await refetch();
      addToast("WhatsApp desconectado.", "success");
    } catch {
      addToast("Nao foi possivel desconectar.", "error");
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-600" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sincronizando...</span>
      </div>
    );
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3">
      <div
        className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${
          connected
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : "border-zinc-800 bg-zinc-900/40 text-zinc-500"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            connected
              ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              : "bg-zinc-600"
          }`}
        />
        {connected ? "✓ WhatsApp Conectado" : "WhatsApp desconectado"}
      </div>

      {showDetails ? (
        <p className="px-1 text-[11px] leading-5 text-zinc-400">
          {connected
            ? "Sua conexao esta pronta para o atendimento automatico."
            : state === "open"
              ? "Conexao em atualizacao."
              : "Conecte o WhatsApp na aba Integracoes para ativar o agente."}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!connected ? (
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={busyAction !== null || !companyId}
            className="rounded-2xl bg-[#B6FF00] px-3 py-2 text-xs font-black text-zinc-950 transition hover:brightness-105 disabled:opacity-50"
          >
            {busyAction === "connect" ? "Conectando..." : "Conectar WhatsApp"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleDisconnect()}
            disabled={busyAction !== null || !companyId}
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            {busyAction === "disconnect" ? "Desconectando..." : "Desconectar"}
          </button>
        )}
      </div>
    </div>
  );
};
