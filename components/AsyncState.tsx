import React from "react";
import NextLevelLoader from "./NextLevelLoader";
import { EmptyStateCard } from "./ui/Card";

interface StateCardProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const LoadingState: React.FC<{ label?: string }> = () => (
  <NextLevelLoader fullscreen={false} />
);

export const EmptyState: React.FC<StateCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <EmptyStateCard className="mx-auto max-w-3xl border-dashed border-white/10 bg-[#0b100e]/90">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10">
      <span className="h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(182,255,0,0.5)]" />
    </div>
    <h3 className="text-lg font-black tracking-tight text-zinc-100">{title}</h3>
    {description ? (
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-400">{description}</p>
    ) : null}
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="nl-button-primary mt-5"
      >
        {actionLabel}
      </button>
    ) : null}
  </EmptyStateCard>
);

export const ErrorState: React.FC<StateCardProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="nl-card nl-card-empty border-red-400/30 bg-red-500/10">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10">
      <span className="h-2.5 w-2.5 rounded-full bg-red-300 shadow-[0_0_18px_rgba(248,113,113,0.42)]" />
    </div>
    <h3 className="text-lg font-black tracking-tight text-red-200">{title}</h3>
    {description ? (
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-200/80">{description}</p>
    ) : null}
    {actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="nl-button-danger mt-5"
      >
        {actionLabel}
      </button>
    ) : null}
  </div>
);
