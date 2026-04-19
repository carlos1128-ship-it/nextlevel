import { useCallback, useEffect, useState } from "react";
import { evolutionGetStatus } from "../services/endpoints";

export function useEvolutionStatus(companyId: string | null | undefined) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState("close");

  const refetch = useCallback(async () => {
    if (!companyId) {
      setConnected(false);
      setState("close");
      setLoading(false);
      return;
    }

    try {
      const data = await evolutionGetStatus(companyId);
      setConnected(Boolean(data.connected));
      setState(data.state || "close");
    } catch {
      setConnected(false);
      setState("close");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    setLoading(true);
    void refetch();

    if (!companyId) return;

    const interval = setInterval(() => {
      void refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [companyId, refetch]);

  return { connected, loading, state, refetch };
}
