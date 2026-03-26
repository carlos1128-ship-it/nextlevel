import React from "react";
import { CreditCardIcon } from "../../../components/icons";

export type PricingPlan = {
  name: string;
  priceDisplay: string;
  summary: string;
  features: string[];
  cta: string;
  recommended?: boolean;
  microcopy?: string;
  eyebrow?: string;
};

type PricingCardProps = {
  plan: PricingPlan;
  onSelect: () => void;
};

const PricingCard = ({ plan, onSelect }: PricingCardProps) => {
  return (
    <article
      className={`relative overflow-hidden rounded-[32px] border p-6 transition duration-200 hover:-translate-y-1 ${
        plan.recommended
          ? "sales-border sales-sheen border-lime-400/40 bg-[linear-gradient(180deg,rgba(163,230,53,0.12),rgba(9,9,11,0.98))]"
          : "border-white/10 bg-white/5"
      }`}
    >
      {plan.recommended ? (
        <span className="absolute right-5 top-5 rounded-full bg-lime-400 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-950 shadow-[0_0_20px_rgba(163,230,53,0.4)]">
          Recomendado
        </span>
      ) : null}

      <div className="pr-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {plan.eyebrow || plan.name}
        </p>
        <div className="mt-4">
          <span className="text-4xl font-black tracking-tight text-white">{plan.priceDisplay}</span>
        </div>
        <p className="mt-4 text-sm leading-7 text-zinc-400">{plan.summary}</p>
      </div>

      <div className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <div
            key={feature}
            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-zinc-950/40 px-4 py-3"
          >
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.65)]" />
            <span className="text-sm text-zinc-200">{feature}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSelect}
        className={`mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-[0.16em] transition ${
          plan.recommended
            ? "bg-lime-400 text-zinc-950 hover:brightness-105"
            : "border border-white/10 bg-white/5 text-zinc-100 hover:border-lime-400/30 hover:bg-white/10"
        }`}
      >
        {plan.cta}
      </button>

      {plan.microcopy ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-left">
          <CreditCardIcon className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
          <p className="text-xs leading-5 text-zinc-400">{plan.microcopy}</p>
        </div>
      ) : null}
    </article>
  );
};

export default PricingCard;
