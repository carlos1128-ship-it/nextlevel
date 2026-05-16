import React from "react";
import { useNavigate } from "react-router-dom";

const BillingCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#030508] px-6 text-white">
      <div className="max-w-xl rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_0_60px_rgba(182,255,0,0.08)]">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-lime-300">
          Assinatura nao concluida
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight">
          Você pode escolher um plano quando quiser
        </h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          Assinatura não concluída. Você pode escolher um plano quando quiser.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => navigate("/planos")}
            className="rounded-lg bg-lime-300 px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-zinc-950"
          >
            Ver planos
          </button>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg border border-white/10 px-6 py-3 text-sm font-bold text-zinc-200 hover:bg-white/[0.06]"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingCancel;
