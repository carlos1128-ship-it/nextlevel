/**
 * Hook compartilhado para verificar o status REAL do WhatsApp.
 * Usado tanto na aba "Integrações" quanto na aba "Atendente Virtual"
 * para garantir estado consistente entre componentes.
 * 
 * MELHORIA v2.0:
 * - Usa endpoint /health que verifica estado LIVE com o WPPConnect
 * - Polling de 5s para atualização automática
 * - Cleanup automático ao trocar de empresa
 * - Previne dessincronização entre abas
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../services/api';

export interface WhatsAppHealthStatus {
  companyId: string;
  status: string;
  connected: boolean;
  qrCode: string | null;
  phoneNumber: string | null;
  pushname: string | null;
  hasClient: boolean;
  hasInitialization: boolean;
  hasRetryTimer: boolean;
  lastError: string | null;
  dbStatus: string;
  dbEnabled: boolean;
  dbLastConnected: string | null;
  healthy: boolean;
  needsReconnect: boolean;
  awaitingQR: boolean;
}

interface UseWhatsAppStatusOptions {
  /** Intervalo de polling em ms (padrão: 5000) */
  pollingInterval?: number;
  /** Habilitar polling automático (padrão: true) */
  enablePolling?: boolean;
  /** Callback quando status muda */
  onStatusChange?: (status: WhatsAppHealthStatus) => void;
}

const DEFAULT_POLLING_INTERVAL = 5000;

/**
 * Busca status REAL do WhatsApp via endpoint /health
 */
async function fetchHealthStatus(companyId: string): Promise<WhatsAppHealthStatus> {
  const { data } = await api.get<WhatsAppHealthStatus>(
    `/attendant/whatsapp/health`,
    { params: { companyId } },
  );
  return data;
}

/**
 * Cleanup forçado da sessão ao trocar de empresa
 */
async function cleanupSession(companyId: string): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>(
    `/attendant/whatsapp/cleanup`,
    null,
    { params: { companyId } },
  );
  return data;
}

export function useWhatsAppStatus(
  companyId: string | null | undefined,
  options: UseWhatsAppStatusOptions = {},
) {
  const {
    pollingInterval = DEFAULT_POLLING_INTERVAL,
    enablePolling = true,
    onStatusChange,
  } = options;

  const [status, setStatus] = useState<WhatsAppHealthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousStatusRef = useRef<string | null>(null);

  // Função para buscar status
  const fetchStatus = useCallback(async () => {
    if (!companyId) {
      setStatus(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const healthStatus = await fetchHealthStatus(companyId);
      setStatus(healthStatus);

      // Detectar mudança de status e notificar callback
      if (previousStatusRef.current !== healthStatus.status) {
        previousStatusRef.current = healthStatus.status;
        onStatusChange?.(healthStatus);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Erro ao buscar status';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [companyId, onStatusChange]);

  // Cleanup ao trocar de empresa
  const cleanupPreviousSession = useCallback(async (previousCompanyId: string) => {
    try {
      await cleanupSession(previousCompanyId);
    } catch {
      // Ignora erros de cleanup — sessão pode já estar limpa
    }
  }, []);

  // Watch companyId changes — cleanup antes de mudar
  useEffect(() => {
    const previousCompanyId = status?.companyId;

    // Se mudou de empresa, fazer cleanup da anterior
    if (previousCompanyId && previousCompanyId !== companyId) {
      cleanupPreviousSession(previousCompanyId);
    }

    // Reset status ao trocar de empresa
    setStatus(null);
    previousStatusRef.current = null;

    // Buscar novo status
    void fetchStatus();
  }, [companyId, cleanupPreviousSession, fetchStatus]);

  // Polling automático
  useEffect(() => {
    if (!enablePolling || !companyId) {
      stopPolling();
      return;
    }

    startPolling();

    return () => {
      stopPolling();
    };
  }, [companyId, enablePolling, pollingInterval, fetchStatus]);

  const startPolling = useCallback(() => {
    stopPolling();

    pollRef.current = setInterval(() => {
      void fetchStatus();
    }, pollingInterval);
  }, [fetchStatus, pollingInterval]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    loading,
    error,
    // Helpers
    isConnected: status?.connected ?? false,
    isHealthy: status?.healthy ?? false,
    needsReconnect: status?.needsReconnect ?? false,
    isAwaitingQR: status?.awaitingQR ?? false,
    // Ações
    refresh: fetchStatus,
    cleanup: cleanupPreviousSession,
  };
}
