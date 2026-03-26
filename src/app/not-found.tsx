import React from "react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07111f] px-4 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(181,255,0,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_30%)]" />

      <section className="relative w-full max-w-3xl rounded-[36px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.38)] backdrop-blur md:p-12">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[32px] border border-lime-400/20 bg-lime-400/10 text-lime-200">
          <svg
            className="h-14 w-14"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="10" y="18" width="44" height="30" rx="8" stroke="currentColor" strokeWidth="3" />
            <path d="M21 18V13C21 8.58172 24.5817 5 29 5H35C39.4183 5 43 8.58172 43 13V18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M24 33H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M28 27L24 33L28 39" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M36 27L40 33L36 39" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-lime-200/70">
          Pagina nao encontrada
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
          Ops, essa aba fugiu do escritorio
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-zinc-300">
          A rota que voce tentou abrir nao apareceu para a reuniao. Volte para o dashboard e siga
          com a operacao sem perder ritmo.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-lime-400 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Voltar ao Dashboard
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
          >
            Ir para a home
          </a>
        </div>
      </section>
    </main>
  );
}
