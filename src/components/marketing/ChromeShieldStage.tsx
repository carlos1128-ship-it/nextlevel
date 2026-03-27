import React from "react";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "../../../components/icons";

const ChromeShieldStage = () => (
  <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(145deg,rgba(12,14,19,0.98),rgba(8,10,14,0.9))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.45)]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(163,230,53,0.12),transparent_26%),radial-gradient(circle_at_84%_24%,rgba(255,255,255,0.12),transparent_20%),radial-gradient(circle_at_60%_100%,rgba(16,185,129,0.12),transparent_24%)]" />
    <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_220px]">
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-zinc-500">
              Escudo de margem
            </p>
            <h3 className="mt-2 text-xl font-black tracking-[-0.04em] text-white">
              Blindagem taticamente simples
            </h3>
          </div>
          <div className="inline-flex rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-lime-200">
            ativo
          </div>
        </div>

        <div className="chrome-shield-stage relative mt-6 h-[290px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.08),rgba(0,0,0,0)_46%),linear-gradient(180deg,#0c1015,#06070b)]">
          <div className="shield-grid absolute inset-0 opacity-40" />
          <div className="life-line absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-lime-300/80 to-transparent" />
          <svg
            viewBox="0 0 520 320"
            className="absolute inset-0 h-full w-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="shieldChrome" x1="114" y1="46" x2="393" y2="267" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FBFBFC" stopOpacity="0.68" />
                <stop offset="0.27" stopColor="#8D95A3" stopOpacity="0.88" />
                <stop offset="0.6" stopColor="#1F2530" />
                <stop offset="1" stopColor="#0A0D13" />
              </linearGradient>
              <linearGradient id="shieldRim" x1="156" y1="42" x2="364" y2="290" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D9FFE8" />
                <stop offset="0.35" stopColor="#B6FF00" />
                <stop offset="1" stopColor="#0A8D54" />
              </linearGradient>
              <radialGradient id="shieldCore" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(263 155) rotate(91.56) scale(122 138)">
                <stop stopColor="#E7FFE0" stopOpacity="0.4" />
                <stop offset="0.4" stopColor="#B6FF00" stopOpacity="0.24" />
                <stop offset="1" stopColor="#0E131A" stopOpacity="0" />
              </radialGradient>
              <filter id="greenGlow" x="93" y="21" width="340" height="290" filterUnits="userSpaceOnUse">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className="shield-float">
              <path
                d="M261 34L380 82V161C380 216 337 266 261 291C185 266 142 216 142 161V82L261 34Z"
                fill="url(#shieldChrome)"
                stroke="rgba(255,255,255,0.24)"
                strokeWidth="1.2"
              />
              <path
                d="M261 56L356 95V160C356 204 321 243 261 266C201 243 166 204 166 160V95L261 56Z"
                fill="url(#shieldCore)"
              />
              <path
                d="M261 52L360 94V162C360 210 323 252 261 276C199 252 162 210 162 162V94L261 52Z"
                stroke="url(#shieldRim)"
                strokeOpacity="0.92"
                strokeWidth="3"
                filter="url(#greenGlow)"
              />
              <path
                d="M213 160L244 193L312 123"
                stroke="#E7FFE0"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M213 160L244 193L312 123"
                stroke="#B6FF00"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#greenGlow)"
              />
            </g>

            <circle cx="263" cy="161" r="114" stroke="rgba(182,255,0,0.12)" strokeWidth="1.2" />
            <circle cx="263" cy="161" r="144" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          </svg>

          <div className="absolute left-4 top-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
              lucro preservado
            </p>
            <p className="mt-1 text-lg font-black text-white">+R$ 14.870</p>
          </div>

          <div className="absolute bottom-4 right-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">
              alerta tatico
            </p>
            <p className="mt-1 text-sm font-bold text-lime-200">Frete ajustado antes do prejuizo</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
            Sem Next Level
          </p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-white">+22%</p>
              <p className="text-sm text-zinc-400">vendas sobem</p>
            </div>
            <ArrowDownRightIcon className="h-8 w-8 text-rose-400" />
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            O faturamento anima, mas a margem sangra no escuro.
          </p>
        </article>

        <article className="rounded-[28px] border border-lime-400/20 bg-lime-400/10 p-5 shadow-[0_0_40px_rgba(163,230,53,0.08)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-lime-200/80">
            Com Next Level
          </p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-3xl font-black text-white">+31%</p>
              <p className="text-sm text-lime-100/80">lucro real</p>
            </div>
            <ArrowUpRightIcon className="h-8 w-8 text-lime-200" />
          </div>
          <p className="mt-3 text-sm leading-6 text-lime-50/80">
            A linha da vida vira comando. Preco, custo e canal entram em harmonia.
          </p>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-zinc-500">
            Presenting
          </p>
          <p className="mt-2 text-base font-black tracking-[-0.03em] text-white">
            O cerebro tatico do seu negocio
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Uma camada de leitura simples para uma batalha que nunca foi simples.
          </p>
        </article>
      </div>
    </div>
  </div>
);

export default ChromeShieldStage;
