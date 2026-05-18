import React from "react";

const Alerts = () => (
  <main className="space-y-6">
    <header>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">Central de alertas</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-100">Alertas operacionais</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
        Quando houver eventos reais de caixa, estoque, integrações ou atendimento, eles aparecerão aqui.
      </p>
    </header>

    <section className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center">
      <h2 className="text-xl font-black text-zinc-100">Nenhum alerta ativo</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">
        A central está pronta, mas não vamos simular notificações. Conecte dados reais para receber alertas acionáveis.
      </p>
    </section>
  </main>
);

export default Alerts;
