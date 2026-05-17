import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, useBilling } from "../App";
import NextLevelLoader from "../components/NextLevelLoader";
import { getCheckoutSessionStatus } from "../src/services/endpoints";

type SuccessState = "confirming" | "success" | "waiting" | "failed";

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2500;

const BillingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const { selectedCompanyId } = useAuth();
  const { refreshBilling } = useBilling();
  const [state, setState] = useState<SuccessState>("confirming");
  const [attempts, setAttempts] = useState(0);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("Estamos liberando seu acesso.");
  const redirectTimerRef = useRef<number | null>(null);

  const title = useMemo(() => {
    if (state === "success") return "Pagamento confirmado.";
    if (state === "waiting") return "Estamos liberando seu acesso.";
    if (state === "failed") return "Nao foi possivel confirmar automaticamente";
    return "Confirmando pagamento...";
  }, [state]);

  const verify = async (manual = false) => {
    if (checking) return;
    setChecking(true);
    setState("confirming");
    setMessage("Estamos liberando seu acesso.");

    try {
      const result = sessionId
        ? await getCheckoutSessionStatus(sessionId, { companyId: selectedCompanyId })
        : null;
      const billing = result?.billing || (await refreshBilling(true));
      const active = Boolean(result?.hasActiveSubscription || billing?.hasActiveSubscription);

      if (active) {
        await refreshBilling(true);
        setState("success");
        setMessage("Plano ativado. Voce sera levado ao dashboard.");
        if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = window.setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 900);
        return;
      }

      const nextAttempts = manual ? 0 : attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setState("failed");
        setMessage("Nao conseguimos confirmar automaticamente agora. Tente novamente ou veja seus planos.");
        return;
      }

      setState("waiting");
      setMessage(result?.message || "Estamos liberando seu acesso.");
    } catch {
      const nextAttempts = manual ? 0 : attempts + 1;
      setAttempts(nextAttempts);
      setState(nextAttempts >= MAX_ATTEMPTS ? "failed" : "waiting");
      setMessage(
        nextAttempts >= MAX_ATTEMPTS
          ? "Nao conseguimos confirmar automaticamente agora."
          : "Estamos liberando seu acesso.",
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void verify(false);
    return () => {
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (state === "success" || state === "failed" || attempts >= MAX_ATTEMPTS) return;
    const timer = window.setTimeout(() => void verify(false), POLL_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [state, attempts, sessionId, selectedCompanyId]);

  if (state === "confirming" || state === "waiting") {
    return <NextLevelLoader />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030508] px-6 text-white">
      <div className="w-full max-w-xl rounded-lg border border-lime-400/20 bg-white/[0.04] p-8 text-center shadow-[0_0_60px_rgba(182,255,0,0.08)]">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">
          NEXT LEVEL
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">{message}</p>
        {state !== "success" ? (
          <p className="mt-3 text-xs font-semibold text-zinc-500">
            Tentativa {Math.min(attempts + 1, MAX_ATTEMPTS)} de {MAX_ATTEMPTS}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {state === "failed" || state === "waiting" ? (
            <button
              type="button"
              onClick={() => void verify(true)}
              disabled={checking}
              className="rounded-lg bg-lime-300 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 disabled:opacity-70"
            >
              {checking ? "Verificando..." : "Tentar novamente"}
            </button>
          ) : null}
          {state === "failed" || state === "waiting" ? (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-white/10 px-6 py-3 text-sm font-bold text-zinc-200 hover:bg-white/[0.06]"
            >
              Ir para dashboard
            </button>
          ) : null}
          {state === "failed" ? (
            <button
              type="button"
              onClick={() => navigate("/planos")}
              className="rounded-lg border border-white/10 px-6 py-3 text-sm font-bold text-zinc-200 hover:bg-white/[0.06]"
            >
              Ver planos
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;
