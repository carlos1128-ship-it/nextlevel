import React, { useEffect, useState } from "react";
import { getBotConfig } from "../src/services/endpoints";
import type { BotConfig } from "../src/types/domain";

interface WhatsAppStatusProps {
  companyId: string | null;
  showDetails?: boolean;
}

export const WhatsAppStatus = ({ companyId, showDetails = false }: WhatsAppStatusProps) => {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    if (!companyId) return;
    try {
      const data = await getBotConfig(companyId);
      setConfig(data);
    } catch (error) {
      console.error("Failed to fetch WhatsApp status", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStatus().finally(() => setLoading(false));

    const interval = setInterval(fetchStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [companyId]);

  const isConnected = !!config?.metaPhoneNumberId;

  if (loading && !config) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="h-2 w-2 rounded-full bg-zinc-600 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sincronizando...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
        isConnected 
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" 
          : "border-zinc-800 bg-zinc-900/40 text-zinc-500"
      }`}>
        <span className={`h-2 w-2 rounded-full ${isConnected ? "animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : "bg-zinc-600"}`} />
        {isConnected ? "Conectado ✓" : "Desconectado"}
      </div>
      {showDetails && isConnected && config?.phoneNumber && (
        <p className="px-1 text-[10px] font-medium text-zinc-500">
          ID: <span className="text-zinc-400">{config.metaPhoneNumberId}</span>
        </p>
      )}
    </div>
  );
};
