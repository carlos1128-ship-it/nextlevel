import React from "react";
import IntegrationsHub from "../components/IntegrationsHub";

const Integrations = () => {
  return (
    <main className="space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
          Integracoes
        </p>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100 md:text-4xl">
          Hub one-click para ativar canais de venda
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          O operador escolhe o canal, clica uma vez e a interface cuida do resto.
          Nada de copiar token, caçar ID ou abrir modal tecnico para tarefas simples.
        </p>
      </section>

      <IntegrationsHub />
    </main>
  );
};

export default Integrations;
