/**
 * Hook compartilhado para verificar o status real do WhatsApp.
 * Usado para manter o estado consistente entre componentes sem recriar sessao.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { cleanupWhatsappSession } from '../services/endpoints';

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
  reconnectAttempts?: number;
  nextReconnectAt?: string | null;
  lifecycleState?: 'idle' | 'starting' | 'qr_ready' | 'connected' | 'failed';
  failureReason?: string | null;
}

interface UseWhatsAppStatusOptions {
  pollingInterval?: number;
  enablePolling?: boolean;
  onStatusChange?: (status: WhatsAppHealthStatus) => void;
}

const DEFAULT_POLLING_INTERVAL = 5000;

async function fetchHealthStatus(companyId: string): Promise<WhatsAppHealthStatus> {
  const { data } = await api.get<WhatsAppHealthStatus>(
    `/attendant/whatsapp/health`,
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

      if (previousStatusRef.current !== healthStatus.status) {
        previousStatusRef.current = healthStatus.status;
        onStatusChange?.(healthStatus);
      }
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        error.response?.data?.message || error.message || 'Erro ao buscar status';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [companyId, onStatusChange]);

  useEffect(() => {
    setStatus(null);
    previousStatusRef.current = null;
    void fetchStatus();
  }, [companyId, fetchStatus]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();

    pollRef.current = setInterval(() => {
      void fetchStatus();
    }, pollingInterval);
  }, [fetchStatus, pollingInterval, stopPolling]);

  useEffect(() => {
    if (!enablePolling || !companyId) {
      stopPolling();
      return;
    }

    startPolling();

    return () => {
      stopPolling();
    };
  }, [companyId, enablePolling, pollingInterval, fetchStatus, startPolling, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    status,
    loading,
    error,
    isConnected: status?.connected ?? false,
    isHealthy: status?.healthy ?? false,
    needsReconnect: status?.needsReconnect ?? false,
    isAwaitingQR: status?.awaitingQR ?? false,
    refresh: fetchStatus,
    cleanup: async () => {
      if (!companyId) {
        return;
      }

      await cleanupWhatsappSession(companyId);
      await fetchStatus();
    },
  };
}
