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
      alert('Erro ao iniciar conexão com a Meta. Verifique se o backend está online.');
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
      {loading ? (
        <svg 
          className="animate-spin h-5 w-5 text-white" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
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
      )}
      <span className="tracking-tight">
        {loading ? 'Conectando...' : 'Conectar com Facebook'}
      </span>
    </button>
  );
};
