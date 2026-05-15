import React, { useState } from 'react';
import { getWhatsappOAuthUrl } from '../src/services/endpoints';

interface WhatsAppConnectButtonProps {
  companyId: string | null;
}

export const WhatsAppConnectButton: React.FC<WhatsAppConnectButtonProps> = ({ companyId }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      const url = await getWhatsappOAuthUrl(companyId);
      // Open the Meta OAuth popup
      window.location.href = url;
    } catch (error) {
      console.error('Failed to get Meta OAuth URL', error);
      alert('Erro ao iniciar conexão com a Meta. Verifique se o serviço está online.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || !companyId}
      className={`
        relative flex items-center justify-center gap-3 px-8 py-4 
        bg-[#008069] hover:bg-[#00a884] disabled:bg-zinc-800
        text-white font-bold rounded-2xl transition-all duration-300
        active:scale-[0.98] shadow-lg hover:shadow-[#008069]/20
        min-w-[240px] group
      `}
    >
      <svg
        className="w-5 h-5 transition-transform group-hover:scale-110"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 9h8" />
        <path d="M8 13h6" />
      </svg>
      <span className="tracking-tight">
        {loading ? 'Conectando...' : 'Conectar com Facebook'}
      </span>
    </button>
  );
};
