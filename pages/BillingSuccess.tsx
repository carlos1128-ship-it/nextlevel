import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBilling } from "../App";

const BillingSuccess = () => {
  const navigate = useNavigate();
  const { refreshBilling } = useBilling();
  const [checking, setChecking] = useState(true);
  const [active, setActive] = useState(false);

  const verify = async () => {
    setChecking(true);
    try {
      const billing = await refreshBilling(true);
      if (billing?.hasActiveSubscription) {
        setActive(true);
        navigate("/dashboard", { replace: true });
        return;
      }
      setActive(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts += 1;
      void verify();
      if (attempts >= 8) window.clearInterval(interval);
    }, 2500);

    void verify();
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030508] px-6 text-white">
      <div className="max-w-xl rounded-[28px] border border-lime-400/20 bg-white/[0.04] p-8 text-center shadow-[0_0_60px_rgba(182,255,0,0.08)]">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">
          Pagamento recebido
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight">
          Estamos confirmando sua assinatura
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          {active
            ? "Assinatura ativa. Redirecionando para o dashboard."
            : "Pagamento em processamento. Assim que a Cakto confirmar, seu acesso será liberado."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={verify}
            disabled={checking}
            className="rounded-[18px] bg-lime-300 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-zinc-950 disabled:opacity-70"
          >
            {checking ? "Verificando..." : "Verificar novamente"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/planos")}
            className="rounded-[18px] border border-white/10 px-6 py-3 text-sm font-bold text-zinc-200 hover:bg-white/[0.06]"
          >
            Voltar para planos
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;
