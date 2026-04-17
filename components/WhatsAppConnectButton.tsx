import React, { useState } from 'react';
import { getWhatsappOAuthUrl } from '../src/services/endpoints';
import { Loader2, MessageSquarePlus } from 'lucide-react';

interface WhatsAppConnectButtonProps {
  companyId: string | null;
  onSuccess?: () => void;
}

export const WhatsAppConnectButton = ({ companyId }: WhatsAppConnectButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const url = await getWhatsappOAuthUrl(companyId);
      // Open the Meta OAuth popup
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get OAuth URL', error);
      alert('Erro ao iniciar conexão com Meta. Verifique se o backend está online.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading || !companyId}
      className="flex items-center gap-3 rounded-2xl bg-[#B6FF00] px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:scale-[1.02] hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(182,255,0,0.3)]"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <MessageSquarePlus className="h-5 w-5" />
      )}
      Conectar WhatsApp Business
    </button>
  );
};
