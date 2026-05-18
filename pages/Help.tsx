import React from "react";

const Help = () => (
  <main className="space-y-6">
    <header>
      <p className="text-xs font-black uppercase tracking-[0.24em] text-lime-300">Ajuda</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-100">Central de ajuda</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
        Canais reais para resolver dúvidas sobre dados, integrações, relatórios e atendimento IA.
      </p>
    </header>

    <section className="grid gap-4 lg:grid-cols-3">
      {[
        ["Primeiros passos", "Cadastre produtos, custos e vendas antes de cobrar previsões da IA."],
        ["Integrações", "Conecte WhatsApp, Instagram ou Mercado Livre apenas pelos botões oficiais."],
        ["Suporte", "Para suporte humano, envie o contexto do problema para suporte@nextlevel.ai."],
      ].map(([title, text]) => (
        <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-base font-black text-zinc-100">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
        </article>
      ))}
    </section>
  </main>
);

export default Help;
