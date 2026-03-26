import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050816] px-4 text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(181,255,0,0.18),_transparent_24%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.22),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-[420px] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(5,8,22,0))]" />

      <section className="relative w-full max-w-4xl overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_36px_120px_rgba(0,0,0,0.42)] backdrop-blur-xl md:p-12">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(181,255,0,0.22),_transparent_60%)]" />

        <div className="relative">
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

          <p className="mt-8 text-center text-xs font-semibold uppercase tracking-[0.24em] text-lime-200/70">
            Pagina nao encontrada
          </p>
          <h1 className="mt-3 text-center text-4xl font-black tracking-tight text-white md:text-6xl">
            Esse caminho saiu do mapa
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-8 text-zinc-300">
            A rota que voce tentou abrir nao esta disponivel agora. Volte rapido para a area principal
            e continue a operacao sem perder contexto.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Status</p>
              <p className="mt-2 text-lg font-black text-white">404 protegido</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Resposta</p>
              <p className="mt-2 text-lg font-black text-white">Retorno imediato</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Proximo passo</p>
              <p className="mt-2 text-lg font-black text-white">Voltar ao fluxo</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-lime-400 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Voltar ao Dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-zinc-100 transition hover:border-white/20 hover:bg-white/10"
          >
            Ir para a home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-transparent px-6 py-4 text-sm font-semibold text-zinc-300 transition hover:border-lime-400/20 hover:text-white"
          >
            Voltar uma pagina
          </button>
          </div>
        </div>
      </section>
    </main>
  );
}
