import React from "react";
import { DASHBOARD_ROUTE } from "../app/routes";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  declare props: Readonly<AppErrorBoundaryProps>;

  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("AppErrorBoundary", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#050816] px-4 text-zinc-100">
          <section className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.38)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
              Erro protegido
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
              Algo saiu do trilho, mas o painel continua seguro
            </h1>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              Recarregue a pagina ou volte para o dashboard. Se o problema persistir, tente novamente
              em instantes.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => window.location.assign(DASHBOARD_ROUTE)}
                className="rounded-2xl bg-lime-400 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-zinc-950 transition hover:brightness-105"
              >
                Ir para o dashboard
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
              >
                Recarregar pagina
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
